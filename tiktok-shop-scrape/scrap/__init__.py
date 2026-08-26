"""Playwright browser helpers using stored seller sessions."""

from __future__ import annotations

import json
import tempfile
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from config import get_settings
from db import get_session


class SessionNotFoundError(RuntimeError):
    """Raised when no Playwright session exists for the seller."""


@asynccontextmanager
async def browser_page(seller_id: str) -> AsyncIterator[Any]:
    """Yield a Playwright page restored from the DB storage_state.

    Args:
        seller_id: TikTok shop / seller id key used at login time.
    """
    row = get_session(seller_id)
    if row is None or not row.storage_state_json.strip():
        raise SessionNotFoundError(
            f"No scrape session for seller_id={seller_id}. "
            "Run: python login.py --seller-id " + seller_id + " "
            "(requires laco-invoice running with matching GATEWAY_SECRET / LACO_INVOICE_URL)"
        )

    try:
        from playwright.async_api import async_playwright
    except ImportError as exc:
        raise RuntimeError(
            "playwright is required. Run: pip install playwright && playwright install chromium"
        ) from exc

    settings = get_settings()
    with tempfile.TemporaryDirectory(prefix="tiktok-scrape-") as tmp:
        state_path = Path(tmp) / "storage_state.json"
        # Validate JSON before writing
        json.loads(row.storage_state_json)
        state_path.write_text(row.storage_state_json, encoding="utf-8")

        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(headless=settings.playwright_headless)
            context = await browser.new_context(storage_state=str(state_path))
            page = await context.new_page()
            try:
                yield page
            finally:
                await context.close()
                await browser.close()


def seller_center_base() -> str:
    """Normalized Seller Center origin (no trailing slash)."""
    return get_settings().tiktok_seller_center_url.rstrip("/")
