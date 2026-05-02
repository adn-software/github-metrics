# GitHub Metrics - Sistema de Métricas y Visualización

Sistema completo de extracción, almacenamiento y visualización de métricas de GitHub para análisis de productividad y KPIs de desarrollo.

## 📁 Estructura del Proyecto

Todo el código y configuración se encuentra en la carpeta `metrics-supabase/`:

```
metrics-supabase/
├── dashboard/              # Dashboard Next.js con visualizaciones en tiempo real
├── superset-railway/       # Configuración de Apache Superset para Railway
├── supabase/              # Supabase Edge Functions
├── schema*.sql            # Schemas de base de datos
├── github-extractor*.js   # Scripts de extracción de datos
├── setup-*.js             # Scripts de configuración
└── *.md                   # Documentación
```

## 🚀 Inicio Rápido

```bash
cd metrics-supabase
npm install
cp .env.example .env
# Edita .env con tus credenciales
npm run setup
```

## 📚 Documentación

- **[README.md](metrics-supabase/README.md)** - Documentación principal
- **[INSTRUCCIONES-SETUP.md](metrics-supabase/INSTRUCCIONES-SETUP.md)** - Guía de instalación
- **[EXTRACCION.md](metrics-supabase/EXTRACCION.md)** - Sistema de extracción de datos
- **[ALERTAS.md](metrics-supabase/ALERTAS.md)** - Sistema de alertas
- **[GUIA-KPIS-GERENCIALES.md](metrics-supabase/GUIA-KPIS-GERENCIALES.md)** - KPIs gerenciales

## 🔧 Componentes

### 1. Dashboard Next.js
Dashboard interactivo con métricas en tiempo real, gráficos de velocidad, alertas y KPIs gerenciales.

### 2. Apache Superset
Configuración lista para desplegar en Railway con dashboards avanzados y reportes personalizables.

### 3. Extracción de Datos
Scripts automatizados para extraer métricas de GitHub y almacenarlas en Supabase.

### 4. Base de Datos
Schemas optimizados para almacenar métricas de desarrolladores, PRs, issues, commits y KPIs.

## 📊 Métricas Disponibles

- Productividad de desarrolladores
- Velocidad de merge de PRs
- Issues resueltos vs abiertos
- Tiempo de respuesta
- KPIs gerenciales
- Alertas automáticas

## 🛠️ Tecnologías

- **Frontend**: Next.js 14, React, TailwindCSS, Recharts
- **Backend**: Node.js, Supabase Edge Functions
- **Base de Datos**: PostgreSQL (Supabase)
- **Visualización**: Apache Superset
- **Deploy**: Railway, Vercel

## 📝 Licencia

Proyecto interno de ADN Software.
