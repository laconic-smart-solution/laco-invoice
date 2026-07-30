"""Runtime settings for tiktok-shop-scrape."""

from __future__ import annotations

from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR: Path = Path(__file__).resolve().parent


class Settings(BaseSettings):
    """Env-backed settings."""

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    tiktok_scrape_port: int = 8090
    gateway_secret: str = "hello"
    tiktok_seller_center_url: str = "https://seller-th.tiktok.com"
    # Partner / agency console — login here first, then switch into a seller shop
    tiktok_partner_center_url: str = "https://partner.tiktokshop.com"
    # laco-invoice base URL — sessions are stored in Oracle (tiktok_seller_sessions)
    laco_invoice_url: str = "http://localhost:8091"
    playwright_headless: bool = True


def get_settings() -> Settings:
    """Load settings (call per request / startup; cheap)."""
    (BASE_DIR / "session").mkdir(parents=True, exist_ok=True)
    return Settings()
