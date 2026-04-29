#!/bin/bash
# Script wrapper para ejecución del monitor de desarrolladores
# Uso: ./run.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Verificar que existe el entorno virtual o instalar dependencias
if [ ! -d "venv" ]; then
    echo "🔄 Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
source venv/bin/activate

# Instalar/actualizar dependencias
pip install -q -r requirements.txt

# Crear directorio de logs si no existe
mkdir -p logs

# Ejecutar con logging
LOG_FILE="logs/run_$(date +%Y%m%d_%H%M%S).log"
echo "🚀 Ejecutando monitor de desarrolladores..."
echo "📄 Log: $LOG_FILE"

python main.py | tee "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Ejecución completada exitosamente"
else
    echo "❌ Error en ejecución (código $EXIT_CODE)"
    echo "   Revisar log: $LOG_FILE"
fi

deactivate
exit $EXIT_CODE
