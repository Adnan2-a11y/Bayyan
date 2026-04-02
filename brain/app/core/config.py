from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path

# Load absolute path of the brain directory for relative db resolution
BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings(BaseSettings):
    model_path: str = "all-MiniLM-L6-v2"
    vector_db_url: str = "./vector_db"
    log_level: str = "INFO"
    port: int = 8000

    # Ensure python loads this from brain/.env
    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding='utf-8',
        extra='ignore'
    )

settings = Settings()
