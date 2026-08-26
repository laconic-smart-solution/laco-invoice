# Order History / Audit Trail — Database Design Proposal

**Status:** Design only — no implementation yet  
**Scope:** Database structure, ER diagram, relationships, and architecture  
**Do not implement** entities, migrations, APIs, or frontend until this design is approved.

---

## 1. Existing Database Analysis

### What already exists (reuse)

| Area | Table | Role for history |
|------|--------|------------------|
| Order | `lco_orders` | Subject of history (`id` Long IDENTITY) |
| Order lines | `order_items` | Related; optional later audit scope |
| Customer | `customers_info` | Separate entity; order points via `customer_id` |
| Excel import (canonical) | `order_import_files` | **This is the Import ID** for clickable filename (`original_filename`, `imported_orders`, `imported_items`, `status`) |
| Import preview | `order_import_batches`, `order_import_preview_orders`, `order_import_preview_items` | Temporary; after commit, real provenance is `order_import_files` |
| Dual-file run | `order_input_runs` | Links to `order_detail_import_file_id` → `order_import_files`; not needed as history FK |
| Withdraw rows | `order_withdraw_import_rows` | Settlement money; currently not the main mutator of `lco_orders` fields |
| User | `users` | Actor (`id`, `full_name`, `email`) |
| Store / MP | `stores`, `marketplaces` | Context on order; not required on every history row |

### How imports already link to orders

- On Excel commit: `lco_orders.source_type = 'IMPORT'`, `lco_orders.source_id = order_import_files.id` (app convention, **no DB FK**).
- UI import detail route already uses Import ID: `/orders/imports/{importFileId}`.
- Filename lives on `order_import_files.original_filename` — do **not** copy into history.

### Soft audit today (not enough)

`MasterEntity` stamps `created_at` / `updated_at` / `created_by` / `updated_by` + soft delete `is_enable`.

That is **not** field-level history: no before/after, no multi-field event, no import FK for display.

### Existing history/revision tables

**None.** No Envers / `_AUD` / revision tables.

### Conventions to follow

- Tables: snake_case (`order_import_files`, …); order table outlier `lco_orders`
- IDs: `Long` IDENTITY
- Timestamps: `Instant` → `created_at` / `updated_at`
- User refs: local `users.id` (same as `AuditUserContext`)
- FKs: often logical (`NO_CONSTRAINT`); history should still declare clear FK columns
- Enums: STRING for import/source-like values

---

## 2. Requirements Understanding

| Need | Design implication |
|------|-------------------|
| Row action → History | Query by `order_id`, newest first |
| One update → many fields | Event header + change rows |
| Sources only `MANUAL` \| `IMPORT_EXCEL` | Separate from `Order.source_type` (`API`/`IMPORT`) |
| Import clickable by ID | Nullable FK → `order_import_files.id` |
| 1 import → many orders | Many history events can share one `import_file_id` |
| CREATE / UPDATE / DELETE | `action` on event |
| Updated By | FK → `users.id` |
| NULL ↔ value | Nullable old/new text (or typed) columns |

**Out of scope unless approved later:** marketplace API sync (`OrderSourceType.API`), withdraw-row-only money, full line-item matrix history.

### Intended frontend flow (future)

```text
Order Management
      ↓
Order Row
      ↓
(...) Action Menu → History
      ↓
Order History page
      ↓
(if Source = IMPORT_EXCEL)
Excel File: orders_august_26.xlsx  (clickable)
      ↓
/orders/imports/{import_file_id}
```

---

## 3. Recommended Architecture

**Event + field-diff (Option B), two new tables, reuse existing import + user.**

```text
lco_orders  ──1:N──►  order_history  ──1:N──►  order_history_changes
                           │
                           ├── N:1 ► users
                           └── N:1 ► order_import_files   (when source = IMPORT_EXCEL)
```

- **`order_history`**: one immutable “event” (who / when / action / source / optional import).
- **`order_history_changes`**: one row per changed field (before / after).
- **Do not** invent a new Excel import table.
- **Do not** put `original_filename` on history.
- History tables should be **append-only** (not soft-deleted `MasterEntity` rows).

Frontend can build:

```text
History event (shared Updated By / At / Source)
  + join users.full_name
  + if IMPORT_EXCEL: join order_import_files for filename + link /orders/imports/{id}
  + list of field changes
```

---

## 4. ER Diagram

