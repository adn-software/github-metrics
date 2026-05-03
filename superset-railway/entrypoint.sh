#!/bin/bash
set -e

echo "🚀 Iniciando Apache Superset..."

# Esperar a que la base de datos esté lista
echo "⏳ Esperando conexión a base de datos..."
python << END
import time
import sys
from sqlalchemy import create_engine
import os

max_retries = 30
retry_count = 0
db_url = os.environ.get('DATABASE_URL', os.environ.get('SQLALCHEMY_DATABASE_URI'))

if db_url and db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)

while retry_count < max_retries:
    try:
        engine = create_engine(db_url)
        connection = engine.connect()
        connection.close()
        print("✅ Base de datos conectada")
        sys.exit(0)
    except Exception as e:
        retry_count += 1
        print(f"⏳ Intento {retry_count}/{max_retries}... {str(e)}")
        time.sleep(2)

print("❌ No se pudo conectar a la base de datos")
sys.exit(1)
END

# Inicializar base de datos si no existe
if [ "${SKIP_DB_INIT}" != "true" ]; then
    echo "📊 Inicializando base de datos de Superset..."
    superset db upgrade
fi

# Crear usuario admin si está configurado
if [ "${CREATE_ADMIN_USER}" = "true" ]; then
    echo "👤 Creando usuario administrador..."
    superset fab create-admin \
        --username "${ADMIN_USERNAME:-admin}" \
        --firstname "${ADMIN_FIRSTNAME:-Admin}" \
        --lastname "${ADMIN_LASTNAME:-User}" \
        --email "${ADMIN_EMAIL:-admin@example.com}" \
        --password "${ADMIN_PASSWORD:-admin}" || echo "⚠️  Admin user may already exist"
fi

# Cargar ejemplos si está configurado
if [ "${SUPERSET_LOAD_EXAMPLES}" = "yes" ]; then
    echo "📈 Cargando ejemplos..."
    superset load_examples
fi

# Inicializar Superset
if [ "${SKIP_INIT}" != "true" ]; then
    echo "🔧 Inicializando Superset..."
    superset init
fi

# Determinar modo de ejecución
if [ -z "$1" ]; then
    # Modo producción con gunicorn (recomendado para Railway)
    if [ "${USE_GUNICORN}" != "false" ]; then
        echo "🌐 Iniciando servidor de producción (Gunicorn) en puerto ${PORT:-8088}..."
        exec gunicorn \
            --bind 0.0.0.0:${PORT:-8088} \
            --workers ${GUNICORN_WORKERS:-4} \
            --worker-class ${GUNICORN_WORKER_CLASS:-gthread} \
            --threads ${GUNICORN_THREADS:-2} \
            --timeout ${GUNICORN_TIMEOUT:-120} \
            --limit-request-line 0 \
            --limit-request-field_size 0 \
            --access-logfile - \
            --error-logfile - \
            "superset.app:create_app()"
    else
        # Modo desarrollo
        echo "🔨 Iniciando servidor de desarrollo en puerto ${PORT:-8088}..."
        exec superset run -h 0.0.0.0 -p ${PORT:-8088} --with-threads --reload --debugger
    fi
else
    echo "▶️  Ejecutando comando personalizado: $@"
    exec "$@"
fi
