import { supabase } from './supabase.js';

/**
 * Script para ejecutar comprobaciones de alertas
 * Ejecutar manualmente o programar con cron
 */

async function runAlertChecks() {
  console.log('🔔 Ejecutando comprobaciones de alertas...\n');
  
  try {
    // Llamar a la función RPC que ejecuta todas las comprobaciones
    const { data, error } = await supabase
      .rpc('run_all_alert_checks');
    
    if (error) {
      console.error('❌ Error ejecutando comprobaciones:', error.message);
      return;
    }
    
    console.log('✅ Comprobaciones completadas:\n');
    
    let totalAlerts = 0;
    data.forEach(check => {
      console.log(`   ${check.check_name}: ${check.alerts_created} alertas creadas`);
      totalAlerts += check.alerts_created;
    });
    
    console.log(`\n📊 Total: ${totalAlerts} nuevas alertas generadas`);
    
    // Mostrar resumen de alertas activas
    const { data: summary } = await supabase
      .from('vw_alerts_summary')
      .select('*');
    
    if (summary && summary.length > 0) {
      console.log('\n📋 Resumen de alertas activas:');
      summary.forEach(s => {
        console.log(`   ${s.alert_type} (${s.severity}): ${s.count} total, ${s.unread_count} sin leer`);
      });
    } else {
      console.log('\n✨ No hay alertas activas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Ejecutar
runAlertChecks();
