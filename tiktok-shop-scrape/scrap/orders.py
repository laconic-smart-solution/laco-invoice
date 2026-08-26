"""Scrape / intercept TikTok Shop Seller Center orders into marketplace contract shape."""

from __future__ import annotations

import json
import logging
import re
from datetime import datetime, timezone
from typing import Any

from models import Order, OrderItem, OrderListData
from scrap import SessionNotFoundError, browser_page, seller_center_base

logger = logging.getLogger(__name__)

# Seller Center often loads order lists via XHR. Capture JSON bodies that look like orders.
_ORDER_URL_HINTS: tuple[str, ...] = (
    "order",
    "orders",
    "trade",
    "fulfillment",
)


def _looks_like_order_payload(url: str, body: Any) -> bool:
    lowered = url.lower()
    if not any(hint in lowered for hint in _ORDER_URL_HINTS):
        return False
    if isinstance(body, dict):
        for key in ("orders", "order_list", "data", "list"):
            if key in body:
                return True
    return isinstance(body, list)


def _as_list(payload: Any) -> list[dict[str, Any]]:
    if isinstance(payload, list):
        return [x for x in payload if isinstance(x, dict)]
    if not isinstance(payload, dict):
        return []
    for key in ("orders", "order_list", "list", "items"):
        value = payload.get(key)
        if isinstance(value, list):
            return [x for x in value if isinstance(x, dict)]
    data = payload.get("data")
    if isinstance(data, list):
        return [x for x in data if isinstance(x, dict)]
    if isinstance(data, dict):
        for key in ("orders", "order_list", "list", "items"):
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


def _ordered_at(raw: Any) -> str | None:
    if raw is None or raw == "":
        return None
    if isinstance(raw, (int, float)):
        ts = int(raw)
        if ts > 1_000_000_000_000:
            ts //= 1000
        return datetime.fromtimestamp(ts, tz=timezone.utc).isoformat().replace("+00:00", "Z")
    text = str(raw).strip()
    if re.fullmatch(r"\d{10,13}", text):
        return _ordered_at(int(text))
    return text


def _map_order(raw: dict[str, Any]) -> Order | None:
    order_id = _pick(
        raw,
        "order_id",
        "orderId",
        "id",
        "main_order_id",
        "order_sn",
        "external_order_id",
    )
    if not order_id:
        return None

    line_raw = raw.get("item_list") or raw.get("sku_list") or raw.get("order_line_list") or raw.get("items") or []
    items: list[OrderItem] = []
    if isinstance(line_raw, list):
        for line in line_raw:
            if not isinstance(line, dict):
                continue
            price = _pick(line, "sale_price", "sku_sale_price", "price", "unit_price", default="0")
            qty_raw = line.get("quantity") or line.get("sku_quantity") or line.get("qty") or 1
            try:
                qty = int(qty_raw)
            except (TypeError, ValueError):
                qty = 1
            items.append(
                OrderItem(
                    sku=_pick(line, "seller_sku", "sku", "sku_id", "product_id"),
                    product_name=_pick(line, "product_name", "sku_name", "name"),
                    price=price,
                    quantity=max(qty, 1),
                    line_total=_pick(line, "line_total", "sku_total_price", default=price),
                    currency=_pick(line, "currency") or None,
                    buyer_id=_pick(line, "buyer_id", "user_id") or None,
                )
            )

    recipient = raw.get("recipient_address") or raw.get("shipping_address") or {}
    if not isinstance(recipient, dict):
        recipient = {}

    return Order(
        external_order_id=order_id,
        status=_pick(raw, "order_status", "status", "display_status"),
        total_amount=_pick(
            raw,
            "payment_total",
            "total_amount",
            "pay_amount",
            "order_amount",
            default="0",
        ),
        currency=_pick(raw, "currency", "payment_currency", default="THB"),
        ordered_at=_ordered_at(
            raw.get("create_time")
            or raw.get("created_at")
            or raw.get("order_create_time")
            or raw.get("ordered_at")
        ),
        customer_name=_pick(recipient, "name", "recipient_name")
        or _pick(raw, "buyer_nickname", "customer_name"),
        customer_email=_pick(raw, "buyer_email", "customer_email"),
        customer_phone=_pick(recipient, "phone", "phone_number", "mobile")
        or _pick(raw, "customer_phone"),
        customer_address=_pick(recipient, "full_address", "address_detail", "address")
        or _pick(raw, "customer_address"),
        external_customer_id=_pick(raw, "user_id", "buyer_id", "external_customer_id"),
        items=items,
    )


def _dedupe(orders: list[Order]) -> list[Order]:
    seen: set[str] = set()
    out: list[Order] = []
    for order in orders:
        if order.external_order_id in seen:
            continue
        seen.add(order.external_order_id)
        out.append(order)
    return out


async def scrape_orders(
    seller_id: str,
    *,
    page: int = 1,
    limit: int = 20,
    updated_from: str | None = None,
) -> OrderListData:
    """Open Seller Center orders UI, intercept JSON, map to contract orders.

    DOM selectors vary by region/UI version; network interception is the primary path.
    When no XHR payloads are captured, returns an empty list (not an error) so callers
    can still complete sync; check logs / selectors after Seller Center UI changes.
    """
    del updated_from  # reserved for future filter once payload shape is stable
    captured: list[dict[str, Any]] = []

    async def on_response(response: Any) -> None:
        try:
            url = response.url
            ctype = (response.headers or {}).get("content-type", "")
            if "json" not in ctype.lower() and "javascript" not in ctype.lower():
                # Still try JSON parse for APIs that omit content-type
                pass
            body = await response.json()
        except Exception:
            return
        if _looks_like_order_payload(url, body):
            captured.extend(_as_list(body))
            logger.info("Captured order-like payload from %s (%s rows)", url, len(_as_list(body)))

    try:
        async with browser_page(seller_id) as browser_tab:
            browser_tab.on("response", on_response)
            base = seller_center_base()
            # Common Seller Center order list routes (region-dependent).
            candidates = [
                f"{base}/order",
                f"{base}/order/list",
                f"{base}/orders",
                f"{base}/homepage",
            ]
            for url in candidates:
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
        raise RuntimeError(f"TikTok scrape failed for seller_id={seller_id}: {exc}") from exc

    mapped = [o for o in (_map_order(raw) for raw in captured) if o is not None]
    mapped = _dedupe(mapped)
    # Newest-ish first when create_time present in ordered_at
    mapped.sort(key=lambda o: o.ordered_at or "", reverse=True)

    start = max(page - 1, 0) * max(limit, 1)
    end = start + max(limit, 1)
    page_items = mapped[start:end]
    return OrderListData(items=page_items, total=len(mapped))
