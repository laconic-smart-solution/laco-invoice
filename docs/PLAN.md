# Remove Invoice Flows — Implementation Plan

**Status:** Planning only — no application code, schema, or migrations have been changed.  
**Scope of analysis:** `laco-invoice/client`, `laco-invoice/server`, related docs/config  
**Date:** 2026-08-26

---

## 1. Objective

Completely remove **Invoice issuance / management flows** from Laco Invoice (frontend + backend), while keeping Order, Excel import, Order History, Customer, Store, Product, and other non-invoice features working.

This plan inventories every Invoice touchpoint found in the codebase and defines a phased removal strategy, risks, and approval gates.

---

## 2. Scope

### In scope (remove or strip)

- Invoice list / detail UI and routes
- Generate invoice from order (single + bulk)
- Invoice PDF / print / export / bulk PDF ZIP
- Void invoice
- Invoice stats on dashboard / classic SPA
- Backend `Invoice` entity, APIs, PDF, Spring Batch bulk-generate, Redis→WebSocket progress
- Order UI/API fields that exist only to support invoicing (`invoiceId`, invoicing stats, Generate/View Invoice actions)
- Import REPLACE rule that blocks when an invoice exists
- Invoice i18n, nav, shortcuts, breadcrumbs

### Out of scope / do not blindly remove

| Item | Reason |
|------|--------|
| Product/brand name “Laco Invoice”, app code `laco-invoice`, cookie names `laco_invoice_*` | Product identity / SSO application code — **needs business decision** whether to rename |
| `OrderTaxInvoice` / table `order_tax_invoices` | Excel “Request Tax Invoice” **import metadata**, not the issued `Invoice` entity — **needs approval** (keep vs remove) |
| Order money fields (`total_amount`, VAT, shipping) | Order commerce data, not invoice documents |
| Order History audit tables | Independent of Invoice |
| Auth / roles (OWNER, ADMIN, etc.) | Shared; only invoice-specific `@PreAuthorize` usages go away with invoice APIs |

### Explicit decision: `OrderTaxInvoice`

**Recommendation pending approval:**

- **Option A (recommended default):** Keep `OrderTaxInvoice` + Excel tax columns; only remove issued-invoice flows (`Invoice`, PDF, generate, void, bulk).
- **Option B:** Also remove tax-request Excel columns and `order_tax_invoices` if product no longer needs marketplace tax-request data.

This plan treats **Option A** as the default path and marks Option B as optional Phase 5b.

---

## 3. Existing Invoice Functionality

### What exists today

| Capability | How it works |
|------------|--------------|
| Create invoice | `POST /api/v1/orders/{orderId}/invoices` — one invoice per order; number `INV-yyyyMM-######`; VAT 7% |
| Bulk create | Spring Batch job + Redis progress + STOMP `/topic/order-bulk-generate/{runId}` + ZIP download |
| List / filter / stats | `POST /pageable`, `GET /stats` |
| Detail | `GET /{id}` |
| Void | `PATCH /{id}/void` (MANAGER\|ADMIN) |
| PDF | OpenPDF from `templates/invoice/tax-invoice.xhtml` |
| Export | Excel export + preview; bulk PDF ZIP |
| Order coupling | Order list/detail enrich `invoiceId`; stats include invoiced/awaiting/coverage; REPLACE blocked if invoice exists |
| Excel tax request | Separate `OrderTaxInvoice` filled on import (not used by PDF) |

### What does **not** exist

- Dedicated “Create Invoice” page (creation is only from Orders)
- Invoice edit / history / revision tables
- Invoice-specific Quartz jobs
- Invoice-specific client tests
- Fine-grained permission strings (only role checks on methods)
- `lco_orders.invoice_id` column (link is only `invoices.order_id`)

---

## 4. Frontend Impact

### Pages — REMOVE

| Route | File |
|-------|------|
| `/invoices` | `client/src/features/invoices/pages/invoices-page.tsx` |
| `/invoices/:invoiceId` | `client/src/features/invoices/pages/invoice-detail-page.tsx` |

### Components — REMOVE (feature package)

Under `client/src/features/invoices/`:

