import { supabase } from './supabase.js';

const schemaSQL = `
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

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_daily_metrics_developer_id ON daily_metrics(developer_id);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_developer_date ON daily_metrics(developer_id, date);
CREATE INDEX IF NOT EXISTS idx_developers_github_username ON developers(github_username);
CREATE INDEX IF NOT EXISTS idx_developers_is_active ON developers(is_active);
`;

async function setupDatabase() {
  console.log('🔧 Configurando base de datos...\n');
  
  // Verificar si la tabla developers existe
  const { data: devTable, error: devError } = await supabase
    .from('developers')
    .select('count')
    .limit(1);
  
  if (devError && devError.code === '42P01') {
    console.log('⚠️  Tablas no existen. Por favor ejecuta schema.sql manualmente en Supabase:');
    console.log('\n📋 Pasos:');
    console.log('   1. Ve a tu dashboard de Supabase');
    console.log('   2. SQL Editor > New query');
    console.log('   3. Pega el contenido de schema.sql');
    console.log('   4. Click en Run\n');
    console.log('\n📝 SQL a ejecutar:');
    console.log('─────────────────────────────────────────');
    console.log(schemaSQL);
    console.log('─────────────────────────────────────────\n');
  } else if (devError) {
    console.error('❌ Error verificando tablas:', devError.message);
  } else {
    console.log('✅ Tablas ya existen en la base de datos');
    
    // Verificar tabla daily_metrics
    const { data: metricsTable, error: metricsError } = await supabase
      .from('daily_metrics')
      .select('count')
      .limit(1);
    
    if (metricsError && metricsError.code === '42P01') {
      console.log('⚠️  Tabla daily_metrics no existe. Ejecuta schema.sql');
    } else {
      console.log('✅ Tabla daily_metrics OK');
    }
  }
}

setupDatabase().catch(console.error);