```text
┌────────────────────┐         ┌─────────────────────┐
│     lco_orders     │         │       users         │
│  (existing)        │         │     (existing)      │
└─────────┬──────────┘         └──────────▲──────────┘
          │ 1:N                            │ N:1
          ▼                                │
┌──────────────────────────────────────────┴──────────┐
│                   order_history                      │
│  id, order_id, action, source, performed_by_user_id, │
│  performed_at, import_file_id (nullable), …          │
└─────────┬───────────────────────────────┬────────────┘
          │ 1:N                           │ N:1 (nullable)
          ▼                               ▼
┌─────────────────────────┐   ┌──────────────────────────┐
│ order_history_changes   │   │   order_import_files     │
│ history_id, field_name, │   │   (existing Excel        │
│ old_value, new_value,   │   │    import record)        │
│ value_type, …           │   │   original_filename, …   │
└─────────────────────────┘   └──────────────────────────┘

Existing (context only — not new history FKs required):
  order_input_runs.order_detail_import_file_id → order_import_files
  lco_orders.source_id → order_import_files.id  (convention today)
```

---

## 5. Table Design

### New: `order_history`

| Column | Type (conceptual) | Null | Default | PK/FK/Unique |
|--------|-------------------|------|---------|--------------|
| `id` | BIGINT IDENTITY | NO | — | PK |
| `order_id` | BIGINT | NO | — | FK → `lco_orders.id` |
| `action` | VARCHAR(20) | NO | — | `CREATE` \| `UPDATE` \| `DELETE` |
| `source` | VARCHAR(20) | NO | — | `MANUAL` \| `IMPORT_EXCEL` |
| `performed_by_user_id` | BIGINT | YES* | — | FK → `users.id` |
| `performed_at` | TIMESTAMP WITH TZ | NO | — | — |
| `import_file_id` | BIGINT | YES | — | FK → `order_import_files.id` |
| `note` | VARCHAR(500) | YES | — | optional |
| `created_at` | TIMESTAMP WITH TZ | NO | now | insert-only stamp |

\*Nullable only if system/job has no user; prefer NOT NULL for interactive MANUAL/IMPORT.

**Check constraints (recommended):**

- `source IN ('MANUAL','IMPORT_EXCEL')`
- `action IN ('CREATE','UPDATE','DELETE')`
- `(source = 'IMPORT_EXCEL' AND import_file_id IS NOT NULL) OR (source = 'MANUAL' AND import_file_id IS NULL)`

### New: `order_history_changes`

| Column | Type | Null | Default | PK/FK/Unique |
|--------|------|------|---------|--------------|
| `id` | BIGINT IDENTITY | NO | — | PK |
| `history_id` | BIGINT | NO | — | FK → `order_history.id` |
| `field_name` | VARCHAR(100) | NO | — | stable key, e.g. `order_status` |
| `field_label_key` | VARCHAR(150) | YES | — | optional i18n key |
| `old_value` | VARCHAR(2000) / CLOB | YES | — | NULL = was empty |
| `new_value` | VARCHAR(2000) / CLOB | YES | — | NULL = cleared |
| `value_type` | VARCHAR(20) | NO | `'STRING'` | see §6 |

**Unique (recommended):** `(history_id, field_name)` — one row per field per event.

### Reused (no redesign)

- `order_import_files` — Import ID + `original_filename`
- `users` — actor display name
- `lco_orders` — no required schema change for v1 (optional later: keep `source_id` in sync)

---

## 6. Column-by-Column Explanation

### `order_history`

| Column | Purpose |
|--------|---------|
| `id` | History event id |
| `order_id` | Which order |
| `action` | CREATE / UPDATE / DELETE |
| `source` | MANUAL / IMPORT_EXCEL only |
| `performed_by_user_id` | Who; join `users.full_name` for “Admin Laconic” |
| `performed_at` | When the business change happened |
| `import_file_id` | Exact import for click-through; null if MANUAL |
| `note` | Optional (“bulk replace”, etc.) |
| `created_at` | Row insert time (may equal `performed_at`) |

### `order_history_changes`

| Column | Purpose |
|--------|---------|
| `field_name` | Machine key: `order_status`, `total_amount`, `customer_name`, … |
| `old_value` / `new_value` | Canonical string form of before/after; both null disallowed as a pair of equals |
| `value_type` | How to interpret for UI: `STRING`, `INTEGER`, `DECIMAL`, `BOOLEAN`, `DATE`, `DATETIME`, `ENUM`, `JSON`, `TEXT` |

