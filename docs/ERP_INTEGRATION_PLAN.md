# ERP master-data sync and voucher integration plan

## Decision summary

Do **not** call the ERP API for every invoice or voucher action. Laco Invoice should keep a local, synchronised copy of the ERP master data it needs, while ERP exchange happens in controlled batches.

Recommended delivery order:

1. **Inbound master-data import by CSV** — the first production path for ERP items, vendors, account codes, departments, tax codes, and currencies.
2. **Excel (`.xlsx`) import/export** — finance-friendly review and maintenance format using the same data contract.
3. **Voucher CSV/XLSX export** — a controlled accounting handoff to ERP.
4. **ERP API integration** — optional scheduled master-data sync and asynchronous voucher posting only after the ERP contract is stable.

This avoids blocking invoice issuance or voucher preparation when ERP is slow, unavailable, rate-limited, or requires a VPN. It also gives finance a reviewable and auditable handoff.

## Integration scope and direction

| Data | Direction | Initial method | Future method | Owner of truth |
| --- | --- | --- | --- | --- |
| ERP items / products | ERP → Laco | CSV/XLSX import | Scheduled API sync | ERP |
| Vendors / suppliers | ERP → Laco | CSV/XLSX import | Scheduled API sync | ERP |
| GL account codes | ERP → Laco | CSV/XLSX import | Scheduled API sync | ERP |
| Departments / cost centres | ERP → Laco | CSV/XLSX import | Scheduled API sync | ERP |
| Tax codes, VAT rules, currencies | ERP → Laco | CSV/XLSX import | Scheduled API sync | ERP |
| Store, marketplace, SKU, and accounting mappings | Laco-managed, mapped to ERP IDs | CSV/XLSX maintenance | Optional API lookup/validation | Agreed by Finance |
| GL vouchers | Laco → ERP | CSV/XLSX export | Asynchronous API posting | Laco until posted; ERP after acceptance |
| ERP voucher reference/status | ERP → Laco | Manual reconciliation import | API status/reconciliation sync | ERP |

Laco should store the external ERP identifier, code, name, active status, and last-sync metadata for each ERP master record. Voucher creation must use those local records rather than call ERP in the user request.

## Master-data sync workflow

```text
ERP master-data extract / API
        ↓
CSV or XLSX uploaded to Laco, or scheduled server-side sync
        ↓
Validate file/API payload against the master-data template
        ↓
Show preview: new, changed, inactive, and invalid records
        ↓
Authorised finance/admin user approves import
        ↓
Upsert local ERP master records and write sync audit log
        ↓
Voucher screen reads local items, vendors, account codes, tax codes, etc.
```

Never delete a master record that is referenced by an existing voucher. Instead, mark it inactive and retain its historical code/name snapshot on the voucher.

## Required ERP master data

### 1. Items / products

| Field | Required | Notes |
| --- | --- | --- |
| `erp_item_id` | Yes | Stable ERP primary key; never use the name as identity. |
| `erp_code` | Yes | Human-readable ERP/SKU/item code; unique per ERP company. |
| `name` | Yes | Item/product name. |
| `unit` | No | Unit of measure. |
| `vat_tax_code` | Conditional | Default ERP tax code when available. |
| `revenue_account_code` / `expense_account_code` | Conditional | Default GL mapping. |
| `active` | Yes | Inactive items remain available on historical vouchers only. |
| `updated_at` | Recommended | Supports delta sync and conflict review. |

### 2. Vendors / suppliers

| Field | Required | Notes |
| --- | --- | --- |
| `erp_vendor_id` | Yes | Stable ERP primary key. |
| `vendor_code` | Yes | Unique code used by finance. |
| `vendor_name` | Yes | Display name. |
| `tax_id` | Conditional | Validate format; restrict visibility where needed. |
| `address` | No | Preserve line breaks safely. |
| `payment_terms` | No | Reference/display value. |
| `active` | Yes | Do not hard-delete linked vendors. |
| `updated_at` | Recommended | Supports delta sync. |

### 3. GL account codes

| Field | Required | Notes |
| --- | --- | --- |
| `erp_account_id` | Yes | Stable ERP account primary key. |
| `account_code` | Yes | Unique chart-of-accounts code. |
| `account_name` | Yes | Display name. |
| `account_type` | Recommended | Asset, liability, income, expense, etc. |
| `allow_debit` / `allow_credit` | Recommended | Pre-validates voucher entries. |
| `active` | Yes | Inactive accounts cannot be chosen for new vouchers. |
| `updated_at` | Recommended | Supports delta sync. |

