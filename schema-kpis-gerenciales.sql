-- ============================================================================
-- KPIs GERENCIALES - DASHBOARD EJECUTIVO
-- Para reuniones semanales con gerencia/dirección
-- ============================================================================

-- ============================================================================
-- TABLA ADICIONAL: Clasificación de Issues (para Rework Rate)
-- ============================================================================

CREATE TABLE IF NOT EXISTS issue_types (
    id BIGSERIAL PRIMARY KEY,
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    issue_number INT NOT NULL,
    issue_title TEXT,
    issue_type TEXT, -- 'feature', 'bug', 'fix', 'enhancement'
    created_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    repo_name TEXT,
    is_rework BOOLEAN DEFAULT false, -- Si es un bug/fix de algo reciente
    related_to_issue_number INT, -- Issue original que causó el rework
    date DATE NOT NULL,
    UNIQUE(developer_id, issue_number, date)
);

CREATE INDEX IF NOT EXISTS idx_issue_types_date ON issue_types(date);
CREATE INDEX IF NOT EXISTS idx_issue_types_type ON issue_types(issue_type);
CREATE INDEX IF NOT EXISTS idx_issue_types_rework ON issue_types(is_rework);

-- ============================================================================
-- KPI 1: THROUGHPUT GLOBAL SEMANAL (Entrega de Valor)
-- ============================================================================

-- Vista: Throughput semanal comparativo
CREATE OR REPLACE VIEW vw_kpi_throughput_semanal AS
WITH semanas AS (
    SELECT 
        DATE_TRUNC('week', date) as semana,
        SUM(issues_closed) as total_issues_cerrados,
        SUM(commits_count) as total_commits,
        COUNT(DISTINCT developer_id) as devs_activos,
        SUM(lines_added + lines_deleted) as total_code_churn
    FROM daily_metrics
    WHERE date >= CURRENT_DATE - INTERVAL '8 weeks'
    GROUP BY DATE_TRUNC('week', date)
),
semana_actual AS (
    SELECT total_issues_cerrados FROM semanas 
    WHERE semana = DATE_TRUNC('week', CURRENT_DATE)
),
semana_anterior AS (
    SELECT total_issues_cerrados FROM semanas 
    WHERE semana = DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days')
)
SELECT 
    s.semana,
    s.total_issues_cerrados,
    s.total_commits,
    s.devs_activos,
    s.total_code_churn,
    ROUND(
        ((s.total_issues_cerrados::FLOAT / NULLIF(LAG(s.total_issues_cerrados) OVER (ORDER BY s.semana), 0)) - 1) * 100,
        2
    ) as variacion_porcentual
FROM semanas s
ORDER BY s.semana DESC;

-- Función RPC: Obtener throughput actual vs anterior
CREATE OR REPLACE FUNCTION kpi_throughput_comparativo()
RETURNS TABLE (
    semana_actual_issues INT,
    semana_anterior_issues INT,
    variacion_porcentual FLOAT,
    tendencia TEXT
) AS $$
DECLARE
    actual INT;
    anterior INT;
    variacion FLOAT;
BEGIN
    -- Semana actual
    SELECT COALESCE(SUM(issues_closed), 0) INTO actual
    FROM daily_metrics
    WHERE date >= DATE_TRUNC('week', CURRENT_DATE);
    
    -- Semana anterior
    SELECT COALESCE(SUM(issues_closed), 0) INTO anterior
    FROM daily_metrics
    WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days')
    AND date < DATE_TRUNC('week', CURRENT_DATE);
    
    -- Calcular variación
    IF anterior > 0 THEN
        variacion := ((actual::FLOAT / anterior) - 1) * 100;
    ELSE
        variacion := 0;
    END IF;
    
    RETURN QUERY SELECT 
        actual,
        anterior,
        variacion,
        CASE 
            WHEN variacion > 10 THEN '📈 CRECIMIENTO FUERTE'
            WHEN variacion > 0 THEN '📊 CRECIMIENTO'
            WHEN variacion = 0 THEN '➡️ ESTABLE'
            WHEN variacion > -10 THEN '📉 LEVE CAÍDA'
            ELSE '⚠️ CAÍDA SIGNIFICATIVA'
        END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- KPI 2: TIME-TO-MARKET (Lead Time Promedio)
-- ============================================================================

-- Vista: Evolución del Lead Time semanal
CREATE OR REPLACE VIEW vw_kpi_lead_time_tendencia AS
SELECT 
    DATE_TRUNC('week', date) as semana,
    ROUND(AVG(avg_lead_time_h), 2) as lead_time_promedio_h,
    MIN(avg_lead_time_h) as mejor_lead_time_h,
    MAX(avg_lead_time_h) as peor_lead_time_h,
    COUNT(*) as total_entregas,
    ROUND(AVG(avg_lead_time_h) / 24.0, 2) as lead_time_dias