- `components/invoices-header.tsx`
- `components/invoices-filters.tsx`
- `components/invoices-stat-cards.tsx`
- `components/invoices-table.tsx`
- `components/invoice-export-preview-dialog.tsx`
- `components/invoice-document.tsx`
- `components/invoice-detail-sidebar.tsx`
- `constants/invoice-filter-options.ts`
- `types/invoice.ts`

### Shared UI — REMOVE

- `client/src/components/common/order-bulk-generate-panel.tsx`
- Mounts in `classic-spa-shell.tsx`, `modern-dashboard-shell.tsx`

### Components — MODIFY (strip invoice actions)

| File | Change |
|------|--------|
| `orders-table.tsx` | Remove Generate / View Invoice row actions; remove bulk-generate toolbar action |
| `orders-header.tsx` | Remove Bulk Generate button |
| `orders-page.tsx` | Remove bulk-generate confirm/mutation/WS wiring |
| `order-detail-header.tsx` / `order-detail-page.tsx` | Remove Generate / View Invoice |
| `order-detail-info.tsx` | Remove `invoiceId` display |
| `order-export-preview-dialog.tsx` | Remove `invoiceId` column |
| `order-import-dialog.tsx` | Remove / reword `warning_has_invoice` UX (backend warning must also change) |
| `classic-detail-sheet.tsx` | Remove generate + invoice detail panel |
| `dashboard-stat-cards.tsx` | Remove Invoices issued / Total billed / Awaiting invoice cards (or replace with non-invoice metrics) |
| `dashboard-header.tsx` | Remove unwired “Bulk Invoices” button |
| `classic-overview-panel.tsx` | Remove invoice stats / awaiting-invoice drill-down |
| `classic-workspace.tsx` / classic route utils | Remove invoices panel |

### Services / queries / stores — REMOVE

| File |
|------|
| `shared/services/invoice.service.ts` |
| `shared/queries/invoice.query.ts` |
| `shared/stores/order-bulk-generate-store.ts` |
| `shared/hooks/use-order-bulk-generate-subscription.ts` |

### Services / queries — MODIFY

| File | Change |
|------|--------|
| `shared/services/order.service.ts` | Remove `invoiceId` from types; remove bulk-generate API methods; remove `POST .../invoices` |
| `shared/queries/order.query.ts` | Remove generate-invoice mutation, bulk-generate hooks |
| `features/orders/types/order.ts`, `util/map-order.ts` | Drop `invoiceId` |
| `features/orders/data/mock-orders.ts` | Drop invoice fields if present |

### Navigation / i18n — MODIFY or REMOVE

| Area | Action |
|------|--------|
| `constants/navigation.ts` | Remove invoices nav item |
| `locales/*/sidebar.json` | Remove `nav.invoices` |
| `locales/*/invoices.json` | Delete files; unregister namespace in `i18n.ts` |
| `locales/*/orders.json` | Remove generate / bulk_generate / invoice action keys |
| `locales/*/dashboard.json` | Remove invoice stats / bulk_invoices keys |
| `locales/*/classic.json` | Remove invoices panel keys |
| `locales/*/shortcuts.json` | Remove go-invoices |
| `features/shortcuts/constants/app-shortcuts.ts` | Remove `go-invoices` / `g`+`i` |
| `shared/hooks/use-app-keyboard-shortcuts.ts` | Remove invoices shortcut |
| `shared/hooks/use-breadcrumbs.ts` | Remove invoice crumb logic |
| Brand strings “Laco Invoice” | **Keep unless rename approved** |

### Permissions (frontend)

- No invoice-specific guards beyond `ProtectedRoute`.
- Removing routes is sufficient; no separate permission matrix to delete.

---

## 5. Backend Impact

### Package / files — REMOVE (entire invoice feature)

```text
server/.../features/invoice/
  InvoiceController.java
  OrderInvoiceController.java
  InvoiceService.java
  InvoiceServiceImpl.java
  InvoicePdfService.java
  InvoiceMapper.java
  InvoiceDto.java, InvoiceDetailDto.java, InvoiceListItemDto.java
  InvoiceLineItemDto.java, InvoiceStatsDto.java, InvoiceExportRequest.java
  pageable/InvoiceFilter.java, InvoicePageRequest.java
  bulk/*  (Batch reader/processor/writer/zip/listeners/progress Redis/STOMP)
```

Also remove:

