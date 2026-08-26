"""Marketplace-contract response models (snake_case JSON)."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class Envelope(BaseModel):
    """API envelope matching communication-service utils.OK."""

    success: bool = True
    message: str = ""
    data: Any = None
    error: str | None = None


class OrderItem(BaseModel):
    sku: str = ""
    product_name: str = ""
    price: str = "0"
    quantity: int = 1
    line_total: str = "0"
    currency: str | None = None
    buyer_id: str | None = None


class Order(BaseModel):
    external_order_id: str
    status: str = ""
    total_amount: str = "0"
    currency: str = "THB"
    ordered_at: str | None = None
    customer_name: str = ""
    customer_email: str = ""
    customer_phone: str = ""
    customer_address: str = ""
    external_customer_id: str = ""
    items: list[OrderItem] = Field(default_factory=list)


class OrderListData(BaseModel):
    items: list[Order] = Field(default_factory=list)
    total: int = 0


class Product(BaseModel):
    external_product_id: str
    sku: str = ""
    name: str = ""
    price: str = "0"
    currency: str = "THB"
    status: str = ""
    image_url: str | None = None


class ProductListData(BaseModel):
    items: list[Product] = Field(default_factory=list)
    total: int = 0


class SessionUpsertRequest(BaseModel):
    seller_id: str
    storage_state_json: str
    display_name: str | None = None


class SessionMeta(BaseModel):
    seller_id: str
    display_name: str | None = None
    updated_at: str | None = None
    has_storage_state: bool = True
