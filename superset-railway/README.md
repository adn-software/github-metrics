# 📊 Apache Superset en Railway

Despliegue de Apache Superset usando Docker en Railway para crear dashboards profesionales.

## 🎯 ¿Qué es esto?

Apache Superset es una plataforma open-source de visualización de datos y exploración de BI (Business Intelligence). Esta configuración te permite desplegarlo fácilmente en Railway usando Docker.

## 📋 Requisitos Previos

1. Cuenta en [Railway](https://railway.app) (gratis para empezar)
2. Este repositorio con la carpeta `superset-railway/`
3. 5 minutos de tu tiempo ⏱️

## 🚀 Guía de Despliegue Paso a Paso

### Paso 1: Crear Proyecto en Railway

1. Ve a [Railway](https://railway.app) e inicia sesión
2. Click en **"New Project"**
3. Selecciona **"Deploy from GitHub repo"**
4. Autoriza Railway para acceder a tu repositorio
5. Selecciona este repositorio

### Paso 2: Configurar el Servicio

1. Railway detectará automáticamente el Dockerfile
2. Configura el **Root Directory** como: `superset-railway`
3. Railway comenzará a construir la imagen Docker

### Paso 3: Agregar Base de Datos PostgreSQL

1. En tu proyecto de Railway, click en **"New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway creará automáticamente la base de datos y la variable `DATABASE_URL`
3. Espera a que la base de datos esté lista (icono verde)

### Paso 4: (Opcional) Agregar Redis

Para mejor rendimiento y caché:

1. Click en **"New"** → **"Database"** → **"Add Redis"**
2. Railway creará automáticamente la variable `REDIS_URL`

### Paso 5: Configurar Variables de Entorno

En el servicio de Superset, ve a **"Variables"** y agrega:

#### ✅ Variables Requeridas (Primera vez):

```env
SUPERSET_SECRET_KEY=<genera-con-comando-abajo>
CREATE_ADMIN_USER=true
ADMIN_USERNAME=admin
ADMIN_PASSWORD=TuPasswordSegura123!
ADMIN_EMAIL=tu-email@ejemplo.com
```

**Generar SECRET_KEY:** Ejecuta en tu terminal:
```bash
openssl rand -base64 42
```

#### 🔧 Variables Opcionales (Recomendadas):

```env
APP_NAME=Métricas ADN
BABEL_DEFAULT_LOCALE=es
LOG_LEVEL=INFO
USE_GUNICORN=true
GUNICORN_WORKERS=4
```

### Paso 6: Desplegar

1. Railway desplegará automáticamente después de configurar las variables
2. Espera 3-5 minutos para el primer despliegue
3. Verás logs en tiempo real del proceso de inicialización
4. Cuando veas "🌐 Iniciando servidor de producción", ¡está listo!

### Paso 7: Acceder a Superset

1. Click en **"Settings"** → **"Generate Domain"** para obtener una URL pública
2. Abre la URL en tu navegador
3. Inicia sesión con las credenciales que configuraste:
   - Usuario: `admin` (o el que configuraste)
   - Password: `TuPasswordSegura123!`

### Paso 8: Después del Primer Despliegue

Una vez que hayas iniciado sesión exitosamente, **actualiza estas variables** para evitar recrear el admin:

```env
CREATE_ADMIN_USER=false
SKIP_DB_INIT=true
SKIP_INIT=true
```

Railway redesplegará automáticamente con la nueva configuración.

## 🔗 Conectar a Supabase

Una vez que Superset esté funcionando, conéctalo a tu base de datos de Supabase:

### Opción 1: Usando la URI de Conexión

1. En Supabase, ve a **Settings** → **Database** → **Connection string**
2. Copia la URI de conexión (modo Session)
3. En Superset, ve a **Settings** → **Database Connections** → **+ Database**
4. Selecciona **PostgreSQL**
5. En "SQLALCHEMY URI" pega:
   ```
   postgresql://postgres:[PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
   ```
6. Click en **Test Connection** y luego **Connect**

### Opción 2: Configuración Manual

1. En Superset, ve a **Settings** → **Database Connections** → **+ Database**
2. Selecciona **PostgreSQL**
3. Configura:
   - **Host**: `db.xxxxxx.supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **Username**: `postgres`
   - **Password**: Tu password de Supabase
   - **SSL**: ✅ Activado

### Crear Datasets

1. Ve a **Data** → **Datasets** → **+ Dataset**
2. Selecciona tu conexión de Supabase
3. Elige el schema (ej: `public`)
4. Selecciona una tabla (ej: `github_metrics`, `developer_metrics`)
5. Click en **Create Dataset and Create Chart**

## 📊 Dashboards Recomendados

Una vez conectado a Supabase, puedes crear visualizaciones para:

### KPIs de Desarrollo
- 📈 PRs mergeados vs abiertos por semana
- ⏱️ Tiempo promedio de merge de PRs
- 🐛 Issues resueltos vs creados
- 👥 Productividad por desarrollador
- 📅 Tendencias de commits por día/semana

### Métricas de Equipo
- 🏆 Top contribuidores del mes
- 📊 Distribución de trabajo por proyecto
- 🔥 Actividad de código (heatmap)
- 📉 Backlog de issues y PRs

## 🛠️ Comandos Útiles

### Ver logs en tiempo real
```bash
railway logs --follow
```

### Acceder al shell de Superset
```bash
railway run bash
superset shell
```

### Actualizar base de datos manualmente
```bash
railway run bash
superset db upgrade
superset init
```

### Crear usuario adicional
```bash
railway run bash
superset fab create-user \
  --username nuevo_usuario \
  --firstname Nombre \
  --lastname Apellido \
  --email usuario@ejemplo.com \
  --role Admin \
  --password password123
```

## 🔒 Seguridad y Mejores Prácticas

- ✅ **Nunca** expongas `SUPERSET_SECRET_KEY` en el código
- ✅ Usa contraseñas fuertes para el usuario admin
- ✅ Habilita HTTPS en producción (`SESSION_COOKIE_SECURE=true`)
- ✅ Configura CORS solo para dominios confiables
- ✅ Desactiva el registro público de usuarios (`AUTH_USER_REGISTRATION=False`)
- ✅ Revisa logs regularmente para detectar accesos no autorizados
- ✅ Mantén Superset actualizado

## 📁 Estructura de Archivos

```
superset-railway/
├── Dockerfile          # Imagen Docker basada en apache/superset
├── superset_config.py  # Configuración personalizada
├── entrypoint.sh       # Script de inicialización
├── railway.json        # Configuración de Railway
└── README.md          # Esta guía
```

## 🐛 Troubleshooting

### ❌ Error: "SECRET_KEY is required"

**Solución:** Genera una secret key y agrégala a las variables de entorno:
```bash
openssl rand -base64 42
```
Copia el resultado y agrégalo como `SUPERSET_SECRET_KEY` en Railway.

### ❌ Error de conexión a base de datos

**Causa:** `DATABASE_URL` no está configurada o es incorrecta.

**Solución:** 
1. Verifica que agregaste PostgreSQL en Railway
2. Railway debe crear automáticamente la variable `DATABASE_URL`
3. Reinicia el servicio de Superset

### ❌ Error: "Role already exists"

**Causa:** El usuario admin ya fue creado en un despliegue anterior.

**Solución:** Actualiza las variables de entorno:
```env
CREATE_ADMIN_USER=false
```

### ❌ Timeout en consultas grandes

**Causa:** Las consultas tardan más que el timeout configurado.

**Solución:** Aumenta los timeouts:
```env
SQLLAB_TIMEOUT=600
SUPERSET_WEBSERVER_TIMEOUT=600
GUNICORN_TIMEOUT=300
```

### ❌ No puedo acceder a la URL

**Causa:** El dominio no está generado o el servicio no está corriendo.

**Solución:**
1. Ve a **Settings** → **Networking** → **Generate Domain**
2. Verifica que el servicio esté en estado "Active" (verde)
3. Revisa los logs para ver si hay errores

### ❌ Error 502 Bad Gateway

**Causa:** El contenedor está iniciando o falló.

**Solución:**
1. Espera 2-3 minutos (el primer inicio es lento)
2. Revisa los logs: `railway logs`
3. Verifica que todas las variables requeridas estén configuradas

## 🚀 Optimización de Rendimiento

### Para proyectos pequeños (< 1GB datos)
```env
GUNICORN_WORKERS=2
GUNICORN_THREADS=2
DB_POOL_SIZE=5
```

### Para proyectos medianos (1-10GB datos)
```env
GUNICORN_WORKERS=4
GUNICORN_THREADS=4
DB_POOL_SIZE=10
CACHE_TIMEOUT=600
QUERY_CACHE_TIMEOUT=7200
```

### Para proyectos grandes (> 10GB datos)
```env
GUNICORN_WORKERS=8
GUNICORN_THREADS=4
DB_POOL_SIZE=20
CACHE_TIMEOUT=1800
QUERY_CACHE_TIMEOUT=14400
```

Además, asegúrate de tener Redis configurado para mejor rendimiento de caché.

## 📚 Recursos Adicionales

- 📖 [Documentación oficial de Superset](https://superset.apache.org/docs/)
- 🚂 [Railway Documentation](https://docs.railway.app/)
- 🐘 [PostgreSQL en Railway](https://docs.railway.app/databases/postgresql)
- 🔗 [SQLAlchemy URI Format](https://docs.sqlalchemy.org/en/14/core/engines.html#database-urls)
- 🎨 [Superset Gallery](https://superset.apache.org/gallery) - Ejemplos de dashboards

## 💡 Próximos Pasos

1. ✅ Despliega Superset en Railway
2. ✅ Conéctalo a tu base de datos de Supabase
3. ✅ Crea tu primer dataset
4. ✅ Construye tu primer dashboard
5. ✅ Comparte visualizaciones con tu equipo

¡Listo! Ahora tienes una plataforma profesional de BI corriendo en Railway. 🎉
