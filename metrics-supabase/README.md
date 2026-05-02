# Dashboard de Métricas CTO - GitHub + Supabase

Sistema de extracción y visualización de métricas de desarrollo para gestión de equipos AI-First.

## 🎯 Métricas implementadas

| Métrica | Descripción | API GitHub |
|---------|-------------|------------|
| **Commits** | Total de commits diarios | Events API |
| **Líneas de código** | Additions/deletions (volumen IA) | Commits API |
| **Repos tocados** | Diferentes proyectos activos | Events API |
| **Issues cerrados** | Throughput de entregas | Search Issues API |
| **Lead time** | Horas desde creación a cierre de Issue | Search Issues API |
| **Días inactivo** | Tiempo desde última actividad | Events API |

## 🚀 Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env con tus credenciales
cp .env.example .env
# Editar .env con tus credenciales

# 3. Crear tablas en Supabase (SQL Editor > New query)
# Copiar y ejecutar el contenido de schema.sql
```

## ⚙️ Configuración

Edita `.env` con tus credenciales:

```env
SUPABASE_URL=https://wolzdaitdgcepohnrewm.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_KEY=tu-service-key
GITHUB_TOKEN=ghp_tu_token_github
GITHUB_ORG=tu-organizacion  # Opcional
```

### Obtener GitHub Token
1. GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)
2. Generate new token (classic)
3. Scopes requeridos: `repo`, `read:org`, `read:user`

## 📊 Uso

### 1. Agregar desarrolladores

```bash
node seed-developers.js
```

Interactivamente agrega los GitHub usernames de tu equipo.

### 2. Ejecutar extracción de métricas

```bash
# Extracción del día actual
node github-extractor.js

# Extracción de fecha específica
node github-extractor.js 2026-04-30
```

### 3. Configurar ejecución diaria (cron)

```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar todos los días a las 9 AM
0 9 * * * cd /ruta/al/proyecto && node github-extractor.js >> logs/extraction.log 2>&1
```

## 🗄️ Estructura de Datos

### Tablas Principales
| Tabla | Columnas Clave |
|-------|----------------|
| `developers` | `id`, `github_username`, `full_name`, `is_active` |
| `daily_metrics` | `developer_id`, `date`, `commits_count`, `lines_added`, `lines_deleted`, `repos_touched`, `issues_closed`, `avg_lead_time_h`, `days_inactive`, `last_activity_at` |
| `extraction_logs` | Logs de cada ejecución del extractor |

### Vistas para Dashboard (7 Widgets)

| Vista | Propósito | Widget Recomendado |
|-------|-----------|-------------------|
| `vw_bench_watch` | Radar de Disponibilidad | Tabla con semáforo |
| `vw_throughput_daily` | Velocidad de Entrega | Gráfico de barras |
| `vw_velocity_by_dev` | Eficiencia por dev | Gauge Chart |
| `vw_code_volume_daily` | Volumen de código | Stacked Area Chart |
| `vw_focus_index` | Índice de Foco | Bubble Chart |
| `vw_commit_pulse` | Consistencia de Flujo | GitHub-style Calendar |
| `vw_weekly_dev_performance` | Performance Semanal | Tabla resumen |

### Funciones RPC

```sql
-- Calcular score de desarrollador (0-100)
SELECT * FROM calcular_score_desarrollador('uuid-dev', '2026-05-01');

-- Detectar desarrolladores en riesgo
SELECT * FROM detectar_desarrolladores_riesgo(3);
```

## 📊 Dashboard Next.js

### Instalación del Frontend

```bash
cd dashboard
npm install
# Librerías recomendadas: tremor, recharts, @supabase/supabase-js
```

### Queries para cada Widget

```javascript
// 1. Radar de Disponibilidad (Bench Watch)
const { data } = await supabase
  .from('vw_bench_watch')
  .select('*');

// 2. Throughput Diario
const { data } = await supabase
  .from('vw_throughput_daily')
  .select('*')
  .limit(30);

// 3. Score de Desarrollador
const { data } = await supabase
  .rpc('calcular_score_desarrollador', { 
    dev_id: 'uuid-del-dev',
    fecha_hasta: '2026-05-01'
  });

// 4. Alertas de Riesgo
const { data } = await supabase
  .rpc('detectar_desarrolladores_riesgo', { dias_limite: 3 });