- `domain/models/Invoice.java`
- `domain/models/InvoiceStatus.java`
- `domain/models/converter/InvoiceStatusConverter.java`
- `domain/models/OrderBulkGenerateRun.java`
- `domain/models/OrderBulkGenerateStatus.java`
- `domain/repositories/InvoiceRepository.java`
- `domain/repositories/OrderBulkGenerateRunRepository.java`
- `config/OrderBulkGenerateProperties.java`
- `config/websocket/OrderBulkGenerateStompChannelInterceptor.java` (+ registration in `WebSocketConfig`)
- `resources/templates/invoice/tax-invoice.xhtml`
- Optional fonts only used by invoice PDF (if unused elsewhere)

### Optional (approval) — REMOVE under Option B

- `domain/models/OrderTaxInvoice.java`
- `domain/repositories/OrderTaxInvoiceRepository.java`
- Excel tax-field mapping in `OrderImportService.upsertTaxInvoice` / Excel row models

### Backend — MODIFY

| File | Change |
|------|--------|
| `OrderServiceImpl` | Stop loading invoices for list/detail; remove invoiced/awaiting/coverage from stats (or redefine stats) |
| `OrderDto` / `OrderMapper` / `OrderStatsDto` | Remove `invoiceId` and invoicing metrics |
| `OrderRepository` | Remove `countInvoiced*` / `countAwaitingInvoice*` queries |
| `OrderImportService.replaceOrder` | Remove “invoice exists → block REPLACE” guard |
| `OrderImportPreviewService` | Remove `HAS_INVOICE` warning / `assertReplaceAllowed` invoice check |
| `AuthorizationService` | No invoice-only methods; only call sites disappear |
| `pom.xml` | Consider removing OpenPDF / Batch if unused after removal (**verify** Batch/OpenPDF not used elsewhere) |
| `application.yml` | Remove `app.order-bulk-generate.*` |

### Keep (default)

- Order, OrderItem, Customer, Store, Marketplace
- Order import / preview / input runs / withdraw
- Order History (`order_history`, `order_history_changes`)
- `OrderTaxInvoice` (unless Option B)

---

## 6. Database Impact

### Tables to remove (Invoice issuance)

| Table | Notes |
|-------|-------|
| `invoices` | Primary invoice documents |
| `order_bulk_generate_runs` | Bulk generate job runs |

### Tables — keep by default / optional remove

| Table | Decision |
|-------|----------|
| `order_tax_invoices` | **Keep** under Option A; remove under Option B |
| Spring Batch metadata tables | May remain unused; cleanup optional |

### Columns on non-invoice tables

| Location | Finding |
|----------|---------|
| `lco_orders` | **No** `invoice_id` / `invoice_number` / `invoice_status` columns |
| `order_import_preview_orders.warning_code` | Soft string `HAS_INVOICE` — stop writing; no FK |

### FKs / indexes / constraints

- Logical JPA FK `invoices.order_id` → `lco_orders.id` (often `NO_CONSTRAINT` in app)
- Unique: `invoices.order_id`, `invoices.invoice_no`
- Soft-delete column `is_enable` on invoice entities (MasterEntity)

### Data handling — **REQUIRES APPROVAL**

| Option | Description |
|--------|-------------|
| Archive | Export invoices + PDFs, then drop tables |
| Soft retain | Leave tables in DB but remove app access (not preferred long-term) |
| Hard delete | `DROP TABLE` after backup |

**Do not delete production invoice data without explicit business sign-off.**

---

## 7. Order Dependencies

| Dependency | Today | After removal |
|------------|-------|---------------|
| Order create | Does **not** require invoice | No change |
| Order update / sync | Independent | No change |
| Order list/detail API | Returns `invoiceId` | Remove field |
| Order stats | Invoiced / awaiting / coverage | Remove or replace with non-invoice KPIs |
| Order UI actions | Generate / View Invoice / Bulk Generate | Remove |
| Excel REPLACE | Blocked if invoice exists | Allow REPLACE (or keep other business blocks only) |
| Excel MERGE | Allowed even with invoice | Unchanged except warning text |
| Order History | No invoice fields audited | Unchanged |
| Import tax columns | Writes `OrderTaxInvoice` | Keep (Option A) |

**Conclusion:** Orders can operate without invoices. Coupling is enrichment + guards + UI actions, not a hard create dependency.

---

## 8. Customer / Payment / Other Dependencies

