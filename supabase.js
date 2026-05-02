import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
// Usar SERVICE_KEY si está disponible (permite bypass RLS para escritura)
// Si no, usar ANON_KEY (solo lectura para usuarios autenticados)
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Faltan las variables de entorno SUPABASE_URL y/o SUPABASE_ANON_KEY/SUPABASE_SERVICE_KEY');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function testConnection() {
  try {
    // Verifica que el cliente está configurado correctamente
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      throw error;
    }
    
    console.log('✅ Conexión a Supabase configurada correctamente');
    console.log(`   URL: ${supabaseUrl}`);
    return true;
  } catch (error) {
    console.error('❌ Error conectando a Supabase:', error.message);
    return false;
  }
}

// Función para listar tablas disponibles
export async function listTables() {
  try {
    const { data, error } = await supabase
      .rpc('get_tables');
    
    if (error) {
      // Fallback: consultar directamente pg_tables (si tenemos permisos)
      console.log('ℹ️  Nota: Usando service_role key para ver tablas');
    }
    
    return { data, error };
  } catch (error) {
    console.error('Error listando tablas:', error.message);
    return { data: null, error };
  }
}
