# 📅 Sistema de Extracción de Métricas

Guía completa para extracciones históricas y automáticas.

## 🚀 Formas de Ejecutar Extracción

### 1. Extracción del Día Actual (Hoy)

```bash
npm run extract
```

Extrae métricas del día actual y las guarda en Supabase.

### 2. Extracción de Fecha Específica

```bash
# Extraer datos del 15 de abril de 2025
npm run extract:date 2025-04-15

# Extraer datos de ayer
npm run extract:date 2025-04-30
```

### 3. Extracción Histórica (Varios Días)

```bash
# Extraer últimos 30 días (por defecto)
npm run extract:historic

# Extraer últimos 7 días
npm run extract:historic 7

# Extraer últimos 60 días
npm run extract:historic 60
```

## 📊 Cargar Datos Históricos de Abril

### Opción A: Cargar Todo Abril de Una Vez

```bash
# Abril tiene ~30 días, pero solo cargaremos desde el 15 de abril para no sobrecargar
npm run extract:historic 15
```

### Opción B: Cargar Día por Día (Más Control)

```bash
# 15 de abril
npm run extract:date 2025-04-15

# 16 de abril
npm run extract:date 2025-04-16

# 17 de abril
npm run extract:date 2025-04-17

# ... y así sucesivamente
```

### Opción C: Script Automático para Todo Abril

```bash
# Crear script temporal
cat > extract-april.sh << 'EOF'
#!/bin/bash
for day in {15..30}; do
  echo "Extrayendo 2025-04-$day..."
  node github-extractor-enhanced.js 2025-04-$day
  sleep 3
done
EOF

chmod +x extract-april.sh
./extract-april.sh
```

## ⏰ Extracción Automática Diaria (11 PM)

### Opción 1: Cron Job (Linux/Mac)

```bash
# Editar crontab
crontab -e

# Agregar línea para ejecutar a las 23:00 (11 PM) todos los días
0 23 * * * cd /home/solcelote/Documentos/ADN/metrics-supabase && npm run extract >> /var/log/metrics-extract.log 2>&1
```

### Opción 2: PM2 (Node.js Process Manager)

```bash
# Instalar PM2 globalmente
npm install -g pm2

# Crear configuración
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'metrics-extract',
    script: './github-extractor-enhanced.js',
    instances: 1,
    exec_mode: 'fork',
    cron_restart: '0 23 * * *',
    env: {
      NODE_ENV: 'production'
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    combine_logs: true
  }]
};
EOF

# Iniciar con PM2
pm2 start ecosystem.config.cjs

# Guardar configuración
pm2 save
pm2 startup
```

### Opción 3: Systemd Timer (Linux)

```bash
# Crear servicio
sudo tee /etc/systemd/system/metrics-extract.service << 'EOF'
[Unit]
Description=Metrics Extraction Service
After=network.target

[Service]
Type=oneshot
WorkingDirectory=/home/solcelote/Documentos/ADN/metrics-supabase
ExecStart=/usr/bin/npm run extract
User=solcelote
EOF

# Crear timer
sudo tee /etc/systemd/system/metrics-extract.timer << 'EOF'
[Unit]
Description=Run metrics extraction daily at 23:00

[Timer]
OnCalendar=*-*-* 23:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Activar
sudo systemctl daemon-reload
sudo systemctl enable metrics-extract.timer
sudo systemctl start metrics-extract.timer

# Verificar
systemctl list-timers --all
```

## 📝 Comandos de Extracción Rápida

| Comando | Descripción |
|---------|-------------|
| `npm run extract` | Hoy |
| `npm run extract:date 2025-04-15` | Fecha específica |
| `npm run extract:historic 30` | Últimos 30 días |
| `npm run extract:historic 7` | Última semana |
| `npm run alerts` | Verificar alertas |

## 🎯 Plan Recomendado para Producción

### Paso 1: Cargar Histórico de Abril

```bash
# Cargar desde el 15 de abril hasta hoy (~15 días)
npm run extract:historic 15
```

### Paso 2: Configurar Extracción Automática

```bash
# Configurar cron para 11 PM diario
crontab -e

# Agregar:
0 23 * * * cd /ruta/al/proyecto && npm run extract >> /tmp/extract.log 2>&1
```

### Paso 3: Verificar Dashboard

- Ir a http://localhost:3001
- Verificar que hay datos históricos
- Las gráficas deberían mostrar tendencias

## 📊 Qué Datos Se Extraen

Cada extracción captura:

1. **Commits** por desarrollador
2. **Líneas de código** (agregadas/eliminadas)
3. **Issues cerrados**
4. **Lead time** (tiempo de cierre)
5. **Repos activos**
6. **Actividad por proyecto**

## ⚠️ Límites de GitHub API

- **Autenticado**: 5,000 requests/hora
- **Sin autenticar**: 60 requests/hora

El script tiene pausas automáticas para no exceder límites.

## 🔍 Verificar Extracción

### Ver logs de extracción

```bash
# Última extracción
tail -50 /tmp/extract.log

# O ver en tiempo real
npm run extract 2>&1 | tee /tmp/extract-$(date +%Y%m%d).log
```

### Verificar datos en Supabase

```sql
-- Ver últimas extracciones
SELECT * FROM extraction_logs ORDER BY created_at DESC LIMIT 5;

-- Ver métricas por día
SELECT date, COUNT(*) as developers, SUM(commits_count) as total_commits
FROM daily_metrics
GROUP BY date
ORDER BY date DESC;

-- Ver developers activos por día
SELECT date, COUNT(DISTINCT developer_id) as active_devs
FROM daily_metrics
WHERE commits_count > 0
GROUP BY date
ORDER BY date DESC;
```

## 🚀 Comenzar Ahora

### Cargar Abril (Recomendado)

```bash
# Cargar últimos 15 días (desde mediados de abril)
npm run extract:historic 15
```

Esto tomará ~5-10 minutos y cargará datos históricos para que el dashboard muestre tendencias reales.

---

**¿Listo para cargar los datos de abril?** Ejecuta:

```bash
npm run extract:historic 15
```
