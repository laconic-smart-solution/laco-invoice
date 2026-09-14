# Laco-Invoice — Frontend vs Backend & Mock Data Audit

> Generated from a full scan of `laco-invoice/client` and `laco-invoice/server`.  
> Use this to see what the UI already calls, what is stubbed, and what exists on the server but has no screen yet.

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Frontend feature exists **and** backend API is implemented (real DB or external service) |
| 🟡 | Frontend + backend exist, but backend uses **stub / mock / optional external** data |
| 🔴 | Frontend expects something the backend does **not** fully provide (gap or bug) |
| ⚪ | Backend API exists but **no frontend UI** uses it |
| 🧪 | Dev-only mock layer (`VITE_USE_MOCK_API` or in-memory stub) |

---

## Quick summary

| Question | Answer |
|----------|--------|
| Does the main app need missing APIs for current sidebar pages? | **Mostly no** — stores, products, orders, input runs, invoices, vouchers, customers, users, profile all have matching backend endpoints. |
| Where is mock data? | **ERP lookups & voucher post** (default), **Amazon order sync**, **dev seed vouchers**, optional **full frontend mock API**, order **breadcrumb** leak. |
| Biggest real gaps | ERP live integration (`USE_ERP_API=false` by default), Amazon marketplace, some admin/store APIs unused by UI, order breadcrumb still reads mock file. |
| Backend ahead of frontend | Purchase orders, ERP items CRUD, product ERP mapping, some user/store admin endpoints. |

---

## 1. Frontend pages → API status

All paths below use base URL `{VITE_API_BASE_URL}` (default `/api` → `http://localhost:8091/api`).

### Auth & profile

| Route | Page | Main APIs | Status |
|-------|------|-----------|--------|
| `/login` | Login | `POST /v1/auth/login`, `GET /v1/me/profile` | ✅ SSO + DB |
| `/register` | Register | `POST /v1/users` | ✅ |
| `/forgot-password` | Forgot password | `POST /v1/auth/resend-otp` | 🟡 Reuses OTP resend — no dedicated “forgot password email” API |
| `/otp-verify` | OTP | `POST /v1/auth/verify-otp`, resend, profile | ✅ |
| `/reset-password` | Reset password | `POST /v1/auth/change-password` | ✅ |
| `/profile`, `/settings` | Profile | `GET/PUT /v1/me/profile`, `POST /v1/auth/change-password` | ✅ |

### Dashboard shell

| Route | Page | Main APIs | Status |
|-------|------|-----------|--------|
| `/app` | Dashboard stats | orders/stats, stores/products/customers/users pageable | ✅ |
| `/shortcuts` | Shortcuts | *(none)* | Static UI only |
| `/` | Marketing | *(none)* | Hardcoded pricing in frontend |

### Stores & marketplaces

| Route | Page | Main APIs | Status |
|-------|------|-----------|--------|
| `/stores` | List | `POST /v1/stores/pageable` | ✅ |
| `/stores/new` | Create | `POST /v1/stores` | ✅ |
| `/stores/:id` | Detail | `GET /v1/stores/:id`, Lazada/Shopee/TikTok connect APIs | ✅ External gateway for OAuth |
| `/stores/:marketplace/callback` | OAuth callback | `POST .../connect` | ✅ |

**Frontend missing (backend already has API):**

| Missing UI | Backend API |
|------------|-------------|
| Edit / delete store | `PUT /v1/stores/:id`, `DELETE /v1/stores/:id` |

### Products (marketplace catalog)

| Route | Page | Main APIs | Status |
|-------|------|-----------|--------|
| `/products` | List + sync | `POST /v1/marketplace-products/pageable`, stats, sync, export | ✅ TikTok/Shopee/Lazada via gateway |
| `/products/:id` | Detail | `GET /v1/marketplace-products/:id` | ✅ |

**Notes:**

- Amazon appears in DB seed but **product sync has no Amazon adapter** → sync fails for Amazon stores.
- Product **ERP mapping** API exists on server; **no frontend** calls it yet.

### Orders

| Route | Page | Main APIs | Status |
|-------|------|-----------|--------|
| `/orders` | List | pageable, stats, export | ✅ |
| `/orders/:id` | Detail | `GET /v1/orders/:id`, history, sync | ✅ / 🟡 sync depends on marketplace |
| `/orders/imports` | Import files | `POST /v1/order-import-files/pageable` | ✅ Hidden from sidebar nav |
| `/orders/imports/:id` | Import detail | `GET /v1/order-import-files/:id` | ✅ |
| `/orders/inputs` | Input runs | `POST /v1/order-input-runs/pageable` | ✅ |
| `/orders/inputs/:id` | Input run detail | Full input-run lifecycle APIs | ✅ |

