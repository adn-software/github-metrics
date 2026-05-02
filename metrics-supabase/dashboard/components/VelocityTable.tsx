'use client'

import { useEffect, useState } from 'react'
import { supabase, VelocityByDev } from '@/lib/supabase'
import { Zap, Clock, Trophy } from 'lucide-react'

export default function VelocityTable() {
  const [devs, setDevs] = useState<VelocityByDev[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchVelocity() {
      const { data, error } = await supabase
        .from('vw_velocity_by_dev')
        .select('*')
        .order('avg_lead_time_h', { ascending: true })
      
      if (!error && data) {
        setDevs(data)
      }
      setLoading(false)
    }

    fetchVelocity()
  }, [])

  if (loading) return <div className="card">Cargando...</div>

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <Zap className="w-5 h-5 text-yellow-500" />
          Velocidad por Desarrollador
        </h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 font-medium text-gray-600">Desarrollador</th>
              <th className="text-center py-2 font-medium text-gray-600">Issues</th>
              <th className="text-center py-2 font-medium text-gray-600">Lead Time</th>
              <th className="text-center py-2 font-medium text-gray-600">Mejor</th>
            </tr>
          </thead>
          <tbody>
            {devs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-4 text-center text-gray-400">
                  No hay datos de velocidad
                </td>
              </tr>
            ) : (
              devs.map((dev, index) => (
                <tr key={dev.developer_id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      {index === 0 && <Trophy className="w-4 h-4 text-yellow-500" />}
                      <div>
                        <p className="font-medium">{dev.full_name}</p>
                        <p className="text-xs text-gray-400">@{dev.github_username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-center">
                    <span className="font-semibold">{dev.total_issues_closed || 0}</span>
                  </td>
                  <td className="py-3 text-center">
                    <span className={`inline-flex items-center gap-1 ${
                      dev.avg_lead_time_h < 24 ? 'text-green-600' : 'text-yellow-600'
                    }`}>
                      <Clock className="w-3 h-3" />
                      {dev.avg_lead_time_h ? `${dev.avg_lead_time_h.toFixed(1)}h` : 'N/A'}
                    </span>
                  </td>
                  <td className="py-3 text-center text-gray-500">
                    {dev.best_lead_time_h ? `${dev.best_lead_time_h.toFixed(1)}h` : 'N/A'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