### 4. Supporting masters

Synchronise the same way for:

- departments, branches, projects, and cost centres;
- tax codes, withholding-tax codes, VAT rates, and tax reporting rules;
- currencies and exchange-rate references if multi-currency is required;
- payment methods and bank accounts when the voucher flow requires them.

## Phase 0 — agree the master-data contract

Before implementing screens or API clients, get a sample ERP extract and agree for every master type:

1. stable identifier, business code, display name, and active/inactive field;
2. data ownership: which values ERP controls and which Laco may maintain locally;
3. full-load and incremental/delta strategy;
4. expected data volume and update frequency;
5. duplicate-code, rename, merge, and deactivation rules;
6. character encoding, date/timezone, number formats, and required columns;
7. ERP company/branch scope and access permissions.

## Phase 1 — CSV master-data import (recommended first release)

### User experience

Add an **ERP master data** area with separate tabs for Items, Vendors, Account codes, Departments, and Tax codes. Each tab should provide:

- download template and data dictionary;
- upload CSV and validation preview before any database change;
- counts for new, updated, unchanged, inactive, and rejected rows;
- row-level error download;
- `Apply import` restricted to authorised finance/admin users;
- import history with template version, source filename/checksum, importer, time, results, and rollback reference.

### Import rules

- CSV must be UTF-8. Offer UTF-8 with BOM only where an ERP/Excel export requires it.
- Dates use `YYYY-MM-DD` or ISO-8601 timestamps; decimals use `.` with no thousands separators.
- Validate headers against a named template version, e.g. `laco-erp-master-v1`.
- Reject duplicate external IDs and duplicate codes in a scoped ERP company/branch.
- Upsert only after preview approval; do not partially apply an invalid file.
- Use external ERP ID as the match key. Code changes update the existing record; a changed name is not a new record.
- Record source hash and import batch ID so the same file can be identified and safely re-run.

### File templates

Use one file per master type initially. This is easier for finance to prepare and validate.

```text
erp-items-v1.csv
erp-vendors-v1.csv
erp-gl-accounts-v1.csv
erp-departments-v1.csv
erp-tax-codes-v1.csv
```

Do not let users edit imported ERP IDs from ordinary voucher screens. Mapping changes should use a controlled mapping/import workflow.

## Phase 2 — Excel master-data import and review

Support an `.xlsx` workbook for organisations that maintain ERP masters in Excel.

Recommended workbook sheets:

- `Read me` — template version, instructions, valid values, and import rules;
- `Items`;
- `Vendors`;
- `GL Accounts`;
- `Departments`;
- `Tax Codes`;
- `Validation` — optionally generated by Laco after upload.

The server should convert both CSV and Excel into the **same import command and validation model**. No accounting logic should exist only in the spreadsheet path.

## Phase 3 — voucher flow using locally synced masters

### Voucher creation

1. Finance selects store/company, voucher category, date, and source invoice where applicable.
2. The screen searches **local** ERP items, vendors, account codes, departments, tax codes, and currencies.
3. The system snapshots the selected ERP code/name and external ERP ID into the voucher/entry for audit history.
4. It validates account rules, VAT/WHT values, required master data, and debit = credit before the voucher can be generated.
5. The generated voucher stays local in `DRAFT` or `GENERATED` until an authorised user exports or posts it.

### Voucher export

Export approved vouchers as CSV/XLSX in a batch. Each export batch includes the mapping/template version and references the master-data sync version used to produce it.

Minimum voucher header values:

- local voucher number and source invoice number;
- voucher date, tax month, voucher category, currency, and description;
- ERP vendor ID/code, ERP account ID/code, item ID/code, department/cost centre ID/code, tax code;
- debit, credit, taxable amount, VAT amount, and reference number;
- Laco export batch ID and per-row source ID for duplicate prevention.

### Voucher posting and feedback

- **File route:** finance imports the batch to ERP and uploads/enters ERP voucher numbers and rejected-row reasons back into Laco.
- **API route:** a background job sends only approved voucher batches and records the ERP reference/status for every voucher.
- A failed or rejected voucher remains visible as `FAILED` / `NEEDS_ATTENTION`; it never disappears or silently becomes posted.

## API integration documentation plan

