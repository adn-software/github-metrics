# Apache Superset en Railway

Configuración lista para desplegar Apache Superset en Railway.

## 📋 Requisitos Previos

1. Cuenta en [Railway](https://railway.app)
2. Base de datos PostgreSQL (Railway la crea automáticamente)
3. Instancia Redis (opcional, para caché y Celery)
4. Proyecto conectado a un repositorio Git

## 🚀 Pasos de Despliegue

### 1. Generar SECRET_KEY

Antes de desplegar, necesitas generar una secret key:

```bash
openssl rand -base64 42
```

Guarda este valor, lo usarás en las variables de entorno.

### 2. Configurar Variables de Entorno

En el dashboard de Railway, configura estas variables:

#### Requeridas:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `SUPERSET_SECRET_KEY` | Clave secreta generada | `abc123...` |
| `DATABASE_URL` | URL de PostgreSQL (Railway la provee) | `postgresql://...` |
| `CREATE_ADMIN_USER` | Crear usuario admin al iniciar | `true` |
| `ADMIN_USERNAME` | Nombre de usuario admin | `admin` |
| `ADMIN_PASSWORD` | Contraseña admin | `tu-password-segura` |
| `ADMIN_EMAIL` | Email del admin | `admin@tu-empresa.com` |

#### Opcionales:

| Variable | Descripción | Default |
|----------|-------------|---------|
| `REDIS_URL` | URL de Redis para caché | `redis://localhost:6379/0` |
| `LOG_LEVEL` | Nivel de logging | `INFO` |
| `SUPERSET_LOAD_EXAMPLES` | Cargar dashboards de ejemplo | `no` |
| `CACHE_TIMEOUT` | Timeout de caché en segundos | `300` |
| `QUERY_CACHE_TIMEOUT` | Timeout de caché de queries | `3600` |
| `ROW_LIMIT` | Límite de filas en consultas | `50000` |
| `APP_NAME` | Nombre de la aplicación | `Superset` |
| `BABEL_DEFAULT_LOCALE` | Idioma por defecto | `es` |

### 3. Desplegar

1. Conecta tu repositorio a Railway
2. Railway detectará automáticamente el Dockerfile
3. El despliegue se ejecutará automáticamente

### 4. Inicializar (Primera vez)

Para la primera ejecución, asegúrate de tener:

```
CREATE_ADMIN_USER=true
SKIP_DB_INIT=false
SKIP_INIT=false
```

Una vez que el admin esté creado, puedes cambiar a:

```
CREATE_ADMIN_USER=false
SKIP_DB_INIT=true
SKIP_INIT=true
```

## 🔗 Conectar a Supabase

Para conectar Superset a tu base de datos de Supabase:

1. Obtén la URL de conexión de Supabase (Settings > Database > Connection string)
2. En Superset, ve a **Settings > Database Connections > + Database**
3. Selecciona **PostgreSQL**
4. Configura:
   - Host: `db.xxxxxx.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `[tu-password]`
   - SSL: Activado

## 📊 Dashboards Pre-configurados

Una vez conectado a Supabase, puedes crear datasets y dashboards para:

- Métricas de desarrolladores
- PRs mergeados vs abiertos
- Tiempo promedio de merge
- Issues resueltos
- KPIs de productividad

## 🛠️ Comandos Útiles

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

### Ver logs

```bash
railway logs
```

## 🔒 Seguridad

- **Nunca** expongas `SUPERSET_SECRET_KEY` en el código
- Usa HTTPS en producción (`SESSION_COOKIE_SECURE=true`)
- Configura CORS apropiadamente (`CORS_ORIGINS`)
- Desactiva el registro público de usuarios

## 📁 Estructura de Archivos

```
superset-railway/
├── Dockerfile          # Configuración del contenedor
├── superset_config.py  # Configuración de Superset
├── entrypoint.sh       # Script de inicio
└── README.md          # Esta guía
```

## 🐛 Troubleshooting

### Error: "SECRET_KEY is required"

Genera y configura la variable `SUPERSET_SECRET_KEY`.

### Error de conexión a base de datos

Verifica que `DATABASE_URL` esté correctamente configurada. Railway debe proveerla automáticamente.

### Error: "Role already exists"

El usuario admin ya existe. Cambia `CREATE_ADMIN_USER` a `false`.

### Timeout en consultas grandes

Aumenta `SQLLAB_TIMEOUT` y `SUPERSET_WEBSERVER_TIMEOUT`.

## 📚 Recursos

- [Documentación oficial de Superset](https://superset.apache.org/docs/)
- [Railway Documentation](https://docs.railway.app/)
- [SQLAlchemy URI Format](https://docs.sqlalchemy.org/en/14/core/engines.html#database-urls)
