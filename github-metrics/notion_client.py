import requests
from typing import List, Dict, Any, Optional
from datetime import datetime
from config import Config

class NotionClient:
    def __init__(self):
        self.token = Config.NOTION_TOKEN
        self.database_id = Config.NOTION_DATABASE_ID
        self.headers = {
            'Authorization': f'Bearer {self.token}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        }
        self.base_url = 'https://api.notion.com/v1'
    
    def create_or_update_database(self, title: str = "Métricas de Desarrolladores") -> str:
        """Crea o verifica la base de datos en Notion"""
        # Notion no permite actualizar estructura fácilmente, asumimos que la DB ya existe
        # o creamos una nueva si no se proporciona ID
        if self.database_id:
            return self.database_id
        
        # Crear nueva base de datos
        url = f'{self.base_url}/databases'
        data = {
            "parent": {"page_id": "PARENT_PAGE_ID"},  # Necesita configuración manual
            "title": [{"type": "text", "text": {"content": title}}],
            "properties": {
                "Desarrollador": {"title": {}},
                "Username ": {"rich_text": {}},
                "Fecha": {"date": {}},
                "Commits": {"number": {"format": "number"}},
                "Lineas Agregadas ": {"number": {"format": "number"}},
                "Lineas Eliminadas ": {"number": {"format": "number"}},
                "Lineas Total": {"number": {"format": "number"}},
                "Repos Hoy": {"number": {"format": "number"}},
                "Total Repos Asignados": {"number": {"format": "number"}},
                "Último Commit": {"date": {}},
                "Dias Inactivo": {"number": {"format": "number"}},
                "Estado ": {"select": {
                    "options": [
                        {"name": "Activo", "color": "green"},
                        {"name": "Sin Actividad", "color": "gray"},
                        {"name": "Inactivo", "color": "red"},
                        {"name": "Alerta", "color": "yellow"}
                    ]
                }},
                "Score ": {"number": {"format": "number"}},
                "Fecha Registro": {"date": {}}
            }
        }
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()['id']
    
    def get_database_schema(self) -> Dict:
        """Obtiene el esquema de la base de datos para debug"""
        url = f'{self.base_url}/databases/{self.database_id}'
        response = requests.get(url, headers=self.headers)
        response.raise_for_status()
        return response.json()
    
    def query_database(self, filter_data: Optional[Dict] = None) -> List[Dict]:
        """Consulta registros existentes en la base de datos"""
        url = f'{self.base_url}/databases/{self.database_id}/query'
        results = []
        has_more = True
        next_cursor = None
        
        while has_more:
            data = {}
            if filter_data:
                data['filter'] = filter_data
            if next_cursor:
                data['start_cursor'] = next_cursor
            
            response = requests.post(url, headers=self.headers, json=data)
            response.raise_for_status()
            data = response.json()
            
            results.extend(data.get('results', []))
            has_more = data.get('has_more', False)
            next_cursor = data.get('next_cursor')
        
        return results
    
    def find_page_by_username(self, username: str) -> Optional[str]:
        """Busca página existente por username"""
        try:
            # Intentar con filtro de Notion API
            filter_data = {
                "property": "Username ",
                "rich_text": {"equals": username}
            }
            results = self.query_database(filter_data)
            if results:
                return results[0]['id']
        except Exception:
            # Si falla el filtro, buscar manualmente en todas las páginas
            pass
        
        # Búsqueda manual sin filtro
        try:
            all_results = self.query_database()
            for page in all_results:
                props = page.get('properties', {})
                username_prop = props.get('Username', {})
                rich_text = username_prop.get('rich_text', [])
                if rich_text and rich_text[0].get('text', {}).get('content') == username:
                    return page['id']
        except Exception:
            pass
        
        return None
    
    def create_page(self, metrics: Any, record_date: str) -> Dict:
        """Crea nueva página con métricas de desarrollador para un día específico"""
        url = f'{self.base_url}/pages'
        
        # Determinar estado basado en actividad del día
        if metrics.commits == 0:
            status = "Sin Actividad"
        else:
            status = "Activo"
        
        data = {
            "parent": {"database_id": self.database_id},
            "properties": {
                "Desarrollador": {
                    "title": [{"text": {"content": metrics.name}}]
                },
                "Username ": {
                    "rich_text": [{"text": {"content": metrics.username}}]
                },
                "Fecha": {
                    "date": {"start": record_date}
                },
                "Commits": {"number": metrics.commits},
                "Lineas Agregadas ": {"number": metrics.lines_added},
                "Lineas Eliminadas ": {"number": metrics.lines_deleted},
                "Lineas Total": {"number": metrics.lines_added + metrics.lines_deleted},
                "Repos Hoy": {"number": len(metrics.repos_contributed)},
                "Total Repos Asignados": {"number": metrics.total_assigned_repos},
                "Último Commit": {
                    "date": {"start": metrics.last_commit_date.isoformat() if metrics.last_commit_date else datetime.now().isoformat()}
                },
                "Dias Inactivo": {"number": metrics.days_since_last_commit if metrics.days_since_last_commit != float('inf') else None},
                "Estado ": {"select": {"name": status}},
                "Score ": {"number": round(metrics.activity_score, 2)}
            }
        }
        
        # Debug: mostrar datos que se envían
        print(f"         [DEBUG] Enviando: commits={metrics.commits}, repos_hoy={len(metrics.repos_contributed)}, total_repos={metrics.total_assigned_repos}")
        
        response = requests.post(url, headers=self.headers, json=data)
        
        if response.status_code not in [200, 201]:
            error_detail = response.text[:500]
            raise Exception(f"HTTP {response.status_code}: {error_detail}")
        
        response.raise_for_status()
        return response.json()
    
    def append_daily_metrics(self, developers: Dict[str, Any], record_date: str):
        """
        Registra métricas diarias en Notion.
        SIEMPRE crea nuevas filas, nunca actualiza existentes.
        """
        synced = 0
        created = 0
        errors = []
        
        print(f"   📤 Enviando {len(developers)} registros a Notion...")
        
        for username, metrics in developers.items():
            try:
                # Siempre crear nueva página (nunca actualizar)
                result = self.create_page(metrics, record_date)
                created += 1
                synced += 1
                print(f"      ✓ {username}: registrado (ID: {result.get('id', 'N/A')[:8]}...)")
            except Exception as e:
                error_msg = f"{username}: {str(e)}"
                errors.append(error_msg)
                print(f"      ✗ {error_msg}")
        
        if errors:
            print(f"   ⚠️  Errores encontrados ({len(errors)}):")
            for err in errors[:5]:  # Mostrar primeros 5 errores
                print(f"      - {err}")
        
        return {'synced': synced, 'created': created, 'errors': len(errors)}
    
    def sync_developer_metrics(self, developers: Dict[str, Any], period: str):
        """
        DEPRECATED: Usar append_daily_metrics() en su lugar.
        Mantiene compatibilidad hacia atrás pero redirige a append_daily_metrics.
        """
        return self.append_daily_metrics(developers, period)
