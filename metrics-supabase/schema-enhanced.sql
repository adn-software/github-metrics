-- ============================================================================
-- DASHBOARD CTO - ESQUEMA COMPLETO CON VISTAS Y FUNCIONES
-- ============================================================================

-- ============================================================================
-- 1. TABLAS PRINCIPALES
-- ============================================================================

-- Tabla de desarrolladores
CREATE TABLE IF NOT EXISTS developers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    github_username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métricas diarias (snapshots)
CREATE TABLE IF NOT EXISTS daily_metrics (
    id BIGSERIAL PRIMARY KEY,
    developer_id UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    commits_count INT DEFAULT 0,
    lines_added INT DEFAULT 0,
    lines_deleted INT DEFAULT 0,
    repos_touched INT DEFAULT 0,
    issues_closed INT DEFAULT 0,
    avg_lead_time_h FLOAT DEFAULT 0,
    last_activity_at TIMESTAMP WITH TIME ZONE,
    days_inactive INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(developer_id, date)
);

-- ============================================================================
-- 2. ÍNDICES DE PERFORMANCE (CRÍTICOS PARA DASHBOARD RÁPIDO)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_daily_metrics_developer_id ON daily_metrics(developer_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_developer_date ON daily_metrics(developer_id, date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date_inactive ON daily_metrics(date, days_inactive);
CREATE INDEX IF NOT EXISTS idx_developers_github_username ON developers(github_username);
CREATE INDEX IF NOT EXISTS idx_developers_is_active ON developers(is_active);

-- Índice compuesto para consultas de rango de fechas
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date_range 
ON daily_metrics(date DESC, developer_id);

-- ============================================================================
-- 3. FUNCIONES RPC (PARA LÓGICA COMPLEJA)
-- ============================================================================

-- Función: Calcular score de desarrollador
CREATE OR REPLACE FUNCTION calcular_score_desarrollador(dev_id UUID, fecha_hasta DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
    score_total FLOAT,
    velocidad_score FLOAT,
    consistencia_score FLOAT,
    volumen_score FLOAT,
    foco_score FLOAT
) AS $$
BEGIN
    RETURN QUERY
    WITH metricas_7d AS (
        SELECT 
            SUM(commits_count) as total_commits,
            SUM(issues_closed) as total_issues,
            AVG(avg_lead_time_h) as avg_lead_time,
            SUM(lines_added + lines_deleted) as total_lines,
            AVG(repos_touched) as avg_repos,
            COUNT(DISTINCT date) as dias_activos
        FROM daily_metrics
        WHERE developer_id = dev_id 
        AND date >= fecha_hasta - INTERVAL '7 days'
        AND date <= fecha_hasta
    ),
    metricas_30d AS (
        SELECT AVG(days_inactive) as avg_inactividad
        FROM daily_metrics
        WHERE developer_id = dev_id 
        AND date >= fecha_hasta - INTERVAL '30 days'
        AND date <= fecha_hasta
    )
    SELECT 
        -- Score total ponderado (0-100)
        LEAST(100, (
            (m7.total_issues * 10) + 
            (m7.total_commits * 2) + 
            (CASE WHEN m7.avg_lead_time < 8 THEN 30 ELSE 20 END) +
            (CASE WHEN m7.avg_repos <= 2 THEN 20 ELSE 10 END) -
            (m30.avg_inactividad * 5)
        ))::FLOAT as score_total,
        
        -- Sub-scores
        LEAST(100, (100 / NULLIF(m7.avg_lead_time, 0)) * 10)::FLOAT as velocidad_score,
        LEAST(100, (m7.dias_activos / 7.0) * 100)::FLOAT as consistencia_score,
        LEAST(100, (m7.total_lines / 1000.0) * 100)::FLOAT as volumen_score,
        LEAST(100, 100 - ((m7.avg_repos - 1) * 25))::FLOAT as foco_score
        
    FROM metricas_7d m7, metricas_30d m30;
END;
$$ LANGUAGE plpgsql;

-- Función: Detectar desarrolladores en riesgo (bench/inactivos)
CREATE OR REPLACE FUNCTION detectar_desarrolladores_riesgo(dias_limite INT DEFAULT 3)
RETURNS TABLE (
    developer_id UUID,
    github_username TEXT,
    full_name TEXT,
    dias_inactivo INT,
    ultima_actividad TIMESTAMP WITH TIME ZONE,
    nivel_riesgo TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.github_username,
        d.full_name,
        dm.days_inactive,
        dm.last_activity_at,
        CASE 
            WHEN dm.days_inactive > dias_limite * 2 THEN 'CRÍTICO'
            WHEN dm.days_inactive > dias_limite THEN 'ALTO'
            WHEN dm.days_inactive > 1 THEN 'MEDIO'
            ELSE 'BAJO'
        END as nivel_riesgo
    FROM developers d
    INNER JOIN daily_metrics dm ON d.id = dm.developer_id
    WHERE dm.date = CURRENT_DATE
    AND d.is_active = true
    AND dm.days_inactive > 1
    ORDER BY dm.days_inactive DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 4. VISTAS PARA WIDGETS DEL DASHBOARD
-- ============================================================================

-- Vista 1: Radar de Disponibilidad (Bench Watch)
CREATE OR REPLACE VIEW vw_bench_watch AS
SELECT 
    d.id as developer_id,
    d.github_username,
    d.full_name,
    dm.days_inactive,
    dm.last_activity_at,
    CASE 
        WHEN dm.days_inactive > 2 THEN '🔴 CRÍTICO'
        WHEN dm.days_inactive = 2 THEN '🟠 ALTO'
        WHEN dm.days_inactive = 1 THEN '🟡 MEDIO'
        ELSE '🟢 ACTIVO'
    END as status_bench,
    dm.date
FROM developers d
LEFT JOIN daily_metrics dm ON d.id = dm.developer_id AND dm.date = CURRENT_DATE
WHERE d.is_active = true
ORDER BY dm.days_inactive DESC NULLS LAST;

-- Vista 2: Velocidad de Entrega (Throughput)
CREATE OR REPLACE VIEW vw_throughput_daily AS
SELECT 
    date,
    SUM(issues_closed) as total_issues_closed,
    SUM(commits_count) as total_commits,
    COUNT(DISTINCT developer_id) as developers_activos,
    ROUND(AVG(avg_lead_time_h), 2) as avg_lead_time_horas
FROM daily_metrics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Vista 3: Eficiencia por Desarrollador (Lead Time)
CREATE OR REPLACE VIEW vw_velocity_by_dev AS
SELECT 
    d.id as developer_id,
    d.github_username,
    d.full_name,
    ROUND(AVG(dm.avg_lead_time_h), 2) as avg_lead_time_h,
    SUM(dm.issues_closed) as total_issues_closed,
    MIN(dm.avg_lead_time_h) as best_lead_time_h,
    MAX(dm.date) as last_metric_date
FROM developers d
LEFT JOIN daily_metrics dm ON d.id = dm.developer_id
AND dm.date >= CURRENT_DATE - INTERVAL '7 days'
WHERE d.is_active = true
GROUP BY d.id, d.github_username, d.full_name
ORDER BY avg_lead_time_h ASC NULLS LAST;

-- Vista 4: Volumen de Código (Code Volume)
CREATE OR REPLACE VIEW vw_code_volume_daily AS
SELECT 
    date,
    SUM(lines_added) as total_added,
    SUM(lines_deleted) as total_deleted,
    SUM(lines_added + lines_deleted) as total_churn,
    ROUND(AVG(lines_added::FLOAT / NULLIF(lines_deleted, 0)), 2) as add_delete_ratio
FROM daily_metrics
WHERE date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY date
ORDER BY date DESC;

-- Vista 5: Índice de Foco (Context Switching)
CREATE OR REPLACE VIEW vw_focus_index AS
SELECT 
    d.github_username,
    d.full_name,
    dm.date,
    dm.repos_touched,
    dm.lines_added + dm.lines_deleted as code_volume,
    CASE 
        WHEN dm.repos_touched = 1 THEN '🟢 ENFOCADO'
        WHEN dm.repos_touched = 2 THEN '🟡 MODERADO'
        ELSE '🔴 DISPERSO'
    END as focus_status
FROM daily_metrics dm
JOIN developers d ON dm.developer_id = d.id
WHERE dm.date >= CURRENT_DATE - INTERVAL '7 days'
AND d.is_active = true
ORDER BY dm.date DESC, dm.repos_touched DESC;

-- Vista 6: Consistencia de Flujo (Commit Pulse)
CREATE OR REPLACE VIEW vw_commit_pulse AS
SELECT 
    d.id as developer_id,
    d.github_username,
    dm.date,
    dm.commits_count,
    LAG(dm.commits_count, 1) OVER (PARTITION BY d.id ORDER BY dm.date) as commits_prev_day,
    dm.commits_count - LAG(dm.commits_count, 1) OVER (PARTITION BY d.id ORDER BY dm.date) as commit_delta
FROM daily_metrics dm
JOIN developers d ON dm.developer_id = d.id
WHERE dm.date >= CURRENT_DATE - INTERVAL '14 days'
AND d.is_active = true
ORDER BY d.github_username, dm.date DESC;

-- Vista 7: Performance Semanal (Resumen CTO)
CREATE OR REPLACE VIEW vw_weekly_dev_performance AS
SELECT 
    dm.developer_id,
    d.github_username,
    d.full_name,
    SUM(dm.issues_closed) as total_tasks,
    ROUND(AVG(dm.avg_lead_time_h), 2) as velocity_avg_h,
    MAX(dm.last_activity_at) as last_seen,
    SUM(dm.commits_count) as total_commits,
    SUM(dm.lines_added) as total_lines_added,
    ROUND(AVG(dm.repos_touched), 1) as avg_repos_per_day,
    MAX(dm.days_inactive) as max_days_inactive
FROM daily_metrics dm
JOIN developers d ON dm.developer_id = d.id
WHERE dm.date > CURRENT_DATE - INTERVAL '7 days'
AND d.is_active = true
GROUP BY dm.developer_id, d.github_username, d.full_name
ORDER BY total_tasks DESC, velocity_avg_h ASC;

-- Vista 8: Resumen completo para dashboard principal
CREATE OR REPLACE VIEW recent_metrics_summary AS
SELECT 
    d.id as developer_id,
    d.github_username,
    d.full_name,
    d.is_active,
    dm.id as metric_id,
    dm.date,
    dm.commits_count,
    dm.lines_added,
    dm.lines_deleted,
    dm.repos_touched,
    dm.issues_closed,
    dm.avg_lead_time_h,
    dm.days_inactive,
    dm.last_activity_at
FROM developers d
LEFT JOIN daily_metrics dm ON d.id = dm.developer_id
WHERE d.is_active = true
ORDER BY dm.date DESC NULLS LAST, d.github_username;

-- ============================================================================
-- 5. TRIGGERS PARA ACTUALIZACIÓN AUTOMÁTICA
-- ============================================================================

-- Función para actualizar timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_developers_updated_at ON developers;
CREATE TRIGGER update_developers_updated_at
    BEFORE UPDATE ON developers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_metrics_updated_at ON daily_metrics;
CREATE TRIGGER update_daily_metrics_updated_at
    BEFORE UPDATE ON daily_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 6. POLÍTICAS RLS (ROW LEVEL SECURITY) - OPCIONAL
-- ============================================================================

-- Habilitar RLS en las tablas
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados ven todo (para admin/CTO)
CREATE POLICY "Allow all for authenticated" ON developers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON daily_metrics
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Nota: Para restricciones más granulares (devs ven solo sus datos),
-- descomenta y adapta estas políticas:

-- CREATE POLICY "Users see own data" ON daily_metrics
--     FOR SELECT
--     TO authenticated
--     USING (developer_id = auth.uid());

-- ============================================================================
-- 7. TABLA DE CONFIGURACIÓN Y LOG
-- ============================================================================

-- Tabla para logs de extracción
CREATE TABLE IF NOT EXISTS extraction_logs (
    id BIGSERIAL PRIMARY KEY,
    extraction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT,
    developers_processed INT,
    records_inserted INT,
    records_updated INT,
    errors TEXT,
    duration_seconds INT
);

CREATE INDEX IF NOT EXISTS idx_extraction_logs_date ON extraction_logs(extraction_date DESC);

-- ============================================================================
-- INSTRUCCIONES DE USO
-- ============================================================================
-- 
-- 1. Ejecutar todo este script en Supabase SQL Editor
-- 2. Las vistas estarán disponibles inmediatamente
-- 3. Para llamar funciones RPC desde Next.js:
--    const { data, error } = await supabase
--      .rpc('calcular_score_desarrollador', { 
--        dev_id: 'uuid-del-dev', 
--        fecha_hasta: '2026-05-01' 
--      });
--
-- 4. Para consultar vistas:
--    const { data } = await supabase
--      .from('vw_bench_watch')
--      .select('*');
--
-- ============================================================================
