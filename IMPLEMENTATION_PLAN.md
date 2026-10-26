# Step-by-Step Implementation Plan

## Phase 0 — Decisions and setup
- [ ] Confirm business timezone (default suggestion: Asia/Kolkata).
- [ ] Confirm base stock unit and packaging conversion rules.
- [ ] Confirm number of warehouses and whether bins are required.
- [ ] Confirm order numbering convention and currency (default suggestion: INR).
- [ ] Confirm whether selling prices, taxes, and cost prices are required in MVP.
- [ ] Create Git repository and Next.js TypeScript app.
- [ ] Create MongoDB Atlas project/database and least-privilege database user.
- [ ] Create separate development, preview, and production environments.
- [ ] Add `.env.example` and typed environment validation.

## Phase 1 — Foundation
- [ ] Build AppShell, navigation, page header, buttons, cards, badges, tables, dialogs, skeletons, empty/error states.
- [ ] Configure lint, formatting, strict TypeScript, test runner.
- [ ] Configure database connection reuse for serverless runtime.
- [ ] Implement authentication.
- [ ] Implement central permission map and server authorization helpers.
- [ ] Implement audit event service.
- [ ] Add health/readiness checks that do not reveal secrets.

Exit criteria: app runs locally; protected routes are protected; tests cover authorization basics.

## Phase 2 — Catalogue and locations
- [ ] Category model and management.
- [ ] Product and SKU/variant model.
- [ ] SKU uniqueness and archive workflow.
- [ ] Warehouse and optional bin/location model.
- [ ] Product list/detail/create/edit screens.
- [ ] Seed fictional categories, products, SKUs, and warehouse.

Exit criteria: catalogue is persisted and searchable; archived SKUs remain visible in historical records.

## Phase 3 — Inventory engine
- [ ] StockBalance and immutable StockMovement models.
- [ ] Shared transaction/idempotency helpers.
- [ ] Receive-stock workflow.
- [ ] Transfer workflow.
- [ ] Adjustment and damage/quarantine workflow.
- [ ] Stock movement list/detail.
- [ ] Balance reconciliation report and tests.

Exit criteria: every stock change is ledger-backed, idempotent, and tested.

## Phase 4 — Customers and orders
- [ ] Customer CRUD/archive and duplicate warnings.
- [ ] Draft order create/edit.
- [ ] Order number generator safe under concurrency.
- [ ] Confirmation/reservation service.
- [ ] Order list/detail/timeline.
- [ ] Cancellation and reservation release.
- [ ] Tests for insufficient and concurrent stock reservation.

Exit criteria: draft orders do not affect stock; confirmed orders reserve stock reliably.

## Phase 5 — Fulfillment and returns
- [ ] Pick/pack workflow.
- [ ] Shipment draft and dispatch posting.
- [ ] Partial fulfillment.
- [ ] Delivery status if required.
- [ ] Return intake, inspection, disposition, and posting.
- [ ] Shipment and return timelines.
- [ ] Duplicate request and quantity reconciliation tests.

Exit criteria: physical stock matches posted shipments/returns and order status.

## Phase 6 — Dashboard and reporting
- [ ] KPI queries based on real data.
- [ ] Stock flow chart and date/warehouse filters.
- [ ] Low-stock list and alerts.
- [ ] Daily in/out report.
- [ ] Customer order history.
- [ ] Order fulfillment report.
- [ ] Permission-aware CSV export and CSV injection protection.

Exit criteria: dashboard values reconcile with detail reports.

## Phase 7 — Polish and security
- [ ] Responsive QA at mobile/tablet/desktop.
- [ ] Accessibility and keyboard QA.
- [ ] Rate limiting and secure headers.
- [ ] Validate upload/storage behavior if implemented.
- [ ] Review server/client boundary and ensure secrets are server-only.
- [ ] Dependency and security review.
- [ ] Backup and restore documentation.

## Phase 8 — Deploy
- [ ] Configure Vercel project.
- [ ] Configure environment variables for Preview and Production separately.
- [ ] Configure MongoDB Atlas access for the deployment.
- [ ] Deploy Preview and run smoke tests.
- [ ] Test real workflow using non-production data.
- [ ] Configure custom domain and HTTPS.
- [ ] Configure monitoring and alerts.
- [ ] Run production readiness checklist and obtain business sign-off.

## Release checklist
- [ ] No known critical data-integrity or authorization bugs.
- [ ] Tests pass.
- [ ] Backup/restore approach documented.
- [ ] Admin account secured.
- [ ] Seed/demo data disabled in production.
- [ ] All required environment variables configured.
- [ ] Stock reconciliation baseline recorded.
- [ ] Staff trained on receiving, confirming orders, dispatching, and returns.
