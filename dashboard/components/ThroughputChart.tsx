'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ThroughputDaily } from '@/lib/supabase'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Line,
  ComposedChart
} from 'recharts'
import { GitPullRequest, TrendingUp } from 'lucide-react'

export default function ThroughputChart() {
  const [data, setData] = useState<ThroughputDaily[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchThroughput() {
      const { data, error } = await supabase
        .from('vw_throughput_daily')
        .select('*')
        .order('date', { ascending: true })
        .limit(30)
      
      if (!error && data) {
        setData(data.map(d => ({
          ...d,
          date: new Date(d.date).toLocaleDateString('es', { day: 'numeric', month: 'short' })
        })))
      }
      setLoading(false)
    }

    fetchThroughput()
  }, [])

  if (loading) return <div className="card">Cargando...</div>

  const totalIssues = data.reduce((sum, d) => sum + (d.issues_closed || 0), 0)
  const avgLeadTime = data.length > 0 
    ? data.reduce((sum, d) => sum + (d.avg_lead_time_h || 0), 0) / data.length 
    : 0

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <GitPullRequest className="w-5 h-5 text-green-500" />
          Throughput Diario
        </h3>
        <div className="flex gap-4 text-sm">
          <span className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4 text-blue-500" />
            {totalIssues} issues/30d
          </span>
          <span className="text-gray-500">
            Avg: {avgLeadTime.toFixed(1)}h lead time
          </span>
        </div>
      </div>
      
      <div className="h-64">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="issues_closed" 
                fill="#3b82f6" 
                name="Issues Cerrados"
                radius={[4, 4, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="avg_lead_time_h" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Lead Time (h)"
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No hay datos suficientes
          </div>
        )}
      </div>
    </div>
  )
}
