"""FastAPI service exposing marketplace contract via Playwright scrape.

Temporary bridge until TikTok Partner Open API is ready.
Compatible with laco-invoice TikTokServiceClient when TIKTOK_SHOP_SCRAPPING=true.
"""

from __future__ import annotations

import logging
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.responses import JSONResponse

from config import get_settings
from db import get_session, init_db, list_sessions, upsert_session
from models import (
    Envelope,
    OrderListData,
    ProductListData,
    SessionMeta,
    SessionUpsertRequest,
)
from scrap import SessionNotFoundError
from scrap.orders import scrape_orders
from scrap.products import scrape_products

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("tiktok-shop-scrape")

app = FastAPI(title="tiktok-shop-scrape", version="0.1.0")


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    settings = get_settings()
    logger.info(
        "tiktok-shop-scrape ready (sessions via laco-invoice %s)",
        settings.laco_invoice_url,
    )


def require_gateway_secret(
    x_gateway_secret: Annotated[str | None, Header(alias="X-Gateway-Secret")] = None,
) -> None:
    expected = get_settings().gateway_secret
    if not expected:
        return
    if (x_gateway_secret or "").strip() != expected:
        raise HTTPException(status_code=401, detail="invalid gateway secret")


GatewayDep = Annotated[None, Depends(require_gateway_secret)]


def ok(data: object, message: str = "") -> JSONResponse:
    return JSONResponse(Envelope(success=True, message=message, data=data).model_dump())


def fail(status: int, message: str) -> JSONResponse:
    return JSONResponse(
        Envelope(success=False, message="", data=None, error=message).model_dump(),
        status_code=status,
    )


@app.get("/api/v1/healthz")
def healthz() -> JSONResponse:
    return ok({"status": "ok", "service": "tiktok-shop-scrape"})


@app.get("/api/v1/orders")
async def list_orders(
    _: GatewayDep,
    access_token: str = Query(..., description="Ignored in scrape mode; required for contract compat"),
    seller_id: str | None = Query(None),
    shop_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    updated_from: str | None = Query(None),
) -> JSONResponse:
    del access_token
    key = (seller_id or shop_id or "").strip()
    if not key:
        return fail(400, "seller_id (or shop_id) is required for scrape mode")
    try:
        data: OrderListData = await scrape_orders(
            key, page=page, limit=limit, updated_from=updated_from
        )
        return ok(data.model_dump())
    except SessionNotFoundError as exc:
        return fail(400, str(exc))
    except Exception as exc:
        logger.exception("list_orders failed")
        return fail(502, str(exc))


@app.get("/api/v1/products")
async def list_products(
    _: GatewayDep,
    access_token: str = Query(...),
    seller_id: str | None = Query(None),
    shop_id: str | None = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str | None = Query(None),
) -> JSONResponse:
    del access_token
    key = (seller_id or shop_id or "").strip()
    if not key:
        return fail(400, "seller_id (or shop_id) is required for scrape mode")
    try:
        data: ProductListData = await scrape_products(
            key, page=page, limit=limit, search=search
        )
        return ok(data.model_dump())
    except SessionNotFoundError as exc:
        return fail(400, str(exc))
    except Exception as exc:
        logger.exception("list_products failed")
        return fail(502, str(exc))


@app.get("/api/v1/products/{external_product_id}")
async def get_product(
    external_product_id: str,
    _: GatewayDep,
    access_token: str = Query(...),
    seller_id: str | None = Query(None),
    shop_id: str | None = Query(None),
) -> JSONResponse:
    """Best-effort detail: list products and pick by id."""
    key = (seller_id or shop_id or "").strip()
    if not key:
        return fail(400, "seller_id (or shop_id) is required for scrape mode")
    try:
        data = await scrape_products(key, page=1, limit=100)
        match = next(
            (p for p in data.items if p.external_product_id == external_product_id),
            None,
        )
        if match is None:
            return fail(404, f"product {external_product_id} not found in scrape results")
        return ok(match.model_dump())
    except SessionNotFoundError as exc:
        return fail(400, str(exc))
    except Exception as exc:
        logger.exception("get_product failed")
        return fail(502, str(exc))


@app.post("/api/v1/sessions")
def upsert_seller_session(
    body: SessionUpsertRequest,
    _: GatewayDep,
) -> JSONResponse:
    """Store Playwright storage_state JSON for a seller (also used by login.py)."""
    if not body.seller_id.strip() or not body.storage_state_json.strip():
        return fail(400, "seller_id and storage_state_json are required")
    row = upsert_session(
        body.seller_id.strip(),
        body.storage_state_json,
        display_name=body.display_name,
    )
    return ok(
        SessionMeta(
            seller_id=row.seller_id,
            display_name=row.display_name,
            updated_at=row.updated_at.isoformat() if row.updated_at else None,
        ).model_dump()
    )


@app.get("/api/v1/sessions")
def get_sessions(_: GatewayDep) -> JSONResponse:
    rows = list_sessions()
    return ok(
        [
            SessionMeta(
                seller_id=r.seller_id,
                display_name=r.display_name,
                updated_at=r.updated_at.isoformat() if r.updated_at else None,
            ).model_dump()
            for r in rows
        ]
    )


@app.get("/api/v1/sessions/{seller_id}")
def get_seller_session(seller_id: str, _: GatewayDep) -> JSONResponse:
    row = get_session(seller_id)
    if row is None:
        return fail(404, f"no session for seller_id={seller_id}")
    return ok(
        {
            "seller_id": row.seller_id,
            "display_name": row.display_name,
            "updated_at": row.updated_at.isoformat() if row.updated_at else None,
            "storage_state_json": row.storage_state_json,
        }
    )


# Scrape mode does not support Partner OAuth; return clear errors for invoice callers.
@app.get("/api/v1/stores/authorize-url")
def authorize_url(_: GatewayDep) -> JSONResponse:
    return fail(
        501,
        "Scrape mode has no OAuth authorize URL. Run python login.py --seller-id <id>, "
        "then create a TikTok connection with that external_seller_id.",
    )


@app.post("/api/v1/stores/connect")
def connect(_: GatewayDep) -> JSONResponse:
    return fail(501, "Scrape mode does not support OAuth connect. Use login.py instead.")


@app.post("/api/v1/stores/refresh")
def refresh(_: GatewayDep) -> JSONResponse:
    return fail(501, "Scrape mode does not support token refresh. Re-run login.py.")
