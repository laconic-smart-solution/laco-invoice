# Marketplace Product Detail API

Database-backed product detail for synced marketplace products. Used by the **View Details** action on the products list page.

## Architecture

```text
React client
  → GET /api/v1/marketplace-products/{id} (laco-invoice BFF)
    → products table (description, images_json, variants_json)
    → product_erp_mapping (ERP summary when linked)
```

Data is populated by the **Sync Now** Spring Batch job (list upsert + detail enrichment). Read APIs never call the marketplace gateway directly.

Authentication uses the cookie-based BFF session (`withCredentials: true`).

---

## BFF endpoint

### `GET /api/v1/marketplace-products/{id}`

Returns marketplace product detail plus ERP mapping summary for the product detail page.

**Authorization:** Owner of the store or Admin (`@authz.isOwnerOrAdmin()`)

**Cookies:** `laco_invoice_access_token` (HttpOnly) or `Authorization: Bearer` for Swagger.

#### Path parameters

| Parameter | Description |
|-----------|-------------|
| `id` | laco-invoice `products.id` (database primary key) |

#### Example request

```http
GET /api/v1/marketplace-products/1042
Cookie: laco_invoice_access_token=...
```

#### Success response `200`

```json
{
  "success": true,
  "code": 200,
  "message": "OK",
  "data": {
    "id": 1042,
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
      }
    ],
    "erp": {
      "status": "SYNCED",
      "localProductId": 1042,
      "erpItemId": 9001,
      "erpSku": "HMG4",
      "erpName": "ERP item name",
      "mappedAt": "2026-07-01T08:00:00Z"
    }
  }
}
```

#### Error responses

| HTTP | When |
|------|------|
| `401` | Missing or expired session |
| `403` | User is not store owner/admin |
| `404` | Product not found or not a marketplace product |

---

## Response fields

### Product (`data`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | number | laco-invoice `products.id` |
| `storeId` | number | laco-invoice store ID |
| `storeName` | string | Store display name |
| `marketplaceCode` | string | `LAZADA`, `SHOPEE`, `TIKTOK` |
| `marketplaceName` | string | Human-readable marketplace name |
| `externalProductId` | string | Marketplace item ID |
| `sku` | string | Seller SKU |
| `name` | string | Product title |
| `description` | string \| null | Synced from marketplace detail step |
| `price` | string | Decimal string |
| `currency` | string | e.g. `THB` |
| `status` | string | Marketplace status |
| `images` | string[] | Image URLs from `images_json` |
| `variants` | object[] | Variants from `variants_json` |
| `erp` | object | ERP mapping summary (see below) |

### Variant (`variants[]`)

| Field | Type | Description |
|-------|------|-------------|
| `sku` | string | Seller SKU |
| `price` | string | Variant price |
| `currency` | string | Currency code |
| `status` | string | Variant status |
| `quantity` | string | Stock quantity when available |

### ERP (`erp`)

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `SYNCED` or `UNMAPPED` |
| `localProductId` | number \| null | laco-invoice `products.id` when linked |
| `erpItemId` | number \| null | Linked ERP item ID |
| `erpSku` | string \| null | ERP SKU when synced |
| `erpName` | string \| null | ERP item name when synced |
| `mappedAt` | string \| null | ISO-8601 mapping timestamp |

---

## Related endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/v1/marketplace-products/sources` | Connected store sources |
| `GET` | `/api/v1/marketplace-products` | Paginated product list (DB) |
| `POST` | `/api/v1/marketplace-products/sync` | Start sync job |
| `GET` | `/api/v1/marketplace-products/sync/{syncRunId}` | Poll sync status |

See [marketplace-product-sync.md](./marketplace-product-sync.md) for sync job details.

---

## Client usage

```ts
// shared/services/marketplace-product.service.ts
export const marketplaceProductService = {
  getDetail: async (productId: number) => {
    const response = await apiClient.get<ApiResponse<MarketplaceProductDetail>>(
      `/v1/marketplace-products/${productId}`
    )
    return response.data.data
  },
}
```

Route: `/products/:productId`
