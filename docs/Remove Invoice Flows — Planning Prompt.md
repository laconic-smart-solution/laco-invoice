Create a **PLAN.md** file for removing **all Invoice-related flows** from this application.

### IMPORTANT

**DO NOT WRITE OR MODIFY ANY APPLICATION CODE.**

This task is **planning and analysis only**.

Do not modify:

- Backend code
- Frontend code
- Database migrations
- Database schema
- API endpoints
- Entities
- DTOs
- Services
- Controllers
- Repositories
- React components
- TypeScript files
- Routes
- Configuration files

The only file you should create or modify is:

```text
PLAN.md
```

---

# Objective

Analyze the entire application and create a detailed implementation plan for completely removing **all Invoice-related functionality** from both the **frontend and backend**.

The goal is to identify everything that needs to be removed, updated, or verified before any code changes are made.

---

# 1. Analyze the Existing Application

First inspect the entire project structure and identify all Invoice-related functionality.

Search both:

```text
frontend/
backend/
```

or the actual project structure used by this repository.

Do not assume Invoice functionality is limited to files named `Invoice`.

Search for related:

- Classes
- Entities
- DTOs
- Controllers
- Services
- Repositories
- APIs
- Routes
- Pages
- Components
- Hooks
- Types
- Interfaces
- Database tables
- Database columns
- Enums
- Constants
- Permissions
- Navigation items
- Menus
- Buttons
- Forms
- Validation
- Queries
- Reports
- Imports/exports
- Background jobs
- Scheduled tasks
- Notifications
- Configuration
- Environment variables
- Documentation

Also search for different naming conventions and related terms such as:

```text
Invoice
invoice
invoices
INVOICE
invoice_id
invoiceId
invoiceNumber
invoice_no
invoice_no
billing
bill
billing_status
invoice_status
```

Do not remove things merely because they have a similar name. Determine whether they are actually part of the Invoice flow.

---

# 2. Frontend Analysis

Identify all frontend Invoice-related functionality.

Document:

### Pages

- Invoice list
- Invoice detail
- Invoice creation
- Invoice editing
- Invoice preview
- Invoice history
- Invoice reports
- Any other Invoice pages

### Components

Identify Invoice-specific:

- Components
- Modals
- Drawers
- Forms
- Tables
- Filters
- Buttons
- Dropdown actions
- Status components

### Routing

Identify:

- Invoice routes
- Nested Invoice routes
- Dynamic Invoice routes
- Links/navigation to Invoice pages

### API Integration

Identify frontend:

- Invoice API clients
- Hooks
- TanStack Query queries
- Mutations
- Services
- API types
- Request/response models

### State Management

Identify Invoice-related:

- Stores
- Context
- Redux/Zustand/etc.
- Local state abstractions

### Navigation

Identify:

- Sidebar menu items
- Navigation links
- Dashboard cards
- Quick actions
- Breadcrumbs
- Menus

that lead to Invoice functionality.

### Permissions

Identify Invoice-specific:

- Permission checks
- Roles
- Feature flags
- Access-control logic

---

# 3. Backend Analysis

Identify all backend Invoice-related functionality.

Document:

### Entities / Models

Identify:

- Invoice entities
- Invoice-related entities
- Relationships to Order
- Relationships to Customer
- Relationships to Store
- Relationships to Payment
- Other Invoice relationships

### DTOs

Identify:

- Request DTOs
- Response DTOs
- Search/filter DTOs
- Report DTOs

### Controllers

Identify all Invoice-related:

- REST controllers
- Endpoints
- Controller methods

### Services

Identify:

- Invoice services
- Invoice calculation logic
- Invoice generation
- Invoice status management
- Invoice validation
- Invoice business rules

### Repositories

Identify:

- Invoice repositories
- Invoice queries
- Custom queries
- Native SQL
- Specifications

### Scheduled Jobs

Check for:

- Invoice generation jobs
- Invoice reminders
- Invoice status jobs
- Scheduled invoice processing

### Events / Messaging

Check for:

- Invoice events
- Kafka messages
- Queue messages
- Event listeners
- Notifications

### Reports / Documents

Identify:

