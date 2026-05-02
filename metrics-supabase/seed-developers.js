import { supabase } from './supabase.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Agrega un desarrollador a la base de datos
 */
async function addDeveloper(githubUsername, fullName) {
  const { data, error } = await supabase
    .from('developers')
    .insert({
      github_username: githubUsername,
      full_name: fullName,
      is_active: true
    })
    .select()
    .single();
  
  if (error) {
    if (error.code === '23505') {
      console.log(`⚠️  El desarrollador ${githubUsername} ya existe.`);
      return null;
    }
    throw new Error(`Error agregando desarrollador: ${error.message}`);
  }
  
  console.log(`✅ Desarrollador agregado: ${githubUsername} (${fullName})`);
  return data;
}

/**
 * Lista desarrolladores existentes
 */
async function listDevelopers() {
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .order('github_username');
  
  if (error) {
    throw new Error(`Error listando desarrolladores: ${error.message}`);
  }
  
  if (data.length === 0) {
    console.log('\n📭 No hay desarrolladores registrados.');
  } else {
    console.log('\n👥 Desarrolladores registrados:');
    console.log('──────────────────────────────────────');
    for (const dev of data) {
      const status = dev.is_active ? '🟢' : '🔴';
      console.log(`   ${status} ${dev.github_username} (${dev.full_name || 'Sin nombre'})`);
    }
    console.log('──────────────────────────────────────');
    console.log(`Total: ${data.length} desarrolladores\n`);
  }
  
  return data;
}

/**
 * Elimina un desarrollador
 */
async function removeDeveloper(githubUsername) {
  const { error } = await supabase
    .from('developers')
    .delete()
    .eq('github_username', githubUsername);
  
  if (error) {
    throw new Error(`Error eliminando desarrollador: ${error.message}`);
  }
  
  console.log(`🗑️  Desarrollador eliminado: ${githubUsername}`);
}

/**
 * Menú interactivo
 */
function showMenu() {
  console.log('\n═══════════════════════════════════════');
  console.log('   GESTIÓN DE DESARROLLADORES');
  console.log('═══════════════════════════════════════');
  console.log('1. Agregar desarrollador');
  console.log('2. Listar desarrolladores');
  console.log('3. Eliminar desarrollador');
  console.log('4. Salir');
  console.log('───────────────────────────────────────');
}

async function main() {
  console.log('🚀 Iniciando gestión de desarrolladores...\n');
  
  // Verificar conexión
  try {
    await supabase.from('developers').select('count').limit(1);
    console.log('✅ Conexión a Supabase verificada\n');
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.log('💡 Verifica que las tablas estén creadas ejecutando schema.sql');
    process.exit(1);
  }
  
  const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));
  
  while (true) {
    showMenu();
    const option = await askQuestion('Selecciona una opción: ');
    
    switch (option.trim()) {
      case '1': {
        const username = await askQuestion('GitHub username: ');
        const name = await askQuestion('Nombre completo: ');
        if (username.trim()) {
          await addDeveloper(username.trim(), name.trim());
        }
        break;
      }
      
      case '2': {
        await listDevelopers();
        break;
      }
      
      case '3': {
        await listDevelopers();
        const username = await askQuestion('Username a eliminar: ');
        if (username.trim()) {
          const confirm = await askQuestion('¿Confirmar eliminación? (s/n): ');
          if (confirm.toLowerCase() === 's') {
            await removeDeveloper(username.trim());
          }
        }
        break;
      }
      
      case '4': {
        console.log('\n👋 Saliendo...\n');
        rl.close();
        return;
      }
      
      default: {
        console.log('\n⚠️  Opción inválida\n');
      }
    }
  }
}

main().catch(error => {
  console.error('Error:', error.message);
  rl.close();
  process.exit(1);
});
