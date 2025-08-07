"""Configuration management for the application."""

from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict
from dotenv import load_dotenv

# Load environment variables
load_dotenv()


class AIConfig(BaseSettings):
    """AI provider configuration settings."""

    model_config = SettingsConfigDict(env_prefix="")

    gemini_api_key: str = Field(default="", description="Google Gemini API key")
    gemini_model: str = Field(
        default="gemini-2.5-flash-lite", description="Gemini model to use"
    )
    default_provider: str = Field(default="gemini", description="Default AI provider")
    enable_usage_tracking: bool = Field(
        default=True, description="Enable AI usage tracking"
    )


class ImageConfig(BaseSettings):
    """Image processing configuration settings."""

    model_config = SettingsConfigDict(env_prefix="")

    max_image_size_mb: int = Field(default=10, description="Maximum image size in MB")
    max_ai_image_size_kb: int = Field(
        default=500, description="Maximum AI image size in KB"
    )
    image_compression_quality: int = Field(
        default=85, description="Image compression quality"
    )
    supported_formats: List[str] = Field(
        default=["image/jpeg", "image/png", "image/webp"],
        description="Supported image formats",
    )
    storage_bucket_name: str = Field(
        default="task-images", description="Supabase storage bucket name for images"
    )


class DatabaseConfig(BaseSettings):
    """Database configuration settings."""

    model_config = SettingsConfigDict(env_prefix="")

    # Try multiple possible database URL environment variables
    # Railway might use DATABASE_URL or DATABASE_PRIVATE_URL
    database_url: str = Field(default="", description="Database connection URL", alias="DATABASE_URL")
    database_private_url: str = Field(default="", description="Private database URL", alias="DATABASE_PRIVATE_URL")
    pool_size: int = Field(default=10, description="Connection pool size")
    max_overflow: int = Field(default=20, description="Maximum pool overflow")
    pool_pre_ping: bool = Field(default=True, description="Enable pool pre-ping")
    echo: bool = Field(default=False, description="Enable SQL logging")


class AppConfig(BaseSettings):
    """Main application configuration."""

    model_config = SettingsConfigDict()

    # Existing Supabase config
    supabase_url: str = Field(default="", description="Supabase project URL")
    supabase_key: str = Field(default="", description="Supabase anon key")

    # Default locations for new users
    default_locations: List[str] = Field(
        default=["Kitchen", "Bedroom", "Garden", "Bathroom"],
        description="Default location names for new users",
    )


# Global configuration instances
app_config = AppConfig()
ai_config = AIConfig()
image_config = ImageConfig()
database_config = DatabaseConfig()


# Backward compatibility wrapper
class Config:
    """Backward compatibility configuration wrapper."""

    def __init__(self):
        self.supabase_url = app_config.supabase_url
        self.supabase_key = app_config.supabase_key
        self.ai = ai_config
        self.image = image_config
        self.database = database_config


# Global configuration instance
config = Config()
