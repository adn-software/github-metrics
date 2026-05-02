# CTO Dashboard - Next.js

Dashboard de métricas para equipos de desarrollo con Supabase y GitHub.

## 🚀 Inicio Rápido

### 1. Instalar Dependencias

```bash
cd dashboard
npm install
```

### 2. Configurar Variables de Entorno

Crear archivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://wolzdaitdgcepohnrewm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_6b3VuQgYh00WT8iIk1qUSQ_DSjqzdKD
```

### 3. Ejecutar Servidor de Desarrollo

```bash
npm run dev
```

Abrir: http://localhost:3000

## 📊 Características

### 5 KPIs Gerenciales (Para Reuniones Ejecutivas)
1. **Throughput Semanal** - Issues cerrados
2. **Time-to-Market** - Lead time promedio
3. **Project Mix** - Distribución de esfuerzo
4. **Rework Rate** - Tasa de retrabajo
5. **Utilización** - Capacidad del equipo

### 7 Widgets Operativos (Para Gestión Diaria)
1. **Bench Watch** - Desarrolladores inactivos
2. **Throughput Chart** - Issues cerrados por día
3. **Project Mix** - Distribución por proyecto
4. **Velocity Table** - Velocidad por desarrollador
5. **Stale Issues** - Issues estancados
6. **Code Volume** - Volumen de código
7. **Focus Index** - Índice de foco (context switching)

## 🏗️ Estructura

```
dashboard/
├── app/
│   ├── page.tsx              # Dashboard principal
│   ├── layout.tsx            # Layout de la app
│   └── globals.css           # Estilos globales
├── components/
│   ├── KPIsGerenciales.tsx   # 5 KPIs ejecutivos
│   ├── BenchWatch.tsx        # Radar de disponibilidad
│   ├── ThroughputChart.tsx   # Gráfico de throughput
│   ├── ProjectMix.tsx        # Distribución de esfuerzo
│   ├── VelocityTable.tsx     # Velocidad por dev
│   └── StaleIssues.tsx       # Issues estancados
├── lib/
│   └── supabase.ts           # Cliente Supabase + tipos
├── next.config.js
├── tailwind.config.js
└── package.json
```

## 🔧 Tecnologías

- **Next.js 14** - Framework React
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos
- **Recharts** - Gráficos
- **Supabase** - Backend y datos
- **Lucide React** - Iconos

## 📝 Notas

- Las vistas de Supabase (SQL) se actualizan automáticamente
- El dashboard recarga datos cada 5 minutos
- Compatible con modo oscuro (futuro)

## 🚀 Deploy

Para producción:

```bash
npm run build
npm start
```

O deploy en Vercel:
```bash
npx vercel
```
