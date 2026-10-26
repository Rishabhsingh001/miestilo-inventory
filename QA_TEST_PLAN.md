# QA and Test Plan

## 1. Testing layers
- Unit tests: calculations, validation, state transitions, permissions.
- Service/integration tests: MongoDB models, transactions, stock posting, order workflows.
- API tests: validation, authentication, authorization, status codes, idempotency.
- End-to-end tests: critical user journeys in a browser.
- Manual responsive/accessibility review.
- Deployment smoke tests on Vercel preview.

Use an isolated test database. Never run automated destructive tests against production.

## 2. Critical inventory tests
- Receipt draft does not change stock.
- Posting receipt increases correct warehouse/SKU balance exactly once.
- Duplicate receipt-post request does not double-count.
- Transfer cannot exceed source available quantity.
- Transfer source and destination reconcile after receipt.
- Adjustment requires reason and permission.
- Posted movement cannot be edited or deleted.
- Negative available stock is blocked.
- Concurrent reservations cannot oversell.
- Reconciliation detects deliberately introduced balance/ledger mismatch.

## 3. Critical order tests
- Draft order does not reserve stock.
- Confirmation reserves stock.
- Confirmation fails cleanly when stock is insufficient.
- Concurrent confirmation for the same last units allows only valid reservations.
- Shipment cannot exceed reserved, undispatched quantity.
- Dispatch decreases on-hand and reserved quantities correctly.
- Partial shipment produces Partially Fulfilled state.
- Final shipment produces Fulfilled state.
- Cancellation releases undispatched reservations.
- Cancellation does not erase shipped history.
- Duplicate dispatch request cannot deduct twice.
- Invalid status transition returns conflict.
- Order snapshots remain unchanged if product name/price changes later.

## 4. Return tests
- Return quantity cannot exceed eligible dispatched quantity.
- Restock disposition adds sellable stock.
- Quarantine disposition does not increase available stock.
- Scrap disposition does not return stock to sellable balance.
- Duplicate return posting cannot double-count.
- Returned quantities and order status reconcile.

## 5. Permissions tests
- Read-only user cannot create or update stock.
- Sales user cannot post an adjustment without permission.
- Warehouse staff cannot view cost price unless granted.
- Unauthenticated requests receive 401/redirect as appropriate.
- Unauthorized exports receive 403.
- Audit logs cannot be changed through public API.
- User cannot promote their own role.

## 6. UI tests
- Forms show inline validation.
- Search, filter, sort, and pagination work together.
- Empty, loading, error, and permission-denied states render correctly.
- Confirm dialogs protect destructive operations.
- Buttons prevent duplicate submissions while pending.
- Mobile layout is usable at 360px width.
- Keyboard focus is visible and dialog focus is managed correctly.
- Charts have accessible labels or a data-table alternative.

## 7. Data and performance checks
- Unique SKU and order number indexes reject duplicates.
- Large lists use pagination.
- Common query filters use appropriate indexes.
- Dates at timezone boundaries appear in the correct business day.
- Monetary calculations use decimal-safe arithmetic.
- CSV exports correctly escape formula-leading cells.
- No secrets or customer data appear in client bundles or logs.

## 8. Release gate
Do not deploy production until:
- Type checking passes.
- Linting passes.
- Unit and integration tests pass.
- Critical end-to-end flows pass.
- A stock reconciliation check passes.
- Authentication and role tests pass.
- Environment variables and backup plan are documented.
- A human user has verified the staging workflow with fictional/test data.
