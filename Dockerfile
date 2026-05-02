FROM apache/superset:latest

USER root

# Instalar psycopg2 y otras dependencias necesarias
RUN pip install --no-cache-dir psycopg2-binary redis

# Crear directorio para config
RUN mkdir -p /app/pythonpath

# Copiar configuración personalizada
COPY superset_config.py /app/pythonpath/superset_config.py

# Crear script de inicio
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

USER superset

# Configurar variables de entorno
ENV PYTHONPATH=/app/pythonpath
ENV SUPERSET_CONFIG_PATH=/app/pythonpath/superset_config.py

ENTRYPOINT ["/entrypoint.sh"]