**Value storage recommendation:** store **canonical strings** (e.g. decimals as plain decimal text, enums as enum names, datetimes as ISO-8601). Keeps one simple UI table and avoids polymorphic typed columns. Use larger type (CLOB) only for rare huge JSON fields if audited.

---

## 7. Order → History Relationship

- Cardinality: **1 order : N history events**
- Access path: `WHERE order_id = ? ORDER BY performed_at DESC, id DESC`
- CREATE: usually one event with many “NULL → value” change rows (or a compact CREATE rule — see edge cases)
- UPDATE: one event + only changed fields
- DELETE: one event; optional snapshot of last values as `old_value` with `new_value` NULL

---

## 8. History → Field Changes Relationship

```text
One user click / one import commit for one order
        ↓
one order_history row
        ↓
N order_history_changes rows (same Updated By / At / Source)
```

UI groups by `history_id` so Status + Amount + Customer Name share one header — matches the “one history event, multiple field changes” requirement.

---

## 9. History → Excel Import Relationship

```text
order_history.import_file_id  →  order_import_files.id
order_import_files.original_filename  →  display text
```

Navigation:

```text
/orders/imports/{import_file_id}
```

Rules:

- `IMPORT_EXCEL` ⇒ `import_file_id` required
- `MANUAL` ⇒ `import_file_id` null
- Never key navigation by filename

One import file can appear on many orders’ history (one commit, many order events).

Prefer **`order_import_files`**, not `order_import_batches` or `order_input_runs`, because:

- commit creates the durable file record
- UI already uses `/orders/imports/:importFileId`
- filename and counts live there

---

## 10. History → User Relationship

```text
order_history.performed_by_user_id → users.id
```

Display: `users.full_name` (fallback `email`).

Align with existing `AuditUserContext` / `created_by` / `updated_by` local user id — do not store auth-server id on history.

---

## 11. Indexes & Constraints

### Indexes

| Index | Columns | Why |
|-------|---------|-----|
| `ix_oh_order_perf` | `(order_id, performed_at, id)` | Primary History page query (≤30 chars for Oracle) |
| `ix_oh_import_file` | `(import_file_id)` | “What did this import change?” / integrity |
| `ix_oh_user` | `(performed_by_user_id)` | User activity audits |
| `ix_oh_source_perf` | `(source, performed_at)` | Filter MANUAL vs IMPORT over time |
| `ix_oh_action_perf` | `(action, performed_at)` | Optional ops reporting |
| `ix_ohc_history` | `(history_id)` | Load all fields for an event |
| `ux_ohc_hist_field` | `(history_id, field_name)` UNIQUE | No duplicate field rows |

### Constraints

- CHECK on `source` / `action`
- CHECK import_file_id nullability vs source
- FK `order_id`, `performed_by_user_id`, `import_file_id`, `history_id`
- ON DELETE for `order_id`: prefer **RESTRICT** (keep audit) or soft-delete orders only; do not cascade-wipe history
- ON DELETE for `import_file_id`: prefer **RESTRICT** or SET NULL only if you accept orphan IMPORT_EXCEL without link (RESTRICT is safer for audit)

### Immutability

- History rows should **never be updated** after insert.
- Prefer **no application deletes**; retention via archive policy if needed later.
- Do not map these tables to soft-delete `MasterEntity` patterns that rewrite `updated_at` / `is_enable`.

### Sensitive data

- Prefer an **allowlist** of audited fields rather than logging every column.
- Consider excluding or masking phone / address / PII in `old_value` / `new_value`.
- Customer data lives on `customers_info`; only audit customer fields when product requirements demand it.

---

## 12. Example Database Records

Assume `users.id = 1` (Admin Laconic), `lco_orders.id = 5841`, `order_import_files.id = 1001`, filename `orders_august_26.xlsx`.

### Case 1 — Manual CREATE

`order_history`:  
`action=CREATE`, `source=MANUAL`, `import_file_id=NULL`, `performed_by_user_id=1`

`order_history_changes` (examples):

| field_name | old_value | new_value |
|------------|-----------|-----------|
| order_status | NULL | PENDING |
| total_amount | NULL | 167.30 |
| customer_name | NULL | John |

### Case 2 — Manual UPDATE

`order_history`:  
`action=UPDATE`, `source=MANUAL`, `import_file_id=NULL`

`order_history_changes`:

| field_name | old_value | new_value |
|------------|-----------|-----------|
| order_status | PENDING | COMPLETED |
| total_amount | 167.30 | 180.50 |
| customer_name | John | John Smith |

