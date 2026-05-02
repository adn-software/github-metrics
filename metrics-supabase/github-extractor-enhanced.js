import { Octokit } from 'octokit';
import { supabase } from './supabase.js';
import { format, subDays, differenceInDays, parseISO, differenceInHours } from 'date-fns';
import dotenv from 'dotenv';

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_ORG = process.env.GITHUB_ORG;
// Soporte para múltiples organizaciones (separadas por coma)
const GITHUB_ORGS = process.env.GITHUB_ORGS ? process.env.GITHUB_ORGS.split(',').map(o => o.trim()) : (GITHUB_ORG ? [GITHUB_ORG] : []);

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
 * Detecta y registra automáticamente nuevos desarrolladores desde eventos de GitHub
 */
async function autoRegisterDevelopers(events) {
  const usernamesFromEvents = new Set();
  
  // Extraer usernames de los eventos
  for (const event of events) {
    if (event.actor?.login) {
      usernamesFromEvents.add(event.actor.login);
    }
  }
  
  if (usernamesFromEvents.size === 0) return [];
  
  console.log(`\n🔍 Detectados ${usernamesFromEvents.size} usuarios en eventos de GitHub`);
  
  // Obtener desarrolladores existentes
  const { data: existingDevs } = await supabase
    .from('developers')
    .select('github_username');
  
  const existingUsernames = new Set(existingDevs?.map(d => d.github_username) || []);
  
  // Encontrar usuarios nuevos
  const newUsernames = Array.from(usernamesFromEvents).filter(u => !existingUsernames.has(u));
  
  if (newUsernames.length === 0) {
    console.log('   ✅ Todos los usuarios ya están registrados');
    return [];
  }
  
  console.log(`   🆕 ${newUsernames.length} usuarios nuevos detectados: ${newUsernames.join(', ')}`);
  
  // Obtener información de perfil de GitHub
  const newDevelopers = [];
  
  for (const username of newUsernames) {
    try {
      const { data: user } = await octokit.request('GET /users/{username}', {
        username,
        headers: { 'X-GitHub-Api-Version': '2022-11-28' }
      });
      
      newDevelopers.push({
        github_username: username,
        full_name: user.name || username,
        is_active: true
      });
      
      console.log(`   ✓ ${username} → ${user.name || username}`);
      
    } catch (error) {
      // Si no podemos obtener info, usar username como nombre
      newDevelopers.push({
        github_username: username,
        full_name: username,
        is_active: true
      });
      console.log(`   ✓ ${username} (sin perfil)`);
    }
  }
  
  // Insertar en base de datos
  if (newDevelopers.length > 0) {
    const { error } = await supabase
      .from('developers')
      .insert(newDevelopers);
    
    if (error) {
      console.error(`   ⚠️ Error registrando usuarios: ${error.message}`);
      return [];
    }
    
    console.log(`   ✅ ${newDevelopers.length} desarrolladores registrados automáticamente\n`);
  }
  
  return newDevelopers;
}

/**
 * Obtiene commits recientes para detectar desarrolladores automáticamente
 */
async function getRecentCommits(since) {
  console.log('\n🔍 Buscando commits recientes para detectar desarrolladores...');
  
  try {
    const allCommits = [];
    
    // Obtener repos de todas las organizaciones configuradas
    let repos = [];
    
    for (const org of GITHUB_ORGS) {
      try {
        const { data: orgRepos } = await octokit.request('GET /orgs/{org}/repos', {
          org: org,
          per_page: 50,
          sort: 'pushed',
          headers: { 'X-GitHub-Api-Version': '2022-11-28' }
        });
        repos.push(...orgRepos);
        console.log(`   📁 Org "${org}": ${orgRepos.length} repos encontrados`);
      } catch (e) {
        console.error(`   ⚠️  No se pudo acceder a org "${org}": ${e.message}`);
      }
    }
    
    // Si no hay orgs configuradas, usar repos del usuario
    if (repos.length === 0 && GITHUB_ORGS.length === 0) {
      const { data: userRepos } = await octokit.request('GET /user/repos', {
        per_page: 50,
        sort: 'pushed',
        headers: { 'X-GitHub-Api-Version': '2022-11-28' }
      });
      repos = userRepos;
      console.log(`   📁 Repos personales: ${userRepos.length} encontrados`);
    }
    
    // Obtener commits recientes de cada repo (limitado a los 5 repos más activos)
    for (const repo of repos.slice(0, 5)) {
      try {
        const { data: commits } = await octokit.request('GET /repos/{owner}/{repo}/commits', {
          owner: repo.owner.login,
          repo: repo.name,
          since: since.toISOString(),
          per_page: 50,
          headers: { 'X-GitHub-Api-Version': '2022-11-28' }
        });
        
        allCommits.push(...commits);
      } catch (e) {
        // Ignorar repos sin acceso
      }
    }
    
    console.log(`   ✅ Encontrados ${allCommits.length} commits recientes`);
    return allCommits;
    
  } catch (error) {
    console.error(`   ⚠️ Error obteniendo commits: ${error.message}`);
    return [];
  }
}

