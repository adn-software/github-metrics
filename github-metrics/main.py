#!/usr/bin/env python3
"""
Monitor de Desempeño de Programadores - Sistema Gerencial
Sincroniza métricas de GitHub a Notion para control de equipo.
"""

import sys
from datetime import datetime, timedelta
from github_client import GitHubClient
from metrics_calculator import MetricsCalculator
from notion_client import NotionClient
from config import Config

def get_today_range():
    """Retorna el rango de fechas para el día actual (desde 00:00 hasta ahora)"""
    now = datetime.now()
    start_of_day = now.replace(hour=0, minute=0, second=0, microsecond=0)
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

def generate_report(developers: dict, calc: MetricsCalculator, report_date: str):
    """Genera reporte gerencial en consola"""
    print("\n" + "="*70)
    print("📊 REPORTE GERENCIAL - MÉTRICAS DE DESARROLLADORES")
    print("="*70)
    
    # Estadísticas generales
    stats = calc.get_summary_stats(developers)
    print(f"\n📈 Estadísticas del Equipo - Día {report_date}:")
    print(f"   • Total desarrolladores activos: {stats['total_developers']}")
    print(f"   • Total commits: {stats['total_commits']}")
    print(f"   • Total líneas agregadas: {stats['total_lines_added']:,}")
    print(f"   • Total líneas eliminadas: {stats['total_lines_deleted']:,}")
    print(f"   • Total líneas modificadas: {stats['total_lines_changed']:,}")
    print(f"   • Promedio commits por dev: {stats['avg_commits_per_dev']:.1f}")
    
    # Ranking por commits
    print(f"\n🏆 TOP DESARROLLADORES POR COMMITS (HOY):")
    ranking = calc.get_ranking_by_commits(developers)
    for i, dev in enumerate(ranking[:10], 1):
        print(f"   {i}. {dev.name}: {dev.commits} commits | {dev.lines_added + dev.lines_deleted:,} líneas")
    
    # Ranking por líneas de código
    print(f"\n💻 TOP DESARROLLADORES POR LÍNEAS DE CÓDIGO (HOY):")
    ranking_lines = calc.get_ranking_by_lines(developers)
    for i, dev in enumerate(ranking_lines[:10], 1):
        print(f"   {i}. {dev.name}: {dev.lines_added + dev.lines_deleted:,} líneas ({dev.lines_added:,}+ / {dev.lines_deleted:,}-)")
    
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
    
    # Calcular métricas
    developers = calc.calculate_metrics(all_commits)
    print(f"👥 Desarrolladores encontrados: {len(developers)}")
    
    if not developers:
        print("⚠️  No se encontraron desarrolladores con actividad en el período.")
        sys.exit(0)
    
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
