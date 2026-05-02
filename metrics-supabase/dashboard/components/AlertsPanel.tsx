'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Bell, AlertTriangle, CheckCircle, X, Eye } from 'lucide-react'

interface Alert {
  id: string
  alert_type: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  entity_type?: string
  entity_id?: string
  metadata: any
  is_read: boolean
  created_at: string
  hours_since_created: number
}

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    fetchAlerts()
    
    // Actualizar cada 2 minutos
    const interval = setInterval(fetchAlerts, 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  async function fetchAlerts() {
    const { data, error } = await supabase
      .from('vw_active_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    
    if (!error && data) {
      setAlerts(data)
    }
    setLoading(false)
  }

  async function markAsRead(alertId: string) {
    await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId)
    
    setAlerts(alerts.map(a => 
      a.id === alertId ? { ...a, is_read: true } : a
    ))
  }

  async function resolveAlert(alertId: string) {
    await supabase
      .from('alerts')
      .update({ 
        is_resolved: true, 
        resolved_at: new Date().toISOString() 
      })
      .eq('id', alertId)
    
    setAlerts(alerts.filter(a => a.id !== alertId))
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-100 border-red-500 text-red-900'
      case 'HIGH': return 'bg-orange-100 border-orange-500 text-orange-900'
      case 'MEDIUM': return 'bg-yellow-100 border-yellow-500 text-yellow-900'
      default: return 'bg-blue-100 border-blue-500 text-blue-900'
    }
  }

  const getSeverityIcon = (severity: string) => {
    if (severity === 'CRITICAL' || severity === 'HIGH') {
      return <AlertTriangle className="w-5 h-5" />
    }
    return <Bell className="w-5 h-5" />
  }

  const unreadCount = alerts.filter(a => !a.is_read).length
  const criticalCount = alerts.filter(a => a.severity === 'CRITICAL').length

  return (
    <>
      {/* Botón flotante de alertas */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all ${
          criticalCount > 0 
            ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
            : unreadCount > 0
            ? 'bg-orange-500 hover:bg-orange-600'
            : 'bg-blue-500 hover:bg-blue-600'
        } text-white`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-white text-red-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de alertas */}
      {showPanel && (
        <div className="fixed top-0 right-0 h-screen w-full md:w-96 bg-white shadow-2xl z-40 overflow-y-auto">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-lg">Alertas</h3>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowPanel(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Cargando alertas...</p>
            ) : alerts.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                <p className="text-gray-600 font-medium">¡Todo en orden!</p>
                <p className="text-sm text-gray-400">No hay alertas activas</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`border-l-4 rounded-lg p-3 ${getSeverityColor(alert.severity)} ${
                    alert.is_read ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getSeverityIcon(alert.severity)}
                      <span className="font-semibold text-sm">{alert.severity}</span>
                    </div>
                    <div className="flex gap-1">
                      {!alert.is_read && (
                        <button
                          onClick={() => markAsRead(alert.id)}
                          className="p-1 hover:bg-white/50 rounded"
                          title="Marcar como leída"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="p-1 hover:bg-white/50 rounded"
                        title="Resolver"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-sm mb-1">{alert.title}</h4>
                  <p className="text-xs opacity-90 mb-2">{alert.description}</p>
                  
                  <div className="flex items-center justify-between text-xs opacity-75">
                    <span>{alert.alert_type.replace('_', ' ')}</span>
                    <span>
                      {alert.hours_since_created < 1 
                        ? 'Hace minutos'
                        : `Hace ${Math.floor(alert.hours_since_created)}h`
                      }
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {showPanel && (
        <div
          className="fixed inset-0 bg-black/20 z-30"
          onClick={() => setShowPanel(false)}
        />
      )}
    </>
  )
}
