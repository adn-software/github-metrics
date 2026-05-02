import { Octokit } from 'octokit';
import { supabase } from './supabase.js';
import { format, subDays, differenceInDays, parseISO, differenceInHours } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ORG = process.env.GITHUB_ORG;

if (!GITHUB_TOKEN) {
  console.error('❌ Error: Falta GITHUB_TOKEN en variables de entorno');
  process.exit(1);
}

// Inicializar cliente de GitHub
const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Obtiene la lista de desarrolladores activos desde Supabase
 */
async function getDevelopers() {
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .eq('is_active', true);
  
  if (error) {
    throw new Error(`Error obteniendo desarrolladores: ${error.message}`);
  }
  
  return data || [];
}

/**
 * Obtiene eventos de GitHub para un usuario específico
 */
async function getUserEvents(username, since, until) {
  try {
    const events = [];
    let page = 1;
    const perPage = 100;
    
    while (true) {
      const { data } = await octokit.request('GET /users/{username}/events', {
        username,
        per_page: perPage,
        page,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      
      if (data.length === 0) break;
      
      // Filtrar eventos del rango de fechas
      const filteredEvents = data.filter(event => {
        const eventDate = parseISO(event.created_at);
        return eventDate >= since && eventDate <= until;
      });
      
      events.push(...filteredEvents);
      
      // Si el evento más antiguo ya es anterior a 'since', detener
      const oldestEvent = data[data.length - 1];
      if (parseISO(oldestEvent.created_at) < since) break;
      
      page++;
      
      // Límite de seguridad
      if (page > 10) break;
    }
    
    return events;
  } catch (error) {
    console.error(`   ⚠️  Error obteniendo eventos de ${username}: ${error.message}`);
    return [];
  }
}

/**
 * Obtiene Issues cerrados por un usuario en un rango de fechas
 */
async function getClosedIssues(username, since, until, org) {
  try {
    const query = org 
      ? `org:${org} author:${username} is:closed created:${format(since, 'yyyy-MM-dd')}..${format(until, 'yyyy-MM-dd')}`
      : `author:${username} is:closed created:${format(since, 'yyyy-MM-dd')}..${format(until, 'yyyy-MM-dd')}`;
    
    const { data } = await octokit.request('GET /search/issues', {
      q: query,
      per_page: 100,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    return data.items || [];
  } catch (error) {
    console.error(`   ⚠️  Error obteniendo issues de ${username}: ${error.message}`);
    return [];
  }
}

/**
 * Obtiene estadísticas de un commit específico
 */
async function getCommitStats(owner, repo, sha) {
  try {
    const { data } = await octokit.request('GET /repos/{owner}/{repo}/commits/{ref}', {
      owner,
      repo,
      ref: sha,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    });
    
    return {
      additions: data.stats?.additions || 0,
      deletions: data.stats?.deletions || 0
    };
  } catch (error) {
    return { additions: 0, deletions: 0 };
  }
}

/**
 * Calcula métricas diarias para un desarrollador
 */
async function calculateDailyMetrics(developer, targetDate) {
  const since = new Date(targetDate);
  since.setHours(0, 0, 0, 0);
  
  const until = new Date(targetDate);
  until.setHours(23, 59, 59, 999);
  
  console.log(`\n👤 Procesando: ${developer.github_username} (${format(targetDate, 'yyyy-MM-dd')})`);
  
  // Obtener eventos del día
  const events = await getUserEvents(developer.github_username, since, until);
  
  // Obtener último evento (para calcular inactividad)
  const lastEvent = events.length > 0 ? events[0] : null;
  const lastActivityAt = lastEvent ? parseISO(lastEvent.created_at) : null;
  
  // Calcular días de inactividad desde la última actividad hasta hoy
  const today = new Date();
  const daysInactive = lastActivityAt ? differenceInDays(today, lastActivityAt) : 999;
  
  // Métricas de commits y código
  let commitsCount = 0;
  let linesAdded = 0;
  let linesDeleted = 0;
  const reposTouched = new Set();
  
  for (const event of events) {
    // Contar repos distintos
    if (event.repo?.name) {
      reposTouched.add(event.repo.name);
    }
    
    // Procesar PushEvent
    if (event.type === 'PushEvent' && event.payload?.commits) {
      const commits = event.payload.commits;
      commitsCount += commits.length;
      
      // Obtener stats de cada commit (limitado para no saturar la API)
      if (commits.length <= 10) {
        for (const commit of commits) {
          const [owner, repo] = event.repo.name.split('/');
          if (owner && repo) {
            const stats = await getCommitStats(owner, repo, commit.sha);
            linesAdded += stats.additions;
            linesDeleted += stats.deletions;
          }
        }
      } else {
        // Para muchos commits, estimar basado en el primer commit
        const [owner, repo] = event.repo.name.split('/');
        if (owner && repo && commits[0]) {
          const stats = await getCommitStats(owner, repo, commits[0].sha);
          linesAdded += stats.additions * commits.length;
          linesDeleted += stats.deletions * commits.length;
        }
      }
    }
  }
  
  // Métricas de Issues
  const closedIssues = await getClosedIssues(
    developer.github_username, 
    since, 
    until, 
    GITHUB_ORG
  );
  
  const issuesClosed = closedIssues.length;
  
  // Calcular lead time promedio
  let totalLeadTimeHours = 0;
  for (const issue of closedIssues) {
    const created = parseISO(issue.created_at);
    const closed = parseISO(issue.closed_at);
    const hours = differenceInHours(closed, created);
    totalLeadTimeHours += hours;
  }
  
  const avgLeadTimeHours = issuesClosed > 0 ? totalLeadTimeHours / issuesClosed : 0;
  
  const metrics = {
    developer_id: developer.id,
    date: format(targetDate, 'yyyy-MM-dd'),
    commits_count: commitsCount,
    lines_added: linesAdded,
    lines_deleted: linesDeleted,
    repos_touched: reposTouched.size,
    issues_closed: issuesClosed,
    avg_lead_time_h: avgLeadTimeHours,
    last_activity_at: lastActivityAt ? lastActivityAt.toISOString() : null,
    days_inactive: daysInactive
  };
  
  console.log(`   📊 Métricas calculadas:`);
  console.log(`      Commits: ${commitsCount}`);
  console.log(`      Líneas (+${linesAdded}/-${linesDeleted})`);
  console.log(`      Repos: ${reposTouched.size}`);
  console.log(`      Issues cerrados: ${issuesClosed}`);
  console.log(`      Lead time promedio: ${avgLeadTimeHours.toFixed(1)}h`);
  console.log(`      Última actividad: ${lastActivityAt ? format(lastActivityAt, 'yyyy-MM-dd HH:mm') : 'N/A'}`);
  console.log(`      Días inactivo: ${daysInactive}`);
  
  return metrics;
}

/**
 * Guarda o actualiza métricas en Supabase
 */
async function saveMetrics(metrics) {
  const { data, error } = await supabase
    .from('daily_metrics')
    .upsert(metrics, {
      onConflict: 'developer_id,date',
      ignoreDuplicates: false
    });
  
  if (error) {
    throw new Error(`Error guardando métricas: ${error.message}`);
  }
  
  return data;
}

/**
 * Función principal de extracción
 */
export async function extractMetrics(targetDate = new Date()) {
  console.log('═══════════════════════════════════════════');
  console.log('🔧 EXTRACTOR DE MÉTRICAS GITHUB - CTO Dashboard');
  console.log('═══════════════════════════════════════════');
  console.log(`📅 Fecha objetivo: ${format(targetDate, 'yyyy-MM-dd')}`);
  
  try {
    // Obtener desarrolladores
    const developers = await getDevelopers();
    
    if (developers.length === 0) {
      console.log('\n⚠️  No hay desarrolladores activos en la base de datos.');
      console.log('   Usa el script seed-developers.js para agregarlos.');
      return;
    }
    
    console.log(`\n👥 Desarrolladores activos: ${developers.length}`);
    
    // Procesar cada desarrollador
    for (const developer of developers) {
      const metrics = await calculateDailyMetrics(developer, targetDate);
      await saveMetrics(metrics);
    }
    
    // Procesar actividad por proyecto (para KPI Project Mix)
    await processProjectActivity(targetDate);
    
    console.log('\n✅ Extracción completada exitosamente');
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error en extracción:', error.message);
    process.exit(1);
  }
}

/**
 * Procesa actividad por proyecto para KPI de Project Mix
 */
async function processProjectActivity(targetDate) {
  console.log('\n📊 Procesando actividad por proyecto...');
  
  try {
    // Obtener métricas del día agrupadas por repo
    const { data: metrics, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('date', format(targetDate, 'yyyy-MM-dd'));
    
    if (error) throw error;
    
    // Agrupar por repo (necesitamos extender el extractor para capturar repo_name)
    // Por ahora, esto es un placeholder - se completará cuando extraigamos repos
    console.log('   ℹ️  Project activity tracking pendiente de implementación completa');
    
  } catch (error) {
    console.error('   ⚠️  Error procesando project activity:', error.message);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetDate = process.argv[2] ? new Date(process.argv[2]) : new Date();
  extractMetrics(targetDate);
}
