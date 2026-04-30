#!/usr/bin/env python3
"""
Monitor de Desempeño de Programadores - Sistema Gerencial
Sincroniza métricas de GitHub a Notion para control de equipo.
"""

import sys
from datetime import datetime, timedelta
from github_client import GitHubClient
from metrics_calculator import MetricsCalculator, DeveloperMetrics
from notion_client import NotionClient
from config import Config

def get_today_range():
    """Retorna el rango de fechas para el día actual en UTC (GitHub usa UTC)"""
    now = datetime.utcnow()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
    print(f"   📅 Rango de búsqueda: {start_of_day.isoformat()} a {now.isoformat()} (UTC)")
    return start_of_day, now

def collect_all_commits(github: GitHubClient, since: datetime, until: datetime) -> list:
    """Recolecta commits de todos los repos de la organización en un rango de fechas"""
    
    print(f"📁 Obteniendo repositorios de la organización '{github.org}'...")
    repos = github.get_org_repositories()
    print(f"   Encontrados {len(repos)} repositorios")
    
    all_commits = []
    
    for repo in repos:
        repo_name = repo['name']
        print(f"\n   🔍 Analizando: {repo_name}")
        
        try:
            commits = github.get_commits_from_all_branches(repo_name, since, until)
            print(f"      Commits encontrados: {len(commits)}")
            
            # Obtener detalles de cada commit (líneas de código)
            for commit in commits:
                try:
                    details = github.get_commit_details(repo_name, commit['sha'])
                    commit['repo'] = repo_name
                    commit['stats'] = details.get('stats', {'additions': 0, 'deletions': 0})
                    all_commits.append(commit)
                except Exception as e:
                    # Commit sin stats (puede ser merge o borrado)
                    commit['repo'] = repo_name
                    commit['stats'] = {'additions': 0, 'deletions': 0}
                    all_commits.append(commit)
                    
        except Exception as e:
            print(f"      ⚠️ Error: {e}")
            continue
    
    return all_commits

def get_developer_assigned_repos(github: GitHubClient, developers: dict) -> dict:
    """Obtiene el total de repos asignados para cada desarrollador"""
    print("\n📋 Obteniendo información de repos asignados por desarrollador...")
    assigned_repos = {}
    
    for username in developers.keys():
        try:
            repos = github.get_org_member_repos(username)
            assigned_repos[username] = len(repos)
            print(f"   • {username}: {len(repos)} repos asignados")
        except Exception as e:
            print(f"   ⚠️ Error obteniendo repos de {username}: {e}")
            assigned_repos[username] = 0
    
    return assigned_repos

def generate_report(developers: dict, calc: MetricsCalculator, report_date: str):
    """Genera reporte gerencial en consola con detalles por día"""
    print("\n" + "="*70)
    print("📊 REPORTE GERENCIAL - MÉTRICAS DIARIAS DE DESARROLLADORES")
    print("="*70)
    
    # Estadísticas generales
    stats = calc.get_summary_stats(developers)
    print(f"\n📈 Estadísticas del Equipo - Día {report_date}:")
    print(f"   • Total desarrolladores: {stats['total_developers']}")
    print(f"   • Total commits hoy: {stats['total_commits']}")
    print(f"   • Total líneas agregadas hoy: {stats['total_lines_added']:,}")
    print(f"   • Total líneas eliminadas hoy: {stats['total_lines_deleted']:,}")
    print(f"   • Total líneas modificadas hoy: {stats['total_lines_changed']:,}")
    
    # Ranking detallado por desarrollador
    print(f"\n🏆 DETALLE POR DESARROLLADOR (HOY):")
    ranking = calc.get_ranking_by_commits(developers)
    for i, dev in enumerate(ranking[:15], 1):
        print(f"\n   {i}. {dev.name} (@{dev.username})")
        print(f"      📦 Repos trabajados hoy: {len(dev.repos_contributed)}")
        print(f"      📝 Commits hoy: {dev.commits}")
        print(f"      ➕ Líneas agregadas hoy: {dev.lines_added:,}")
        print(f"      ➖ Líneas eliminadas hoy: {dev.lines_deleted:,}")
        print(f"      📊 Total líneas modificadas: {dev.lines_added + dev.lines_deleted:,}")
        print(f"      🏛️  Total repos asignados: {dev.total_assigned_repos}")
        if dev.last_commit_date:
            print(f"      🕐 Último commit hoy: {dev.last_commit_date.strftime('%H:%M:%S')}")
        else:
            print(f"      ⚪ Sin actividad hoy")
    
    print(f"\n✅ Reporte del día {report_date} completado.")
    print("\n" + "="*70)

