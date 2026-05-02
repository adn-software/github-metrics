'use client'

import KPIsGerenciales from '@/components/KPIsGerenciales'
import BenchWatch from '@/components/BenchWatch'
import ThroughputChart from '@/components/ThroughputChart'
import ProjectMixChart from '@/components/ProjectMix'
import VelocityTable from '@/components/VelocityTable'
import StaleIssues from '@/components/StaleIssues'
import AlertsPanel from '@/components/AlertsPanel'
import { BarChart3, Users, GitPullRequest, Clock, Zap } from 'lucide-react'

export default function Dashboard() {
  return (
    <main className="min-h-screen bg-gray-50 p-6">
      {/* Panel de Alertas Flotante */}
      <AlertsPanel />
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900">
            CTO Dashboard
          </h1>
        </div>
        <p className="text-gray-600">
          Métricas de desarrollo en tiempo real • {new Date().toLocaleDateString('es', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </header>

      {/* KPIs Gerenciales - Sección Ejecutiva */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-800">
            KPIs Gerenciales
          </h2>
          <span className="text-sm text-gray-500">- Para reuniones ejecutivas</span>
        </div>
        <KPIsGerenciales />
      </section>

      {/* Widgets Operativos */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <GitPullRequest className="w-5 h-5 text-gray-700" />
          <h2 className="text-xl font-semibold text-gray-800">
            Widgets Operativos
          </h2>
          <span className="text-sm text-gray-500">- Para gestión diaria</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Row 1 */}
          <ThroughputChart />
          <BenchWatch />
          <ProjectMixChart />
          
          {/* Row 2 */}
          <VelocityTable />
          <StaleIssues />
          
          {/* Code Volume - Simple metric card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <Zap className="w-5 h-5 text-yellow-500" />
                Volumen de Código
              </h3>
            </div>
            <div className="text-center py-8">
              <p className="text-4xl font-bold text-gray-900">IA-First</p>
              <p className="text-gray-500 mt-2">Workflow sin PRs</p>
              <div className="mt-4 flex justify-center gap-4 text-sm">
                <div>
                  <p className="font-semibold text-green-600">Commits</p>
                  <p className="text-gray-600">Directos</p>
                </div>
                <div className="border-l pl-4">
                  <p className="font-semibold text-blue-600">Velocidad</p>
                  <p className="text-gray-600">Máxima</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>Dashboard CTO • Métricas de {new Date().getFullYear()}</p>
        <p className="mt-1">
          Datos actualizados desde Supabase • 
          <span className="text-blue-600 ml-1">
            {new Date().toLocaleTimeString('es')}
          </span>
        </p>
      </footer>
    </main>
  )
}
