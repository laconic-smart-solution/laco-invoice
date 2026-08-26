I have approved the **Order History / Audit Trail database design**.

Please now implement the feature in the existing project.

Before changing anything, inspect the existing codebase and follow its current architecture, naming conventions, coding style, database migration approach, authentication/user handling, API patterns, and frontend structure.

Do not rewrite unrelated code.

# 1. Approved Architecture

Implement:

```text
lco_orders
    │
    │ 1:N
    ▼
order_history
    │
    │ 1:N
    ▼
order_history_changes
```

`order_history` also references:

```text
order_history.performed_by_user_id
        ↓
users.id
```

and, when the source is Excel:

```text
order_history.import_file_id
        ↓
order_import_files.id
```

Reuse the existing:

* `lco_orders`
* `users`
* `order_import_files`

Do not create another Excel import table.

The existing Excel import filename is:

```text
order_import_files.original_filename
```

The existing Import Detail route is:

```text
/orders/imports/{importFileId}
```

Use the existing Import ID for navigation rather than the filename.

---

# 2. History Sources

The `order_history.source` field must support ONLY:

```text
MANUAL
IMPORT_EXCEL
```

Do not introduce:

```text
WEB
API
IMPORT
SYNC
SYSTEM
```

For manual operations:

```text
source = MANUAL
import_file_id = NULL
```

For Excel operations:

```text
source = IMPORT_EXCEL
import_file_id = existing order_import_files.id
```

Make sure the database constraint reflects this rule.

---

# 3. History Actions

Support:

```text
CREATE
UPDATE
DELETE
```

Use the existing project conventions for enum handling, but the database representation should be compatible with:

```text
CREATE
UPDATE
DELETE
```

---

# 4. Database Migration

Create the appropriate database migration using the project's existing migration framework.

Do not manually change the database outside the project's normal migration mechanism.

Create:

## `order_history`

Required conceptual fields:

```text
id
order_id
action
source
performed_by_user_id
performed_at
import_file_id
note
created_at
```

Requirements:

* `id` = BIGINT IDENTITY / existing project ID convention
* `order_id` = FK to `lco_orders.id`
* `action` = CREATE / UPDATE / DELETE
* `source` = MANUAL / IMPORT_EXCEL
* `performed_by_user_id` = FK to `users.id`
* `performed_at` = timestamp with timezone / project `Instant` convention
* `import_file_id` = nullable FK to `order_import_files.id`
* `note` = nullable
* `created_at` = insert timestamp

Add the approved constraints:

```text
source IN ('MANUAL', 'IMPORT_EXCEL')
```

```text
action IN ('CREATE', 'UPDATE', 'DELETE')
```

and:

```text
IMPORT_EXCEL → import_file_id IS NOT NULL
MANUAL       → import_file_id IS NULL
```

Do not cascade-delete history when an order is deleted.

History must be preserved.

---

# 5. `order_history_changes`

Create:

```text
id
history_id
field_name
field_label_key
old_value
new_value
value_type
```

Requirements:

* `history_id` → `order_history.id`
* `field_name` = stable machine field name
* `field_label_key` = optional frontend/i18n label key
* `old_value` = nullable
* `new_value` = nullable
* `value_type` = required

Use canonical string representation for old/new values.

Examples:

```text
PENDING
COMPLETED
167.30
180.50
John
John Smith
```

Support:

```text
NULL → value
value → NULL
value → value
```

Add a unique constraint:

```text
(history_id, field_name)
```

so one history event cannot contain the same field twice.

---

# 6. Indexes

Add the approved indexes:

```text
(order_id, performed_at DESC, id DESC)
(import_file_id)
(performed_by_user_id)
(source, performed_at)
(action, performed_at)
```

and:

```text
order_history_changes(history_id)
```

plus:

```text
UNIQUE(history_id, field_name)
```

Use the project's actual database/index naming conventions.

---

# 7. Immutability

Order history is an audit trail.

Once created:

* Do not update history records.
* Do not update history change records.
* Do not soft-delete history.
* Do not expose normal CRUD endpoints for modifying history.
* Do not allow history records to be overwritten.

History should be append-only.

---

# 8. User Tracking

Use the existing authenticated user / `AuditUserContext` mechanism.

Do not create another user system.

For every MANUAL operation, identify the current user:

```text
order_history.performed_by_user_id
        ↓
users.id
```

Display:

```text
users.full_name
```

with the existing fallback behavior if appropriate.

For Excel imports, use the user who performed/imported the Excel operation.

Do not store username/full name as duplicated text in `order_history`.

---

# 9. Field Audit Allowlist

For v1, do NOT automatically audit every database column.

Create a clear audit field allowlist based on the approved design.

Start with:

```text
order_status
order_substatus
total_amount
subtotal
shipping_fee
amount_ex_vat
vat_amount
currency
order_date
buyer_message
seller_note
```

Also evaluate the existing order model and include:

```text
customer_name
customer_phone
```

only if these are actually represented as order-level fields and are appropriate to audit.

Do not invent fields that don't exist.

Before implementing the allowlist, inspect the existing `lco_orders` entity/table and map the real field names.

---

# 10. Manual Order History

Implement history recording for manual order operations.

When a user manually creates an order:

```text
action = CREATE
source = MANUAL
import_file_id = NULL
```

When a user manually updates an order:

```text
action = UPDATE
source = MANUAL
import_file_id = NULL
```

Only record fields whose values actually changed.

For example:

```text
Order Status:
PENDING → COMPLETED

Total Amount:
167.30 → 180.50

Customer Name:
John → John Smith
```

must create:

```text
ONE order_history record
```

and:

```text
THREE order_history_changes records
```

All three changes must share:

```text
history_id
performed_by_user_id
performed_at
source
action
```

Do NOT create three separate history events.

---

# 11. No-Op Updates

If an update does not actually change any audited field:

```text
old value == new value
```

do not create an unnecessary history event.

For example:

```text
PENDING → PENDING
```

should not create a history record.

---

# 12. Excel Import History

Inspect the existing Excel import implementation carefully.

Find the exact point where an Excel import is committed and orders are:

* Created
* Updated
* Merged
* Replaced

Add history recording at the correct business-transaction level.

For Excel-created orders:

```text
action = CREATE
source = IMPORT_EXCEL
import_file_id = order_import_files.id
```

For Excel-updated orders:

```text
action = UPDATE
source = IMPORT_EXCEL
import_file_id = order_import_files.id
```

The history must reference the actual durable:

```text
order_import_files.id
```

Do not use:

```text
order_import_batches.id
order_input_runs.id
filename
```

as the primary history import reference.

The approved design specifically uses `order_import_files` as the canonical import record.

---

# 13. Excel Import Transaction Safety

This is very important.

History records must be created in the same logical transaction as the order changes whenever the existing import architecture supports this.

If the Excel import fails and the order changes are rolled back:

**the history must also be rolled back.**

Do not create history for an operation that ultimately failed.

If an Excel import changes nothing for an existing order:

```text
old values == new values
```

do not create an UPDATE history event.

---

# 14. Import Filename

Do NOT copy:

```text
original_filename
```

into `order_history`.

Retrieve it through:

```text
order_history.import_file_id
        ↓
order_import_files.id
        ↓
order_import_files.original_filename
```

This avoids duplicated filenames and ensures the filename always comes from the canonical import record.

---

# 15. Backend API

After the database and history recording are implemented, add the API required by the frontend.

Follow the existing API architecture and naming conventions.

At minimum, provide an endpoint to retrieve an order's history.

The API should return grouped history events rather than a completely flat list.

Conceptually:

```text
Order
  ├── History Event
  │     ├── Updated By
  │     ├── Updated At
  │     ├── Action
  │     ├── Source
  │     ├── Import ID
  │     ├── Excel Filename
  │     └── Changes[]
  │
  └── History Event
        ├── ...
        └── Changes[]
```

Each change should contain:

```text
field
before
after
```

The history event should contain:

```text
id
action
source
updatedBy
updatedAt
importFileId
excelFileName
changes
```

Do not expose unnecessary internal database fields.

---

# 16. Pagination

History can grow significantly.

Implement pagination using the project's existing pagination conventions.

Default:

```text
newest first
```

Sort by:

```text
performed_at DESC
id DESC
```

The frontend should not load an unlimited number of history records.

---

# 17. Frontend — Order List

In the existing Order Management list, locate the existing:

```text
(...)
```

action menu.

Add:

```text
History
```

without changing the existing actions.

The flow should be:

```text
Order List
   ↓
(...)
   ↓
History
```

---

# 18. Frontend — Order History

When the user clicks History, open the appropriate existing page/modal/drawer pattern used by the application.

Follow the current UI design system.

Display history grouped by event.

For example:

```text
August 26, 2026 — 09:30

Updated by: Admin Laconic
Source: MANUAL
Action: UPDATE

Field              Before       After
------------------------------------------------
Order Status       PENDING      COMPLETED
Total Amount       167.30       180.50
Customer Name      John         John Smith
```

Do not create one row per event without showing the individual field changes.

---

# 19. Excel Import History UI

When:

```text
source = IMPORT_EXCEL
```

show:

```text
Source: IMPORT_EXCEL
Excel File: orders_august_26.xlsx
```

The filename must be clickable.

Clicking it must navigate using:

```text
importFileId
```

to:

```text
/orders/imports/{importFileId}
```

Do not construct the URL using the filename.

Do not search for the import by filename.

---

# 20. Manual History UI

When:

```text
source = MANUAL
```

show:

```text
Source: MANUAL
```

Do not show an Excel file link.

---

# 21. UI Handling for CREATE

For CREATE events, old values will normally be:

```text
NULL
```

and new values contain the initial values.

Display them clearly.

Example:

```text
Order Status
Before: —
After: PENDING
```

Use the frontend's existing empty/null display convention if one exists.

---

# 22. UI Handling for DELETE

If DELETE history is implemented for an order:

```text
action = DELETE
```

show the appropriate final/previous values according to the backend data available.

Do not break the history page if the order itself has been soft deleted.

History should remain accessible where the application architecture allows it.

---

# 23. Error Handling

Implement appropriate handling for:

* Order does not exist
* History does not exist
* Invalid order ID
* Invalid import ID
* Deleted/disabled user
* Missing import file
* Import history with invalid reference
* Permission denied

Do not expose stack traces or database errors to the frontend.

Follow the existing project's error-handling pattern.

---

# 24. Authorization

Use the existing authentication and authorization mechanism.

Do not create a new permission system.

A user should only be able to view history for orders they are already authorized to access.

Apply the same order-access rules used by the existing Order Management page/API.

---

# 25. Testing

Add appropriate tests following the existing project conventions.

At minimum test:

### Manual

1. Manual CREATE creates history.
2. Manual UPDATE creates one event.
3. Multiple changed fields create multiple change rows under one event.
4. No-op update creates no history.
5. MANUAL has `import_file_id = NULL`.
6. Correct user is recorded.

### Excel

7. Excel CREATE creates `IMPORT_EXCEL` history.
8. Excel UPDATE creates `IMPORT_EXCEL` history.
9. Correct `import_file_id` is recorded.
10. Correct filename is returned through the import relationship.
11. Multiple orders from one Excel file reference the same import ID.
12. Failed import does not leave incorrect history.
13. No-op Excel update creates no history.

### API

14. History returns newest events first.
15. History pagination works.
16. Field changes are grouped by history event.
17. Import filename is returned for `IMPORT_EXCEL`.
18. Import filename is absent/null for `MANUAL`.

### Frontend

19. History action appears in the order `(...)` menu.
20. Clicking History loads the correct order history.
21. Before/After values display correctly.
22. Updated By and Updated At display correctly.
23. MANUAL displays correctly.
24. IMPORT_EXCEL displays correctly.
25. Excel filename is clickable.
26. Clicking Excel filename navigates to the correct Import Detail page.