| Area | Linked to Invoice? | Action |
|------|-------------------|--------|
| Customer | PDF “Bill To” reads customer; no invoice FK on customer | Keep customer; remove PDF only |
| Payment | No payment/invoice module found | Keep N/A |
| Order Items | Used as PDF line items | Keep items; remove PDF |
| Store / Marketplace | Scope filters on invoice list | Keep entities; remove invoice filters |
| Shipping / VAT on Order | Order money fields | **Keep** |
| Accounting / external ERP invoice sync | Not found as separate invoice flow | N/A |
| Notifications | Bulk progress WebSocket only | Remove with bulk generate |
| Reports | Invoice Excel/PDF exports only | Remove |

---

## 9. API Impact

### REMOVE

| Method | Endpoint | Controller | Reason |
|--------|----------|------------|--------|
| POST | `/api/v1/invoices/pageable` | `InvoiceController` | Invoice-only |
| GET | `/api/v1/invoices/stats` | `InvoiceController` | Invoice-only |
| POST | `/api/v1/invoices/export` | `InvoiceController` | Invoice-only |
| POST | `/api/v1/invoices/export/preview` | `InvoiceController` | Invoice-only |
| POST | `/api/v1/invoices/bulk-pdf` | `InvoiceController` | Invoice-only |
| GET | `/api/v1/invoices/{id}` | `InvoiceController` | Invoice-only |
| PATCH | `/api/v1/invoices/{id}/void` | `InvoiceController` | Invoice-only |
| GET | `/api/v1/invoices/{id}/pdf` | `InvoiceController` | Invoice-only |
| POST | `/api/v1/orders/{orderId}/invoices` | `OrderInvoiceController` | Generate |
| POST | `/api/v1/orders/bulk-generate` | `OrderInvoiceController` | Bulk job |
| GET | `/api/v1/orders/bulk-generate/{runId}` | `OrderInvoiceController` | Bulk status |
| GET | `/api/v1/orders/bulk-generate/{runId}/download` | `OrderInvoiceController` | Bulk ZIP |
| STOMP | `/topic/order-bulk-generate/{runId}` | WebSocket | Progress |

### MODIFY

| Method | Endpoint | Change |
|--------|----------|--------|
| POST | `/api/v1/orders/pageable` | Stop joining/enriching `invoiceId` |
| GET | `/api/v1/orders/{id}` | Remove `invoiceId` from detail DTO |
| GET | `/api/v1/orders/stats` | Remove or redefine invoicing metrics |
| POST | `/api/v1/orders/export` (+ preview) | Drop `invoiceId` column |
| POST | `/api/v1/orders/import/...` commit/preview | Remove HAS_INVOICE / REPLACE block |

### KEEP (examples)

- All non-invoice order/import/input-run/customer/store/product/user APIs
- Auth / me / marketplace sync (unless separately scoped)

---

## 10. Route Impact

### REMOVE

| Route | Why | Navigation |
|-------|-----|------------|
| `/invoices` | Invoice list | Remove sidebar + shortcuts |
| `/invoices/:invoiceId` | Invoice detail | Remove links from orders/dashboard |

**Redirect suggestion:** `/invoices*` → `/orders` (optional, temporary) to avoid bookmarks 404. **Needs approval.**

### MODIFY

| Route | Why |
|-------|-----|
| `/orders` | Remove generate/bulk UI |
| `/orders/:orderId` | Remove generate/view invoice |
| Classic SPA panels | Remove invoices panel / awaiting-invoice focus |
| `/` dashboard | Remove invoice KPI cards |

### KEEP

- Orders, order inputs, imports, customers, stores, products, users, auth, profile, shortcuts (minus invoice shortcut)

---

## 11. Permissions & Security

| Check | Location | Action |
|-------|----------|--------|
| `@authz.isOwnerOrAdmin()` on invoice APIs | Invoice / OrderInvoice controllers & services | Goes away with endpoints |
| `@authz.isManagerOrAdmin()` on void | `InvoiceServiceImpl.void` | Goes away |
| STOMP interceptor OWNER/ADMIN for bulk topic | `OrderBulkGenerateStompChannelInterceptor` | Remove |
| Shared roles OWNER/MANAGER/STAFF/ADMIN | `UserRole` | **Keep** |

