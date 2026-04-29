import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any
from config import Config

class GitHubClient:
    def __init__(self):
        self.token = Config.GITHUB_TOKEN
        self.org = Config.GITHUB_ORG
        self.headers = {
            'Authorization': f'token {self.token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        self.base_url = 'https://api.github.com'
    
    def get_org_repositories(self) -> List[Dict]:
        """Obtiene todos los repositorios del usuario u organización"""
        repos = []
        page = 1
        # Intentar como organización primero, si falla intentar como usuario
        urls_to_try = [
            f'{self.base_url}/orgs/{self.org}/repos',
            f'{self.base_url}/users/{self.org}/repos'
        ]
        
        for url in urls_to_try:
            try:
                while True:
                    params = {'page': page, 'per_page': 100, 'type': 'all'}
                    response = requests.get(url, headers=self.headers, params=params)
                    if response.status_code == 404:
                        break  # Probar siguiente URL
                    response.raise_for_status()
                    data = response.json()
                    if not data:
                        return repos
                    repos.extend(data)
                    page += 1
                if repos:
                    return repos
            except requests.exceptions.HTTPError:
                continue
        
        return repos
    
    def get_branches(self, repo_name: str) -> List[str]:
        """Obtiene todas las ramas de un repositorio"""
        branches = []
        page = 1
        while True:
            url = f'{self.base_url}/repos/{self.org}/{repo_name}/branches'
            params = {'page': page, 'per_page': 100}
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 404 or response.status_code == 409:
                break
            response.raise_for_status()
            data = response.json()
            if not data:
                break
            branches.extend([b['name'] for b in data])
            page += 1
        return branches
    
    def get_commits(self, repo_name: str, since: datetime, until: datetime, branch: str = None) -> List[Dict]:
        """Obtiene commits de un repositorio en un rango de fechas"""
        commits = []
        page = 1
        while True:
            url = f'{self.base_url}/repos/{self.org}/{repo_name}/commits'
            params = {
                'page': page,
                'per_page': 100,
                'since': since.isoformat(),
                'until': until.isoformat()
            }
            if branch:
                params['sha'] = branch
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code == 409:  # Repo vacío
                break
            response.raise_for_status()
            data = response.json()
            if not data:
                break
            commits.extend(data)
            page += 1
        return commits
    
    def get_commits_from_all_branches(self, repo_name: str, since: datetime, until: datetime) -> List[Dict]:
        """Obtiene commits de todas las ramas del repositorio"""
        # Obtener todas las ramas
        branches = self.get_branches(repo_name)
        
        if not branches:
            # Si no hay ramas, intentar sin especificar (rama default)
            return self.get_commits(repo_name, since, until)
        
        # Usar un diccionario para evitar duplicados por SHA
        all_commits = {}
        
        for branch in branches:
            try:
                commits = self.get_commits(repo_name, since, until, branch)
                for commit in commits:
                    sha = commit['sha']
                    # Solo agregar si no existe o si esta versión tiene más info
                    if sha not in all_commits:
                        all_commits[sha] = commit
            except Exception:
                # Ignorar ramas que no se pueden acceder
                continue
        
        return list(all_commits.values())
    
    def get_commit_details(self, repo_name: str, sha: str) -> Dict:
        """Obtiene detalles de un commit (líneas agregadas/eliminadas)"""
        url = f'{self.base_url}/repos/{self.org}/{repo_name}/commits/{sha}'
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def get_contributors(self, repo_name: str) -> List[Dict]:
        """Obtiene lista de contribuidores del repositorio"""
        url = f'{self.base_url}/repos/{self.org}/{repo_name}/contributors'
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