If ERP supports an API, create versioned documentation before coding. Add files under `docs/api/erp/`, for example:

```text
docs/api/erp/v1-master-data-sync.md
docs/api/erp/v1-voucher-posting.md
docs/api/erp/v1-reconciliation.md
docs/api/erp/templates/master-data-v1.md
docs/api/erp/templates/gl-voucher-v1.md
```

### `v1-master-data-sync.md` must define

- endpoints or extracts for items, vendors, account codes, departments, tax codes, currencies, and their branch/company scope;
- full sync vs delta sync parameters, cursor/`updated_since` behaviour, and pagination;
- primary key, code uniqueness, inactive/deleted record semantics, and timestamps;
- authentication, token rotation, rate limits, retries, timeouts, and IP/VPN requirements;
- example request/response payloads, error response schema, and API version/deprecation policy;
- reconciliation method: counts, checksums, or last-successful cursor.

### `v1-voucher-posting.md` must define

- endpoint, request payload, and required header/line fields;
- idempotency key rule, e.g. `laco:{tenant}:{voucher_id}:{revision}`;
- synchronous/asynchronous acceptance, status polling, cancel/reversal behaviour;
- returned ERP voucher number and line-level rejection format;
- retryable and non-retryable errors;
- security boundaries: credentials on the server only, never in the browser.

## Scheduled API sync design (future)

When API access is approved, run server-side scheduled jobs instead of browser-triggered lookup calls:

| Sync | Suggested cadence | Strategy |
| --- | --- | --- |
| GL account codes, tax codes | Daily + manual refresh | Full or delta; low volume, high importance |
| Vendors | Daily or every few hours | Delta by `updated_since` where available |
| Items/products | Every few hours or nightly | Delta by cursor/timestamp; full reconciliation nightly/weekly |
| Departments/cost centres | Daily | Full or delta |
| Voucher post status | Every 15–60 minutes for pending batches | Poll only outstanding submissions |

Each job needs a sync run record: start/end time, source cursor, request count, received/created/updated/inactivated/rejected counts, error summary, and next cursor. A failed sync preserves the last known good local master data.

## Data model additions

In addition to export-batch records, introduce local sync metadata for every ERP master record:

- `external_erp_id`, `erp_company_id`, `erp_code`, `name`, `active`;
- `external_updated_at`, `last_synced_at`, `sync_run_id`, `source_hash`;
- `mapping_version` where local accounting mapping is applied;
- no hard deletion for records referenced by vouchers.

Add `erp_sync_runs` with master type, source (`CSV`, `XLSX`, `API`), template/API version, status, cursor, counts, initiating user/job, timestamps, source checksum, and safe error details.

## Current application fit

The application already has local invoice and voucher records, Excel-export utilities, and an ERP feature flag (`app.erp.enabled`). An invoice provides the core export data:

- invoice number, status, issue date, date range
- marketplace/store context
- buyer name, tax ID, and address
- subtotal, VAT rate, VAT amount, grand total, and currency
- order/item counts and notes

Local GL vouchers already preserve a voucher number, ERP voucher number, voucher date, category, status, reference number, and ERP master IDs. This makes a batch-export workflow a natural fit: generate or select vouchers locally, validate them, then export or post the approved batch.

## Target workflow

```text
Invoice issued in Laco Invoice
        ↓
Finance selects a date range / store / marketplace
        ↓
System validates records and creates an export batch
        ↓
Finance reviews exceptions and approves the batch
        ↓
CSV or XLSX download  ───────────────→ manual ERP import
        ↓
Optional later: queued API submission → ERP
        ↓
Reconciliation records ERP reference and final outcome
```

The user should never wait for an ERP response while issuing an invoice.

## Phase 1 — CSV export (recommended first release)

### User experience

Add an **ERP exports** page under Vouchers or Invoices with:

- filters: store, marketplace, document date, tax month, voucher category, status
- a pre-export validation summary: ready, warning, and blocked counts
- a field-mapping/template selector, e.g. `Standard GL import`, `Customer ERP import`
- `Download CSV` and `Download Excel` actions
- an export history showing batch number, creator, created time, row count, filename, and outcome

Finance reviews the file, imports it into ERP, then enters or uploads the ERP batch/reference number. This closes the audit trail without requiring a live API connection.

### CSV rules