No dedicated `INVOICE_*` permission entities found.

---

## 12. Configuration & Environment

### REMOVE / MODIFY

| Config | Action |
|--------|--------|
| `app.order-bulk-generate.max-orders` / `chunk-size` | Remove from `application.yml` |
| `OrderBulkGenerateProperties.workRoot` default temp dir | Unused after removal |
| Redis channel `order-bulk-generate:progress` | Code removal (Redis itself stays for other uses) |
| OpenPDF / Batch dependencies | Remove from `pom.xml` **if** unused elsewhere — **verify first** |

### KEEP (unless rebrand approved)

| Config | Notes |
|--------|-------|
| `spring.application.name: lacoinvoice` | Brand |
| SSO `application-code: laco-invoice` | External SSO registration |
| Cookies `laco_invoice_access_token` / `refresh` | Auth |
| Client `VITE_APPLICATION_CODE=laco-invoice` | Auth/SSO |
| Hostnames `dev-laco-invoice.laconic.co.th` | Infra |

---

## 13. Tests

### Backend

| Test | Action |
|------|--------|
| `features/invoice/InvoicePdfServiceTest.java` | **REMOVE** |
| No InvoiceController / bulk integration tests found | N/A |
| Order import tests (if any) asserting HAS_INVOICE / REPLACE block | **MODIFY** |
| `OrderHistoryIntegrationTest` | **KEEP** (unrelated) |
| `CustomerServiceIntegrationTest` | **KEEP** |

### Frontend

| Tests | Action |
|-------|--------|
| No invoice `*.test.*` / `*.spec.*` found | N/A |

### After removal

- Add smoke checks: orders list/detail, import REPLACE without invoice block, dashboard loads without invoice APIs.

---

## 14. Documentation

| Doc / artifact | Action |
|----------------|--------|
| `docs/database-schema.md` (INVOICES section) | Update when schema drops |
| `docs/Remove Invoice Flows — Planning Prompt.md` | Keep as historical prompt |
| This `PLAN.md` | Living plan until implementation done |
| OpenAPI / Swagger | Regenerates when controllers removed |
| User/dev docs mentioning Generate Invoice | Update |
| Seed/mock order data with `invoiceId` | Clean |

Do **not** treat every “invoice” string in docs as code to delete (e.g. product name).

---

## 15. Dependency Graph

```text
                         ┌──────────────────────┐
                         │   Invoice (invoices)  │
                         │  PDF / void / export  │
                         └──────────┬───────────┘
                                    │ 1:0..1 order_id
                                    ▼
┌──────────────┐           ┌────────────────────┐
│  Frontend UI │──────────▶│       Order        │
│  /invoices   │  generate │    (lco_orders)    │
│  Generate /  │◀──────────│                    │
│  Bulk Generate│ invoiceId│                    │
└──────┬───────┘           └─────────┬──────────┘
       │                             │
       │                             ├── OrderItem
       │                             ├── CustomerInfo (Bill To on PDF only)
       │                             ├── Store / Marketplace
       │                             └── OrderTaxInvoice (Excel tax request)
       │                                      ▲ KEEP by default
       ▼
┌──────────────────┐     ┌─────────────────────────────┐
│ OrderBulkGenerate│────▶│ Redis progress → STOMP WS   │
│ Run + Batch ZIP  │     └─────────────────────────────┘
└──────────────────┘

Dashboard / Classic SPA stats ──▶ Invoice stats + Order awaiting-invoice counts
Import REPLACE guard ──────────▶ InvoiceRepository.existsByOrder_Id
```

---

## 16. Recommended Removal Strategy

