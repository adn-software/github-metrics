# 🚂 Configuración Visual de Railway - Paso a Paso

Guía visual con capturas de pantalla conceptuales para desplegar Apache Superset en Railway.

## 📋 Antes de Empezar

### 1. Generar Secret Key

Abre tu terminal y ejecuta:

```bash
openssl rand -base64 42
```

**Ejemplo de salida:**
```
YXBhY2hlLXN1cGVyc2V0LXNlY3JldC1rZXktZXhhbXBsZS0xMjM0NTY3ODkw
```

✅ **Copia este valor** - lo necesitarás en el paso 5.

---

## 🚀 Paso 1: Crear Nuevo Proyecto

### En Railway Dashboard:

1. Ve a [railway.app](https://railway.app)
2. Click en **"New Project"**

```
┌─────────────────────────────────────┐
│  Railway Dashboard                  │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  + New Project              │   │  ← Click aquí
│  └─────────────────────────────┘   │
│                                     │
│  Your Projects:                     │
│  - project-1                        │
│  - project-2                        │
└─────────────────────────────────────┘
```

---

## 📦 Paso 2: Deploy from GitHub

### Seleccionar fuente:

```
┌─────────────────────────────────────┐
│  Deploy from...                     │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📦 Deploy from GitHub repo │   │  ← Click aquí
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📄 Deploy from template    │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🐳 Deploy Docker image     │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## 🔗 Paso 3: Conectar Repositorio

### Autorizar y seleccionar:

```
┌─────────────────────────────────────┐
│  Select Repository                  │
│                                     │
│  🔍 Search: metrics-supabase        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  ✓ tu-usuario/              │   │
│  │    metrics-supabase         │   │  ← Selecciona este
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │    otro-repo                │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Configurar Root Directory:

```
┌─────────────────────────────────────┐
│  Configure Service                  │
│                                     │
│  Root Directory:                    │
│  ┌─────────────────────────────┐   │
│  │  superset-railway           │   │  ← Escribe esto
│  └─────────────────────────────┘   │
│                                     │
│  ✅ Dockerfile detected             │
│                                     │
│  [Deploy Now]                       │
└─────────────────────────────────────┘
```

**⚠️ Importante**: No hagas deploy todavía, primero agrega las bases de datos.

---

## 🗄️ Paso 4: Agregar PostgreSQL

### En tu proyecto:

```
┌─────────────────────────────────────┐
│  Project: metrics-superset          │
│                                     │
│  Services:                          │
│  ┌─────────────────────────────┐   │
│  │  superset (building...)     │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  + New                      │   │  ← Click aquí
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Seleccionar PostgreSQL:

```
┌─────────────────────────────────────┐
│  Add to Project                     │
│                                     │
│  Database:                          │
│  ┌─────────────────────────────┐   │
│  │  🐘 PostgreSQL              │   │  ← Click aquí
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📮 Redis                   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🍃 MongoDB                 │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

✅ **Espera** a que PostgreSQL esté en estado "Active" (icono verde).

---

## 📮 Paso 5: Agregar Redis (Opcional pero Recomendado)

### Repetir proceso:

```
┌─────────────────────────────────────┐
│  Project: metrics-superset          │
│                                     │
│  Services:                          │
│  ┌─────────────────────────────┐   │
│  │  superset (waiting...)      │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │  postgres ✅ Active          │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  + New                      │   │  ← Click aquí
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Seleccionar Redis:

```
┌─────────────────────────────────────┐
│  Add to Project                     │
│                                     │
│  Database:                          │
│  ┌─────────────────────────────┐   │
│  │  🐘 PostgreSQL              │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  📮 Redis                   │   │  ← Click aquí
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## ⚙️ Paso 6: Configurar Variables de Entorno

### Ir a Variables:

```
┌─────────────────────────────────────┐
│  Service: superset                  │
│                                     │
│  Tabs:                              │
│  ┌─────┬─────────┬─────────┬─────┐ │
│  │ ⚙️  │ 📊      │ 🔧      │ 📝  │ │
│  │Settings│Metrics│Variables│Logs │ │  ← Click Variables
│  └─────┴─────────┴─────────┴─────┘ │
└─────────────────────────────────────┘
```

### Agregar Variables:

```
┌─────────────────────────────────────────────────────────┐
│  Variables                                              │
│                                                         │
│  Railway provides:                                      │
│  ✅ DATABASE_URL (from postgres)                        │
│  ✅ REDIS_URL (from redis)                              │
│  ✅ PORT (automatic)                                    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  + New Variable                                 │   │  ← Click aquí
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Variables Requeridas:

Agrega una por una:

```
┌─────────────────────────────────────┐
│  Variable Name:                     │
│  ┌─────────────────────────────┐   │
│  │  SUPERSET_SECRET_KEY        │   │
│  └─────────────────────────────┘   │
│                                     │
│  Variable Value:                    │
│  ┌─────────────────────────────┐   │
│  │  YXBhY2hlLXN1cGVyc2V0...    │   │  ← Pega tu secret key
│  └─────────────────────────────┘   │
│                                     │
│  [Add]                              │
└─────────────────────────────────────┘
```

**Lista completa de variables a agregar:**

```env
SUPERSET_SECRET_KEY=<tu-secret-key-del-paso-1>
CREATE_ADMIN_USER=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TuPasswordSegura123!
ADMIN_EMAIL=tu-email@ejemplo.com
APP_NAME=Métricas ADN
BABEL_DEFAULT_LOCALE=es
USE_GUNICORN=true
GUNICORN_WORKERS=4
```

---

## 🚀 Paso 7: Deploy

### Railway desplegará automáticamente:

```
┌─────────────────────────────────────┐
│  Deployments                        │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🔄 Building...             │   │
│  │  ├─ Pulling image           │   │
│  │  ├─ Installing deps         │   │
│  │  └─ Building container      │   │
│  └─────────────────────────────┘   │
│                                     │
│  Logs:                              │
│  > Step 1/10: FROM apache/superset  │
│  > Step 2/10: RUN pip install...    │
└─────────────────────────────────────┘
```

### Espera a ver estos logs:

```
┌─────────────────────────────────────┐
│  Logs                               │
│                                     │
│  🚀 Iniciando Apache Superset...    │
│  ⏳ Esperando conexión a BD...      │
│  ✅ Base de datos conectada         │
│  📊 Inicializando BD de Superset... │
│  👤 Creando usuario administrador...│
│  🔧 Inicializando Superset...       │
│  🌐 Iniciando servidor de           │
│     producción (Gunicorn) en        │
│     puerto 8080...                  │
│  ✅ Superset listo!                 │
└─────────────────────────────────────┘
```

⏱️ **Tiempo estimado**: 3-5 minutos

---

## 🌐 Paso 8: Generar Dominio Público

### Ir a Settings → Networking:

```
┌─────────────────────────────────────┐
│  Service: superset                  │
│                                     │
│  Settings → Networking              │
│                                     │
│  Public Networking:                 │
│  ┌─────────────────────────────┐   │
│  │  Generate Domain            │   │  ← Click aquí
│  └─────────────────────────────┘   │
│                                     │
│  Custom Domain:                     │
│  ┌─────────────────────────────┐   │
│  │  + Add Custom Domain        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Dominio generado:

```
┌─────────────────────────────────────┐
│  Public URL:                        │
│  ┌─────────────────────────────┐   │
│  │  https://superset-production│   │
│  │  -abc123.up.railway.app     │   │  ← Copia esta URL
│  └─────────────────────────────┘   │
│                                     │
│  [Copy URL]                         │
└─────────────────────────────────────┘
```

---

## 🎉 Paso 9: Acceder a Superset

### Abrir en navegador:

```
┌─────────────────────────────────────────────────────────┐
│  https://superset-production-abc123.up.railway.app      │
├─────────────────────────────────────────────────────────┤
│                                                         │
│              🎨 Apache Superset                         │
│                                                         │
│              ┌─────────────────────┐                    │
│              │  Username:          │                    │
│              │  ┌───────────────┐  │                    │
│              │  │ admin         │  │  ← Escribe admin  │
│              │  └───────────────┘  │                    │
│              │                     │                    │
│              │  Password:          │                    │
│              │  ┌───────────────┐  │                    │
│              │  │ ••••••••••••  │  │  ← Tu password    │
│              │  └───────────────┘  │                    │
│              │                     │                    │
│              │  [Sign In]          │                    │
│              └─────────────────────┘                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Paso 10: Verificar Instalación

### Dashboard principal:

```
┌─────────────────────────────────────────────────────────┐
│  Apache Superset - Métricas ADN                         │
├─────────────────────────────────────────────────────────┤
│  Home | Dashboards | Charts | Datasets | SQL Lab       │
│                                                         │
│  Welcome, admin! 👋                                     │
│                                                         │
│  Quick Actions:                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │ + Database  │  │ + Dataset   │  │ + Chart     │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
│                                                         │
│  Recent Activity:                                       │
│  (empty - this is your first login)                    │
└─────────────────────────────────────────────────────────┘
```

✅ **¡Éxito!** Superset está funcionando.

---

## 🔧 Paso 11: Actualizar Variables (Importante)

### Después del primer login exitoso:

Vuelve a Railway → Variables y actualiza:

```
┌─────────────────────────────────────┐
│  Variables to Update:               │
│                                     │
│  CREATE_ADMIN_USER                  │
│  ┌─────────────────────────────┐   │
│  │  false                      │   │  ← Cambiar a false
│  └─────────────────────────────┘   │
│                                     │
│  + Add Variable:                    │
│  SKIP_DB_INIT = true                │
│  SKIP_INIT = true                   │
│                                     │
│  [Save Changes]                     │
└─────────────────────────────────────┘
```

Railway redesplegará automáticamente.

---

## 🔗 Paso 12: Conectar a Supabase

### En Superset → Settings → Database Connections:

```
┌─────────────────────────────────────────────────────────┐
│  Database Connections                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  + Database                                     │   │  ← Click aquí
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Seleccionar PostgreSQL:

```
┌─────────────────────────────────────┐
│  Select Database Type               │
│                                     │
│  🔍 Search: postgres                │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  🐘 PostgreSQL              │   │  ← Click aquí
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### Configurar conexión:

```
┌─────────────────────────────────────────────────────────┐
│  Connect to PostgreSQL                                  │
│                                                         │
│  Display Name:                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Supabase - Métricas GitHub                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  SQLALCHEMY URI:                                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │  postgresql://postgres:[PASSWORD]@              │   │
│  │  db.xxxxxx.supabase.co:5432/postgres            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ☑️ Allow DML                                           │
│  ☑️ Allow CSV Upload                                    │
│  ☑️ Expose in SQL Lab                                   │
│                                                         │
│  [Test Connection]  [Connect]                           │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Paso 13: Crear Primer Dataset

### Data → Datasets → + Dataset:

```
┌─────────────────────────────────────────────────────────┐
│  Create Dataset                                         │
│                                                         │
│  Database:                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Supabase - Métricas GitHub                     │   │  ← Seleccionar
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Schema:                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │  public                                         │   │  ← Seleccionar
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Table:                                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │  daily_metrics                                  │   │  ← Seleccionar
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [Create Dataset and Create Chart]                      │
└─────────────────────────────────────────────────────────┘
```

---

## 🎨 Paso 14: Crear Primer Chart

### Seleccionar tipo de visualización:

```
┌─────────────────────────────────────────────────────────┐
│  Choose Chart Type                                      │
│                                                         │
│  📊 Bar Chart        📈 Line Chart      🥧 Pie Chart    │
│  📉 Area Chart       🗺️ Map             📅 Calendar     │
│  📊 Table            🎯 Gauge           📊 Histogram    │
│                                                         │
│  [Select and Create]                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎉 ¡Completado!

### Tu setup está listo:

```
✅ Railway proyecto creado
✅ PostgreSQL agregado
✅ Redis agregado
✅ Variables configuradas
✅ Superset desplegado
✅ Dominio público generado
✅ Login exitoso
✅ Variables actualizadas
✅ Supabase conectado
✅ Primer dataset creado
✅ Primer chart creado
```

---

## 📊 Vista Final del Proyecto

```
┌─────────────────────────────────────────────────────────┐
│  Project: metrics-superset                              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Services:                                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🌐 superset                    ✅ Active       │   │
│  │  https://superset-production-abc123...          │   │
│  │  CPU: 45% | RAM: 512MB | Requests: 24/min      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🐘 postgres                    ✅ Active       │   │
│  │  Size: 1.2GB | Connections: 3                   │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  📮 redis                       ✅ Active       │   │
│  │  Memory: 45MB | Keys: 127                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  Monthly Cost: ~$5 USD (Hobby Plan)                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🆘 Troubleshooting Visual

### Si el build falla:

```
❌ Build Failed
│
├─ Verifica Root Directory = "superset-railway"
├─ Verifica que Dockerfile existe
└─ Revisa logs para error específico
```

### Si no puedes acceder:

```
❌ Cannot Access URL
│
├─ Verifica que dominio está generado
├─ Espera 2-3 minutos (primer inicio es lento)
├─ Revisa que servicio está "Active" (verde)
└─ Revisa logs para errores
```

### Si login falla:

```
❌ Login Failed
│
├─ Verifica ADMIN_USERNAME y ADMIN_PASSWORD
├─ Revisa logs: "👤 Creando usuario administrador..."
└─ Si dice "already exists", el usuario ya está creado
```

---

**¿Necesitas más ayuda?**
- Ver [README.md](./README.md) para troubleshooting detallado
- Ver [DEPLOYMENT-CHECKLIST.md](./DEPLOYMENT-CHECKLIST.md) para verificar pasos

**¡Listo para crear dashboards profesionales!** 🎨📊
