'use client'

import { useEffect, useState } from 'react'
import { supabase, ProjectMix } from '@/lib/supabase'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PieChart as PieIcon } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function ProjectMixChart() {
  const [data, setData] = useState<ProjectMix[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjectMix() {
      const { data, error } = await supabase
        .from('vw_project_mix_weekly')
        .select('*')
        .order('percentage_of_effort', { ascending: false })
      
      if (!error && data) {
        setData(data)
      }
      setLoading(false)
    }

    fetchProjectMix()
  }, [])

  if (loading) return <div className="card">Cargando...</div>

  const chartData = data.map((item, index) => ({
    name: item.repository_name,
    value: item.percentage_of_effort,
    issues: item.total_issues_closed,
    developers: item.developers_involved,
    color: COLORS[index % COLORS.length]
  }))

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <PieIcon className="w-5 h-5 text-purple-500" />
          Distribución de Esfuerzo
        </h3>
      </div>
      
      <div className="h-64">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
                formatter={(value: number, name: string, props: any) => [
                  `${value}%`,
                  `${props.payload.issues} issues, ${props.payload.developers} devs`
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No hay datos de proyectos
          </div>
        )}
      </div>
      
      <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
        {chartData.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate max-w-[150px]">{item.name}</span>
            </div>
            <span className="font-medium">{item.value}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}
