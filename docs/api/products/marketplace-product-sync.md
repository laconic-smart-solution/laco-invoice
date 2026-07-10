# Marketplace Product Sync API

Background sync that imports marketplace products into the laco-invoice database. Triggered by **Sync Now** on the products page.

## Architecture

```text
POST /api/v1/marketplace-products/sync
  → Spring Batch job (async)
    1. listUpsertStep     — paginate gateway product list, upsert list fields
    2. detailEnrichStep   — fetch product detail per row (4 threads), update description/images/variants
    3. softDisableStep    — set is_enable = 0 for rows not touched in this run
  → marketplace_product_sync_runs (status + counters)
```

List and detail read APIs always serve from the database after sync. The gateway is only called during the batch job.

Upsert key: `(store_id, marketplace_code, external_product_id, sku)`

---

## Endpoints

### `POST /api/v1/marketplace-products/sync`

Starts an async sync job for one connected store source.

**Authorization:** Owner of the store or Admin

#### Query parameters

| Parameter | Required | Description |
|-----------|----------|-------------|
| `storeId` | Yes | laco-invoice store ID |
| `marketplaceCode` | Yes | `LAZADA`, `SHOPEE`, or `TIKTOK` |

#### Example request

```http
POST /api/v1/marketplace-products/sync?storeId=21&marketplaceCode=LAZADA
Cookie: laco_invoice_access_token=...
```

#### Success response `200`

```json
{
  "success": true,
  "code": 200,
  "message": "Sync started",
  "data": {
    "id": 15,
    "storeId": 21,
    "marketplaceCode": "LAZADA",
    "status": "RUNNING",
    "insertedCount": 0,
    "updatedCount": 0,
    "disabledCount": 0,
    "failedCount": 0,
    "errorMessage": null,
    "startedAt": "2026-07-06T03:30:00Z",
    "completedAt": null
  }
}
```

Returns `409` or business error if a sync is already `RUNNING` for the same store + marketplace.

---

### `GET /api/v1/marketplace-products/sync/{syncRunId}`

Poll sync job progress. Client should refetch every ~2 seconds until `status` is `COMPLETED` or `FAILED`.

#### Path parameters

| Parameter | Description |
|-----------|-------------|
| `syncRunId` | Sync run ID from `POST /sync` |

#### Sync status values

| Status | Meaning |
|--------|---------|
| `RUNNING` | Job in progress |
| `COMPLETED` | Finished successfully |
| `FAILED` | Job failed (see `errorMessage`) |

#### Counters

| Field | Description |
|-------|-------------|
| `insertedCount` | New products created |
| `updatedCount` | Existing products updated |
| `disabledCount` | Products soft-disabled (delisted since last sync) |
| `failedCount` | Detail enrichment failures (per-item, non-fatal) |

---

## Batch job steps

### 1. List upsert

- Reader: paginated gateway product list via marketplace adapter
- Writer: hybrid persistence — native SQL `UPDATE` for existing rows, JPA `save` for inserts
- Chunk size: 50
- One transaction per chunk

### 2. Detail enrich

- Reader: DB products for this store/marketplace/sync run
- Processor: gateway product detail → native SQL update of `description`, `images_json`, `variants_json`
- Thread pool: 4 workers
- Chunk size: 10
- Per-item failures increment `failedCount` without aborting the job

### 3. Soft disable

- Native SQL: `is_enable = 0` where `last_synced_at < syncStartedAt` for the store/marketplace

---

## Sources endpoint (sync metadata)

`GET /api/v1/marketplace-products/sources` includes per-source sync metadata:

| Field | Description |
|-------|-------------|
| `lastSyncedAt` | Completed time of latest sync run (or started time if still running) |
| `syncStatus` | Latest run status: `RUNNING`, `COMPLETED`, `FAILED`, or `null` if never synced |

---

## Related code

| Layer | Location |
|-------|----------|
| Controller | `server/.../MarketplaceProductController.java` |
| Sync service | `server/.../MarketplaceProductSyncService.java` |
| Batch config | `server/.../sync/MarketplaceProductSyncBatchConfig.java` |
| Persistence | `server/.../MarketplaceProductPersistenceService.java` |
| Product repository | `server/.../ProductRepository.java` (native upsert queries) |
