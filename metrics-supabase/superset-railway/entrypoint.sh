#!/bin/bash
set -e

# Inicializar base de datos si no existe
if [ "${SKIP_DB_INIT}" != "true" ]; then
    echo "Inicializando base de datos de Superset..."
    superset db upgrade
fi

# Crear usuario admin si está configurado
if [ "${CREATE_ADMIN_USER}" = "true" ]; then
    echo "Creando usuario administrador..."
    superset fab create-admin \
        --username "${ADMIN_USERNAME:-admin}" \
        --firstname "${ADMIN_FIRSTNAME:-Admin}" \
        --lastname "${ADMIN_LASTNAME:-User}" \
        --email "${ADMIN_EMAIL:-admin@example.com}" \
        --password "${ADMIN_PASSWORD:-admin}" || echo "Admin user may already exist"
fi

# Cargar ejemplos si está configurado
if [ "${SUPERSET_LOAD_EXAMPLES}" = "yes" ]; then
    echo "Cargando ejemplos..."
    superset load_examples
fi

# Inicializar Superset
if [ "${SKIP_INIT}" != "true" ]; then
    echo "Inicializando Superset..."
    superset init
fi

# Iniciar servidor según el comando proporcionado
if [ -z "$1" ]; then
    echo "Iniciando servidor de desarrollo en puerto ${PORT:-8088}..."
    exec superset run -h 0.0.0.0 -p ${PORT:-8088} --with-threads --reload --debugger
else
    echo "Ejecutando: $@"
    exec "$@"
fi
