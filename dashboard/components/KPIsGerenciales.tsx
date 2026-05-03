'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ManagerialKPIs } from '@/lib/supabase'
import { 
  TrendingUp, 
  Clock, 
  PieChart, 
  AlertTriangle, 
  Users,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface KPIsGerencialesProps {
  className?: string
}

export default function KPIsGerenciales({ className }: KPIsGerencialesProps) {
  const [kpis, setKpis] = useState<ManagerialKPIs | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchKPIs() {
      const { data, error } = await supabase
        .from('vw_managerial_kpis_weekly')
        .select('*')
        .single()
      
      if (!error && data) {
        setKpis(data)
      }
      setLoading(false)
    }

    fetchKPIs()
    // Actualizar cada 5 minutos
    const interval = setInterval(fetchKPIs, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">Cargando KPIs...</div>
  }

  if (!kpis) {
    return <div className="text-red-500">Error cargando KPIs</div>
  }

  const kpiCards = [
    {
      title: 'Throughput',
      value: kpis.m1_throughput_total_entregas,
      label: 'entregas/semana',
      icon: TrendingUp,
      trend: 'up',
      color: 'bg-blue-500',
      target: 'Incremental'
    },
    {
      title: 'Time-to-Market',
      value: `${kpis.m2_lead_time_promedio_h.toFixed(1)}h`,
      label: 'lead time promedio',
      icon: Clock,
      trend: kpis.m2_lead_time_promedio_h < 24 ? 'down' : 'up',
      color: kpis.m2_lead_time_promedio_h < 24 ? 'bg-green-500' : 'bg-yellow-500',
      target: '< 24h'
    },
    {
      title: 'Project Mix',
      value: `${kpis.m3_top_proyecto_pct?.toFixed(0) || 0}%`,
      label: kpis.m3_top_proyecto || 'Sin datos',
      icon: PieChart,
      trend: 'neutral',
      color: 'bg-purple-500',
      target: 'Top proyecto'
    },
    {
      title: 'Rework Rate',
      value: `${kpis.m4_tasa_retrabajo_pct.toFixed(1)}%`,
      label: 'tasa de retrabajo',
      icon: AlertTriangle,
      trend: kpis.m4_tasa_retrabajo_pct < 10 ? 'down' : 'up',
      color: kpis.m4_tasa_retrabajo_pct < 10 ? 'bg-green-500' : 'bg-red-500',
      target: '< 10%'
    },
    {
      title: 'Utilización',
      value: `${kpis.m5_utilizacion_equipo_pct.toFixed(0)}%`,
      label: 'capacidad activa',
      icon: Users,
      trend: kpis.m5_utilizacion_equipo_pct > 85 ? 'up' : 'down',
      color: kpis.m5_utilizacion_equipo_pct > 85 ? 'bg-green-500' : 'bg-yellow-500',
      target: '> 85%'
    }
  ]

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 ${className}`}>
      {kpiCards.map((kpi, index) => (
        <div key={index} className="card hover:shadow-lg transition-shadow">
          <div className="card-header">
            <div className={`p-2 rounded-lg ${kpi.color} bg-opacity-10`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color.replace('bg-', 'text-')}`} />
            </div>
            {kpi.trend !== 'neutral' && (
              kpi.trend === 'up' ? 
                <ArrowUp className="w-4 h-4 text-green-500" /> : 
                <ArrowDown className="w-4 h-4 text-red-500" />
            )}
          </div>
          <div className="metric-value">{kpi.value}</div>
          <div className="metric-label">{kpi.label}</div>
          <div className="mt-2 text-xs text-gray-400">Meta: {kpi.target}</div>
        </div>
      ))}
    </div>
  )
}