### Case 3 — Excel CREATE

`order_history`:  
`action=CREATE`, `source=IMPORT_EXCEL`, `import_file_id=1001`

Changes: initial field set as NULL → values (from import).  
UI: Excel File = join `#1001` → `orders_august_26.xlsx`.

### Case 4 — Excel UPDATE (MERGE/REPLACE)

`order_history`:  
`action=UPDATE`, `source=IMPORT_EXCEL`, `import_file_id=1001`

| field_name | old_value | new_value |
|------------|-----------|-----------|
| order_status | PENDING | COMPLETED |
| total_amount | 167.30 | 180.50 |

Same `import_file_id` for Order B/C/D under that file.

---

## 13. History Storage Comparison

| Criterion | A JSON snapshot | B Field-level (event + changes) | C Hybrid |
|-----------|-----------------|----------------------------------|----------|
| DB size | Large | Smallest for diffs | Largest |
| Query “what changed?” | App must diff | Native | Native + redundant |
| History UI (Field / Before / After) | Awkward | Natural | Natural |
| Auditability | Full state | Exact fields | Full + fields |
| Debugging full state | Best | Need replay | Best |
| New order fields | Flexible JSON | Add field names only | Both |
| Integrity | Hard to validate | Easy CHECK/unique | Harder |
| Scale (millions) | Heavier | Best | Worst |
| FE / BE effort | Diff logic heavy | Straightforward | Most work |
| Exact changed fields | Must compute | Stored | Stored |

---

## 14. Final Recommendation

**Recommend Option B: `order_history` + `order_history_changes`, FK to existing `order_import_files` and `users`.**

Why for Laco Invoice:

1. Matches the History UI (Field / Before / After / By / At / Source).
2. One event → many fields without fake duplicate events.
3. Import click-through uses real Import ID already used by `/orders/imports/{id}`.
4. Avoids duplicating filenames.
5. Scales better than full JSON snapshots.
6. No suitable existing history table to extend.

Optional later (not v1): archive JSON blob on CREATE/DELETE only if you need full reconstruct without replaying all diffs.

---

## 15. Potential Edge Cases

1. **API marketplace sync** — today `source_type=API`; history sources forbid `API`/`SYNC`. Decide: no history for sync yet, or expand sources later.
2. **CREATE verbosity** — logging every field as NULL→value can be huge; optional “CREATE summary” with only key fields, or store CREATE with empty changes + note.
3. **Customer fields** — live on `customers_info`; either audit as logical order fields (`customer_name`) when order UI shows them, or exclude until customer history exists.
4. **Line items** — MERGE/REPLACE can change many SKUs; recommend **v1 = order header only**; item history as phase 2 (`entity_type`/`entity_id` or separate table).
5. **Withdraw Excel** — updates settlement rows more than `lco_orders`; don’t force `IMPORT_EXCEL` onto order history unless Order columns actually change.
6. **Same filename, different imports** — solved by Import ID.
7. **User deleted** — keep `performed_by_user_id`; show “Unknown user” if missing. Prefer no hard delete of users.
8. **No-op import** — if MERGE changes nothing, write **no** history event.
9. **REPLACE with invoice block** — no history if update aborted.
10. **Clock skew** — use server `Instant` for `performed_at`.

---

## 16. Decisions Needed Before Implementation

Please confirm:

1. **Approve two new tables** `order_history` + `order_history_changes` (names OK?).
2. **Import FK target** = `order_import_files.id` (recommended).
3. **Sources strictly** `MANUAL` | `IMPORT_EXCEL` — API sync out of scope for v1?
4. **CREATE logging**: all fields vs selected important fields?
5. **Customer fields** in order history: yes (denormalized labels) or no?
6. **Order items** in v1: exclude?
7. **DELETE action**: soft-delete order only today — still emit DELETE history?
8. **Immutable policy**: no UPDATE/DELETE on history tables (app + DB grants)?
9. **Sensitive fields**: exclude phone/address from audit, or mask?
10. **Initial field allowlist** for v1 (suggested):
    `order_status`, `order_substatus`, `total_amount`, `subtotal`, `shipping_fee`, `amount_ex_vat`, `vat_amount`, `currency`, `order_date`, `buyer_message`, `seller_note`, and optionally `customer_name` / `customer_phone`.

---

Once these decisions are approved (especially 1–6 and 10), implementation can proceed step by step: schema → backend writers on import/manual paths → History menu + page.