FROM daily_metrics
WHERE date >= CURRENT_DATE - INTERVAL '8 weeks'
AND avg_lead_time_h > 0
GROUP BY DATE_TRUNC('week', date)
ORDER BY semana DESC;

-- Función RPC: Lead Time con meta y tendencia
CREATE OR REPLACE FUNCTION kpi_lead_time_vs_meta(meta_horas FLOAT DEFAULT 24.0)
RETURNS TABLE (
    lead_time_actual_h FLOAT,
    meta_h FLOAT,
    cumple_meta BOOLEAN,
    diferencia_h FLOAT,
    tendencia_7d FLOAT,
    status TEXT
) AS $$
DECLARE
    actual FLOAT;
    semana_pasada FLOAT;
    tendencia FLOAT;
BEGIN
    -- Lead time de esta semana
    SELECT COALESCE(AVG(avg_lead_time_h), 0) INTO actual
    FROM daily_metrics
    WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
    AND avg_lead_time_h > 0;
    
    -- Lead time semana pasada
    SELECT COALESCE(AVG(avg_lead_time_h), 0) INTO semana_pasada
    FROM daily_metrics
    WHERE date >= DATE_TRUNC('week', CURRENT_DATE - INTERVAL '7 days')
    AND date < DATE_TRUNC('week', CURRENT_DATE)
    AND avg_lead_time_h > 0;
    
    -- Calcular tendencia
    IF semana_pasada > 0 THEN
        tendencia := ((actual / semana_pasada) - 1) * 100;
    ELSE
        tendencia := 0;
    END IF;
    
    RETURN QUERY SELECT 
        actual,
        meta_horas,
        actual <= meta_horas,
        actual - meta_horas,
        tendencia,
        CASE 
            WHEN actual <= meta_horas AND tendencia < 0 THEN '🟢 EXCELENTE - Bajo meta y mejorando'
            WHEN actual <= meta_horas THEN '🟢 CUMPLIENDO META'
            WHEN actual <= meta_horas * 1.2 THEN '🟡 CERCA DE META'
            ELSE '🔴 FUERA DE META'
        END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- KPI 3: DISTRIBUCIÓN DE ESFUERZO POR PROYECTO (Project Mix)
-- ============================================================================

-- Tabla para tracking de repos/proyectos
CREATE TABLE IF NOT EXISTS project_activity (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    repo_name TEXT NOT NULL,
    commits_count INT DEFAULT 0,
    issues_count INT DEFAULT 0,
    developers_count INT DEFAULT 0,
    lines_changed INT DEFAULT 0,
    project_priority TEXT, -- 'high', 'medium', 'low'
    UNIQUE(date, repo_name)
);

CREATE INDEX IF NOT EXISTS idx_project_activity_date ON project_activity(date);
CREATE INDEX IF NOT EXISTS idx_project_activity_repo ON project_activity(repo_name);

-- Vista: Project Mix semanal
CREATE OR REPLACE VIEW vw_kpi_project_mix AS
WITH actividad_semanal AS (
    SELECT 
        repo_name,
        SUM(commits_count) as total_commits,
        SUM(issues_count) as total_issues,
        SUM(lines_changed) as total_lines,
        MAX(project_priority) as prioridad
    FROM project_activity
    WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
    GROUP BY repo_name
),
total_actividad AS (
    SELECT SUM(total_commits) as total FROM actividad_semanal
)
SELECT 
    a.repo_name,
    a.total_commits,
    a.total_issues,
    a.total_lines,
    a.prioridad,
    ROUND((a.total_commits::FLOAT / NULLIF(t.total, 0)) * 100, 2) as porcentaje_esfuerzo
FROM actividad_semanal a, total_actividad t
ORDER BY porcentaje_esfuerzo DESC;

-- ============================================================================
-- KPI 4: TASA DE RETRABAJO (Calidad en Alta Velocidad)
-- ============================================================================

-- Vista: Rework Rate semanal
CREATE OR REPLACE VIEW vw_kpi_rework_rate AS
WITH issues_semana AS (
    SELECT 
        COUNT(*) as total_issues,
        SUM(CASE WHEN is_rework THEN 1 ELSE 0 END) as issues_rework
    FROM issue_types
    WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
)
SELECT 
    total_issues,
    issues_rework,
    ROUND((issues_rework::FLOAT / NULLIF(total_issues, 0)) * 100, 2) as rework_rate_porcentaje,
    CASE 
        WHEN (issues_rework::FLOAT / NULLIF(total_issues, 0)) * 100 < 5 THEN '🟢 EXCELENTE'
        WHEN (issues_rework::FLOAT / NULLIF(total_issues, 0)) * 100 < 10 THEN '🟡 ACEPTABLE'
        ELSE '🔴 REQUIERE ATENCIÓN'
    END as calidad_status
