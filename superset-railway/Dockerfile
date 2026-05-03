FROM apache/superset:latest

USER root

# Cache bust: 2026-05-03-004 - Fix user permissions for psycopg2

# Crear directorio para configuración
RUN mkdir -p /app/pythonpath

# Copiar archivos de configuración
COPY superset_config.py /app/pythonpath/superset_config.py
COPY entrypoint.sh /entrypoint.sh

# Dar permisos de ejecución
RUN chmod +x /entrypoint.sh

# Cambiar a usuario superset ANTES de instalar dependencias
USER superset

# Actualizar pip e instalar dependencias como usuario superset
RUN pip install --upgrade pip && \
    pip install --no-cache-dir \
    psycopg2-binary==2.9.9 \
    redis==5.0.0 \
    celery==5.3.0 \
    gunicorn==21.2.0 \
    sqlalchemy==1.4.49

# Variables de entorno
ENV PYTHONPATH=/app/pythonpath
ENV SUPERSET_CONFIG_PATH=/app/pythonpath/superset_config.py
ENV FLASK_APP=superset

# Puerto por defecto (Railway lo sobreescribe con $PORT)
EXPOSE 8088

ENTRYPOINT ["/entrypoint.sh"]
