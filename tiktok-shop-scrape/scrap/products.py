"""Scrape / intercept TikTok Shop products into marketplace contract shape."""

from __future__ import annotations

import logging
from typing import Any

from models import Product, ProductListData
from scrap import SessionNotFoundError, browser_page, seller_center_base

logger = logging.getLogger(__name__)

_PRODUCT_URL_HINTS: tuple[str, ...] = ("product", "products", "goods", "item")


def _as_list(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("products", "product_list", "list", "items"):
        value = payload.get(key)
        if isinstance(value, list):
            return [x for x in value if isinstance(x, dict)]
    data = payload.get("data")
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    if isinstance(data, dict):
        for key in ("products", "product_list", "list", "items"):
            value = data.get(key)
            if isinstance(value, list):
                return [x for x in value if isinstance(x, dict)]
    return []


def _pick(obj: dict[str, Any], *keys: str, default: str = "") -> str:
    for key in keys:
        value = obj.get(key)
        if value is None:
            continue
        text = str(value).strip()
        if text:
            return text
    return default


def _map_product(raw: dict[str, Any]) -> Product | None:
    product_id = _pick(raw, "product_id", "id", "item_id", "external_product_id")
    if not product_id:
        return None
    return Product(
        external_product_id=product_id,
        sku=_pick(raw, "seller_sku", "sku", "outer_id"),
        name=_pick(raw, "product_name", "name", "title"),
        price=_pick(raw, "sale_price", "price", default="0"),
        currency=_pick(raw, "currency", default="THB"),
        status=_pick(raw, "status", "product_status"),
        image_url=_pick(raw, "image_url", "main_image", "img") or None,
    )


async def scrape_products(
    seller_id: str,
    *,
    page: int = 1,
    limit: int = 20,
    search: str | None = None,
) -> ProductListData:
    """Open Seller Center product list and intercept JSON payloads."""
    del search
    captured: list[dict[str, Any]] = []

    async def on_response(response: Any) -> None:
        try:
            url = response.url.lower()
            if not any(hint in url for hint in _PRODUCT_URL_HINTS):
                return
            body = await response.json()
        except Exception:
            return
        rows = _as_list(body)
        if rows:
            captured.extend(rows)
            logger.info("Captured product-like payload from %s (%s rows)", response.url, len(rows))

    try:
        async with browser_page(seller_id) as browser_tab:
            browser_tab.on("response", on_response)
            base = seller_center_base()
            for url in (f"{base}/product", f"{base}/product/list", f"{base}/products"):
                try:
                    await browser_tab.goto(url, wait_until="networkidle", timeout=60_000)
                    await browser_tab.wait_for_timeout(2_500)
                    if captured:
                        break
                except Exception as exc:
                    logger.warning("Navigation failed for %s: %s", url, exc)
    except SessionNotFoundError:
        raise
    except Exception as exc:
        raise RuntimeError(f"TikTok product scrape failed for seller_id={seller_id}: {exc}") from exc

    mapped = [p for p in (_map_product(raw) for raw in captured) if p is not None]
    # de-dupe
    seen: set[str] = set()
    unique: list[Product] = []
    for product in mapped:
        if product.external_product_id in seen:
            continue
        seen.add(product.external_product_id)
        unique.append(product)

    start = max(page - 1, 0) * max(limit, 1)
    end = start + max(limit, 1)
    return ProductListData(items=unique[start:end], total=len(unique))
