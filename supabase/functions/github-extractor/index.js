// Edge Function para Supabase - Extracción de métricas GitHub
// Se ejecuta automáticamente vía Cron Job

import { createClient } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Cliente Supabase con service role
function getSupabaseClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );
}

// Cliente GitHub
function getGithubClient() {
  const token = Deno.env.get('GITHUB_TOKEN');
  return {
    async request(url, options = {}) {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'CTO-Metrics-Dashboard',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      return response.json();
    }
  };
}

async function extractMetrics(supabase, github, targetDate) {
  const since = new Date(targetDate);
  since.setHours(0, 0, 0, 0);
  
  const until = new Date(targetDate);
  until.setHours(23, 59, 59, 999);
  
  // Obtener desarrolladores
  const { data: developers, error: devError } = await supabase
    .from('developers')
    .select('*')
    .eq('is_active', true);
  
  if (devError) throw devError;
  
  let totalInserted = 0;
  let totalUpdated = 0;
  let errors = [];
  
  for (const dev of developers) {
    try {
      // Obtener eventos del usuario
      const eventsUrl = `https://api.github.com/users/${dev.github_username}/events?per_page=100`;
      const events = await github.request(eventsUrl);
      
      // Filtrar eventos del día
      const dayEvents = events.filter(e => {
        const eventDate = new Date(e.created_at);
        return eventDate >= since && eventDate <= until;
      });
      
      // Calcular métricas
      let commitsCount = 0;
      let linesAdded = 0;
      let linesDeleted = 0;
      const reposTouched = new Set();
      let lastActivity = null;
      
      for (const event of dayEvents) {
        if (event.repo?.name) {
          reposTouched.add(event.repo.name);
        }
        
        if (event.type === 'PushEvent' && event.payload?.commits) {
          commitsCount += event.payload.commits.length;
        }
        
        if (!lastActivity || new Date(event.created_at) > new Date(lastActivity)) {
          lastActivity = event.created_at;
        }
      }
      
      // Obtener issues cerrados
      const org = Deno.env.get('GITHUB_ORG');
      const issuesQuery = org 
        ? `org:${org} author:${dev.github_username} is:closed created:${since.toISOString().split('T')[0]}..${until.toISOString().split('T')[0]}`
        : `author:${dev.github_username} is:closed created:${since.toISOString().split('T')[0]}..${until.toISOString().split('T')[0]}`;
      
      const issuesUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(issuesQuery)}`;
      const issues = await github.request(issuesUrl);
      
      const issuesClosed = issues.total_count || 0;
      
      // Calcular lead time
      let totalLeadTime = 0;
      for (const issue of issues.items || []) {
        const created = new Date(issue.created_at);
        const closed = new Date(issue.closed_at);
        totalLeadTime += (closed - created) / (1000 * 60 * 60); // Horas
      }
      const avgLeadTime = issuesClosed > 0 ? totalLeadTime / issuesClosed : 0;
      
      // Calcular días inactivos
      const today = new Date();
      const lastActivityDate = lastActivity ? new Date(lastActivity) : null;
      const daysInactive = lastActivityDate 
        ? Math.floor((today - lastActivityDate) / (1000 * 60 * 60 * 24))
        : 999;
      
      // Guardar métricas
      const metrics = {
        developer_id: dev.id,
        date: targetDate,
        commits_count: commitsCount,
        lines_added: linesAdded,
        lines_deleted: linesDeleted,
        repos_touched: reposTouched.size,
        issues_closed: issuesClosed,
        avg_lead_time_h: avgLeadTime,
        last_activity_at: lastActivity,
        days_inactive: daysInactive
      };
      
      const { error: upsertError } = await supabase
        .from('daily_metrics')
        .upsert(metrics, {
          onConflict: 'developer_id,date',
          ignoreDuplicates: false
        });
      
      if (upsertError) {
        errors.push(`${dev.github_username}: ${upsertError.message}`);
      } else {
        totalInserted++;
      }
      
    } catch (error) {
      errors.push(`${dev.github_username}: ${error.message}`);
    }
  }
  
  // Log de extracción
  await supabase.from('extraction_logs').insert({
    status: errors.length === 0 ? 'SUCCESS' : 'PARTIAL',
    developers_processed: developers.length,
    records_inserted: totalInserted,
    errors: errors.join('; ')
  });
  
  return {
    processed: developers.length,
    inserted: totalInserted,
    errors: errors.length
  };
}

// Handler principal
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    const supabase = getSupabaseClient();
    const github = getGithubClient();
    
    // Fecha objetivo (hoy por defecto, o desde parámetros)
    const url = new URL(req.url);
    const targetDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    console.log(`Iniciando extracción para ${targetDate}`);
    
    const result = await extractMetrics(supabase, github, targetDate);
    
    return new Response(
      JSON.stringify({
        success: true,
        date: targetDate,
        ...result
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