**UI wired but hidden** (`className="hidden"` in `orders-header.tsx`):

| Button | API | Status |
|--------|-----|--------|
| Sync orders | `POST /v1/orders/sync` | ✅ exists, button hidden |
| Import Excel | Opens `OrderImportDialog` → preview/commit APIs | ✅ exists, button hidden |

**Frontend bug / gap:**

| Issue | Detail |
|-------|--------|
| Order breadcrumb | `use-breadcrumbs.ts` uses `useOrderDetailQuery` → `GET /v1/orders/:id` (`externalOrderId`) | ✅ Fixed |

### Invoices

| Route | Page | Main APIs | Status |
|-------|------|-----------|--------|
| `/invoices` | List | `POST /v1/invoices/pageable` | ✅ |
| `/invoices/:id` | Detail | `GET /v1/invoices/:id`, patch status, change number | ✅ |

**Hooks/services defined but unused:**

| Item | API |
|------|-----|
| `useDeleteInvoiceMutation` | `DELETE /v1/invoices/:id` ⚪ |
| `invoiceService.getPaymentSummary` | `GET /v1/invoices/:id/payment-summary` ⚪ (detail DTO may already include payment info) |

### Vouchers (ERP GL)

| Route | Page | Main APIs | Status |
|-------|------|-----------|--------|
| `/vouchers` | List | `POST /v1/vouchers/pageable`, export | ✅ local DB |
| `/vouchers/:id` | Detail / edit / post | `GET /v1/vouchers/:id`, ERP lookups, `POST .../post` | 🟡 ERP lookups & post are stub unless `USE_ERP_API=true` |

**ERP lookup APIs used by voucher forms:**

| API | Default backend | With `USE_ERP_API=true` |
|-----|-----------------|-------------------------|
| `GET /v1/erp-lookups/items` | 🧪 In-memory stub | Live ERP-LACONIC |
| `GET /v1/erp-lookups/items/:id/finance-accounts` | 🧪 Hardcoded per item ID | Live ERP-LACONIC |
| `GET /v1/erp-lookups/account-codes` | 🧡 Stub | Live ERP |
| `GET /v1/erp-lookups/vendors` | 🧪 Stub | Live ERP |
| `GET /v1/erp-lookups/departments` | 🧪 Stub | Live ERP |
| `GET /v1/erp-lookups/currencies` | 🧪 Stub | Live ERP |
| `POST /v1/vouchers/:id/post` | 🧪 Local POSTED only | Calls ERP `POST /api/common/gl-vouchers` |

### Customers & users

| Route | Page | Main APIs | Status |
|-------|------|-----------|--------|
| `/customers` | List | pageable, export, sync | ✅ |
| `/customers/new` | Create | `POST /v1/customers` | ✅ |
| `/customers/:id/edit` | Edit | GET/PUT/DELETE customer | ✅ |
| `/users` | List (admin) | pageable, export, verify-otp | ✅ |
| `/users/new` | Create | `POST /v1/users` | ✅ |
| `/users/:id` | Detail (read-only) | `GET /v1/users/:id` | ✅ |

**Backend has API, frontend does not use:**

| Missing UI | Backend API |
|------------|-------------|
| Change user role | `PATCH /v1/users/:id/role` |
| Change user credentials (admin) | `PUT /v1/users/:id/credentials` |
| Delete user | `DELETE /v1/users/:id` |

---

## 2. Frontend features that need backend attention

These are places where the **UI exists** (or is partially wired) but the **backend is stubbed, incomplete, or misaligned**.

| # | Area | What the frontend does | Backend situation | Severity |
|---|------|------------------------|-------------------|----------|
| 1 | **Voucher ERP post** | “Post to ERP” on voucher detail | Default: `StubErpPostService` only flips local status. Real post needs `USE_ERP_API=true` + ERP-LACONIC running. | High for production ERP |
| 2 | **ERP comboboxes** | Item, account, vendor, dept, currency lookups | Default: `StubErpLookupService` fixed IDs 1001–1003, 501–503, etc. | High for production ERP |
| 3 | **Item finance accounts** | Auto-fill accounts when item selected in voucher form | Stub returns hardcoded DOMESTIC / DOMESTIC-OTHER rows per item ID | High when ERP live |
| 4 | **Amazon orders** | Store can be Amazon; sync button exists (hidden) | `StubMarketplaceOrderAdapter` returns **empty list** | Medium |
| 5 | **Amazon products** | Products page sync | **No product adapter** for AMAZON | Medium |
| 6 | **Order breadcrumb** | Shows order # in breadcrumb on detail page | Uses `GET /v1/orders/:id` ✅ | Fixed |
| 7 | **Forgot password** | Sends OTP via resend | No dedicated forgot-password / email-reset endpoint | Low |
| 8 | **TikTok scrape connect** | Optional scrape flow | Needs `TIKTOK_SHOP_SCRAPPING=true` + scrape service | Config-dependent |
| 9 | **OpenAI file detect** | Input run file type detection | Optional; needs `OPENAI_API_KEY` | Config-dependent |