```

## ⚡ Edge Function (Opcional)

Para ejecutar el extractor automáticamente en Supabase sin servidor externo:

```bash
# Deploy Edge Function
supabase functions deploy github-extractor

# Configurar cron job (ejecuta cada día a las 9 AM)
supabase functions schedule create github-extractor --cron '0 9 * * *'
```

La Edge Function está en: `supabase/functions/github-extractor/`

## 📈 Queries SQL Útiles

```sql
-- Métricas de hoy con semáforo de status
SELECT 
  github_username,
  days_inactive,
  CASE 
    WHEN days_inactive > 2 THEN '🔴 CRÍTICO'
    WHEN days_inactive = 2 THEN '🟠 ALTO'
    WHEN days_inactive = 1 THEN '🟡 MEDIO'
    ELSE '🟢 ACTIVO'
  END as status
FROM vw_bench_watch;

-- Performance semanal completa
SELECT * FROM vw_weekly_dev_performance;

-- Historial de extracciones
SELECT * FROM extraction_logs ORDER BY extraction_date DESC LIMIT 10;

-- Comparativa de velocidad (lead time promedio)
SELECT 
  full_name,
  velocity_avg_h,
  total_tasks
FROM vw_weekly_dev_performance
ORDER BY velocity_avg_h ASC;
```

## 📁 Archivos

| Archivo | Descripción |
|---------|-------------|
| `supabase.js` | Cliente Supabase configurado |
| `github-extractor-enhanced.js` | **Script completo con Issues y labels** |
| `github-extractor.js` | Script legacy (solo métricas de código) |
| `seed-developers.js` | Gestión de desarrolladores |
| `schema-final.sql` | **⭐ Schema completo recomendado** |
| `schema-enhanced.sql` | Schema con vistas y funciones RPC |
| `schema-kpis-gerenciales.sql` | KPIs gerenciales adicionales |
| `schema.sql` | Estructura básica (legacy) |
| `explore.js` | Utilidad de exploración |
| `setup-db.js` | Verificación de configuración |
| `GUIA-KPIS-GERENCIALES.md` | Guía de uso de KPIs ejecutivos |
| `supabase/functions/github-extractor/` | Edge Function para ejecución automática |

## 🔒 Seguridad

- **Nunca compartas** el archivo `.env`
- Usa el `SUPABASE_SERVICE_KEY` **solo** en backend/Edge Functions
- El `GITHUB_TOKEN` tiene acceso de lectura a tus repos privados
- **RLS habilitado** en tablas para producción
- Política actual: usuarios autenticados ven todo (para admin/CTO)
- Para restringir (devs ven solo sus datos), modificar políticas RLS

## 📊 KPIs Gerenciales (Para Reuniones Ejecutivas)

Implementados **5 KPIs clave** para presentar a gerencia/dirección:

| KPI | Función RPC | Meta |
|-----|-------------|------|
| 1. Throughput Semanal | `kpi_throughput_comparativo()` | Incremental |
| 2. Time-to-Market | `kpi_lead_time_vs_meta(24)` | < 24h |
| 3. Project Mix | `vw_kpi_project_mix` | Según prioridades |
| 4. Tasa de Retrabajo | `kpi_analisis_calidad()` | < 10% |
| 5. Utilización Equipo | `kpi_reporte_capacidad()` | > 85% |

### Reporte Ejecutivo Completo
```javascript
const { data } = await supabase.rpc('generar_reporte_ejecutivo');
```

Ver **GUIA-KPIS-GERENCIALES.md** para detalles completos.

## 🎯 Roadmap Dashboard CTO

- [x] Extracción de métricas GitHub
- [x] Almacenamiento en series de tiempo (Supabase)
- [x] Funciones RPC para cálculos complejos
- [x] Vistas SQL para 7 widgets técnicos
- [x] KPIs gerenciales (5 indicadores ejecutivos)
- [x] Edge Function para ejecución automática
- [ ] Frontend Next.js con los 7 widgets + 5 KPIs
- [ ] Captura de datos por proyecto (Project Mix)
- [ ] Clasificación de Issues (Rework Rate)
- [ ] Autenticación y permisos granulares
- [ ] Alertas automáticas (Slack/Email) para devs inactivos
- [ ] Predicciones con ML (tendencias de velocidad)
