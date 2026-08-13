from functools import lru_cache
from urllib.parse import quote_plus

from pydantic import SecretStr, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )

    database_url: str | None = None
    db_host: str | None = None
    db_port: int = 5432
    db_name: str = "incluseon"
    db_user: str = "incluseon"
    db_password: SecretStr | None = None
    secret_key: SecretStr
    openai_api_key: SecretStr
    environment: str = "development"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    algorithm: str = "HS256"
    cors_origins: str = "http://localhost:5173"
    allowed_hosts: str = "localhost,127.0.0.1,testserver"
    redis_url: str = "redis://localhost:6379/0"
    reports_directory: str = "generated_reports"
    storage_backend: str = "local"
    s3_bucket: str | None = None
    s3_region: str = "sa-east-1"
    s3_endpoint_url: str | None = None
    frontend_url: str = "http://localhost:5173"
    ses_from_email: str | None = None
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_from_email: str | None = None
    debug: bool = False
    cookie_secure: bool = False
    cookie_domain: str | None = None
    access_cookie_name: str = "incluseon_access"
    refresh_cookie_name: str = "incluseon_refresh"
    sentry_dsn: SecretStr | None = None
    max_request_size_mb: int = 10
    log_level: str = "INFO"
    pilot_demo_mode: bool = False
    self_registration_enabled: bool = False
    google_client_id: str | None = None

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

    @property
    def trusted_hosts(self) -> list[str]:
        return [host.strip() for host in self.allowed_hosts.split(",") if host.strip()]

    @property
    def is_production(self) -> bool:
        return self.environment.lower() == "production"

    @model_validator(mode="after")
    def validate_production_settings(self):
        if not self.database_url:
            if not self.db_host or not self.db_password:
                raise ValueError("DATABASE_URL ou DB_HOST/DB_PASSWORD devem ser configurados")
            password = quote_plus(self.db_password.get_secret_value())
            self.database_url = (
                f"postgresql+asyncpg://{self.db_user}:{password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}"
            )
        elif self.database_url.startswith("postgresql://"):
            self.database_url = self.database_url.replace(
                "postgresql://", "postgresql+asyncpg://", 1
            )
        if not self.is_production:
            return self

        secret = self.secret_key.get_secret_value()
        if len(secret) < 32 or secret in {"generate-a-long-random-secret", "change-me"}:
            raise ValueError("SECRET_KEY deve ter ao menos 32 caracteres aleatórios em produção")
        if self.debug:
            raise ValueError("DEBUG deve ser false em produção")
        if not self.cookie_secure:
            raise ValueError("COOKIE_SECURE deve ser true em produção")
        if any("localhost" in origin for origin in self.allowed_origins):
            raise ValueError("CORS_ORIGINS não pode conter localhost em produção")
        if not self.trusted_hosts or "*" in self.trusted_hosts:
            raise ValueError("ALLOWED_HOSTS deve listar os hosts de produção")
        if self.storage_backend == "s3" and not self.s3_bucket:
            raise ValueError("S3_BUCKET é obrigatório quando STORAGE_BACKEND=s3")
        if self.storage_backend not in {"local", "s3"}:
            raise ValueError("STORAGE_BACKEND deve ser local ou s3")
        smtp_values = (
            self.smtp_host,
            self.smtp_username,
            self.smtp_password,
            self.smtp_from_email,
        )
        if not self.ses_from_email and not all(smtp_values):
            raise ValueError(
                "Configure SES_FROM_EMAIL ou SMTP_HOST/SMTP_USERNAME/"
                "SMTP_PASSWORD/SMTP_FROM_EMAIL em produção"
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
