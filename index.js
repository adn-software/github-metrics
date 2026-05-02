import { supabase, testConnection } from './supabase.js';

async function main() {
  console.log('Iniciando conexión a Supabase...\n');
  
  // Test de conexión
  await testConnection();
  
  // Ejemplo: Listar tablas (requiere permisos)
  console.log('\n--- Ejemplo: Consultando datos ---');
  
  // Aquí puedes agregar tus consultas
  // const { data, error } = await supabase.from('tu_tabla').select('*');
  // console.log(data);
}

main();
