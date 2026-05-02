import { supabase } from './supabase.js';

async function exploreDatabase() {
  console.log('🔍 Explorando proyecto Supabase...\n');

  // 1. Información del proyecto
  console.log('📊 PROYECTO:');
  console.log(`   URL: ${process.env.SUPABASE_URL || 'https://wolzdaitdgcepohnrewm.supabase.co'}`);
  console.log(`   Cliente: Supabase JS v2.49.4\n`);

  // 2. Intentar obtener información de tablas usando diferentes métodos
  console.log('📋 TABLAS Y DATOS:');
  
  try {
    // Método 1: Consultar pg_tables (requiere permisos)
    const { data: tables, error: tablesError } = await supabase
      .from('pg_tables')
      .select('tablename, schemaname')
      .eq('schemaname', 'public');

    if (tablesError) {
      console.log(`   ℹ️  No se pueden listar tablas automáticamente (${tablesError.message})`);
      console.log(`   💡 Intenta consultar una tabla específica con: supabase.from('nombre_tabla').select('*')`);
    } else if (tables && tables.length > 0) {
      console.log(`   ✅ Encontradas ${tables.length} tablas en schema 'public':`);
      for (const table of tables) {
        // Contar registros en cada tabla
        const { count, error: countError } = await supabase
          .from(table.tablename)
          .select('*', { count: 'exact', head: true });
        
        if (!countError) {
          console.log(`      - ${table.tablename}: ${count} registros`);
        } else {
          console.log(`      - ${table.tablename}: (sin acceso)`);
        }
      }
    } else {
      console.log('   ℹ️  No hay tablas en el schema public');
    }
  } catch (error) {
    console.log(`   ⚠️  Error explorando: ${error.message}`);
  }

  // 3. Información de autenticación
  console.log('\n🔐 AUTENTICACIÓN:');
  const { data: { session }, error: authError } = await supabase.auth.getSession();
  
  if (session) {
    console.log(`   ✅ Sesión activa`);
    console.log(`   Usuario: ${session.user.email || session.user.id}`);
  } else {
    console.log(`   ℹ️  No hay sesión activa (autenticación anónima)`);
  }

  // 4. Opciones de consulta disponibles
  console.log('\n💡 CONSULTAS QUE PUEDES HACER:');
  console.log(`   • SELECT: supabase.from('tabla').select('*')`);
  console.log(`   • INSERT: supabase.from('tabla').insert({ campo: valor })`);
  console.log(`   • UPDATE: supabase.from('tabla').update({ campo: valor }).eq('id', 1)`);
  console.log(`   • DELETE: supabase.from('tabla').delete().eq('id', 1)`);
  console.log(`   • FILTROS: .eq(), .gt(), .lt(), .like(), .in()`);
  console.log(`   • ORDEN: .order('columna', { ascending: false })`);
  console.log(`   • PAGINACIÓN: .range(0, 9)`);
  console.log(`   • REALTIME: supabase.channel('canal').on('postgres_changes', ...)`);

  console.log('\n📝 EJEMPLO PRÁCTICO:');
  console.log(`   const { data, error } = await supabase`);
  console.log(`     .from('users')`);
  console.log(`     .select('*')`);
  console.log(`     .eq('status', 'active')`);
  console.log(`     .order('created_at', { ascending: false })`);
  console.log(`     .limit(10);`);
}

exploreDatabase().catch(console.error);