---

## 3. Backend APIs with no frontend (yet)

These controllers are implemented on the server but **no screen in the client** calls them.

| Module | Base path | Purpose |
|--------|-----------|---------|
| Purchase orders | `/api/v1/purchase-orders` | Full CRUD + pageable |
| ERP items (local mapping table) | `/api/v1/erp-items` | CRUD for invoice-side ERP item records (not live ERP catalog) |
| Product ERP mapping | `/api/v1/products/{id}/erp-mapping` | Link marketplace product → ERP item |
| Products CRUD | `/api/v1/products` | Generic product entity (separate from marketplace-products) |
| Marketplaces list | `/api/v1/marketplaces` | Frontend hardcodes marketplace list in `stores/config/marketplaces.ts` |
| Invoice payment summary | `/api/v1/invoices/:id/payment-summary` | Service method exists, never called |
| Invoice delete | `DELETE /api/v1/invoices/:id` | Mutation hook exists, no delete button |
| Direct order import | `POST /api/v1/orders/import` | Legacy path; UI uses preview/commit flow instead |
| Store update/delete | `PUT/DELETE /api/v1/stores/:id` | No edit store page |
| User admin | `PATCH role`, `PUT credentials`, `DELETE user` | Detail page is read-only |
| TikTok internal sessions | `/api/v1/internal/tiktok-seller-sessions` | Gateway/scrape integration only |
| TikTok scrape connect | `POST /api/v1/stores/:id/tiktok/scrape-connect` | No dedicated UI button (connect flow may cover it) |
| Re-fetch import preview | `GET /api/v1/orders/import/preview/:batchId` | Preview kept in dialog state after POST |

---

## 4. Where mock / stub / seed data lives

### 4.1 Backend — runtime stubs (switchable)

| Location | Class / config | When active | What it fakes |
|----------|----------------|-------------|---------------|
| `server/.../erp/lookup/StubErpLookupService.java` | `@ConditionalOnProperty app.erp.enabled=false` | **Default** | Items, accounts, vendors, departments, currencies, item finance accounts |
| `server/.../erp/StubErpPostService.java` | same | **Default** | Voucher post → returns local voucher number, no ERP HTTP |
| `server/.../integration/.../StubMarketplaceOrderAdapter.java` | Always registered | Amazon order sync | Returns empty order list |
| `server/.../integration/cache/InMemoryMarketplaceTokenCache.java` | When Redis unavailable | Dev fallback | In-memory OAuth tokens |
| `server/.../config/HealthController.java` | Always | Health check | Static `{ status: "UP" }` |

**Enable live ERP instead of stubs** — in `server/.env`:

```env
USE_ERP_API=true
ERP_API_BASE_URL=http://localhost:<erp-laconic-port>
ERP_API_TOKEN=          # if ERP security enabled
ERP_POSTED_BY=LACO-INVOICE
```

### 4.2 Backend — startup seed data (written to real Oracle DB)

| Location | What gets inserted |
|----------|-------------------|
| `bootstrap/MarketplaceInitializer.java` | Marketplaces: TIKTOK, SHOPEE, LAZADA, AMAZON |
| `bootstrap/ErpGlVoucherSeedInitializer.java` | Sample vouchers `APV-MOCK-001`, `APV-MOCK-002`, `PV-MOCK-001` using stub ERP IDs |
| `bootstrap/DefaultAdminAccountInitializer.java` | Default admin user when `app.users.default-admin.enabled=true` |

### 4.3 Backend — stub catalog contents (`StubErpLookupService`)

| Type | Mock IDs | Examples |
|------|----------|----------|
| Items | 1001–1003 | FG-SHIP-FEE, FG-COMMISSION, FG-ADS |
| Accounts | 2101, 2102, 1101, 4101, 5101, 5102 | AP, Accrued, Bank, Revenue, Expenses |
| Vendors | 501–503 | V-TIKTOK, V-LAZADA, V-SHOPEE |
| Departments | 1–4 | N/A, AC, SA, WH |
| Currencies | 1–4 | THB, USD, JPY, EUR |
| Finance accounts | Per item 1001/1002/1003 | DOMESTIC + DOMESTIC-OTHER preset GL lines |

Unknown account IDs still resolve dynamically as `"Account {id}"` for dev convenience.

### 4.4 Frontend — full mock API layer (dev only)

Turn on with `client/.env`:

```env
VITE_USE_MOCK_API=true
```

