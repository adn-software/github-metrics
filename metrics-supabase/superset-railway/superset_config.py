import os
import logging

# =============================================================================
# CONFIGURACIÓN BÁSICA
# =============================================================================

# Secret key - REQUERIDO para producción
SECRET_KEY = os.environ.get("SUPERSET_SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SUPERSET_SECRET_KEY es requerido. Genera uno con: openssl rand -base64 42")

# Puerto del servidor
PORT = int(os.environ.get("PORT", 8088))

# =============================================================================
# BASE DE DATOS (Metadata de Superset)
# =============================================================================

# Railway proporciona DATABASE_URL automáticamente
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    # Convertir postgres:// a postgresql:// para SQLAlchemy
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

SQLALCHEMY_DATABASE_URI = DATABASE_URL or os.environ.get(
    "SQLALCHEMY_DATABASE_URI",
    "postgresql://localhost/superset"
)

# Pool de conexiones para Railway
SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_size": int(os.environ.get("DB_POOL_SIZE", 5)),
    "max_overflow": int(os.environ.get("DB_MAX_OVERFLOW", 10)),
    "pool_recycle": int(os.environ.get("DB_POOL_RECYCLE", 300)),
    "pool_pre_ping": True,
}

# =============================================================================
# REDIS (Cache y Celery)
# =============================================================================

# Railway Redis
REDIS_URL = os.environ.get("REDIS_URL", os.environ.get("REDIS_PUBLIC_URL", "redis://localhost:6379/0"))

# Configuración de caché
CACHE_CONFIG = {
    "CACHE_TYPE": "RedisCache",
    "CACHE_DEFAULT_TIMEOUT": int(os.environ.get("CACHE_TIMEOUT", 300)),
    "CACHE_KEY_PREFIX": "superset_",
    "CACHE_REDIS_URL": REDIS_URL,
}

# Caché para resultados de consultas
def get_cache_config():
    return {
        "CACHE_TYPE": "RedisCache",
        "CACHE_DEFAULT_TIMEOUT": int(os.environ.get("QUERY_CACHE_TIMEOUT", 3600)),
        "CACHE_KEY_PREFIX": "superset_query_",
        "CACHE_REDIS_URL": REDIS_URL,
    }

DATA_CACHE_CONFIG = get_cache_config()

# =============================================================================
# CELERY (Tareas asíncronas)
# =============================================================================

class CeleryConfig:
    broker_url = REDIS_URL
    result_backend = REDIS_URL
    worker_prefetch_multiplier = 1
    task_acks_late = True
    task_track_started = True
    task_always_eager = os.environ.get("CELERY_ALWAYS_EAGER", "false").lower() == "true"

CELERY_CONFIG = CeleryConfig

# =============================================================================
# FEATURE FLAGS
# =============================================================================

FEATURE_FLAGS = {
    # Alertas y reportes
    "ALERT_REPORTS": True,
    "ALERT_REPORTS_NOTIFICATION_DRY_RUN": False,
    
    # Dashboards embebidos
    "EMBEDDED_SUPERSET": True,
    "EMBEDDED_SUPERSET_CHARTS": True,
    
    # Mejoras de UX
    "DASHBOARD_RBAC": True,
    "DRILL_TO_DETAIL": True,
    "DRILL_BY": True,
    "DATAPANEL_CLOSED_BY_DEFAULT": False,
    "DISABLE_LEGACY_DATASOURCE_EDITOR": True,
    
    # Rendimiento
    "GLOBAL_ASYNC_QUERIES": True,
    "ENABLE_TEMPLATE_PROCESSING": True,
    
    # Seguridad
    "DASHBOARD_CROSS_FILTERS": True,
    "CROSS_FILTERS": True,
}

# =============================================================================
# SEGURIDAD
# =============================================================================

# Session
SESSION_COOKIE_SAMESITE = os.environ.get("SESSION_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_SECURE = os.environ.get("SESSION_COOKIE_SECURE", "false").lower() == "true"
SESSION_COOKIE_HTTPONLY = True

# CSRF
WTF_CSRF_ENABLED = os.environ.get("WTF_CSRF_ENABLED", "true").lower() == "true"
WTF_CSRF_EXEMPT_LIST = ["/api/v1/security/csrf_token/"]

# CORS
ENABLE_CORS = os.environ.get("ENABLE_CORS", "false").lower() == "true"
CORS_OPTIONS = {
    "supports_credentials": True,
    "allow_headers": ["*"],
    "expose_headers": ["*"],
    "resources": "*",
    "origins": os.environ.get("CORS_ORIGINS", "*").split(","),
}

# =============================================================================
# AUTENTICACIÓN
# =============================================================================

AUTH_TYPE = 1  # Database authentication
AUTH_USER_REGISTRATION = False
AUTH_ROLE_PUBLIC = "Public"

# =============================================================================
# LOGGING
# =============================================================================

LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")

logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s:%(levelname)s:%(name)s:%(message)s",
)

# =============================================================================
# RENDIMIENTO
# =============================================================================

# Timeouts
SQLLAB_TIMEOUT = int(os.environ.get("SQLLAB_TIMEOUT", 300))
SUPERSET_WEBSERVER_TIMEOUT = int(os.environ.get("WEBSERVER_TIMEOUT", 300))

# Límites
ROW_LIMIT = int(os.environ.get("ROW_LIMIT", 50000))
SAMPLES_ROW_LIMIT = int(os.environ.get("SAMPLES_ROW_LIMIT", 10000))
DISPLAY_MAX_ROW = int(os.environ.get("DISPLAY_MAX_ROW", 10000))

# Asynchronous queries
GLOBAL_ASYNC_QUERIES_REDIS_CONFIG = {
    "port": 6379,
    "host": os.environ.get("REDIS_HOST", "localhost"),
}
GLOBAL_ASYNC_QUERIES_REDIS_STREAM_PREFIX = "async-queries-"
GLOBAL_ASYNC_QUERIES_REDIS_STREAM_LIMIT = 1000
GLOBAL_ASYNC_QUERIES_REDIS_STREAM_LIMIT_FIREHOSE = 100000
GLOBAL_ASYNC_QUERIES_JWT_SECRET = os.environ.get("GLOBAL_ASYNC_QUERIES_JWT_SECRET", SECRET_KEY)
GLOBAL_ASYNC_QUERIES_JWT_COOKIE_SECURE = SESSION_COOKIE_SECURE
GLOBAL_ASYNC_QUERIES_JWT_COOKIE_SAMESITE = SESSION_COOKIE_SAMESITE

# =============================================================================
# CUSTOMIZACIÓN
# =============================================================================

# Deshabilitar carga de ejemplos por defecto
SUPERSET_LOAD_EXAMPLES = os.environ.get("SUPERSET_LOAD_EXAMPLES", "no").lower() == "yes"

# Logo y branding
APP_NAME = os.environ.get("APP_NAME", "Superset")

# Idioma
BABEL_DEFAULT_LOCALE = os.environ.get("BABEL_DEFAULT_LOCALE", "es")
BABEL_DEFAULT_FOLDER = "translations"
LANGUAGES = {
    "en": {"flag": "us", "name": "English"},
    "es": {"flag": "es", "name": "Español"},
}

# Timezone
DRUID_IS_ACTIVE = False

