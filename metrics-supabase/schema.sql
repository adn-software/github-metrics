-- Estructura de Base de Datos para Dashboard de Métricas CTO
-- Compatible con PostgreSQL / Supabase

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
    
    -- Evitar duplicados de métricas por desarrollador y fecha
    UNIQUE(developer_id, date)
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_daily_metrics_developer_id ON daily_metrics(developer_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_developer_date ON daily_metrics(developer_id, date);
CREATE INDEX IF NOT EXISTS idx_developers_github_username ON developers(github_username);
CREATE INDEX IF NOT EXISTS idx_developers_is_active ON developers(is_active);

-- Función para actualizar el timestamp de updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at automáticamente
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

-- Vista para resumen de métricas recientes
CREATE OR REPLACE VIEW recent_metrics_summary AS
SELECT 
    d.github_username,
    d.full_name,
    d.is_active,
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
ORDER BY dm.date DESC, d.github_username;
