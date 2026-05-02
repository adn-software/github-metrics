'use client'

import { useEffect, useState } from 'react'
import { supabase, BenchWatch } from '@/lib/supabase'
import { Activity, User, AlertCircle } from 'lucide-react'

export default function BenchWatch() {
  const [devs, setDevs] = useState<BenchWatch[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchBench() {
      const { data, error } = await supabase
        .from('vw_bench_watch')
        .select('*')
        .order('days_inactive', { ascending: false })
      
      if (!error && data) {
        setDevs(data)
      }
      setLoading(false)
    }

    fetchBench()
  }, [])

  const getStatusColor = (status: string) => {
    if (status.includes('CRÍTICO')) return 'bg-red-100 text-red-800 border-red-200'
    if (status.includes('ALTO')) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (status.includes('MEDIO')) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  if (loading) return <div className="card">Cargando...</div>

  const criticalDevs = devs.filter(d => d.days_inactive > 2)

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Activity className="w-5 h-5 text-blue-500" />
          Radar de Disponibilidad
        </h3>
        {criticalDevs.length > 0 && (
          <span className="status-badge status-red flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {criticalDevs.length} alertas
          </span>
        )}
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {devs.length === 0 ? (
          <p className="text-gray-500 text-center py-4">No hay datos de desarrolladores</p>
        ) : (
          devs.map((dev) => (
            <div 
              key={dev.developer_id} 
              className={`flex items-center justify-between p-3 rounded-lg border ${getStatusColor(dev.status_bench)}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">{dev.full_name}</p>
                  <p className="text-xs opacity-75">@{dev.github_username}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-sm">{dev.days_inactive} días</p>
                <p className="text-xs opacity-75">inactivo</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