FROM issues_semana;

-- Función RPC: Análisis de calidad
CREATE OR REPLACE FUNCTION kpi_analisis_calidad()
RETURNS TABLE (
    total_entregas INT,
    entregas_limpias INT,
    bugs_fixes INT,
    rework_rate FLOAT,
    calidad_score INT,
    recomendacion TEXT
) AS $$
DECLARE
    total INT;
    rework INT;
    rate FLOAT;
    score INT;
BEGIN
    -- Contar issues de la semana
    SELECT 
        COUNT(*),
        SUM(CASE WHEN is_rework THEN 1 ELSE 0 END)
    INTO total, rework
    FROM issue_types
    WHERE date >= DATE_TRUNC('week', CURRENT_DATE);
    
    -- Calcular rate
    IF total > 0 THEN
        rate := (rework::FLOAT / total) * 100;
    ELSE
        rate := 0;
    END IF;
    
    -- Score de calidad (0-100)
    score := GREATEST(0, 100 - (rate * 5)::INT);
    
    RETURN QUERY SELECT 
        total,
        total - COALESCE(rework, 0),
        COALESCE(rework, 0),
        rate,
        score,
        CASE 
            WHEN rate < 5 THEN 'Calidad excepcional. La IA está produciendo código estable.'
            WHEN rate < 10 THEN 'Calidad dentro de meta. Monitorear tendencia.'
            WHEN rate < 15 THEN 'Incremento de bugs. Revisar prompts de IA y testing.'
            ELSE 'CRÍTICO: Alta tasa de retrabajo. Auditar proceso de desarrollo.'
        END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- KPI 5: ÍNDICE DE CAPACIDAD Y DISPONIBILIDAD (Bench Rate)
-- ============================================================================

-- Vista: Utilización del equipo
CREATE OR REPLACE VIEW vw_kpi_utilizacion_equipo AS
WITH estado_devs AS (
    SELECT 
        d.id,
        d.github_username,
        d.full_name,
        COALESCE(dm.days_inactive, 999) as dias_inactivo,
        CASE 
            WHEN COALESCE(dm.days_inactive, 999) = 0 THEN 'ACTIVO'
            WHEN COALESCE(dm.days_inactive, 999) <= 1 THEN 'ACTIVO'
            WHEN COALESCE(dm.days_inactive, 999) <= 3 THEN 'PARCIAL'
            ELSE 'BENCH'
        END as estado
    FROM developers d
    LEFT JOIN daily_metrics dm ON d.id = dm.developer_id AND dm.date = CURRENT_DATE
    WHERE d.is_active = true
)
SELECT 
    COUNT(*) as total_desarrolladores,
    SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END) as devs_activos,
    SUM(CASE WHEN estado = 'PARCIAL' THEN 1 ELSE 0 END) as devs_parciales,
    SUM(CASE WHEN estado = 'BENCH' THEN 1 ELSE 0 END) as devs_bench,
    ROUND((SUM(CASE WHEN estado = 'ACTIVO' THEN 1 ELSE 0 END)::FLOAT / COUNT(*)) * 100, 2) as tasa_utilizacion
FROM estado_devs;

-- Función RPC: Reporte de capacidad
CREATE OR REPLACE FUNCTION kpi_reporte_capacidad()
RETURNS TABLE (
    total_devs INT,
    devs_100_activos INT,
    devs_en_espera INT,
    tasa_utilizacion FLOAT,
    meta_utilizacion FLOAT,
    cumple_meta BOOLEAN,
    costo_bench_estimado FLOAT,
    recomendacion TEXT
) AS $$
DECLARE
    total INT;
    activos INT;
    bench INT;
    utilizacion FLOAT;
    meta FLOAT := 85.0;
    costo_dev_dia FLOAT := 200.0; -- Ajustar según tu realidad
BEGIN
    -- Contar desarrolladores por estado
    SELECT 
        COUNT(*),
        SUM(CASE WHEN COALESCE(dm.days_inactive, 999) <= 1 THEN 1 ELSE 0 END),
        SUM(CASE WHEN COALESCE(dm.days_inactive, 999) > 3 THEN 1 ELSE 0 END)
    INTO total, activos, bench
    FROM developers d
    LEFT JOIN daily_metrics dm ON d.id = dm.developer_id AND dm.date = CURRENT_DATE
    WHERE d.is_active = true;
    
    -- Calcular utilización
    IF total > 0 THEN
        utilizacion := (activos::FLOAT / total) * 100;
    ELSE
        utilizacion := 0;
    END IF;
    
    RETURN QUERY SELECT 
        total,
        activos,
        bench,
        utilizacion,
        meta,
        utilizacion >= meta,
        bench * costo_dev_dia * 7, -- Costo semanal de bench
        CASE 
            WHEN utilizacion >= 95 THEN '🟢 Capacidad óptima. Considerar expansión si demanda crece.'
            WHEN utilizacion >= meta THEN '🟢 Dentro de meta. Equipo bien balanceado.'
            WHEN utilizacion >= 70 THEN '🟡 Bajo meta. Revisar asignaciones de proyectos.'
            ELSE '🔴 CRÍTICO: Alta capacidad ociosa. Reasignar o reducir equipo.'
        END;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VISTA EJECUTIVA: DASHBOARD GERENCIAL COMPLETO
