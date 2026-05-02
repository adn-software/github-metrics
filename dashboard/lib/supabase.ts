import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wolzdaitdgcepohnrewm.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_6b3VuQgYh00WT8iIk1qUSQ_DSjqzdKD'

export const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos para las vistas
export interface BenchWatch {
  developer_id: string
  full_name: string
  github_username: string
  days_inactive: number
  last_activity_at: string
  status_bench: string
}

export interface ManagerialKPIs {
  m1_throughput_total_entregas: number
  m2_lead_time_promedio_h: number
  m3_top_proyecto: string
  m3_top_proyecto_pct: number
  m4_tasa_retrabajo_pct: number
  m5_utilizacion_equipo_pct: number
}

export interface ThroughputDaily {
  date: string
  issues_closed: number
  avg_lead_time_h: number
  developers_activos: number
}

export interface VelocityByDev {
  developer_id: string
  github_username: string
  full_name: string
  total_issues_closed: number
  avg_lead_time_h: number
  best_lead_time_h: number
  last_delivery: string
}

export interface StaleIssue {
  github_issue_id: number
  repository_name: string
  title: string
  assignee: string
  labels: string[]
  days_open: number
  urgency_level: string
}

export interface ProjectMix {
  repository_name: string
  total_issues_closed: number
  percentage_of_effort: number
  developers_involved: number
}
