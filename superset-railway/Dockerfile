FROM apache/superset:latest

USER root

# Instalar dependencias para PostgreSQL y Redis
RUN pip install --no-cache-dir \
    psycopg2-binary \
    redis \
    celery \
    gunicorn

# Crear directorio para configuración
RUN mkdir -p /app/pythonpath

# Copiar archivos de configuración
COPY superset_config.py /app/pythonpath/superset_config.py
COPY entrypoint.sh /entrypoint.sh

# Dar permisos de ejecución
RUN chmod +x /entrypoint.sh

# Volver a usuario superset
USER superset

# Variables de entorno
ENV PYTHONPATH=/app/pythonpath
ENV SUPERSET_CONFIG_PATH=/app/pythonpath/superset_config.py
ENV FLASK_APP=superset

# Puerto por defecto (Railway lo sobreescribe con $PORT)
EXPOSE 8088

ENTRYPOINT ["/entrypoint.sh"]