---

# 26. Important Implementation Rules

Before coding each part, inspect the existing implementation.

Do not assume the existing Excel import flow works the way you expect.

Find the actual:

* Order creation service
* Order update service
* Excel import service
* Excel commit logic
* Current user context
* Order controller
* Order frontend list
* Existing action menu component
* Existing routing
* Existing pagination pattern
* Existing database migration system

Reuse existing infrastructure wherever possible.

Do not duplicate business logic.

---

# 27. Implementation Order

Implement in this order:

### Phase 1 — Database

1. Create migrations.
2. Create `order_history`.
3. Create `order_history_changes`.
4. Add indexes.
5. Add constraints.
6. Verify migration.

### Phase 2 — Backend Domain

7. Create entities/models.
8. Create repositories/data access.
9. Create history recording service.
10. Implement field-diff logic.
11. Implement user tracking.
12. Implement import tracking.

### Phase 3 — Manual Operations

13. Integrate CREATE history.
14. Integrate UPDATE history.
15. Integrate DELETE history if applicable.
16. Add tests.

### Phase 4 — Excel Import

17. Integrate history into Excel commit flow.
18. Ensure correct `order_import_files.id`.
19. Ensure transaction rollback behavior.
20. Add tests.

### Phase 5 — History API

21. Create history endpoint.
22. Create response DTOs.
23. Add pagination.
24. Add authorization.
25. Add API tests.

### Phase 6 — Frontend

26. Add History to the existing `(...)` menu.
27. Create Order History UI.
28. Display grouped events.
29. Display Before/After values.
30. Display Updated By / Updated At.
31. Display Source.
32. Display Excel filename for `IMPORT_EXCEL`.
33. Make Excel filename clickable.
34. Navigate to existing Import Detail page.
35. Add loading/empty/error states.

### Phase 7 — Final Verification

36. Run backend tests.
37. Run frontend tests/lint/build.
38. Test manual order update.
39. Test Excel import.
40. Test history display.
41. Test Excel Import Detail navigation.
42. Verify no unrelated functionality was changed.

---

# 28. Do Not Over-Engineer

For v1:

* Do not implement JSON snapshots.
* Do not implement marketplace API history.
* Do not implement order-item history.
* Do not create another import table.
* Do not duplicate Excel filenames.
* Do not audit every database column automatically.
* Do not create a separate audit system if the existing architecture can support this cleanly.

Use the approved **event + field-diff architecture**.

---

# 29. Final Expected Architecture

The completed implementation should conceptually be:

```text
┌─────────────────┐
│   lco_orders    │
└────────┬────────┘
         │ 1:N
         ▼
┌──────────────────────────┐
│     order_history        │
│                          │
│ id                       │
│ order_id                 │
│ action                   │
│ source                   │
│ performed_by_user_id    │
│ performed_at             │
│ import_file_id           │
│ note                     │
└───────┬──────────┬───────┘
        │          │
        │ 1:N      │ N:1
        ▼          ▼
┌────────────────┐ ┌─────────────────────┐
│order_history_  │ │       users         │
│changes         │ └─────────────────────┘
│                │
│history_id      │
│field_name      │
│old_value       │
│new_value       │
│value_type      │
└────────────────┘

order_history.import_file_id
        │
        │ N:1
        ▼
┌─────────────────────────┐
│   order_import_files    │
│                         │
│ id                      │
│ original_filename       │
│ ...                     │
└─────────────────────────┘
```

# Final Instruction

Implement this feature completely, but **only within the scope described above**.

First inspect the existing codebase and identify the exact files/classes/modules that need to change.

Then implement the feature following the project's existing architecture and conventions.

Do not rewrite unrelated functionality.

After implementation, provide a concise summary of:

1. Files changed
2. Database migrations added
3. Backend changes
4. Frontend changes
5. Tests added
6. Any assumptions or decisions made
7. Any remaining issues