```text
Phase 0 — Approvals
  - Confirm OrderTaxInvoice keep vs remove
  - Confirm production data archive vs drop
  - Confirm redirects for /invoices*
  - Confirm whether to rebrand “Laco Invoice” (out of band)

Phase 1 — Frontend UI (stop user access)
  - Remove nav, routes, pages, shortcuts, dashboard/classic invoice cards
  - Remove Generate / View Invoice / Bulk Generate from Orders
  - Remove bulk-generate panel from shells
  - Clean i18n

Phase 2 — Frontend API layer
  - Remove invoice.service / invoice.query
  - Strip order types/mappers/hooks for invoiceId & bulk generate
  - Ensure no remaining imports

Phase 3 — Backend APIs
  - Delete InvoiceController + OrderInvoiceController
  - Delete WebSocket interceptor registration for bulk topic

Phase 4 — Backend domain & jobs
  - Delete Invoice* services, PDF, mapper, DTOs
  - Delete bulk Batch + Redis progress stack
  - Delete Invoice / OrderBulkGenerate entities & repos
  - Soften OrderServiceImpl / import preview / REPLACE

Phase 5 — Database
  - Archive data if required
  - Drop invoices, order_bulk_generate_runs
  - Optional 5b: drop order_tax_invoices + stop Excel tax upsert

Phase 6 — Config & dependencies
  - Remove app.order-bulk-generate
  - Prune pom.xml deps if unused
  - Leave SSO/cookie brand names unless rename approved

Phase 7 — Tests & docs
  - Remove InvoicePdfServiceTest
  - Update schema docs
  - Run verification checklist

Phase 8 — Regression
  - Orders CRUD/list/detail/sync
  - Excel import MERGE/REPLACE/CREATE
  - Order History
  - Customers / Stores / Products / Users
```

**Rationale:** Remove UI first so production users stop creating invoices before APIs/tables disappear. DB drop last after archive approval.

---

## 17. Database Migration Plan

*(Document only — do not run yet.)*

### Tables to remove

1. `invoices`
2. `order_bulk_generate_runs`

### Optional

3. `order_tax_invoices` (Option B)

### Columns to remove

- None on `lco_orders` (no invoice columns)

### Columns / behavior to change (app-level, not DDL)

- Stop writing `HAS_INVOICE` on preview warnings

### Data migration / cleanup

1. **Backup** `invoices` (+ any stored PDF artifacts under bulk work dirs)
2. Confirm no external systems read `invoices` or PDF URLs
3. Drop tables in maintenance window
4. Hibernate `ddl-auto: update` will not drop tables — **manual DDL or future migration tool required**

### Indexes / constraints

- Drop with tables (`uk` on `order_id`, `invoice_no`, etc.)

---

## 18. Risk Analysis

| Risk | Impact | Affected Area | Mitigation |
|------|--------|---------------|------------|
| Orders UI still calls removed APIs | Runtime errors | Orders | Phase 1–2 before Phase 3; grep for `/invoices` and `bulk-generate` |
| Import REPLACE suddenly allowed on previously invoiced orders | Data overwrite | Import | Product confirms; communicate behavior change |
| Dashboard empty / broken queries | UX | Dashboard | Remove invoice stats hooks with cards |
| Classic SPA invoices panel 404 | UX | Classic | Remove panel mapping |
| Dropping `OrderTaxInvoice` by mistake | Lose Excel tax metadata | Import | Default Option A; separate approval for B |
| OpenPDF/Batch removal breaks other features | Build/runtime | Server | Grep usages before deleting deps |
| Production invoice data loss | Business/legal | DB | Archive + approval before DROP |
| External bookmarks to `/invoices` | 404 | FE routing | Optional redirect |
| Redis listener leftover after code delete | Startup noise | Config | Remove relay beans completely |
| Brand/SSO rename unfinished | Auth breakage | Config | Do **not** rename `laco-invoice` app code without SSO team |

---

## 19. Verification Plan

### Frontend

- [ ] No Invoices sidebar item
- [ ] `/invoices` and `/invoices/:id` gone (or redirect)
- [ ] No Generate / View Invoice / Bulk Generate on Orders
- [ ] No bulk-generate floating panel
- [ ] Dashboard/classic have no invoice KPIs
- [ ] No `invoice.service` / `invoice.query` imports
- [ ] i18n namespace `invoices` unregistered
- [ ] Shortcut `g` then `i` does not open invoices
- [ ] App builds; no broken imports

### Backend

- [ ] Invoice controllers return 404 / not mapped
- [ ] No `features.invoice` package
- [ ] No Invoice / OrderBulkGenerate entities registered
- [ ] Order pageable/detail/stats/export have no invoice fields
- [ ] Import REPLACE no longer checks invoice existence
- [ ] App starts (no bulk Redis listener bean)
- [ ] Tests pass / invoice PDF test removed

### Database

- [ ] Approved backup completed
- [ ] `invoices` / `order_bulk_generate_runs` dropped (when approved)
- [ ] Option B tables handled if chosen

