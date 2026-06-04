"""Application settings loaded from environment variables / .env file."""

from __future__ import annotations

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database — asyncpg requires the +asyncpg driver prefix
    database_url: str = "postgresql+asyncpg://prune:prune@localhost:5432/prune_ai"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # Supabase Auth
    supabase_url: str = ""
    supabase_jwt_secret: str = ""

    # AI
    anthropic_api_key: str = ""
    openai_api_key: str = ""
    voyage_api_key: str = ""

    # Pinecone
    pinecone_api_key: str = ""
    pinecone_index: str = "prune"

    # WhatsApp Cloud API
    whatsapp_verify_token: str = ""
    whatsapp_access_token: str = ""
    whatsapp_phone_number_id: str = ""
    # Meta App Secret — used to validate X-Hub-Signature-256 on inbound webhooks
    whatsapp_app_secret: str = ""

    # Safaricom Daraja (M-Pesa)
    daraja_consumer_key: str = ""
    daraja_consumer_secret: str = ""
    daraja_passkey: str = ""
    daraja_shortcode: str = ""
    daraja_callback_url: str = "https://api.prune.ai/v1/webhooks/mpesa/stk-callback"
    daraja_env: str = "sandbox"

    @property
    def async_database_url(self) -> str:
        """Ensure the URL uses the asyncpg driver prefix."""
        url = self.database_url
        if url.startswith("postgresql://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url


settings = Settings()
