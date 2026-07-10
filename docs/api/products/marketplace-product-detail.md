# Marketplace Product Detail API

Read-through product detail for a connected marketplace store. Used by the **View Details** action on synced marketplace products.

## Architecture

```text
React client
  → GET /api/v1/marketplace-products/detail (laco-invoice BFF)
    → MarketplaceProductAdapter (LAZADA / SHOPEE / TIKTOK)
      → communication-service GET /api/v1/products/{externalProductId}
        → Lazada REST /product/item/get (LAZADA only; others stub)
```

Authentication uses the cookie-based BFF session (`withCredentials: true`). No tokens are sent from the browser to the identity server.

---

## BFF endpoint

### `GET /api/v1/marketplace-products/detail`

Returns marketplace product detail plus ERP mapping summary for the product detail page.

**Authorization:** Owner of the store or Admin (`@authz.isOwnerOrAdmin()`)

**Cookies:** `laco_invoice_access_token` (HttpOnly) or `Authorization: Bearer` for Swagger.

#### Query parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `storeId` | Yes | laco-invoice store ID |
| `marketplaceCode` | Yes | `LAZADA`, `SHOPEE`, or `TIKTOK` |
| `externalProductId` | Yes | Marketplace item ID (e.g. Lazada `item_id`) |
| `sku` | No | Seller SKU to focus variant; when omitted, first SKU is used |

#### Example request

```http
GET /api/v1/marketplace-products/detail?storeId=21&marketplaceCode=LAZADA&externalProductId=2384719201&sku=HMG4
Cookie: laco_invoice_access_token=...
```

#### Success response `200`

```json
{
  "success": true,
  "code": 200,
  "message": "OK",
  "data": {
    "storeId": 21,
    "storeName": "new",
    "marketplaceCode": "LAZADA",
    "marketplaceName": "Lazada",
    "externalProductId": "2384719201",
    "sku": "HMG4",
    "name": "เคสีใหม่: 038 (Soft Nude)",
    "description": "Product description from marketplace",
    "price": "1490.00",
    "currency": "THB",
    "status": "active",
    "images": [
      "https://example.lazada.co.th/image-1.jpg"
    ],
    "variants": [
      {
        "sku": "HMG4",
        "price": "1490.00",
        "currency": "THB",
        "status": "active",
        "quantity": "12"
      },
      {
        "sku": "HMG5",
        "price": "1590.00",
        "currency": "THB",
        "status": "active",
        "quantity": "4"
      }
    ],
    "erp": {
      "status": "SYNCED",
      "localProductId": null,
      "erpItemId": null,
      "erpSku": "HMG4",
      "erpName": null,
      "mappedAt": null
    }
  }
}
```

#### Error responses

| HTTP | When |
|------|------|
| `401` | Missing or expired session |
| `403` | User is not store owner/admin |
| `404` | Store, connection, or product not found |
| `502` | Marketplace gateway/vendor error |

---

## Response fields

### Product (`data`)

| Field | Type | Description |
|-------|------|-------------|
| `storeId` | number | laco-invoice store ID |
| `storeName` | string | Store display name |
| `marketplaceCode` | string | `LAZADA`, `SHOPEE`, `TIKTOK` |
| `marketplaceName` | string | Human-readable marketplace name |
| `externalProductId` | string | Marketplace item ID |
| `sku` | string | Focused SKU (from query or first variant) |
| `name` | string | Product title |
| `description` | string | Marketplace description (when available) |
| `price` | string | Price for focused SKU |
| `currency` | string | e.g. `THB` |
| `status` | string | Marketplace status |
| `images` | string[] | Product image URLs |
| `variants` | object[] | All SKU variants for the item |
| `erp` | object | ERP mapping summary (see below) |

### Variant (`variants[]`)

| Field | Type | Description |
|-------|------|-------------|
| `sku` | string | Seller SKU |
| `price` | string | Variant price |
| `currency` | string | Currency code |
| `status` | string | Variant status |
| `quantity` | string | Stock quantity when vendor provides it |

### ERP (`erp`)

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `SYNCED` or `UNMAPPED` |
| `localProductId` | number \| null | laco-invoice `products.id` when linked |
| `erpItemId` | number \| null | Linked ERP item ID |
| `erpSku` | string \| null | ERP SKU when synced |
| `erpName` | string \| null | ERP item name when synced |
| `mappedAt` | string \| null | ISO-8601 mapping timestamp |

> **Note:** ERP fields are currently **placeholder** on the BFF until marketplace products are linked to persisted `products` / `product_erp_mapping` records. `status` uses the same deterministic placeholder as the list page.

---

## Communication-service endpoint

### `GET /api/v1/products/{externalProductId}`

Called by laco-invoice server-to-server through the gateway.

**Headers**

| Header | Required |
|--------|----------|
| `X-Gateway-Secret` | Yes |
| `X-Tenant-ID` | Yes (store UUID) |

**Query parameters**

| Parameter | Required | Description |
|-----------|----------|-------------|
| `access_token` | Yes | OAuth token from `store_marketplace_connections` |
| `seller_id` | No | Lazada seller ID |
| `shop_id` | No | Shopee/TikTok shop ID |
| `sku` | No | Focus SKU |

**Gateway paths**

| Marketplace | Public path |
|-------------|-------------|
| Lazada | `/comms/lazada/api/v1/products/{externalProductId}` |
| Shopee | `/comms/shopee/api/v1/products/{externalProductId}` |
| TikTok | `/comms/tiktok/api/v1/products/{externalProductId}` |

#### Vendor response `data`

```json
{
  "external_product_id": "2384719201",
  "sku": "HMG4",
  "name": "Product name",
  "description": "Description",
  "price": "1490.00",
  "currency": "THB",
  "status": "active",
  "images": ["https://..."],
  "variants": [
    {
      "sku": "HMG4",
      "price": "1490.00",
      "currency": "THB",
      "status": "active",
      "quantity": "12"
    }
  ]
}
```

#### Vendor support

| Marketplace | Detail source | Status |
|-------------|---------------|--------|
| Lazada | `GET /product/item/get` | Implemented |
| Shopee | — | Not implemented (404) |
| TikTok | — | Not implemented (404) |

---

## Related endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/marketplace-products/sources` | Connected store sources |
| `GET` | `/api/v1/marketplace-products` | Paginated product list |
| `POST` | `/api/v1/products/{productId}/erp-mapping` | Create ERP mapping (local product) |
| `DELETE` | `/api/v1/products/{productId}/erp-mapping/{mappingId}` | Remove ERP mapping |

---

## Client usage (future)

```ts
// shared/services/marketplace-product.service.ts
export const marketplaceProductService = {
  getDetail: async (params: {
    storeId: number
    marketplaceCode: string
    externalProductId: string
    sku?: string
  }) => {
    const response = await apiClient.get<ApiResponse<MarketplaceProductDetail>>(
      "/v1/marketplace-products/detail",
      { params }
    )
    return response.data.data
  },
}
```

Route suggestion: `/products/:externalProductId?storeId=&marketplaceCode=&sku=`