- UTF-8 encoding; optionally support UTF-8 with BOM if the target ERP or Excel requires it.
- Comma delimiter by default; make delimiter configurable per template.
- Dates: `YYYY-MM-DD`.
- Decimal values: `0.00`, no thousands separators.
- Never use formula values or unescaped text from customer fields.
- One stable header row and a documented template version, e.g. `laco-erp-gl-v1`.
- Use a unique `source_document_id` and `source_batch_id` so a re-import can be detected.

### Standard GL CSV layout

One row represents one GL entry. A single voucher may therefore produce multiple rows.

| Column | Required | Source / rule |
| --- | --- | --- |
| `template_version` | Yes | `laco-erp-gl-v1` |
| `source_batch_id` | Yes | Laco export batch UUID |
| `source_document_type` | Yes | `INVOICE` or `GL_VOUCHER` |
| `source_document_no` | Yes | Invoice number or voucher number |
| `source_document_id` | Yes | Immutable local database ID/UUID |
| `voucher_date` | Yes | Voucher date or invoice issue date |
| `tax_month` | Conditional | First day of tax month when required |
| `store_code` | Yes | Configured Laco/ERP store mapping |
| `marketplace` | Yes | Marketplace code/name |
| `currency` | Yes | Normally `THB` |
| `account_code` | Yes | Mapped ERP GL account code |
| `department_code` | Conditional | Mapped department/cost centre |
| `customer_code` | Conditional | ERP customer mapping |
| `tax_code` | Conditional | ERP VAT/tax code |
| `description` | Yes | Safe, truncated voucher/invoice description |
| `debit` | Yes | `0.00` or positive value |
| `credit` | Yes | `0.00` or positive value |
| `taxable_amount` | Conditional | Invoice subtotal when applicable |
| `vat_amount` | Conditional | Invoice VAT amount when applicable |
| `reference_no` | Yes | Marketplace order/invoice reference |
| `erp_voucher_no` | No | Filled after successful ERP import/post |

### Invoice summary CSV layout

Provide this as a separate finance/reporting export, not a replacement for GL entries.

| Column | Source |
| --- | --- |
| `invoice_number` | Invoice number |
| `issued_date` | `issuedAt` in the selected reporting timezone |
| `store_code` / `marketplace` | Store and marketplace mapping |
| `buyer_name` / `buyer_tax_id` | Invoice buyer data |
| `subtotal` / `vat_rate` / `vat_amount` / `grand_total` | Invoice totals |
| `currency` | Invoice currency |
| `invoice_status` | Issued, paid, void, etc. |
| `source_batch_id` | Export batch UUID |

## Phase 2 — Excel export

Generate `.xlsx` from the same export-batch data; do not make a separate business calculation path.

Workbook recommendation:

- **Summary** — batch metadata, totals, preparer, approval status, and validation counts.
- **GL Entries** — import-ready rows matching the CSV mapping.
- **Invoices** — invoice summary rows.
- **Exceptions** — records not exported and the specific reason.
- **Read me** — template version, field definitions, import steps, and support contact.

Formatting rules:

- lock formula-free data sheets if finance needs protection;
- show currency and dates as values, not locale-dependent formatted text;
- freeze header rows and enable filters;
- include batch totals so finance can reconcile before import.

## Phase 3 — asynchronous ERP API integration

Only proceed once the ERP owner provides a supported, versioned API and an agreed idempotency rule.

### API behaviour

- The UI creates an approved export batch; it does not call ERP directly.
- A background worker posts the batch or its vouchers.
- Use an idempotency key such as `laco:{tenant}:{source_document_type}:{source_document_id}:{revision}`.
- Send at a controlled rate and retry only transient failures.
- Store the ERP response reference, request timestamp, retry count, response code, and safe error message.
- A permanent validation error goes to **Needs attention**, not an automatic retry loop.
- ERP API outages must not change an issued invoice or make it unavailable.

### Required ERP API contract

Before coding, document and agree on:

1. base URL, environments, authentication method, token rotation, and IP/VPN requirements;
2. API version and deprecation policy;
3. create/update/cancel behaviour for invoices and vouchers;
4. idempotency support and duplicate handling;
5. required master-data IDs and how account, customer, department, tax, and item mappings are maintained;
6. limits: maximum entries per request, rate limit, timeouts, and batch size;
7. synchronous vs asynchronous response and status-polling endpoint;
8. error schema, validation messages, and retryable status codes;
9. reconciliation/reporting endpoint or reference number returned after posting.

### Internal API documentation to publish

