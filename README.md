# Sistema de Métricas de Desarrolladores - Control Gerencial

Herramienta automatizada para medir y controlar el desempeño de programadores mediante análisis de repositorios GitHub y generación de reportes en Notion.

## Funcionalidades para Gerencia

- **Detección de inactividad**: Alertas cuando un desarrollador no hace commits por X días
- **Ranking de productividad**: Por commits y líneas de código escritas
- **Dashboard en Notion**: Tabla actualizada automáticamente con todas las métricas
- **Estadísticas de equipo**: Commits totales, líneas de código, promedios

## Métricas Trackeadas

| Métrica | Descripción | Uso Gerencial |
|---------|-------------|---------------|
| Commits | Cantidad de commits en el período | Volumen de trabajo |
| Líneas Agregadas/Eliminadas | Cambios en código | Impacto real en codebase |
| Días Inactivo | Días desde último commit | Detección de bloqueos/problemas |
| Estado | Activo/Alerta/Inactivo | Priorización de seguimiento |
| Score | Commits + (líneas/100) | Ranking compuesto |

## Instalación Rápida

```bash
# 1. Clonar y entrar al directorio
cd Monitoreo-actividad-servidores

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales

# 4. Ejecutar
python main.py
```

## Configuración Detallada

### 1. GitHub Token

1. Ir a GitHub → Settings → Developer settings → Personal access tokens
2. Generar token con permisos: `repo`, `read:org`
3. Copiar token a `GITHUB_TOKEN` en `.env`

### 2. Notion Integration

1. Ir a [Notion Integrations](https://www.notion.so/my-integrations)
2. Crear nueva integración, copiar "Internal Integration Token"
3. Crear una base de datos en Notion con estas columnas:
   - Desarrollador (title)
   - Username (rich text)
   - Período (rich text)
   - Commits (number)
   - Líneas Agregadas (number)
   - Líneas Eliminadas (number)
   - Líneas Total (number)
   - Repos (number)
   - Último Commit (date)
   - Días Inactivo (number)
   - Estado (select: Activo/Alerta/Inactivo)
   - Score (number)
   - Fecha Actualización (date)
4. Compartir la base de datos con la integración
5. Copiar el ID de la base de datos a `NOTION_DATABASE_ID`

### 3. Variables de Entorno (.env)

```env
GITHUB_TOKEN=ghp_tu_token_aqui
GITHUB_ORG=nombre_de_tu_organizacion
NOTION_TOKEN=secret_tu_token_notion
NOTION_DATABASE_ID=id-de-tu-base-de-datos
DAYS_BACK=7                    # Días a analizar
INACTIVITY_THRESHOLD_DAYS=7    # Días para considerar inactivo
```

## Uso

### Ejecución Manual

```bash
python main.py
```

Salida esperada:
```
🚀 Iniciando sincronización de métricas de desarrolladores...
📅 Período de análisis: últimos 7 días

📁 Obteniendo repositorios de la organización 'mi-org'...
   Encontrados 15 repositorios

📊 REPORTE GERENCIAL - MÉTRICAS DE DESARROLLADORES

🏆 TOP DESARROLLADORES POR COMMITS:
   1. 🟢 Juan Pérez: 45 commits | 2,340 líneas
   2. 🟢 Ana García: 38 commits | 1,890 líneas
   ...

⚠️  ALERTAS DE INACTIVIDAD (> 7 días sin commits):
   🔴 Carlos Ruiz: 12 días inactivo

✅ Sincronización completada
```

### Ejecución Automática (Cron)

Ejecutar diariamente a las 9 AM:

```bash
# Editar crontab
crontab -e

# Agregar línea:
0 9 * * * cd /ruta/al/proyecto && /usr/bin/python3 main.py >> logs/cron.log 2>&1
```

## Estructura del Proyecto

```
.
├── main.py                 # Script principal
├── github_client.py        # Cliente GitHub API
├── notion_client.py        # Cliente Notion API
├── metrics_calculator.py   # Cálculo de métricas
├── config.py               # Configuración
├── requirements.txt        # Dependencias
├── .env.example            # Ejemplo de configuración
└── README.md               # Este archivo
```

## Casos de Uso Gerencial

### 1. Revisión Diaria de Equipo
Ejecutar cada mañana para ver:
- Quién está activo y quién no
- Quién necesita seguimiento
- Distribución de carga de trabajo

### 2. Reuniones de Sprint
Usar el reporte para:
- Identificar bloqueos (inactividad)
- Reconocer alta productividad
- Balancear asignaciones

### 3. One-on-ones
Datos objetivos para conversaciones:
- "Veo que has estado muy activo en el repo X"
- "Noté que no has tenido commits esta semana, ¿hay algún bloqueo?"

## Troubleshooting

| Problema | Solución |
|----------|----------|
| "Rate limit exceeded" | El token de GitHub tiene límite de 5000 req/hora. Para orgs grandes, usar varios tokens o esperar. |
| "Database not found" en Notion | Verificar que la base de datos está compartida con la integración |
| Commits no aparecen | Verificar que el usuario hizo commits con email vinculado a su cuenta GitHub |
| Líneas de código en 0 | Algunos commits (merges) no tienen stats. Es normal. |

## Notas Importantes

- **Privacidad**: Este sistema debe usarse con transparencia. Informar al equipo que se monitorea actividad de repos.
- **Contexto**: Las métricas son indicadores, no verdades absolutas. Un desarrollador puede estar en meetings/review sin commits.
- **Calidad > Cantidad**: El sistema mide actividad, no calidad de código. Usar junto con code reviews.

## Soporte

Para problemas o mejoras, revisar los logs de ejecución o modificar `main.py` para modo debug.