- Invoice PDF generation
- Jasper reports
- Invoice exports
- Invoice printing
- Invoice document generation

---

# 4. Database Analysis

Inspect the database-related code and identify all Invoice-related database dependencies.

Document:

- Invoice tables
- Invoice detail tables
- Invoice history tables
- Invoice payment tables
- Invoice-related foreign keys
- Invoice-related columns
- Invoice enums
- Invoice sequences
- Invoice indexes
- Invoice constraints
- Invoice views
- Invoice stored procedures
- Invoice functions
- Invoice triggers

Also identify tables that are **not Invoice tables but contain Invoice-related columns**.

For example:

```text
orders.invoice_id
orders.invoice_number
orders.invoice_status
```

Do not recommend removing these automatically.

Explain whether each field is:

- Invoice-only
- Shared with another business flow
- Required by Order functionality
- Safe to remove
- Requires further confirmation

---

# 5. Order ↔ Invoice Dependencies

This is especially important.

Analyze whether the existing **Order flow depends on Invoice functionality**.

Identify:

```text
Order
   ↓
Invoice
```

relationships and determine:

- Whether Orders can work without Invoices
- Whether Order creation requires Invoice creation
- Whether Order update requires Invoice update
- Whether Order status depends on Invoice status
- Whether Order APIs return Invoice information
- Whether frontend Order pages display Invoice information
- Whether Order History contains Invoice fields
- Whether Excel import contains Invoice-related fields

For every dependency, explain what would need to change to make Orders work independently.

---

# 6. Customer / Payment / Other Dependencies

Check whether Invoice functionality is connected to:

- Customer
- Payment
- Order
- Order Items
- Store
- Marketplace
- Shipping
- Tax
- VAT
- Accounting
- Reports
- Notifications

For each dependency, explain whether the related functionality should:

1. Be removed
2. Be kept
3. Be modified
4. Requires further investigation

Do not assume that payment, tax, or accounting functionality is Invoice-only.

---

# 7. API Impact

Create a complete list of APIs affected by Invoice removal.

Categorize them:

### Remove

Invoice-only APIs that can be completely deleted.

### Modify

APIs that are not Invoice-specific but currently contain Invoice fields or logic.

### Keep

APIs that do not depend on Invoice functionality.

For each API, include:

```text
HTTP Method
Endpoint
Backend Controller
Reason
Action
Dependencies
```

Do not write implementation code.

---

# 8. Frontend Route Impact

Create a list of frontend routes affected by Invoice removal.

Categorize them:

```text
REMOVE
MODIFY
KEEP
```

For each route, explain:

- Why it is affected
- What should happen to navigation
- Whether redirects are needed
- Whether permissions need to change

---

# 9. Database Migration Planning

Do not create migration files yet.

Instead, document the database changes that will eventually be required.

Categorize:

### Tables to Remove

Invoice-only tables.

### Columns to Remove

Invoice-only columns.

### Columns to Keep

Fields that are still required by non-Invoice functionality.

### Foreign Keys to Remove

Invoice-specific relationships.

### Indexes / Constraints to Remove

Invoice-specific database objects.

### Data Migration / Cleanup

Explain whether existing Invoice data should:

- Be deleted
- Be archived
- Be retained
- Require a migration

Do not make assumptions about production data deletion.

Clearly mark anything requiring business approval.

---

# 10. Configuration & Environment

Search for Invoice-related:

- Environment variables
- Application properties
- YAML configuration
- Feature flags
- API URLs
- Third-party integrations
- Credentials
- Scheduled configuration
- Storage buckets
- File paths

Document what should eventually be removed or modified.

---

# 11. Permissions & Security

Identify Invoice-related:

- Roles
- Permissions
- Authorities
- Security rules
- Route guards
- Backend authorization checks

Document which permissions can eventually be removed and which are shared with other features.

---

# 12. Tests

Identify all Invoice-related tests:

### Backend

- Unit tests
- Integration tests
- Controller tests
- Repository tests
- Service tests

### Frontend

- Component tests
- Page tests
- Hook tests
- API tests
- E2E tests

Document which tests should eventually be:

