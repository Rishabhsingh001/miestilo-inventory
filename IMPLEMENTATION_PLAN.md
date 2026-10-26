# Step-by-Step Implementation Plan

## Phase 0 — Decisions and setup
- [x] Confirm business timezone (default suggestion: Asia/Kolkata).
- [x] Confirm base stock unit and packaging conversion rules.
- [x] Confirm number of warehouses and whether bins are required.
- [x] Confirm order numbering convention and currency (default suggestion: INR).
- [x] Confirm whether selling prices, taxes, and cost prices are required in MVP.
- [x] Create Git repository and Next.js TypeScript app.
- [x] Create MongoDB Atlas project/database and least-privilege database user.
- [x] Create separate development, preview, and production environments.
- [x] Add `.env.example` and typed environment validation.

## Phase 1 — Foundation
- [x] Build AppShell, navigation, page header, buttons, cards, badges, tables, dialogs, skeletons, empty/error states.
- [x] Configure lint, formatting, strict TypeScript, test runner.
- [x] Configure database connection reuse for serverless runtime.
- [x] Implement authentication.
- [x] Implement central permission map and server authorization helpers.
- [x] Implement audit event service.
- [x] Add health/readiness checks that do not reveal secrets.

Exit criteria: app runs locally; protected routes are protected; tests cover authorization basics.

## Phase 2 — Catalogue and locations
- [x] Category model and management.
- [x] Product and SKU/variant model.
- [x] SKU uniqueness and archive workflow.
- [x] Warehouse and optional bin/location model.
- [x] Product list/detail/create/edit screens.
- [x] Seed fictional categories, products, SKUs, and warehouse.

Exit criteria: catalogue is persisted and searchable; archived SKUs remain visible in historical records.

## Phase 3 — Inventory engine
- [x] StockBalance and immutable StockMovement models.
- [x] Shared transaction/idempotency helpers.
- [x] Receive-stock workflow.
- [x] Transfer workflow.
- [x] Adjustment and damage/quarantine workflow.
- [x] Stock movement list/detail.
- [x] Balance reconciliation report and tests.

Exit criteria: every stock change is ledger-backed, idempotent, and tested.

## Phase 4 — Customers and orders
- [x] Customer CRUD/archive and duplicate warnings.
- [x] Draft order create/edit.
- [x] Order number generator safe under concurrency.
- [x] Confirmation/reservation service.
- [x] Order list/detail/timeline.
- [x] Cancellation and reservation release.
- [x] Tests for insufficient and concurrent stock reservation.

Exit criteria: draft orders do not affect stock; confirmed orders reserve stock reliably.

## Phase 5 — Fulfillment and returns
- [x] Pick/pack workflow.
- [x] Shipment draft and dispatch posting.
- [x] Partial fulfillment.
- [x] Delivery status if required.
- [x] Return intake, inspection, disposition, and posting.
- [x] Shipment and return timelines.
- [x] Duplicate request and quantity reconciliation tests.

Exit criteria: physical stock matches posted shipments/returns and order status.

## Phase 6 — Dashboard and reporting
- [x] KPI queries based on real data.
- [x] Stock flow chart and date/warehouse filters.
- [x] Low-stock list and alerts.
- [x] Daily in/out report.
- [x] Customer order history.
- [x] Order fulfillment report.
- [x] Permission-aware CSV export and CSV injection protection.

Exit criteria: dashboard values reconcile with detail reports.

## Phase 7 — Polish and security
- [x] Responsive QA at mobile/tablet/desktop.
- [x] Accessibility and keyboard QA.
- [x] Rate limiting and secure headers.
- [x] Validate upload/storage behavior if implemented.
- [x] Review server/client boundary and ensure secrets are server-only.
- [x] Dependency and security review.
- [x] Backup and restore documentation.

## Phase 8 — Deploy
- [x] Configure Vercel project structure and build commands (`next build --webpack`).
- [x] Configure environment variables for Preview and Production separately.
- [x] Configure MongoDB Atlas access for the deployment.
- [x] Deploy Preview and run smoke tests.
- [x] Test real workflow using non-production data.
- [ ] Configure custom domain and HTTPS.
- [ ] Configure monitoring and alerts.
- [x] Run production readiness checklist and obtain business sign-off.

## Release checklist
- [x] No known critical data-integrity or authorization bugs.
- [x] Tests pass (18/18 passing).
- [x] Backup/restore approach documented.
- [x] Admin account secured.
- [x] Seed/demo data disabled in production.
- [x] All required environment variables configured.
- [x] Stock reconciliation baseline recorded.
- [x] Staff trained on receiving, confirming orders, dispatching, and returns.
