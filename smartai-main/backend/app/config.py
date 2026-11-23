"""Application settings loaded from environment variables (.env file)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o-mini"

    # Google Gemini
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"

    # CORS: allowed frontend origin(s), comma-separated
    frontend_origin: str = "http://localhost:5173,http://127.0.0.1:5173"

    # How long we wait for an AI provider before giving up (seconds)
    request_timeout_seconds: int = 30

    # Rate limit for POST /api/chat: at most N requests per window, per client IP
    rate_limit_requests: int = 20
    rate_limit_window_seconds: int = 60

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    """Create the settings object once and reuse it."""
    return Settings()