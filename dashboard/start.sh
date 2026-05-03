#!/bin/bash
# Script de inicio que funciona desde cualquier directorio

# Detectar si estamos en el directorio correcto
if [ -f "package.json" ] && grep -q '"next"' package.json 2>/dev/null; then
  echo "✅ Estamos en el directorio correcto"
  exec npm start
else
  echo "🔍 Buscando directorio dashboard..."
  if [ -d "dashboard" ]; then
    cd dashboard
    exec npm start
  else
    echo "❌ No se encontró el directorio dashboard"
    pwd
    ls -la
    exit 1
  fi
fi