```text
REMOVE
MODIFY
KEEP
```

---

# 13. Documentation

Search for Invoice references in:

- README
- API documentation
- OpenAPI
- Developer documentation
- Comments
- User documentation
- Architecture documentation
- Seed data
- Test data
- Example files

Document what should eventually be updated.

---

# 14. Dependency Graph

Create a high-level dependency graph showing how Invoice functionality is connected to the rest of the system.

Example:

```text
                    ┌─────────────┐
                    │   Invoice   │
                    └──────┬──────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Orders           Payments         Reports
          │
          ▼
       Frontend
```

Replace this with the actual relationships found in the codebase.

---

# 15. Removal Strategy

Create a recommended implementation order.

For example:

```text
Phase 1 — Remove Frontend Invoice UI
Phase 2 — Remove Frontend API Integration
Phase 3 — Remove Backend Invoice APIs
Phase 4 — Remove Backend Invoice Business Logic
Phase 5 — Remove Database Dependencies
Phase 6 — Remove Permissions / Configuration
Phase 7 — Update Tests
Phase 8 — Verify Order and other remaining flows
```

Adjust the phases based on the actual architecture.

---

# 16. Risk Analysis

Identify risks such as:

- Order flow breaking
- Customer flow breaking
- Payment flow breaking
- Excel import breaking
- Reports breaking
- Shared database columns
- Shared services
- Shared DTOs
- Shared enums
- Shared permissions
- Existing production data
- External integrations
- Hidden dependencies

For each risk, provide:

```text
Risk
Impact
Affected Area
Mitigation
```

---

# 17. Verification Plan

Create a checklist for verifying that Invoice has been completely removed without breaking the remaining application.

Include:

### Frontend

- Invoice menu removed
- Invoice routes removed
- Invoice pages removed
- Invoice API calls removed
- Invoice components removed
- No broken navigation
- No broken imports
- No Invoice references remaining

### Backend

- Invoice controllers removed
- Invoice services removed
- Invoice repositories removed
- Invoice entities removed
- Invoice DTOs removed
- Invoice scheduled jobs removed
- No broken dependencies

### Database

- Invoice-only tables handled
- Invoice-only columns handled
- Foreign keys handled
- Indexes handled
- Constraints handled

### Remaining Features

Verify that:

- Orders still work
- Order creation works
- Order updates work
- Order History works
- Excel Import works
- Customer functionality works
- Other non-Invoice features still work

---

# 18. Search Verification

At the end of the plan, include a final search strategy for checking remaining Invoice references.

Search for terms such as:

```text
Invoice
invoice
INVOICE
invoice_id
invoiceId
invoiceNumber
invoice_no
billing
bill
```

However, distinguish between:

- Actual Invoice functionality
- Legitimate non-Invoice references
- Historical documentation
- Shared concepts

Do not recommend blindly deleting every matching string.

---

# 19. PLAN.md Structure

Create `PLAN.md` with this structure:

```text
# Remove Invoice Flows — Implementation Plan

## 1. Objective

## 2. Scope

## 3. Existing Invoice Functionality

## 4. Frontend Impact

## 5. Backend Impact

## 6. Database Impact

## 7. Order Dependencies

## 8. Customer / Payment / Other Dependencies

## 9. API Impact

## 10. Route Impact

## 11. Permissions & Security

## 12. Configuration & Environment

## 13. Tests

## 14. Documentation

## 15. Dependency Graph

## 16. Recommended Removal Strategy

## 17. Database Migration Plan

## 18. Risk Analysis

## 19. Verification Plan

## 20. Final Invoice Reference Search

## 21. Decisions Requiring Approval

## 22. Implementation Checklist
```

---

# Final Requirements

**ONLY create/update `PLAN.md`.**

Do not write application code.

Do not delete any Invoice code yet.

Do not modify the database.

Do not create migrations.

Do not remove routes.

Do not modify frontend or backend implementation.

The purpose of this task is to **analyze the existing application and produce a complete, actionable `PLAN.md` for removing all Invoice flows safely from both frontend and backend**.

The plan must be based on the actual codebase, not assumptions.

Clearly identify anything that requires confirmation before implementation.