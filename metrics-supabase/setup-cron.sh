#!/bin/bash

# Script para configurar extracción automática diaria a las 11 PM
# Ejecutar: bash setup-cron.sh

echo "🕐 Configurando extracción automática diaria a las 11 PM"
echo "════════════════════════════════════════════════════════"

# Obtener ruta absoluta del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
echo "📁 Directorio del proyecto: $PROJECT_DIR"

# Verificar que npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

# Crear directorio de logs si no existe
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"
echo "📝 Logs se guardarán en: $LOG_DIR"

# Crear entrada de cron
CRON_JOB="0 23 * * * cd $PROJECT_DIR && npm run extract >> $LOG_DIR/extract-\$(date +\%Y\%m\%d).log 2>&1"

# Verificar si ya existe la entrada
if crontab -l 2>/dev/null | grep -q "npm run extract"; then
    echo "⚠️  Ya existe una configuración de extracción en cron"
    echo ""
    echo "Configuración actual:"
    crontab -l | grep "npm run extract"
    echo ""
    read -p "¿Deseas reemplazarla? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "❌ Cancelado"
        exit 0
    fi
    # Eliminar entrada anterior
    crontab -l | grep -v "npm run extract" | crontab -
fi

# Agregar nueva entrada
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "✅ Cron configurado exitosamente"
echo ""
echo "📋 Configuración:"
echo "   Hora: 23:00 (11 PM)"
echo "   Comando: npm run extract"
echo "   Logs: $LOG_DIR/extract-YYYYMMDD.log"
echo ""
echo "🔍 Ver configuración actual:"
echo "   crontab -l"
echo ""
echo "📝 Ver logs:"
echo "   tail -f $LOG_DIR/extract-*.log"
echo ""
echo "🗑️  Para eliminar:"
echo "   crontab -e"
echo "   (Eliminar la línea que contiene 'npm run extract')"
echo ""
echo "✨ La extracción se ejecutará automáticamente todos los días a las 11 PM"