def main():
    print("🚀 Iniciando registro diario de métricas de desarrolladores...")
    today = datetime.now().strftime('%Y-%m-%d')
    print(f"📅 Fecha de registro: {today}\n")
    
    # Validar configuración
    try:
        Config.validate()
    except ValueError as e:
        print(f"❌ Error de configuración: {e}")
        print("   Verifica tu archivo .env con las variables necesarias.")
        sys.exit(1)
    
    # Inicializar clientes
    github = GitHubClient()
    notion = NotionClient()
    
    # Obtener rango del día actual
    since, until = get_today_range()
    calc = MetricsCalculator(since=since, until=until)
    
    # Recolectar datos de GitHub del día actual
    try:
        all_commits = collect_all_commits(github, since, until)
        print(f"\n📊 Total commits recolectados hoy: {len(all_commits)}")
    except Exception as e:
        print(f"❌ Error al obtener datos de GitHub: {e}")
        sys.exit(1)
    
    # Calcular métricas de desarrolladores con actividad hoy
    active_developers = calc.calculate_metrics(all_commits)
    print(f"👥 Desarrolladores con actividad hoy: {len(active_developers)}")
    
    # Obtener TODOS los miembros del equipo (para crear historial completo)
    print("\n📋 Obteniendo todos los miembros del equipo...")
    all_members = github.get_all_org_members()
    print(f"   Total miembros en el equipo: {len(all_members)}")
    
    # Crear DeveloperMetrics para todos los miembros (incluyendo los sin actividad hoy)
    all_developers = {}
    
    for username, name in all_members.items():
        if username in active_developers:
            # Usar datos reales de actividad
            all_developers[username] = active_developers[username]
        else:
            # Crear métricas con 0 para miembros sin actividad hoy
            dev = DeveloperMetrics(username=username, name=name)
            dev.commits = 0
            dev.lines_added = 0
            dev.lines_deleted = 0
            dev.last_commit_date = None
            all_developers[username] = dev
    
    # Obtener información de repos asignados para todos los desarrolladores
    print("\n📋 Obteniendo información de repos asignados...")
    for username, dev in all_developers.items():
        try:
            repos = github.get_org_member_repos(username)
            dev.total_assigned_repos = len(repos)
            print(f"   • {username}: {len(repos)} repos asignados")
        except Exception as e:
            print(f"   ⚠️ Error obteniendo repos de {username}: {e}")
            dev.total_assigned_repos = 0
    
    if not all_developers:
        print("⚠️  No se encontraron desarrolladores en el equipo.")
        sys.exit(0)
    
    developers = all_developers  # Usar todos para el reporte y registro
    
    # Generar reporte en consola
    generate_report(developers, calc, today)
    
    # Sincronizar con Notion (siempre crear nuevos registros, nunca actualizar)
    print("\n🔄 Registrando métricas diarias en Notion...")
    try:
        result = notion.append_daily_metrics(developers, today)
        print(f"✅ Registro diario completado:")
        print(f"   • Nuevas filas creadas: {result['created']}")
        print(f"   • Total desarrolladores registrados: {result['synced']}")
    except Exception as e:
        print(f"❌ Error al sincronizar con Notion: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    
    print("\n✨ Proceso completado exitosamente.")

if __name__ == '__main__':
    main()