| Location | Role |
|----------|------|
| `client/src/shared/mock/attach-mock-api.ts` | Intercepts all Axios calls |
| `client/src/shared/mock/mock-api-handler.ts` | ~90+ route handlers |
| `client/src/shared/mock/mock-seed-data.ts` | Stores, customers, products, invoices, vouchers, input runs |
| `client/src/shared/mock/mock-erp-catalog.ts` | ERP lookup responses |
| `client/src/shared/mock/mock-user.ts` | Auto-login as admin |
| `client/src/shared/mock/mock-*-bridge.ts` | Domain-specific mock logic |

When `VITE_USE_MOCK_API=true`, **no real backend is required**.

### 4.5 Frontend — mock data even when using real API 🔴

| Location | Problem |
|----------|---------|
| `client/src/features/orders/data/mock-orders.ts` | Still imported by `use-breadcrumbs.ts` for order detail breadcrumb labels |
| `client/src/features/marketing/pages/marketing-page.tsx` | Hardcoded pricing plans (marketing site only — OK) |

### 4.6 Frontend — dead code (old mocks / unused services)

| File | Notes |
|------|-------|
| `shared/services/lazada-connection.service.ts` | Replaced by generic marketplace connection service |
| `shared/queries/marketplace.query.ts` | `useMarketplacesQuery` never imported |
| `shared/queries/order.query.ts` | `useImportOrdersMutation` unused (preview flow used instead) |

---

## 5. External services (not mock, but required for full function)

| Service | Used by | Config |
|---------|---------|--------|
| **LCN SSO** | Login, OTP, refresh, password | `SSO_URL`, `SSO_JWKS_URL` |
| **Oracle DB** | All core entities | `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` |
| **Redis** | Marketplace token cache (optional) | `REDIS_*` — falls back to in-memory |
| **Communication gateway** | Lazada / Shopee / TikTok OAuth & sync | `COMMUNICATION_GATEWAY_URL`, app keys |
| **ERP-LACONIC** | ERP lookups + voucher post | `USE_ERP_API`, `ERP_API_BASE_URL` |
| **OpenAI** | Input file type detection (optional) | `OPENAI_API_KEY` |
| **TikTok scrape sidecar** | TikTok when scraping mode | `TIKTOK_SHOP_SCRAPPING`, `TIKTOK_SCRAPE_URL` |

---

## 6. Feature matrix (sidebar vs backend reality)

| Sidebar item | Frontend | Backend CRUD | External / stub |
|--------------|----------|--------------|-------------------|
| Dashboard | ✅ | ✅ stats | — |
| Stores | ✅ | ✅ | Marketplace OAuth → gateway |
| Products | ✅ | ✅ marketplace-products | Sync → gateway; Amazon ⚠️ |
| Orders | ✅ | ✅ | Sync → gateway; Amazon stub |
| Order inputs | ✅ | ✅ | File storage + optional OpenAI |
| Invoices | ✅ | ✅ | — |
| Vouchers | ✅ | ✅ local vouchers | ERP lookups/post 🧪 default |
| Customers | ✅ | ✅ | — |
| Users | ✅ partial | ✅ | SSO for credentials |
| Order imports | ✅ (hidden nav) | ✅ | — |

---

## 7. Recommended follow-ups (priority)

1. **Enable live ERP for vouchers** — Set `USE_ERP_API=true` + `ERP_API_BASE_URL` (ERP-LACONIC, default `http://localhost:8080`) when ready; verify finance-accounts + post against real Oracle ERP DB.
2. ~~**Fix order breadcrumb**~~ — Done (`useOrderDetailQuery`).
3. **Unhide or remove** — Orders sync/import buttons (`orders-header.tsx`) and order imports nav item (`navigation.ts`).
4. **Amazon** — Either hide Amazon in UI or implement real order/product adapters.
5. **Admin UX** — Wire user role/credentials/delete and store edit/delete if product needs them.
6. **Future modules** — Purchase orders, ERP items, product ERP mapping have backend only; add UI when business needs them.

---

## 8. Related docs / code entry points

| Topic | Path |
|-------|------|
| ERP env switch | `server/.env` → `USE_ERP_API`, `application.yml` → `app.erp.*` |
| ERP stub implementation | `server/src/main/java/.../erp/lookup/StubErpLookupService.java` |
| ERP HTTP client | `server/src/main/java/.../erp/lookup/HttpErpLookupService.java` |
| Voucher post | `server/.../voucher/ErpGlVoucherService.postToErp()` |
| Frontend mock toggle | `client/.env` → `VITE_USE_MOCK_API` |
| ERP-LACONIC lookup APIs | `erp-smart/ERP-LACONIC/server/.../common/erplookup/` |