When Phase 3 starts, add a versioned document such as `docs/api/erp/v1-batch-export.md` with:

- endpoints for creating, reviewing, downloading, approving, retrying, and reconciling an export batch;
- request/response examples and validation errors;
- authorization rules (`finance.export`, `finance.approve`, `finance.reconcile`);
- idempotency and pagination behaviour;
- CSV/XLSX template schema and versioning;
- a change log.

Do not expose ERP credentials or a direct ERP proxy endpoint to the browser.

## Data model additions

Add local, tenant/store-scoped tables. Names are illustrative.

### `erp_export_batches`

- `id` / `batch_uuid`
- `template_key`, `template_version`, `format` (`CSV`, `XLSX`, `API`)
- selected filters and source period
- `status`: `DRAFT`, `VALIDATED`, `APPROVED`, `EXPORTED`, `SUBMITTING`, `POSTED`, `PARTIALLY_POSTED`, `FAILED`, `RECONCILED`, `CANCELLED`
- record count, debit total, credit total, invoice total
- generated filename, checksum, storage key
- created/approved/exported/reconciled timestamps and user IDs
- ERP batch/reference number and safe error summary

### `erp_export_batch_items`

- batch ID and source document type/ID
- source revision or content hash
- validation status and messages
- export sequence number
- ERP external reference, item status, attempt count, and last attempted time

### Mapping configuration

Keep mapping data local and versioned:

- store → ERP company/branch/store code
- marketplace/payment type → revenue, receivable, fee, and clearing accounts
- VAT rate/type → ERP tax code
- SKU/product/category → ERP item and revenue account
- optional customer/vendor and department/cost centre mappings

Mappings must be effective-dated where accounting periods require it. Export batches must record the mapping version used.

## Validation and reconciliation

Block export when:

- debit and credit totals do not balance;
- required ERP account, tax, store, or customer mapping is missing;
- invoice/voucher is voided, not issued, or already exported without an authorised re-export;
- currency or VAT data is invalid;
- a source document appears twice in the same batch.

Warn, but permit an authorised user to continue, when:

- buyer tax ID or optional cost centre is missing;
- description exceeds target ERP length and will be safely truncated;
- a document was previously exported but has a new revision.

Reconciliation should compare Laco batch totals, ERP import/post totals, and the count of accepted/rejected items. Never mark a whole batch as posted solely because one API request returned HTTP 200.

## Security and operations

- Keep ERP credentials only on the server, in secret management or environment configuration.
- Encrypt files at rest if they contain buyer data; use short-lived signed downloads.
- Limit export and approval roles; log who generated, downloaded, approved, retried, and reconciled each batch.
- Redact tax IDs, credentials, and full ERP payloads from application logs.
- Set retention periods for files and audit records with finance/compliance approval.
- Monitor failed batches, queue age, retry counts, and reconciliation differences.

## Delivery plan

| Milestone | Scope | Acceptance criteria |
| --- | --- | --- |
| 1. Discovery | ERP import template, mappings, finance approval flow | Finance signs off on sample CSV columns and balancing rules. |
| 2. Batch foundation | Batch/item tables, validation service, audit log | A batch can be created without changing invoice state. |
| 3. CSV export | Standard GL and invoice-summary CSV | Finance imports a test batch; totals and row counts reconcile. |
| 4. XLSX export | Workbook using the same batch data | Finance can review Summary, GL Entries, and Exceptions without manual reshaping. |
| 5. Reconciliation | ERP reference capture, exceptions, re-export controls | Every exported source document can be traced to a batch and outcome. |
| 6. API pilot (optional) | Queued ERP posting for one store/template | ERP outage does not block invoices; retries are idempotent and auditable. |

## Open decisions for finance and ERP owners

1. Which ERP import template is the source of truth: one GL-entry file, one invoice file, or both?
2. Is the accounting handoff daily, weekly, or monthly, and who approves it?
3. Which document statuses are eligible for export, and how are cancellations/credit notes handled?
4. Which mappings are mandatory before export?
5. How should duplicate imports and corrected invoices be represented in ERP?
6. Is API access reliable enough for a pilot, or should file exchange remain the operational standard?

## Recommendation

Start with a **versioned CSV export plus Excel review workbook**, backed by local export batches and reconciliation. It provides the fastest reliable value, avoids an ERP dependency during invoice issuance, and creates the exact foundation needed for a safe asynchronous API integration later.
