from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # Database
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/atlas"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Supabase
    supabase_url: str = ""
    supabase_service_key: str = ""
    jwt_secret: str = ""

    # OpenAI
    openai_api_key: str = ""
    openai_model: str = "gpt-4o"
    openai_embedding_model: str = "text-embedding-3-large"

    # App
    app_env: str = "development"
    app_debug: bool = True
    app_secret_key: str = "change-me"
    cors_origins: list[str] = ["http://localhost:3000"]


settings = Settings()
