"""Load/save TikTok seller Playwright sessions via laco-invoice Oracle DB API."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import httpx

from config import get_settings


@dataclass
class SellerSession:
    """Session row mirrored from laco-invoice tiktok_seller_sessions."""

    seller_id: str
    storage_state_json: str
    display_name: str | None = None
    updated_at: str | None = None
    id: int | None = None


class InvoiceApiError(RuntimeError):
    """Raised when laco-invoice session API fails."""


def _headers() -> dict[str, str]:
    settings = get_settings()
    return {
        "X-Gateway-Secret": settings.gateway_secret,
        "Content-Type": "application/json",
        "Accept": "application/json",
    }


def _base() -> str:
    return get_settings().laco_invoice_url.rstrip("/")


def upsert_session(
    seller_id: str,
    storage_state_json: str,
    display_name: str | None = None,
) -> SellerSession:
    """POST session into laco-invoice tiktok_seller_sessions."""
    payload: dict[str, Any] = {
        "sellerId": seller_id.strip(),
        "storageStateJson": storage_state_json,
    }
    if display_name:
        payload["displayName"] = display_name
    url = f"{_base()}/api/v1/internal/tiktok-seller-sessions"
    with httpx.Client(timeout=60.0) as client:
        response = client.post(url, headers=_headers(), json=payload)
    if response.status_code >= 400:
        raise InvoiceApiError(
            f"Failed to upsert session ({response.status_code}): {response.text}"
        )
    body = response.json()
    data = body.get("data") or {}
    return _to_session(data)


def get_session(seller_id: str) -> SellerSession | None:
    """GET session from laco-invoice; None when 404."""
    url = f"{_base()}/api/v1/internal/tiktok-seller-sessions/{seller_id.strip()}"
    with httpx.Client(timeout=60.0) as client:
        response = client.get(
            url,
            headers=_headers(),
            params={"includeStorageState": "true"},
        )
    if response.status_code == 404:
        return None
    if response.status_code >= 400:
        # ResourceNotFound may be wrapped as 404 or 500 depending on handlers
        text = response.text.lower()
        if "not found" in text:
            return None
        raise InvoiceApiError(
            f"Failed to get session ({response.status_code}): {response.text}"
        )
    body = response.json()
    if not body.get("success", True):
        return None
    data = body.get("data")
    if not data:
        return None
    return _to_session(data)


def list_sessions() -> list[SellerSession]:
    """List sessions (metadata; storage may be omitted by API)."""
    url = f"{_base()}/api/v1/internal/tiktok-seller-sessions"
    with httpx.Client(timeout=60.0) as client:
        response = client.get(
            url,
            headers=_headers(),
            params={"includeStorageState": "false"},
        )
    if response.status_code >= 400:
        raise InvoiceApiError(
            f"Failed to list sessions ({response.status_code}): {response.text}"
        )
    body = response.json()
    rows = body.get("data") or []
    return [_to_session(row) for row in rows if isinstance(row, dict)]


def init_db() -> None:
    """No-op: sessions live in laco-invoice DB (Hibernate ddl-auto creates table)."""
    return


def _to_session(data: dict[str, Any]) -> SellerSession:
    return SellerSession(
        id=data.get("id"),
        seller_id=str(data.get("sellerId") or data.get("seller_id") or ""),
        display_name=data.get("displayName") or data.get("display_name"),
        storage_state_json=str(
            data.get("storageStateJson") or data.get("storage_state_json") or ""
        ),
        updated_at=str(data.get("updatedAt") or data.get("updated_at") or "")
        or None,
    )
