import { supabase } from './supabase.js';
import { readFileSync, writeFileSync } from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise(resolve => rl.question(query, resolve));

async function setupAutomatico() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     🚀 SETUP AUTOMÁTICO - DASHBOARD CTO               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // PASO 1: Verificar conexión a Supabase
    console.log('📡 PASO 1: Verificando conexión a Supabase...');
    const { data: testData, error: testError } = await supabase
      .from('developers')
      .select('count')
      .limit(1);
    
    if (testError && testError.code === '42P01') {
      console.log('   ⚠️  Tablas no existen. Creando estructura...\n');
      
      // PASO 2: Crear tablas
      console.log('🗄️  PASO 2: Creando tablas en Supabase...');
      await crearTablas();
      
    } else if (testError) {
      console.error('   ❌ Error de conexión:', testError.message);
      console.log('\n💡 Verifica tus credenciales en supabase.js');
      process.exit(1);
    } else {
      console.log('   ✅ Conexión exitosa. Tablas ya existen.\n');
    }

    // PASO 3: Configurar GitHub Token
    console.log('🔑 PASO 3: Configuración de GitHub...');
    const githubToken = process.env.GITHUB_TOKEN;
    
    if (!githubToken || githubToken === 'ghp_your_github_token_here') {
      console.log('   ⚠️  GitHub token no configurado.\n');
      
      console.log('📋 Para obtener tu GitHub token:');
      console.log('   1. Ve a: https://github.com/settings/tokens');
      console.log('   2. Click en "Generate new token (classic)"');
      console.log('   3. Selecciona scopes: repo, read:org, read:user');
      console.log('   4. Copia el token generado\n');
      
      const token = await askQuestion('Pega tu GitHub token aquí: ');
      const org = await askQuestion('Nombre de tu organización de GitHub (opcional, Enter para omitir): ');
      
      await configurarEnv(token.trim(), org.trim());
      
      console.log('\n   ✅ Archivo .env configurado');
      console.log('   ⚠️  IMPORTANTE: Reinicia el script para que tome efecto');
      console.log('   Ejecuta: npm run setup\n');
      rl.close();
      process.exit(0);
    } else {
      console.log('   ✅ GitHub token configurado\n');
    }

    // PASO 4: Agregar desarrolladores
    console.log('👥 PASO 4: Configuración de desarrolladores...');
    const { data: devs } = await supabase.from('developers').select('count');
    
    if (!devs || devs.length === 0) {
      console.log('   ℹ️  No hay desarrolladores registrados.');
      const agregar = await askQuestion('   ¿Quieres agregar desarrolladores ahora? (s/n): ');
      
      if (agregar.toLowerCase() === 's') {
        await agregarDesarrolladores();
      } else {
        console.log('   ⚠️  Puedes agregar desarrolladores después con: npm run seed\n');
      }
    } else {
      console.log(`   ✅ ${devs[0].count} desarrolladores registrados\n`);
    }

    // PASO 5: Ejecutar primera extracción
    console.log('📊 PASO 5: Primera extracción de métricas...');
    const ejecutar = await askQuestion('   ¿Ejecutar extracción ahora? (s/n): ');
    
    if (ejecutar.toLowerCase() === 's') {
      console.log('\n   🔄 Ejecutando extracción...');
      const { extractMetrics } = await import('./github-extractor-enhanced.js');
      await extractMetrics();
    } else {
      console.log('   ℹ️  Puedes ejecutar después con: npm run extract\n');
    }

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     ✅ SETUP COMPLETADO EXITOSAMENTE                  ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('📋 Próximos pasos:');
    console.log('   1. Ejecutar extracciones diarias: npm run extract');
    console.log('   2. Ver métricas en Supabase Dashboard');
    console.log('   3. Consultar KPIs: SELECT * FROM vw_managerial_kpis_weekly;\n');

    rl.close();

  } catch (error) {
    console.error('\n❌ Error durante setup:', error.message);
    rl.close();
    process.exit(1);
  }
}

async function crearTablas() {
  console.log('\n   ⚠️  Las tablas deben crearse manualmente en Supabase por seguridad.\n');
  console.log('   � INSTRUCCIONES:');
  console.log('   1. Abre: https://supabase.com/dashboard/project/wolzdaitdgcepohnrewm/editor');
  console.log('   2. Click en "SQL Editor" en el menú lateral');
  console.log('   3. Click en "New query"');
  console.log('   4. Abre el archivo: schema-final.sql');
  console.log('   5. Copia TODO el contenido (Ctrl+A, Ctrl+C)');
  console.log('   6. Pega en el editor de Supabase (Ctrl+V)');
  console.log('   7. Click en "Run" (botón verde)\n');
  
  const continuar = await askQuestion('   ¿Ya ejecutaste el schema en Supabase? (s/n): ');
  
  if (continuar.toLowerCase() !== 's') {
    console.log('\n   ⏸️  Setup pausado. Ejecuta "npm run setup" cuando hayas creado las tablas.\n');
    rl.close();
    process.exit(0);
  }
  
  console.log('   ✅ Continuando...\n');
}

async function configurarEnv(githubToken, githubOrg) {
  console.log('⚠️  IMPORTANTE: Debes configurar manualmente SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_KEY');
  console.log('   Obtén estos valores desde tu proyecto Supabase > Settings > API');
  
  const envContent = `# Supabase (CONFIGURA ESTOS VALORES MANUALMENTE)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_KEY=tu_service_key_aqui

# GitHub
GITHUB_TOKEN=${githubToken}
${githubOrg ? `GITHUB_ORG=${githubOrg}` : '# GITHUB_ORG=tu-organizacion'}
`;

  writeFileSync('.env', envContent);
}

async function agregarDesarrolladores() {
  console.log('\n   📝 Agregar desarrolladores:');
  
  while (true) {
    const username = await askQuestion('      GitHub username (Enter para terminar): ');
    if (!username.trim()) break;
    
    const fullName = await askQuestion('      Nombre completo: ');
    
    const { error } = await supabase
      .from('developers')
      .insert({
        github_username: username.trim(),
        full_name: fullName.trim(),
        is_active: true
      });
    
    if (error) {
      console.log(`      ⚠️  Error: ${error.message}`);
    } else {
      console.log(`      ✅ ${username} agregado\n`);
    }
  }
}

setupAutomatico();
