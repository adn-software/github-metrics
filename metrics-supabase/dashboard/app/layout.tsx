import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'CTO Dashboard - Métricas de Desarrollo',
  description: 'Dashboard de métricas para equipos de desarrollo',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50">
        {children}
      </body>
    </html>
  )
}
