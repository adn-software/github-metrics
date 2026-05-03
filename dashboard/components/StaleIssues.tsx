'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { StaleIssue } from '@/lib/supabase'
import { AlertTriangle, Clock, Tag } from 'lucide-react'

export default function StaleIssues() {
  const [issues, setIssues] = useState<StaleIssue[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStaleIssues() {
      const { data, error } = await supabase
        .from('vw_stale_issues')
        .select('*')
        .order('days_open', { ascending: false })
        .limit(10)
      
      if (!error && data) {
        setIssues(data)
      }
      setLoading(false)
    }

    fetchStaleIssues()
  }, [])

  const getUrgencyColor = (level: string) => {
    if (level.includes('CRÍTICO')) return 'border-red-500 bg-red-50'
    if (level.includes('URGENTE')) return 'border-orange-500 bg-orange-50'
    return 'border-yellow-500 bg-yellow-50'
  }

  if (loading) return <div className="card">Cargando...</div>

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">
          <AlertTriangle className="w-5 h-5 text-red-500" />
          Issues Estancados
        </h3>
        <span className="text-sm text-gray-500">
          {issues.length} abiertos &gt; 3 días
        </span>
      </div>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {issues.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>🎉 No hay issues estancados</p>
            <p className="text-sm">Todo el equipo está al día</p>
          </div>
        ) : (
          issues.map((issue) => (
            <div 
              key={issue.github_issue_id}
              className={`p-3 rounded-lg border-l-4 ${getUrgencyColor(issue.urgency_level)}`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{issue.title}</p>
                  <p className="text-xs text-gray-500">
                    {issue.repository_name} • {issue.assignee || 'Sin asignar'}
                  </p>
                  {issue.labels && issue.labels.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {issue.labels.map((label, idx) => (
                        <span 
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-200 rounded-full"
                        >
                          <Tag className="w-3 h-3" />
                          {label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 text-red-600 ml-2">
                  <Clock className="w-4 h-4" />
                  <span className="font-bold">{issue.days_open}d</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
