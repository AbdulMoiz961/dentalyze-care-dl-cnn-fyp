"""
Dentalyze Care Backend - Configuration
"""

import os
from pathlib import Path
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./dentalyze.db"
    
    # JWT
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Model
    MODEL_PATH: str = "./trained_models/dentex_frcnn_best.pth"
    USE_CNN_MODEL: bool = True
    
    # Gemini Fallback
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL_NAME: str = "gemini-2.5-flash-preview-04-17"
    
    # Server
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"
    UPLOAD_DIR: str = "./uploads"
    
    # App
    APP_NAME: str = "Dentalyze Care"
    MAX_HISTORY_ITEMS: int = 100

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    @property
    def model_path_resolved(self) -> Path:
        return Path(self.MODEL_PATH).resolve()

    @property
    def upload_dir_resolved(self) -> Path:
        path = Path(self.UPLOAD_DIR).resolve()
        path.mkdir(parents=True, exist_ok=True)
        return path

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