### Remaining features

- [ ] Orders list/detail/sync
- [ ] Order History
- [ ] Excel import preview/commit (CREATE/MERGE/REPLACE)
- [ ] Order input runs / withdraw
- [ ] Customers / Stores / Products / Users
- [ ] Auth login

---

## 20. Final Invoice Reference Search

After implementation, search both trees:

```text
Invoice
invoice
invoices
invoiceId
invoice_id
invoiceNo
invoice_no
HAS_INVOICE
bulk-generate
bulkGenerate
BulkGenerate
InvoiceStatus
InvoicePdf
tax-invoice
order-bulk-generate
```

### Classify hits

| Category | Examples | Action |
|----------|----------|--------|
| True leftovers | Controllers, UI actions, DTOs | Must fix |
| Brand / SSO | `laco-invoice`, “Laco Invoice”, cookie names | Keep unless rebrand |
| Tax request import | `OrderTaxInvoice`, Excel “Request Tax Invoice” | Keep under Option A |
| Bill To label | Only if residual PDF template | Should be gone with PDF |
| Docs / PLAN | This file, planning prompt | Historical OK |

Do **not** mass-delete every match.

---

## 21. Decisions Requiring Approval

1. **Production invoice data:** archive vs retain vs hard delete?  
2. **`OrderTaxInvoice` / Excel tax-request columns:** keep (A) or remove (B)?  
3. **Redirect** `/invoices*` → `/orders` temporarily?  
4. **Order stats replacement:** remove invoicing KPIs entirely, or replace with other metrics?  
5. **REPLACE after invoicing removed:** always allow overwrite of previously invoiced orders?  
6. **Rebrand** application code / cookies / SSO `laco-invoice`? (separate project — not required to remove flows)  
7. **Classic SPA:** remove invoices panel only, or also “awaiting invoice” order focus UX?  
8. **External consumers** of `/api/v1/invoices/**` or PDF URLs?  

---

## 22. Implementation Checklist

Use during coding (future work — not started):

### Phase 1 — Frontend UI
- [ ] Remove invoices routes + lazy imports + nav
- [ ] Delete `features/invoices/**`
- [ ] Strip order generate/bulk UI
- [ ] Strip dashboard/classic invoice surfaces
- [ ] Remove bulk-generate panel + shells wiring
- [ ] Clean i18n + shortcuts + breadcrumbs

### Phase 2 — Frontend API
- [ ] Delete invoice service/query/store/WS hook
- [ ] Strip order service/query/types `invoiceId` + bulk APIs

### Phase 3 — Backend APIs
- [ ] Delete invoice HTTP controllers
- [ ] Unregister bulk STOMP interceptor

### Phase 4 — Backend domain
- [ ] Delete invoice + bulk packages/entities/repos/PDF/template
- [ ] Patch OrderServiceImpl / OrderDto / stats / export
- [ ] Patch import REPLACE + HAS_INVOICE preview

### Phase 5 — Database
- [ ] Backup
- [ ] Drop `invoices`, `order_bulk_generate_runs`
- [ ] Optional: drop `order_tax_invoices`

### Phase 6 — Config
- [ ] Remove `app.order-bulk-generate`
- [ ] Prune unused Maven deps

### Phase 7 — Tests & docs
- [ ] Remove `InvoicePdfServiceTest`
- [ ] Update `docs/database-schema.md`
- [ ] Run final reference search (§20)

### Phase 8 — Verify
- [ ] Complete §19 checklist

---

## Appendix A — Key file inventory (quick reference)

### Frontend remove
`features/invoices/**`, `shared/services/invoice.service.ts`, `shared/queries/invoice.query.ts`, `shared/stores/order-bulk-generate-store.ts`, `shared/hooks/use-order-bulk-generate-subscription.ts`, `components/common/order-bulk-generate-panel.tsx`, `locales/*/invoices.json`

### Backend remove
`features/invoice/**`, `domain/models/Invoice*.java`, `OrderBulkGenerate*.java`, related repositories, `templates/invoice/**`, `OrderBulkGenerateProperties`, bulk STOMP interceptor

### Backend/frontend modify
Order list/detail/stats/export/import preview, dashboard/classic, navigation, i18n, shortcuts

---

*End of plan. No application code was modified to produce this document.*
