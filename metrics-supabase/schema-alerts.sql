-- ============================================
-- SISTEMA DE ALERTAS AUTOMÁTICAS
-- ============================================

-- Tabla de alertas
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  title TEXT NOT NULL,
  description TEXT,
  entity_type VARCHAR(50),
  entity_id TEXT,
  metadata JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  is_resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT
);

-- Índices para alertas
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_unresolved ON alerts(is_resolved) WHERE is_resolved = FALSE;

-- Tabla de configuración de alertas
CREATE TABLE IF NOT EXISTS alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(50) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT TRUE,
  threshold_value NUMERIC,
  threshold_operator VARCHAR(10) CHECK (threshold_operator IN ('>', '<', '>=', '<=', '=', '!=')),
  check_frequency_minutes INTEGER DEFAULT 60,
  notification_channels JSONB DEFAULT '["dashboard"]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuraciones por defecto
INSERT INTO alert_config (alert_type, threshold_value, threshold_operator, check_frequency_minutes, notification_channels) VALUES
  ('developer_inactive', 3, '>', 60, '["dashboard", "email"]'),
  ('stale_issue', 7, '>', 120, '["dashboard"]'),
  ('high_rework_rate', 15, '>', 60, '["dashboard", "email"]'),
  ('low_throughput', 5, '<', 1440, '["dashboard"]'),
  ('long_lead_time', 48, '>', 60, '["dashboard"]')
ON CONFLICT (alert_type) DO NOTHING;

-- ============================================
-- FUNCIONES PARA GENERAR ALERTAS
-- ============================================

-- Función: Detectar desarrolladores inactivos
CREATE OR REPLACE FUNCTION check_inactive_developers()
RETURNS void AS $$
DECLARE
  config_threshold INTEGER;
  inactive_dev RECORD;
