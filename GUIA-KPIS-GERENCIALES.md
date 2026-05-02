# 📊 Guía de KPIs Gerenciales - Dashboard CTO

## 🎯 Los 5 KPIs para Reuniones Ejecutivas

Esta guía explica cómo usar los KPIs gerenciales implementados para presentar resultados a la dirección.

---

## 1️⃣ THROUGHPUT GLOBAL SEMANAL (Entrega de Valor)

### ¿Qué mide?
Número total de Issues cerrados en toda la organización durante la última semana.

### ¿Por qué es importante?
Responde: **"¿Qué recibimos esta semana por nuestro dinero?"**

### Cómo consultarlo

```javascript
// Desde Next.js
const { data } = await supabase.rpc('kpi_throughput_comparativo');

// Resultado:
{
  semana_actual_issues: 45,
  semana_anterior_issues: 38,
  variacion_porcentual: 18.42,
  tendencia: "📈 CRECIMIENTO FUERTE"
}
```

```sql
-- Desde SQL
SELECT * FROM kpi_throughput_comparativo();
```

### Cómo presentarlo
- **Widget:** Gráfico de barras comparativo
- **Frase clave:** "Esta semana entregamos 45 soluciones, un 18% más que la semana anterior"
- **Meta:** Incremental semana a semana

### Vista histórica
```sql
SELECT * FROM vw_kpi_throughput_semanal ORDER BY semana DESC LIMIT 8;
```

---

## 2️⃣ TIME-TO-MARKET (Lead Time Promedio)

### ¿Qué mide?
Tiempo promedio (en horas) desde que se crea un Issue hasta que se cierra.

### ¿Por qué es importante?
Demuestra **ventaja competitiva**. Si entregas en 4 horas vs 4 días de la competencia, tienes un argumento sólido.

### Cómo consultarlo

```javascript
// Desde Next.js
const { data } = await supabase.rpc('kpi_lead_time_vs_meta', { meta_horas: 24 });

// Resultado:
{
  lead_time_actual_h: 8.5,
  meta_h: 24,
  cumple_meta: true,
  diferencia_h: -15.5,
  tendencia_7d: -12.3,
  status: "🟢 EXCELENTE - Bajo meta y mejorando"
}
```

### Cómo presentarlo
- **Widget:** Gauge Chart (velocímetro)
- **Frase clave:** "Nuestro tiempo de respuesta promedio es de 8.5 horas, 65% mejor que nuestra meta de 24h"
- **Meta sugerida:** < 24 horas para tareas medias

### Tendencia histórica
```sql
SELECT * FROM vw_kpi_lead_time_tendencia ORDER BY semana DESC LIMIT 8;
```

---

## 3️⃣ DISTRIBUCIÓN DE ESFUERZO POR PROYECTO (Project Mix)

### ¿Qué mide?
Porcentaje de actividad (commits e issues) repartido entre diferentes repositorios.

### ¿Por qué es importante?
Valida si el equipo trabaja en **proyectos prioritarios** o pierde tiempo en secundarios.

### Cómo consultarlo

```javascript
// Desde Next.js
const { data } = await supabase.from('vw_kpi_project_mix').select('*');

// Resultado:
[
  { repo_name: "producto-principal", porcentaje_esfuerzo: 60, prioridad: "high" },
  { repo_name: "mantenimiento", porcentaje_esfuerzo: 30, prioridad: "medium" },
  { repo_name: "investigacion", porcentaje_esfuerzo: 10, prioridad: "low" }
]
```

### Cómo presentarlo
- **Widget:** Gráfico de Torta (Pie Chart)
- **Frase clave:** "60% del esfuerzo en Producto Principal, alineado con prioridades del negocio"
- **Meta:** Según prioridades estratégicas de la empresa

### Nota importante
Requiere poblar la tabla `project_activity` con datos de repos. Ver sección de implementación.

---

## 4️⃣ TASA DE RETRABAJO (Calidad en Alta Velocidad)

### ¿Qué mide?
Porcentaje de Issues que son bugs/fixes inmediatamente después de una entrega.

### ¿Por qué es importante?
Equilibra la métrica de velocidad. **No sirve ser rápidos si arreglamos lo mismo 3 veces.**

### Cómo consultarlo

```javascript
// Desde Next.js
const { data } = await supabase.rpc('kpi_analisis_calidad');

// Resultado:
{
  total_entregas: 50,
  entregas_limpias: 48,
  bugs_fixes: 2,
  rework_rate: 4.0,
  calidad_score: 80,
  recomendacion: "Calidad excepcional. La IA está produciendo código estable."
}
```

### Cómo presentarlo
- **Widget:** Ratio de Salud + Score
- **Frase clave:** "Entregamos 50 tareas con solo 4% de tasa de error, calidad score: 80/100"
- **Meta sugerida:** < 10%

### Vista simple
```sql
SELECT * FROM vw_kpi_rework_rate;
```

### Nota importante
Requiere clasificar Issues como 'bug', 'fix', 'feature' en la tabla `issue_types`.

---

## 5️⃣ ÍNDICE DE CAPACIDAD Y DISPONIBILIDAD (Bench Rate)

### ¿Qué mide?
Porcentaje del equipo 100% activo vs. en espera/sin asignación.

### ¿Por qué es importante?
Ayuda a decidir si **contratar, reasignar o buscar nuevos proyectos** para evitar tiempo muerto.

### Cómo consultarlo