/**
 * Obtiene Issues de GitHub (abiertos y cerrados)
 */
async function getGitHubIssues(since, until) {
  console.log('\n📋 Obteniendo Issues de GitHub...');
  
  try {
    const allIssues = [];
    
    // Buscar issues de todas las organizaciones configuradas
    for (const org of GITHUB_ORGS) {
      try {
        const { data } = await octokit.request('GET /orgs/{org}/issues', {
          org: org,
          state: 'all',
          since: since.toISOString(),
          per_page: 100,
          headers: {
            'X-GitHub-Api-Version': '2022-11-28'
          }
        });
        allIssues.push(...data);
        console.log(`   📋 Org "${org}": ${data.length} issues encontrados`);
      } catch (e) {
        console.error(`   ⚠️  No se pudieron obtener issues de "${org}": ${e.message}`);
      }
    }
    
    // Si no hay orgs, buscar issues del usuario autenticado
    if (allIssues.length === 0 && GITHUB_ORGS.length === 0) {
      const { data } = await octokit.request('GET /issues', {
        filter: 'all',
        state: 'all',
        since: since.toISOString(),
        per_page: 100,
        headers: {
          'X-GitHub-Api-Version': '2022-11-28'
        }
      });
      allIssues.push(...data);
    }
    
    console.log(`   ✅ Encontrados ${allIssues.length} issues`);
    return allIssues;
    
  } catch (error) {
    console.error(`   ⚠️  Error obteniendo issues: ${error.message}`);
    return [];
  }
}

/**
 * Procesa y guarda Issues en Supabase
 */