BEGIN
  -- Obtener threshold configurado
  SELECT threshold_value INTO config_threshold 
  FROM alert_config 
  WHERE alert_type = 'developer_inactive' AND is_enabled = TRUE;
  
  IF config_threshold IS NULL THEN
    RETURN;
  END IF;
  
  -- Detectar desarrolladores inactivos
  FOR inactive_dev IN 
    SELECT 
      developer_id,
      full_name,
      github_username,
      days_inactive
    FROM vw_bench_watch
    WHERE days_inactive > config_threshold
      AND status_bench LIKE '%CRÍTICO%'
  LOOP
    -- Insertar alerta si no existe una reciente (últimas 24h)
    INSERT INTO alerts (
      alert_type,
      severity,
      title,
      description,
      entity_type,
      entity_id,
      metadata
    )
    SELECT 
      'developer_inactive',
      CASE 
        WHEN inactive_dev.days_inactive > 7 THEN 'CRITICAL'
        WHEN inactive_dev.days_inactive > 5 THEN 'HIGH'
        ELSE 'MEDIUM'
      END,
      'Desarrollador Inactivo: ' || inactive_dev.full_name,
      'El desarrollador @' || inactive_dev.github_username || ' lleva ' || inactive_dev.days_inactive || ' días sin actividad.',
      'developer',
      inactive_dev.developer_id::TEXT,
      jsonb_build_object(
        'github_username', inactive_dev.github_username,
        'days_inactive', inactive_dev.days_inactive
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM alerts 
      WHERE alert_type = 'developer_inactive'
        AND entity_id = inactive_dev.developer_id::TEXT
        AND is_resolved = FALSE
        AND created_at > NOW() - INTERVAL '24 hours'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función: Detectar issues estancados
CREATE OR REPLACE FUNCTION check_stale_issues()
RETURNS void AS $$
DECLARE
  config_threshold INTEGER;
  stale_issue RECORD;
BEGIN
  SELECT threshold_value INTO config_threshold 
  FROM alert_config 
  WHERE alert_type = 'stale_issue' AND is_enabled = TRUE;
  
  IF config_threshold IS NULL THEN
    RETURN;
  END IF;
  
  FOR stale_issue IN 
    SELECT 
      github_issue_id,
      repository_name,
      title,
      days_open,
      urgency_level
    FROM vw_stale_issues
    WHERE days_open > config_threshold
      AND urgency_level LIKE '%CRÍTICO%'
    LIMIT 10
  LOOP
    INSERT INTO alerts (
      alert_type,
      severity,
      title,
      description,
      entity_type,
      entity_id,
      metadata
    )
    SELECT 
      'stale_issue',
      CASE 
        WHEN stale_issue.days_open > 14 THEN 'CRITICAL'
        WHEN stale_issue.days_open > 10 THEN 'HIGH'
        ELSE 'MEDIUM'
      END,
      'Issue Estancado: ' || stale_issue.repository_name,
      stale_issue.title || ' (abierto hace ' || stale_issue.days_open || ' días)',
      'issue',
      stale_issue.github_issue_id::TEXT,
      jsonb_build_object(
        'repository', stale_issue.repository_name,
        'days_open', stale_issue.days_open,
        'title', stale_issue.title
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM alerts 
      WHERE alert_type = 'stale_issue'
        AND entity_id = stale_issue.github_issue_id::TEXT
        AND is_resolved = FALSE
        AND created_at > NOW() - INTERVAL '24 hours'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Función: Detectar alta tasa de retrabajo
CREATE OR REPLACE FUNCTION check_high_rework_rate()
RETURNS void AS $$
DECLARE
  config_threshold NUMERIC;
  current_rework_rate NUMERIC;
BEGIN
  SELECT threshold_value INTO config_threshold 
  FROM alert_config 
  WHERE alert_type = 'high_rework_rate' AND is_enabled = TRUE;
  
  IF config_threshold IS NULL THEN
    RETURN;
  END IF;
  
  -- Obtener tasa actual de retrabajo
  SELECT m4_tasa_retrabajo_pct INTO current_rework_rate
  FROM vw_managerial_kpis_weekly
  LIMIT 1;
  
  IF current_rework_rate > config_threshold THEN
    INSERT INTO alerts (
      alert_type,
      severity,
      title,
      description,
      metadata
    )
    SELECT 
      'high_rework_rate',
      CASE 
        WHEN current_rework_rate > 25 THEN 'CRITICAL'
        WHEN current_rework_rate > 20 THEN 'HIGH'
        ELSE 'MEDIUM'
      END,
      'Alta Tasa de Retrabajo',
      'La tasa de retrabajo es del ' || ROUND(current_rework_rate, 1) || '%, superando el umbral de ' || config_threshold || '%',
      jsonb_build_object(
        'current_rate', current_rework_rate,
        'threshold', config_threshold
      )
    WHERE NOT EXISTS (
      SELECT 1 FROM alerts 
      WHERE alert_type = 'high_rework_rate'
        AND is_resolved = FALSE
        AND created_at > NOW() - INTERVAL '6 hours'
    );
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Función: Ejecutar todas las comprobaciones de alertas
CREATE OR REPLACE FUNCTION run_all_alert_checks()
RETURNS TABLE(check_name TEXT, alerts_created INTEGER) AS $$
DECLARE
  initial_count INTEGER;
  final_count INTEGER;
BEGIN
  -- Check 1: Desarrolladores inactivos
  SELECT COUNT(*) INTO initial_count FROM alerts WHERE created_at > NOW() - INTERVAL '1 minute';
  PERFORM check_inactive_developers();
  SELECT COUNT(*) INTO final_count FROM alerts WHERE created_at > NOW() - INTERVAL '1 minute';
  check_name := 'Desarrolladores Inactivos';
  alerts_created := final_count - initial_count;
  RETURN NEXT;
  
  -- Check 2: Issues estancados
  SELECT COUNT(*) INTO initial_count FROM alerts WHERE created_at > NOW() - INTERVAL '1 minute';
  PERFORM check_stale_issues();
  SELECT COUNT(*) INTO final_count FROM alerts WHERE created_at > NOW() - INTERVAL '1 minute';
  check_name := 'Issues Estancados';
  alerts_created := final_count - initial_count;
  RETURN NEXT;
  
  -- Check 3: Alta tasa de retrabajo
  SELECT COUNT(*) INTO initial_count FROM alerts WHERE created_at > NOW() - INTERVAL '1 minute';
  PERFORM check_high_rework_rate();
  SELECT COUNT(*) INTO final_count FROM alerts WHERE created_at > NOW() - INTERVAL '1 minute';
  check_name := 'Tasa de Retrabajo';
  alerts_created := final_count - initial_count;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VISTAS PARA ALERTAS
-- ============================================

-- Vista: Alertas activas (no resueltas)
CREATE OR REPLACE VIEW vw_active_alerts AS
SELECT 
  id,
  alert_type,
  severity,
  title,
  description,
  entity_type,
  entity_id,
  metadata,
  is_read,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_since_created
FROM alerts
WHERE is_resolved = FALSE
ORDER BY 
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END,
  created_at DESC;

-- Vista: Resumen de alertas por tipo
CREATE OR REPLACE VIEW vw_alerts_summary AS
SELECT 
  alert_type,
  severity,
  COUNT(*) as count,
  COUNT(*) FILTER (WHERE is_read = FALSE) as unread_count,
  MAX(created_at) as last_alert_at
FROM alerts
WHERE is_resolved = FALSE
GROUP BY alert_type, severity
ORDER BY 
  CASE severity
    WHEN 'CRITICAL' THEN 1
    WHEN 'HIGH' THEN 2
    WHEN 'MEDIUM' THEN 3
    WHEN 'LOW' THEN 4
  END;

-- ============================================
-- RLS (Row Level Security)
-- ============================================

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_config ENABLE ROW LEVEL SECURITY;

-- Políticas: Permitir lectura a todos (anon y authenticated)
-- Usar DO block para evitar errores si ya existen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'alerts' AND policyname = 'Permitir lectura de alertas'
  ) THEN
    CREATE POLICY "Permitir lectura de alertas" ON alerts FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'alert_config' AND policyname = 'Permitir lectura de configuracion'
  ) THEN
    CREATE POLICY "Permitir lectura de configuracion" ON alert_config FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'alerts' AND policyname = 'Permitir actualizar alertas'
  ) THEN
    CREATE POLICY "Permitir actualizar alertas" ON alerts FOR UPDATE USING (true);
  END IF;
END $$;

COMMENT ON TABLE alerts IS 'Tabla de alertas automáticas del sistema';
COMMENT ON TABLE alert_config IS 'Configuración de tipos de alertas y umbrales';
COMMENT ON FUNCTION run_all_alert_checks() IS 'Ejecuta todas las comprobaciones de alertas configuradas';
