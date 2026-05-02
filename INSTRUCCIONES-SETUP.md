# 🚀 Instrucciones de Setup - Dashboard CTO

## Orden de Ejecución Completo

### 1️⃣ Configuración Inicial

```bash
# Clonar o estar en el directorio del proyecto
cd /home/solcelote/Documentos/ADN/metrics-supabase

# Instalar dependencias
npm install
```

### 2️⃣ Configurar Variables de Entorno

Crear archivo `.env` con tus credenciales:

```bash
cp .env.example .env
```

Editar `.env`:

```env
# Supabase (obtén estos valores de tu proyecto Supabase)
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_KEY=tu_service_key_aqui

# GitHub
GITHUB_TOKEN=ghp_TU_TOKEN_AQUI
GITHUB_ORG=tu-organizacion  # Opcional
```

### 3️⃣ Crear Base de Datos en Supabase

**Opción A: Schema Final (Recomendado)**

1. Ve a tu dashboard de Supabase: https://supabase.com/dashboard/project/wolzdaitdgcepohnrewm
2. SQL Editor → New query
3. Copia y pega el contenido de `schema-final.sql`
4. Click en **Run**

Este schema incluye:
- ✅ Tabla `developers`
- ✅ Tabla `daily_metrics`
- ✅ Tabla `github_issues` (con labels para Rework Rate)
- ✅ Tabla `project_activity` (para Project Mix)
- ✅ Tabla `extraction_logs`
- ✅ 7 Vistas Operativas (O1-O7)
- ✅ 5 Vistas Gerenciales (M1-M5)
- ✅ Funciones RPC
- ✅ Índices de performance
- ✅ Row Level Security (RLS)

**Opción B: Schema Modular (Avanzado)**

Si prefieres construir por partes:

```sql
-- 1. Ejecutar schema básico
-- Contenido de schema.sql

-- 2. Ejecutar vistas y funciones
-- Contenido de schema-enhanced.sql

-- 3. Ejecutar KPIs gerenciales
-- Contenido de schema-kpis-gerenciales.sql
```

### 4️⃣ Agregar Desarrolladores

```bash
npm run seed
```

Interactivamente agrega los GitHub usernames de tu equipo:

```
Selecciona una opción: 1
GitHub username: octocat
Nombre completo: Octo Cat
✅ Desarrollador agregado: octocat (Octo Cat)
```

### 5️⃣ Ejecutar Primera Extracción

```bash
# Extracción del día actual
npm run extract

# Extracción de fecha específica
npm run extract 2026-04-30
```

Esto extraerá:
- ✅ Métricas diarias de código (commits, líneas, repos)
- ✅ Issues de GitHub (con labels)
- ✅ Actividad por proyecto
- ✅ Días de inactividad

### 6️⃣ Verificar Datos

```bash
# Opción 1: Desde SQL Editor en Supabase
SELECT * FROM vw_bench_watch;
SELECT * FROM vw_managerial_kpis_weekly;

# Opción 2: Desde Node.js
node -e "
import { supabase } from './supabase.js';
const { data } = await supabase.from('vw_bench_watch').select('*');
console.log(data);
"
```

---

## 📊 Consultas Útiles Post-Setup

### Ver métricas de hoy

```sql
SELECT * FROM vw_bench_watch;
```

### Ver KPIs gerenciales

```sql
SELECT * FROM vw_managerial_kpis_weekly;
```

### Generar reporte ejecutivo completo

```sql
SELECT generar_reporte_ejecutivo();
```

### Ver logs de extracción

```sql
SELECT * FROM extraction_logs ORDER BY extraction_date DESC LIMIT 5;
```

---

## ⚙️ Configurar Ejecución Automática

### Opción 1: Cron Job Local

```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar todos los días a las 9 AM
0 9 * * * cd /home/solcelote/Documentos/ADN/metrics-supabase && npm run extract >> logs/extraction.log 2>&1
```

### Opción 2: Edge Function en Supabase

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref wolzdaitdgcepohnrewm

# Deploy Edge Function
supabase functions deploy github-extractor

# Configurar cron (ejecuta cada día a las 9 AM UTC)
supabase functions schedule create github-extractor --cron '0 9 * * *'
```

---

## 🎯 Checklist de Verificación

- [ ] Dependencias instaladas (`npm install`)
- [ ] Archivo `.env` configurado con credenciales
- [ ] GitHub Token creado con scopes: `repo`, `read:org`, `read:user`
- [ ] Schema ejecutado en Supabase (`schema-final.sql`)
- [ ] Desarrolladores agregados (`npm run seed`)
- [ ] Primera extracción exitosa (`npm run extract`)
- [ ] Vistas funcionando (consultar `vw_bench_watch`)
- [ ] KPIs gerenciales disponibles (`vw_managerial_kpis_weekly`)
- [ ] Ejecución automática configurada (cron o Edge Function)

---

## 🐛 Troubleshooting

### Error: "Could not find the table 'public.developers'"

**Solución:** Ejecutar `schema-final.sql` en Supabase SQL Editor.

### Error: "GITHUB_TOKEN is missing"

**Solución:** Verificar que el archivo `.env` existe y contiene `GITHUB_TOKEN=ghp_...`

### Error: "No hay desarrolladores activos"

**Solución:** Ejecutar `npm run seed` para agregar desarrolladores.

### Issues no se están capturando

**Verificar:**
1. El GitHub Token tiene permisos de `repo`
2. Si usas organización, `GITHUB_ORG` está configurado
3. Los Issues tienen assignees o authors que coinciden con los usernames en la tabla `developers`

### Rework Rate siempre es 0%

**Causa:** Los Issues no tienen labels `bug` o `rework`.

**Solución:** En GitHub, etiquetar los Issues de corrección con label `bug` o `rework`.

---

## 📈 Próximos Pasos

1. **Ejecutar extracción histórica** (últimos 7-30 días)
   ```bash
   # Ejemplo: extraer últimos 7 días
   for i in {0..6}; do
     npm run extract $(date -d "-$i days" +%Y-%m-%d)
   done
   ```

2. **Configurar prioridades de proyectos**
   ```sql
   UPDATE project_activity 
   SET project_priority = 'high' 
   WHERE repo_name = 'producto-principal';
   ```

3. **Crear dashboard Next.js** (ver documentación en README.md)

4. **Configurar alertas** (Slack/Email para devs inactivos > 3 días)

---

## 📚 Documentación Adicional

- **README.md** - Documentación general del proyecto
- **GUIA-KPIS-GERENCIALES.md** - Guía detallada de los 5 KPIs ejecutivos
- **schema-final.sql** - Comentarios en el código SQL

---

## 🆘 Soporte

Si encuentras problemas:
1. Revisar logs de extracción: `SELECT * FROM extraction_logs ORDER BY extraction_date DESC LIMIT 1;`
2. Verificar conexión a Supabase: `node setup-db.js`
3. Verificar permisos de GitHub Token