-- ============================================================================

CREATE OR REPLACE VIEW vw_dashboard_ejecutivo AS
SELECT 
    CURRENT_DATE as fecha_reporte,
    
    -- KPI 1: Throughput
    (SELECT semana_actual_issues FROM kpi_throughput_comparativo()) as throughput_semanal,
    (SELECT variacion_porcentual FROM kpi_throughput_comparativo()) as throughput_variacion,
    
    -- KPI 2: Lead Time
    (SELECT lead_time_actual_h FROM kpi_lead_time_vs_meta()) as lead_time_horas,
    (SELECT cumple_meta FROM kpi_lead_time_vs_meta()) as lead_time_cumple_meta,
    
    -- KPI 4: Calidad
    (SELECT rework_rate FROM kpi_analisis_calidad()) as rework_rate_porcentaje,
    (SELECT calidad_score FROM kpi_analisis_calidad()) as calidad_score,
    
    -- KPI 5: Utilización
    (SELECT tasa_utilizacion FROM kpi_reporte_capacidad()) as utilizacion_equipo,
    (SELECT cumple_meta FROM kpi_reporte_capacidad()) as utilizacion_cumple_meta;

-- ============================================================================
-- FUNCIÓN: GENERAR REPORTE EJECUTIVO COMPLETO
-- ============================================================================

CREATE OR REPLACE FUNCTION generar_reporte_ejecutivo()
RETURNS JSON AS $$
DECLARE
    reporte JSON;
BEGIN
    SELECT json_build_object(
        'fecha', CURRENT_DATE,
        'periodo', 'Semana ' || TO_CHAR(CURRENT_DATE, 'WW/YYYY'),
        
        'kpi_throughput', json_build_object(
            'valor', (SELECT semana_actual_issues FROM kpi_throughput_comparativo()),
            'anterior', (SELECT semana_anterior_issues FROM kpi_throughput_comparativo()),
            'variacion', (SELECT variacion_porcentual FROM kpi_throughput_comparativo()),
            'tendencia', (SELECT tendencia FROM kpi_throughput_comparativo()),
            'meta', 'Incremental'
        ),
        
        'kpi_lead_time', json_build_object(
            'valor_horas', (SELECT lead_time_actual_h FROM kpi_lead_time_vs_meta()),
            'meta_horas', 24,
            'cumple', (SELECT cumple_meta FROM kpi_lead_time_vs_meta()),
            'status', (SELECT status FROM kpi_lead_time_vs_meta())
        ),
        
        'kpi_calidad', json_build_object(
            'entregas_totales', (SELECT total_entregas FROM kpi_analisis_calidad()),
            'rework_rate', (SELECT rework_rate FROM kpi_analisis_calidad()),
            'score', (SELECT calidad_score FROM kpi_analisis_calidad()),
            'recomendacion', (SELECT recomendacion FROM kpi_analisis_calidad())
        ),
        
        'kpi_utilizacion', json_build_object(
            'tasa', (SELECT tasa_utilizacion FROM kpi_reporte_capacidad()),
            'devs_activos', (SELECT devs_100_activos FROM kpi_reporte_capacidad()),
            'devs_bench', (SELECT devs_en_espera FROM kpi_reporte_capacidad()),
            'cumple_meta', (SELECT cumple_meta FROM kpi_reporte_capacidad()),
            'recomendacion', (SELECT recomendacion FROM kpi_reporte_capacidad())
        )
    ) INTO reporte;
    
    RETURN reporte;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
--
-- 1. Ejecutar este script DESPUÉS de schema-enhanced.sql
-- 2. Para obtener el reporte ejecutivo completo:
--    SELECT generar_reporte_ejecutivo();
--
-- 3. Para KPIs individuales:
--    SELECT * FROM kpi_throughput_comparativo();
--    SELECT * FROM kpi_lead_time_vs_meta(24.0);
--    SELECT * FROM kpi_analisis_calidad();
--    SELECT * FROM kpi_reporte_capacidad();
--
-- 4. Desde Next.js:
--    const { data } = await supabase.rpc('generar_reporte_ejecutivo');
--
-- ============================================================================
