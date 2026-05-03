# ⚡ Inicio Rápido - Apache Superset en Railway

Guía de 5 minutos para desplegar Apache Superset en Railway.

## 🎯 Antes de Empezar

Necesitas:
- ✅ Cuenta en [Railway](https://railway.app)
- ✅ Este repositorio en GitHub
- ✅ 5 minutos

## 🚀 Pasos (5 minutos)

### 1️⃣ Generar Secret Key (30 segundos)

Abre tu terminal y ejecuta:

```bash
openssl rand -base64 42
```

**Copia el resultado** - lo necesitarás en el paso 4.

### 2️⃣ Crear Proyecto en Railway (1 minuto)

1. Ve a [railway.app](https://railway.app)
2. Click **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Elige este repositorio
5. Configura **Root Directory**: `superset-railway`

### 3️⃣ Agregar PostgreSQL (30 segundos)

1. En tu proyecto, click **"New"**
2. Selecciona **"Database"** → **"Add PostgreSQL"**
3. Espera a que esté listo (icono verde ✅)

### 4️⃣ Configurar Variables (2 minutos)

En el servicio de Superset, ve a **"Variables"** y agrega:

```env
SUPERSET_SECRET_KEY=<pega-el-resultado-del-paso-1>
CREATE_ADMIN_USER=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TuPasswordSegura123!
ADMIN_EMAIL=tu-email@ejemplo.com
APP_NAME=Métricas ADN
BABEL_DEFAULT_LOCALE=es
USE_GUNICORN=true
```

### 5️⃣ Generar Dominio (30 segundos)

1. Ve a **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copia la URL generada

### 6️⃣ Esperar Despliegue (3-5 minutos)

1. Ve a **"Deployments"**
2. Observa los logs en tiempo real
3. Cuando veas "🌐 Iniciando servidor de producción" → ¡Listo!

### 7️⃣ Acceder a Superset (30 segundos)

1. Abre la URL del paso 5
2. Inicia sesión:
   - **Usuario**: `admin`
   - **Password**: `TuPasswordSegura123!`

## ✅ ¡Completado!

Ahora tienes Superset corriendo. Próximos pasos:

1. **Conectar a Supabase**: Ve a Settings → Database Connections
2. **Crear Dataset**: Data → Datasets → + Dataset
3. **Crear Dashboard**: Dashboards → + Dashboard

## 🔧 Después del Primer Despliegue

Para evitar recrear el usuario admin, actualiza estas variables:

```env
CREATE_ADMIN_USER=false
SKIP_DB_INIT=true
SKIP_INIT=true
```

## 🆘 ¿Problemas?

### No puedo acceder
- Espera 5 minutos (el primer despliegue es lento)
- Verifica que el servicio esté "Active" (verde)

### Error de SECRET_KEY
- Asegúrate de haber generado y pegado la secret key del paso 1

### Error de base de datos
- Verifica que PostgreSQL esté agregado y activo

## 📚 Más Información

- [README completo](./README.md) - Documentación detallada
- [Variables de entorno](./.env.example) - Todas las opciones disponibles

---

**¿Listo para crear dashboards profesionales?** 🎨📊
