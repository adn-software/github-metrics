# 🔔 Sistema de Alertas Automáticas

Sistema de alertas inteligente para el CTO Dashboard que detecta automáticamente problemas y envía notificaciones.

## 📋 Tipos de Alertas

### 1. **Desarrollador Inactivo** 🚨
- **Trigger:** Desarrollador sin actividad por más de 3 días
- **Severidad:** 
  - CRITICAL: > 7 días
  - HIGH: > 5 días
  - MEDIUM: > 3 días
- **Acción:** Revisar disponibilidad del desarrollador

### 2. **Issue Estancado** ⏰
- **Trigger:** Issue abierto por más de 7 días
- **Severidad:**
  - CRITICAL: > 14 días
  - HIGH: > 10 días
  - MEDIUM: > 7 días
- **Acción:** Reasignar o cerrar issue

### 3. **Alta Tasa de Retrabajo** 🔄
- **Trigger:** Tasa de retrabajo > 15%
- **Severidad:**
  - CRITICAL: > 25%
  - HIGH: > 20%
  - MEDIUM: > 15%
- **Acción:** Revisar calidad del código y procesos

### 4. **Bajo Throughput** 📉
- **Trigger:** Menos de 5 issues cerrados por semana
- **Severidad:** MEDIUM
- **Acción:** Revisar bloqueos del equipo

### 5. **Lead Time Largo** ⏱️
- **Trigger:** Lead time promedio > 48 horas
- **Severidad:** MEDIUM
- **Acción:** Optimizar proceso de desarrollo

## 🚀 Instalación

### 1. Ejecutar Schema de Alertas en Supabase

```sql
-- Copiar y ejecutar schema-alerts.sql en Supabase SQL Editor
```

Ve a: https://supabase.com/dashboard/project/wolzdaitdgcepohnrewm/editor
1. Click en "SQL Editor"
2. Pega el contenido de `schema-alerts.sql`
3. Click en "Run"

### 2. Verificar Instalación

```bash
npm run alerts
```

Deberías ver:
```
🔔 Ejecutando comprobaciones de alertas...
✅ Comprobaciones completadas
```

## 📊 Uso

### Ver Alertas en el Dashboard

El dashboard muestra un **botón flotante** en la esquina superior derecha:
- 🔴 Rojo pulsante: Alertas críticas
- 🟠 Naranja: Alertas sin leer
- 🔵 Azul: Sin alertas

Click en el botón para ver el panel de alertas.

### Ejecutar Comprobaciones Manualmente

```bash
npm run alerts
```

### Programar Comprobaciones Automáticas

#### Opción 1: Cron (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Agregar línea (ejecutar cada hora)
0 * * * * cd /ruta/a/metrics-supabase && npm run alerts
```

#### Opción 2: Supabase Edge Function (Recomendado)

Crear función que se ejecute cada hora:

```typescript
// supabase/functions/check-alerts/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const { data, error } = await supabase.rpc('run_all_alert_checks')
  
  return new Response(
    JSON.stringify({ data, error }),
    { headers: { 'Content-Type': 'application/json' } }
  )
})
```

## ⚙️ Configuración

### Modificar Umbrales

```sql
-- Cambiar umbral de inactividad a 5 días
UPDATE alert_config 
SET threshold_value = 5 
WHERE alert_type = 'developer_inactive';

-- Deshabilitar alertas de retrabajo
UPDATE alert_config 
SET is_enabled = FALSE 
WHERE alert_type = 'high_rework_rate';
```

### Ver Configuración Actual

```sql
SELECT * FROM alert_config;
```

## 📱 Canales de Notificación

### Dashboard (Activo)
- Panel flotante en tiempo real
- Actualización cada 2 minutos
- Notificaciones visuales

### Email (Próximamente)
Configurar con Supabase Auth:
```sql
UPDATE alert_config 
SET notification_channels = '["dashboard", "email"]'
WHERE alert_type = 'developer_inactive';
```

### Webhook/Slack (Próximamente)
Integración con Slack para alertas críticas.

## 🔍 Consultas Útiles

### Ver Alertas Activas

```sql
SELECT * FROM vw_active_alerts;
```

### Resumen por Tipo

```sql
SELECT * FROM vw_alerts_summary;
```

### Marcar Alerta como Resuelta

```sql
UPDATE alerts 
SET is_resolved = TRUE, resolved_at = NOW() 
WHERE id = 'alert-id';
```

### Historial de Alertas

```sql
SELECT 
  alert_type,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE is_resolved = TRUE) as resolved,
  AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/3600) as avg_resolution_hours
FROM alerts
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY alert_type;
```

## 🎯 Mejores Prácticas

1. **Revisar alertas diariamente** - Especialmente las críticas
2. **Resolver alertas rápido** - No dejar acumular
3. **Ajustar umbrales** - Según tu equipo
4. **Monitorear tendencias** - Ver si aumentan o disminuyen
5. **Automatizar acciones** - Para alertas recurrentes

## 📈 Métricas de Alertas

El sistema registra:
- Tiempo de creación
- Tiempo de resolución
- Tipo y severidad
- Entidad afectada
- Metadata adicional

Úsalo para:
- Identificar problemas recurrentes
- Medir tiempo de respuesta
- Optimizar procesos

## 🛠️ Troubleshooting

### No se generan alertas

1. Verificar que las funciones existen:
```sql
SELECT * FROM pg_proc WHERE proname LIKE 'check_%';
```

2. Ejecutar manualmente:
```sql
SELECT * FROM run_all_alert_checks();
```

3. Revisar configuración:
```sql
SELECT * FROM alert_config WHERE is_enabled = TRUE;
```

### Demasiadas alertas

Ajustar umbrales:
```sql
UPDATE alert_config 
SET threshold_value = threshold_value * 1.5 
WHERE alert_type = 'developer_inactive';
```

## 📞 Soporte

Para problemas o sugerencias, revisar:
- Logs de Supabase
- Tabla `alerts` para historial
- Vista `vw_alerts_summary` para resumen