```javascript
// Desde Next.js
const { data } = await supabase.rpc('kpi_reporte_capacidad');

// Resultado:
{
  total_devs: 12,
  devs_100_activos: 11,
  devs_en_espera: 1,
  tasa_utilizacion: 91.67,
  meta_utilizacion: 85,
  cumple_meta: true,
  costo_bench_estimado: 1400,
  recomendacion: "🟢 Dentro de meta. Equipo bien balanceado."
}
```

### Cómo presentarlo
- **Widget:** Porcentaje de Utilización + Lista de devs en bench
- **Frase clave:** "Capacidad operativa al 92% (solo 1 desarrollador en espera por falta de asignación)"
- **Meta sugerida:** > 85% de actividad constante

### Vista detallada
```sql
SELECT * FROM vw_kpi_utilizacion_equipo;
```

---

## 📈 REPORTE EJECUTIVO COMPLETO

### Generar reporte JSON con todos los KPIs

```javascript
// Desde Next.js
const { data } = await supabase.rpc('generar_reporte_ejecutivo');

// Resultado: JSON completo con los 5 KPIs
{
  "fecha": "2026-05-01",
  "periodo": "Semana 18/2026",
  "kpi_throughput": {
    "valor": 45,
    "anterior": 38,
    "variacion": 18.42,
    "tendencia": "📈 CRECIMIENTO FUERTE",
    "meta": "Incremental"
  },
  "kpi_lead_time": {
    "valor_horas": 8.5,
    "meta_horas": 24,
    "cumple": true,
    "status": "🟢 EXCELENTE - Bajo meta y mejorando"
  },
  "kpi_calidad": {
    "entregas_totales": 50,
    "rework_rate": 4.0,
    "score": 80,
    "recomendacion": "Calidad excepcional..."
  },
  "kpi_utilizacion": {
    "tasa": 91.67,
    "devs_activos": 11,
    "devs_bench": 1,
    "cumple_meta": true,
    "recomendacion": "🟢 Dentro de meta..."
  }
}
```

### Vista SQL consolidada
```sql
SELECT * FROM vw_dashboard_ejecutivo;
```

---

## 📊 Tabla Resumen de Metas

| KPI | Valor Ideal | Zona Amarilla | Zona Roja |
|-----|-------------|---------------|-----------|
| **Throughput** | Crecimiento semanal | Estable | Decrecimiento |
| **Lead Time** | < 24h | 24-48h | > 48h |
| **Project Mix** | Alineado a prioridades | Desbalanceado | Proyectos incorrectos |
| **Rework Rate** | < 5% | 5-10% | > 10% |
| **Utilización** | > 85% | 70-85% | < 70% |

---

## 🎨 Recomendaciones de Visualización

### Para presentación ejecutiva (PowerPoint/Slides):

1. **Slide 1: Throughput**
   - Gráfico de barras (últimas 8 semanas)
   - Destacar variación porcentual

2. **Slide 2: Lead Time**
   - Gauge chart mostrando meta vs actual
   - Línea de tendencia (últimas 8 semanas)

3. **Slide 3: Project Mix**
   - Pie chart con % por proyecto
   - Tabla de prioridades vs esfuerzo real

4. **Slide 4: Calidad**
   - Score visual (80/100)
   - Ratio: entregas limpias vs bugs

5. **Slide 5: Utilización**
   - Porcentaje grande y visible
   - Lista de devs en bench (si aplica)

### Para dashboard en tiempo real (Next.js):

- **Layout:** Grid 2x3 con los 5 KPIs + resumen
- **Actualización:** Cada hora o manual
- **Filtros:** Semana actual, semana anterior, mes
- **Librería recomendada:** Tremor, Recharts

---

## 🔧 Implementación Pendiente

### Para activar completamente los KPIs:

1. **Project Mix (KPI 3)**
   - Extender `github-extractor.js` para capturar `repo_name` por commit
   - Poblar tabla `project_activity` diariamente
   - Asignar prioridades a proyectos

2. **Rework Rate (KPI 4)**
   - Clasificar Issues por tipo (bug, feature, fix)
   - Detectar Issues relacionados (bugs de features recientes)
   - Poblar tabla `issue_types`

3. **Automatización**
   - Configurar cron job o Edge Function
   - Generar reporte ejecutivo automático cada lunes

---

## 📞 Uso en Reunión Gerencial

### Script sugerido para CTO:

> "Buenos días. Les presento el reporte semanal del departamento de tecnología.
> 
> **Entrega de Valor:** Esta semana cerramos 45 tareas, un 18% más que la semana anterior. Nuestro throughput sigue en crecimiento.
> 
> **Velocidad:** Nuestro tiempo promedio de respuesta es de 8.5 horas desde que identificamos una necesidad hasta que está en producción. Esto nos pone 65% por debajo de nuestra meta de 24 horas.
> 
> **Calidad:** De las 50 entregas, solo 2 requirieron correcciones inmediatas, una tasa de error del 4%. Nuestro score de calidad es 80/100.
> 
> **Distribución:** El 60% del esfuerzo se concentró en el Producto Principal, alineado con las prioridades del negocio.
> 
> **Capacidad:** El equipo opera al 92% de utilización. Solo 1 desarrollador está en espera de asignación, lo cual está dentro de lo esperado.
> 
> En resumen: estamos entregando más, más rápido, con calidad y bien enfocados."

---

## 🚀 Próximos Pasos

1. Ejecutar `schema-kpis-gerenciales.sql` en Supabase
2. Probar funciones RPC individualmente
3. Implementar captura de datos faltantes (repos, issue types)
4. Crear dashboard Next.js con los 5 widgets
5. Automatizar generación de reportes semanales
