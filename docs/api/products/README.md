# Products API

API documentation for marketplace and ERP product features in laco-invoice.

| Document | Description |
|----------|-------------|
| [marketplace-product-detail.md](./marketplace-product-detail.md) | Product detail page — `GET /api/v1/marketplace-products/{id}` |
| [marketplace-product-sync.md](./marketplace-product-sync.md) | Sync Now job — `POST /sync`, `GET /sync/{syncRunId}` |

## Related code

| Layer | Location |
|-------|----------|
| BFF controller | `server/.../features/marketplaceproduct/MarketplaceProductController.java` |
| BFF service | `server/.../features/marketplaceproduct/MarketplaceProductService.java` |
| Sync batch | `server/.../features/marketplaceproduct/sync/` |
| Gateway contract | `communication-service/docs/marketplace-service-contract.md` |
| Lazada detail client | `communication-service/app/lazada-service/internal/client/product_detail_client.go` |
