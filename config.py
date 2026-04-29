import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
    GITHUB_ORG = os.getenv('GITHUB_ORG')
    NOTION_TOKEN = os.getenv('NOTION_TOKEN')
    NOTION_DATABASE_ID = os.getenv('NOTION_DATABASE_ID')
    DAYS_BACK = int(os.getenv('DAYS_BACK', 7))
    INACTIVITY_THRESHOLD_DAYS = int(os.getenv('INACTIVITY_THRESHOLD_DAYS', 7))
    
    @classmethod
    def validate(cls):
        missing = []
        for attr in ['GITHUB_TOKEN', 'GITHUB_ORG', 'NOTION_TOKEN', 'NOTION_DATABASE_ID']:
            if not getattr(cls, attr):
                missing.append(attr)
        if missing:
            raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
