#!/bin/bash
set -e

echo "🚀 Iniciando Apache Superset..."

# Instalar psycopg2-binary en runtime si no está disponible
echo "📦 Verificando e instalando dependencias..."
python -c "import psycopg2" 2>/dev/null || {
    echo "   psycopg2 no encontrado, instalando..."
    pip install --user psycopg2-binary==2.9.9 -q
}

# Exportar PYTHONPATH para incluir user site-packages
export PYTHONPATH="$HOME/.local/lib/python3.10/site-packages:$PYTHONPATH"
echo "   PYTHONPATH: $PYTHONPATH"

# Esperar a que la base de datos esté lista
echo "⏳ Esperando conexión a base de datos..."
python << 'PYTHON_SCRIPT'
import time
import sys
import os

# Agregar user site-packages al path
import site
user_site = site.getusersitepackages()
if user_site not in sys.path:
    sys.path.insert(0, user_site)

try:
    from sqlalchemy import create_engine
except ImportError as e:
    print(f"❌ Error importando SQLAlchemy: {e}")
    sys.exit(1)

max_retries = 30
retry_count = 0
db_url = os.environ.get('DATABASE_URL', os.environ.get('SQLALCHEMY_DATABASE_URI'))

if not db_url:
    print("❌ Error: DATABASE_URL no está configurada")
    sys.exit(1)

# Convertir postgres:// a postgresql:// para SQLAlchemy
if db_url.startswith('postgres://'):
    db_url = db_url.replace('postgres://', 'postgresql://', 1)

print(f"   Conectando a: {db_url.split('@')[-1] if '@' in db_url else 'database'}")

while retry_count < max_retries:
    try:
        engine = create_engine(db_url)
        connection = engine.connect()
        result = connection.execute("SELECT 1")
        connection.close()
        print("✅ Base de datos conectada")
        sys.exit(0)
    except ImportError as e:
        print(f"❌ Error de importación: {str(e)}")
        print("   Reiniciando contenedor para aplicar dependencias...")
        sys.exit(1)
    except Exception as e:
        retry_count += 1
        error_msg = str(e)
        if len(error_msg) > 100:
            error_msg = error_msg[:100] + "..."
        print(f"⏳ Intento {retry_count}/{max_retries}... {error_msg}")
        time.sleep(2)

print("❌ No se pudo conectar a la base de datos")
sys.exit(1)
PYTHON_SCRIPT

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
