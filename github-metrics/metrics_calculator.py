from datetime import datetime, timedelta
from typing import Dict, List, Any
from collections import defaultdict

class DeveloperMetrics:
    def __init__(self, username: str, name: str = None):
        self.username = username
        self.name = name or username
        self.commits = 0
        self.lines_added = 0
        self.lines_deleted = 0
        self.repos_contributed = set()  # Repos donde hizo commits HOY
        self.total_assigned_repos = 0   # Total de repos donde es miembro/colaborador
        self.commit_dates = []
        self.last_commit_date = None
        self.first_commit_date = None
    
    @property
    def days_since_last_commit(self) -> int:
        if not self.last_commit_date:
            return float('inf')
        return (datetime.now() - self.last_commit_date).days
    
    @property
    def is_inactive(self, threshold: int = 7) -> bool:
        return self.days_since_last_commit > threshold
    
    @property
    def activity_score(self) -> float:
        """Score compuesto: commits + (líneas/100)"""
        return self.commits + (self.lines_added + self.lines_deleted) / 100

class MetricsCalculator:
    def __init__(self, since: datetime = None, until: datetime = None, days_back: int = None):
        """
        Calcula métricas para un rango de fechas específico.
        Si since/until no se proporcionan, usa days_back (comportamiento anterior).
        """
        if since and until:
            self.since = since
            self.until = until
            self.days_back = (until - since).days
        elif days_back:
            self.days_back = days_back
            self.since = datetime.now() - timedelta(days=days_back)
            self.until = datetime.now()
        else:
            # Por defecto, día actual
            self.until = datetime.now()
            self.since = self.until.replace(hour=0, minute=0, second=0, microsecond=0)
            self.days_back = 1
    
    def calculate_metrics(self, commits_data: List[Dict]) -> Dict[str, DeveloperMetrics]:
        """Calcula métricas por desarrollador desde lista de commits"""
        developers: Dict[str, DeveloperMetrics] = {}
        
        for commit_info in commits_data:
            author = commit_info.get('author')
            if not author or not author.get('login'):
                continue
            
            username = author['login']
            if username not in developers:
                developers[username] = DeveloperMetrics(
                    username=username,
                    name=commit_info.get('commit', {}).get('author', {}).get('name', username)
                )
            
            dev = developers[username]
            dev.commits += 1
            dev.repos_contributed.add(commit_info.get('repo', 'unknown'))
            
            commit_date_str = commit_info.get('commit', {}).get('author', {}).get('date')
            if commit_date_str:
                commit_date = datetime.fromisoformat(commit_date_str.replace('Z', '+00:00')).replace(tzinfo=None)
                dev.commit_dates.append(commit_date)
                
                if not dev.last_commit_date or commit_date > dev.last_commit_date:
                    dev.last_commit_date = commit_date
                if not dev.first_commit_date or commit_date < dev.first_commit_date:
                    dev.first_commit_date = commit_date
            
            # Líneas de código del commit
            stats = commit_info.get('stats', {})
            dev.lines_added += stats.get('additions', 0)
            dev.lines_deleted += stats.get('deletions', 0)
        
        return developers
    
    def get_inactive_developers(self, developers: Dict[str, DeveloperMetrics], threshold: int = 7) -> List[DeveloperMetrics]:
        """Retorna desarrolladores inactivos por más de X días"""
        return [dev for dev in developers.values() if dev.days_since_last_commit > threshold]
    
    def get_ranking_by_commits(self, developers: Dict[str, DeveloperMetrics]) -> List[DeveloperMetrics]:
        """Ranking por cantidad de commits"""
        return sorted(developers.values(), key=lambda x: x.commits, reverse=True)
    
    def get_ranking_by_lines(self, developers: Dict[str, DeveloperMetrics]) -> List[DeveloperMetrics]:
        """Ranking por líneas de código (agregadas + eliminadas)"""
        return sorted(developers.values(), 
                     key=lambda x: x.lines_added + x.lines_deleted, reverse=True)
    
    def get_summary_stats(self, developers: Dict[str, DeveloperMetrics]) -> Dict[str, Any]:
        """Estadísticas generales del equipo"""
        if not developers:
            return {}
        
        total_commits = sum(d.commits for d in developers.values())
        total_lines = sum(d.lines_added + d.lines_deleted for d in developers.values())
        inactive_count = sum(1 for d in developers.values() if d.is_inactive)
        
        return {
            'total_developers': len(developers),
            'total_commits': total_commits,
            'total_lines_added': sum(d.lines_added for d in developers.values()),
            'total_lines_deleted': sum(d.lines_deleted for d in developers.values()),
            'total_lines_changed': total_lines,
            'inactive_developers': inactive_count,
            'avg_commits_per_dev': total_commits / len(developers) if developers else 0,
            'period_days': self.days_back
        }
