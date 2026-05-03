# 🏗️ Arquitectura - Apache Superset en Railway

Documentación técnica de la arquitectura del deployment.

## 📊 Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                        RAILWAY                              │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Apache Superset Container                │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │  Gunicorn (Production Server)                │    │  │
│  │  │  - Workers: 4                                │    │  │
│  │  │  - Threads: 2 per worker                     │    │  │
│  │  │  - Port: $PORT (Railway dynamic)             │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                                                        │  │
│  │  ┌──────────────────────────────────────────────┐    │  │
│  │  │  Superset Application                        │    │  │
│  │  │  - Flask App                                 │    │  │
│  │  │  - SQLAlchemy ORM                            │    │  │
│  │  │  - Celery (async tasks)                      │    │  │
│  │  └──────────────────────────────────────────────┘    │  │
│  │                                                        │  │
│  └────────────┬───────────────────┬──────────────────────┘  │
│               │                   │                          │
│               ▼                   ▼                          │
│  ┌────────────────────┐  ┌────────────────────┐            │
│  │   PostgreSQL       │  │      Redis         │            │
│  │   (Metadata DB)    │  │   (Cache/Celery)   │            │
│  │                    │  │                    │            │
│  │  - Superset config │  │  - Query cache     │            │
│  │  - Users/roles     │  │  - Session store   │            │
│  │  - Dashboards      │  │  - Celery broker   │            │
│  │  - Charts          │  │                    │            │
│  └────────────────────┘  └────────────────────┘            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   Supabase Database   │
              │   (Data Source)       │
              │                       │
              │  - github_metrics     │
              │  - developer_metrics  │
              │  - kpis_gerenciales   │
              └───────────────────────┘
```

## 🐳 Componentes Docker

### Base Image
- **Imagen**: `apache/superset:latest`
- **Mantenedor**: Apache Software Foundation
- **Actualizaciones**: Automáticas al rebuild

### Capas Adicionales
1. **Dependencias Python**:
   - `psycopg2-binary` - PostgreSQL adapter
   - `redis` - Redis client
   - `celery` - Async task queue
   - `gunicorn` - WSGI HTTP Server

2. **Configuración**:
   - `superset_config.py` - Configuración personalizada
   - `entrypoint.sh` - Script de inicialización

## 🔄 Flujo de Inicio

```
1. Container Start
   ↓
2. entrypoint.sh ejecuta
   ↓
3. Espera conexión a PostgreSQL (max 60s)
   ↓
4. superset db upgrade (si SKIP_DB_INIT != true)
   ↓
5. Crear admin user (si CREATE_ADMIN_USER = true)
   ↓
6. superset init (si SKIP_INIT != true)
   ↓
7. Iniciar Gunicorn
   ↓
8. Superset listo en $PORT
```

## 🗄️ Base de Datos

### PostgreSQL (Metadata)
Almacena toda la configuración de Superset:

- **Usuarios y roles**: Autenticación y permisos
- **Dashboards**: Definiciones de dashboards
- **Charts**: Configuración de gráficos
- **Datasets**: Conexiones a fuentes de datos
- **Queries**: Historial de consultas
- **Logs**: Auditoría de acciones

### Redis (Cache & Celery)
Mejora el rendimiento:

- **Query Cache**: Resultados de consultas frecuentes
- **Session Store**: Sesiones de usuario
- **Celery Broker**: Cola de tareas asíncronas
- **Celery Result Backend**: Resultados de tareas

## 🔌 Conexiones Externas

### Supabase (Data Source)
- **Protocolo**: PostgreSQL (SSL)
- **Puerto**: 5432
- **Autenticación**: Usuario/Password
- **Schemas**: `public`, custom schemas
- **Tablas**: Métricas de GitHub, KPIs, etc.

## ⚙️ Variables de Entorno

### Críticas
| Variable | Propósito | Proveedor |
|----------|-----------|-----------|
| `DATABASE_URL` | Metadata DB | Railway auto |
| `SUPERSET_SECRET_KEY` | Encriptación | Usuario |
| `PORT` | Puerto HTTP | Railway auto |

### Opcionales
| Variable | Propósito | Default |
|----------|-----------|---------|
| `REDIS_URL` | Cache/Celery | Railway auto |
| `GUNICORN_WORKERS` | Concurrencia | 4 |
| `GUNICORN_THREADS` | Threads/worker | 2 |

## 🚀 Escalabilidad

### Vertical (Railway)
- **CPU**: 1-8 vCPUs
- **RAM**: 512MB - 32GB
- **Ajuste**: Automático según plan

### Horizontal (Gunicorn)
```python
# Fórmula recomendada
workers = (2 * CPU_cores) + 1
threads = 2-4

# Ejemplo: 2 vCPUs
workers = 4
threads = 2
# Total: 8 concurrent requests
```

## 🔒 Seguridad

### Capas de Seguridad

1. **Railway**:
   - HTTPS automático
   - Variables de entorno encriptadas
   - Red privada entre servicios

2. **Superset**:
   - CSRF protection
   - Session cookies (HTTPOnly)
   - Password hashing (bcrypt)
   - SQL injection protection (SQLAlchemy)

3. **Base de Datos**:
   - SSL/TLS en tránsito
   - Credenciales rotables
   - Connection pooling

### Best Practices Implementadas

✅ No hardcodear credenciales
✅ Secret key generada aleatoriamente
✅ Cookies seguras en producción
✅ CORS configurado restrictivamente
✅ Registro de usuarios deshabilitado
✅ Logs de auditoría habilitados

## 📈 Monitoreo

### Logs Disponibles
```bash
# Railway CLI
railway logs --follow

# Logs específicos
railway logs --service superset
railway logs --service postgres
railway logs --service redis
```

### Métricas Clave
- **CPU Usage**: < 70% recomendado
- **Memory Usage**: < 80% recomendado
- **Response Time**: < 2s promedio
- **Error Rate**: < 1%

## 🔧 Mantenimiento

### Actualizaciones
```bash
# Rebuild con última imagen
railway up --detach

# Rollback si hay problemas
railway rollback
```

### Backups
- **PostgreSQL**: Railway backups automáticos
- **Dashboards**: Exportar como JSON
- **Configuración**: Versionado en Git

## 🎯 Optimizaciones Aplicadas

### Performance
- ✅ Connection pooling (PostgreSQL)
- ✅ Query caching (Redis)
- ✅ Async queries (Celery)
- ✅ Gunicorn workers optimizados
- ✅ Static assets caching

### Resource Usage
- ✅ `.dockerignore` para builds rápidos
- ✅ Multi-stage build (si aplica)
- ✅ Lazy loading de features
- ✅ Database query optimization

## 📚 Referencias Técnicas

- [Apache Superset Docs](https://superset.apache.org/docs/)
- [Gunicorn Configuration](https://docs.gunicorn.org/en/stable/settings.html)
- [Railway Docs](https://docs.railway.app/)
- [PostgreSQL Best Practices](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

**Arquitectura diseñada para**: Alta disponibilidad, escalabilidad y seguridad en producción.