async function processIssues(issues, developers) {
  console.log('\n💾 Procesando Issues...');
  
  let inserted = 0;
  let updated = 0;
  
  for (const issue of issues) {
    try {
      // Buscar desarrollador por username
      const assignee = issue.assignee?.login || issue.user?.login;
      const developer = developers.find(d => d.github_username === assignee);
      
      // Extraer labels
      const labels = issue.labels?.map(l => l.name) || [];
      
      // Preparar datos
      const issueData = {
        github_issue_id: issue.id,
        developer_id: developer?.id || null,
        repository_name: issue.repository_url?.split('/').slice(-1)[0] || 'unknown',
        title: issue.title,
        state: issue.state,
        labels: labels,
        created_at: issue.created_at,
        closed_at: issue.closed_at
      };
      
      // Upsert en Supabase
      const { error } = await supabase
        .from('github_issues')
        .upsert(issueData, {
          onConflict: 'github_issue_id',
          ignoreDuplicates: false
        });
      
      if (error) {
        console.error(`   ⚠️  Error guardando issue #${issue.number}: ${error.message}`);
      } else {
        inserted++;
      }
      
    } catch (error) {
      console.error(`   ⚠️  Error procesando issue: ${error.message}`);
    }
  }
  
  console.log(`   ✅ Issues procesados: ${inserted} guardados`);
  return { inserted, updated };
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
  
  const metrics = {
    developer_id: developer.id,
    date: format(targetDate, 'yyyy-MM-dd'),
    commits_count: commitsCount,
    lines_added: linesAdded,
    lines_deleted: linesDeleted,
    repos_touched: reposTouched.size,
    last_activity_at: lastActivityAt ? lastActivityAt.toISOString() : null,
    days_inactive: daysInactive
  };
  
  console.log(`   📊 Métricas calculadas:`);
  console.log(`      Commits: ${commitsCount}`);
  console.log(`      Líneas (+${linesAdded}/-${linesDeleted})`);
  console.log(`      Repos: ${reposTouched.size}`);
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
 * Procesa actividad por proyecto para KPI de Project Mix
 */
async function processProjectActivity(targetDate, developers) {
  console.log('\n📊 Procesando actividad por proyecto...');
  
  try {
    // Obtener métricas del día
    const { data: metrics, error } = await supabase
      .from('daily_metrics')
      .select('*')
      .eq('date', format(targetDate, 'yyyy-MM-dd'));
    
    if (error) throw error;
    
    // Agrupar por repo (esto requiere extender para capturar repo_name por métrica)
    console.log('   ℹ️  Project activity tracking - implementación básica');
    
    // Por ahora, agregar actividad basada en issues
    const { data: issues } = await supabase
      .from('github_issues')
      .select('repository_name')
      .eq('state', 'closed')
      .gte('closed_at', format(targetDate, 'yyyy-MM-dd'))
      .lt('closed_at', format(new Date(targetDate.getTime() + 86400000), 'yyyy-MM-dd'));
    
    if (issues && issues.length > 0) {
      const repoStats = {};
      
      for (const issue of issues) {
        if (!repoStats[issue.repository_name]) {
          repoStats[issue.repository_name] = {
            date: format(targetDate, 'yyyy-MM-dd'),
            repo_name: issue.repository_name,
            commits_count: 0,
            issues_count: 0,
            developers_count: 0,
            lines_changed: 0
          };
        }
        repoStats[issue.repository_name].issues_count++;
      }
      
      // Guardar en project_activity
      for (const repo in repoStats) {
        await supabase
          .from('project_activity')
          .upsert(repoStats[repo], {
            onConflict: 'date,repo_name',
            ignoreDuplicates: false
          });
      }
      
      console.log(`   ✅ Actividad procesada para ${Object.keys(repoStats).length} proyectos`);
    }
    
  } catch (error) {
    console.error('   ⚠️  Error procesando project activity:', error.message);
  }
}

/**
 * Función principal de extracción
 */
export async function extractMetrics(targetDate = new Date()) {
  const startTime = Date.now();
  
  console.log('═══════════════════════════════════════════');
  console.log('🔧 EXTRACTOR DE MÉTRICAS GITHUB - CTO Dashboard');
  console.log('═══════════════════════════════════════════');
  console.log(`📅 Fecha objetivo: ${format(targetDate, 'yyyy-MM-dd')}`);
  
  let developersProcessed = 0;
  let issuesProcessed = 0;
  let errors = [];
  
  try {
    // Obtener desarrolladores existentes
    let developers = await getDevelopers();
    console.log(`\n👥 Desarrolladores registrados: ${developers.length}`);
    
    // Procesar Issues de GitHub
    const since = new Date(targetDate);
    since.setDate(since.getDate() - 7); // Últimos 7 días
    const until = new Date(targetDate);
    until.setHours(23, 59, 59, 999);
    
    // Obtener commits recientes para detectar desarrolladores
    const commits = await getRecentCommits(since);
    
    // Detectar desarrolladores desde commits
    const commitEvents = commits.map(c => ({ actor: { login: c.author?.login } }));
    await autoRegisterDevelopers(commitEvents);
    
    const issues = await getGitHubIssues(since, until);
    
    // Detectar y registrar automáticamente nuevos desarrolladores desde Issues
    const issueEvents = issues.map(i => ({ actor: { login: i.user?.login } }));
    await autoRegisterDevelopers(issueEvents);
    
    // Recargar desarrolladores (ahora incluye los nuevos)
    developers = await getDevelopers();
    
    if (developers.length === 0) {
      console.log('\n⚠️  No se encontraron desarrolladores ni en la base de datos ni en GitHub.');
      console.log('   Verifica que hayas configurado correctamente el GITHUB_TOKEN.');
      return;
    }
    
    console.log(`\n👥 Total desarrolladores activos: ${developers.length}`);
    
    const issueStats = await processIssues(issues, developers);
    issuesProcessed = issueStats.inserted;
    
    // Procesar cada desarrollador
    for (const developer of developers) {
      try {
        const metrics = await calculateDailyMetrics(developer, targetDate);
        await saveMetrics(metrics);
        developersProcessed++;
      } catch (error) {
        errors.push(`${developer.github_username}: ${error.message}`);
      }
    }
    
    // Procesar actividad por proyecto
    await processProjectActivity(targetDate, developers);
    
    // Guardar log de extracción
    const duration = Math.floor((Date.now() - startTime) / 1000);
    await supabase.from('extraction_logs').insert({
      status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
      developers_processed: developersProcessed,
      issues_processed: issuesProcessed,
      records_inserted: developersProcessed + issuesProcessed,
      errors: errors.join('; '),
      duration_seconds: duration
    });
    
    console.log('\n✅ Extracción completada exitosamente');
    console.log(`   Desarrolladores: ${developersProcessed}`);
    console.log(`   Issues: ${issuesProcessed}`);
    console.log(`   Duración: ${duration}s`);
    if (errors.length > 0) {
      console.log(`   ⚠️  Errores: ${errors.length}`);
    }
    console.log('═══════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n❌ Error en extracción:', error.message);
    
    // Guardar log de error
    await supabase.from('extraction_logs').insert({
      status: 'ERROR',
      developers_processed: developersProcessed,
      issues_processed: issuesProcessed,
      errors: error.message,
      duration_seconds: Math.floor((Date.now() - startTime) / 1000)
    });
    
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetDate = process.argv[2] ? new Date(process.argv[2]) : new Date();
  extractMetrics(targetDate);
}
