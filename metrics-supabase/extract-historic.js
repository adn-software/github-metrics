import { extractMetrics } from './github-extractor-enhanced.js';
import { format, subDays } from 'date-fns';

/**
 * Script para extraer datos históricos
 * Uso: node extract-historic.js [dias_atras]
 * Ejemplo: node extract-historic.js 30 (extrae últimos 30 días)
 */

async function extractHistoric(daysBack = 30) {
  console.log(`\n📅 Extracción histórica: ${daysBack} días`);
  console.log('═══════════════════════════════════════════\n');
  
  const today = new Date();
  let successCount = 0;
  let errorCount = 0;
  
  for (let i = daysBack; i >= 0; i--) {
    const targetDate = subDays(today, i);
    const dateStr = format(targetDate, 'yyyy-MM-dd');
    
    console.log(`\n🔹 Día ${daysBack - i + 1}/${daysBack + 1}: ${dateStr}`);
    console.log('─'.repeat(40));
    
    try {
      await extractMetrics(targetDate);
      successCount++;
      
      // Pequeña pausa para no saturar la API de GitHub
      if (i > 0) {
        console.log('   ⏳ Esperando 2 segundos...\n');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error(`   ❌ Error en ${dateStr}: ${error.message}`);
      errorCount++;
    }
  }
  
  console.log('\n═══════════════════════════════════════════');
  console.log('✅ Extracción histórica completada');
  console.log(`   Éxitos: ${successCount}`);
  console.log(`   Errores: ${errorCount}`);
  console.log('═══════════════════════════════════════════\n');
}

// Ejecutar
const daysArg = process.argv[2] ? parseInt(process.argv[2]) : 30;
extractHistoric(daysArg);
