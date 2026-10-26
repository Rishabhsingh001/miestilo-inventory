# Technical Architecture

## 1. System overview
Browser → Next.js App Router UI → authenticated server-side route handlers/services → MongoDB Atlas.

The browser must never connect directly to MongoDB. All database access, secrets, permissions, and stock calculations stay on the server.

## 2. Stack
- Next.js App Router, React, TypeScript
- Tailwind CSS + shadcn/ui
- MongoDB Atlas
- Mongoose (or official MongoDB driver; choose one and use consistently)
- Auth.js or a maintained identity provider
- Zod for request validation
- React Hook Form for forms
- TanStack Table for large lists
- Recharts for charts
- Vitest/Jest for unit tests; Playwright for end-to-end tests
- Vercel for deployment

## 3. Suggested project structure
```text
src/
  app/
    (auth)/login/page.tsx
    (app)/layout.tsx
    (app)/dashboard/page.tsx
    (app)/inventory/page.tsx
    (app)/inventory/products/page.tsx
    (app)/inventory/products/[id]/page.tsx
    (app)/inventory/movements/page.tsx
    (app)/inventory/receipts/page.tsx
    (app)/inventory/transfers/page.tsx
    (app)/orders/page.tsx
    (app)/orders/new/page.tsx
    (app)/orders/[id]/page.tsx
    (app)/customers/page.tsx
    (app)/reports/page.tsx
    api/
      products/route.ts
      inventory/receipts/route.ts
      inventory/transfers/route.ts
      inventory/adjustments/route.ts
      orders/route.ts
      orders/[id]/confirm/route.ts
      orders/[id]/cancel/route.ts
      orders/[id]/shipments/route.ts
      returns/route.ts
      reports/stock-movements/route.ts
  components/
    app-shell/
    dashboard/
    inventory/
    orders/
    customers/
    reports/
    ui/
  lib/
    auth/
    db/
    env.ts
    errors/
    permissions/
    validation/
    ids/
  models/
    User.ts
    Product.ts
    Warehouse.ts
    StockBalance.ts
    StockMovement.ts
    Customer.ts
    SalesOrder.ts
    Shipment.ts
    Return.ts
    AuditEvent.ts
  services/
    inventory.service.ts
    order.service.ts
    customer.service.ts
    reporting.service.ts
    audit.service.ts
  hooks/
  types/
  tests/
scripts/
  seed.ts
```

This is a suggested structure, not a requirement to create empty files for every line. Keep modules cohesive.

## 4. Backend design
Use Route Handlers for HTTP API boundaries and service modules for business logic. Route handlers should:
1. Authenticate request.
2. Check permission.
3. Parse/validate input with Zod.
4. Call a service.
5. Return a consistent response.
6. Log safe diagnostic information for unexpected errors.

Do not place complicated stock logic directly in React components or route handlers. Services own state transitions and ledger writes.

## 5. MongoDB and transactions
- Use MongoDB Atlas. Use a deployment configuration that supports multi-document transactions for production stock/order workflows.
- Use a MongoDB session/transaction for operations that need to update stock balance, movement ledger, order/shipment state, and audit event together.
- For concurrent stock reservations, use conditional atomic updates (e.g. available quantity >= requested quantity) and appropriate transaction/retry handling.
- Add unique indexes to SKU, order number, customer code, and idempotency key scope.
- Avoid unbounded queries; paginate and project only required fields.
- Index fields used together in filters and sorts after checking actual query patterns.
- Do not rely only on cached balance values without reconciliation. Either calculate from movements for selected reporting periods and maintain a controlled balance projection, or use a balance collection updated atomically with movements. Document the approach.
- Build an admin reconciliation command/report that compares ledger-derived quantities with balance projections.

## 6. Stock model strategy
Recommended: immutable `StockMovement` ledger plus `StockBalance` projection per SKU + warehouse + stock status/location. A posted stock operation writes ledger entries and updates balances in one transaction. `available` is derived from balance fields, not separately editable by users.

Example conceptual formula:
`available = onHand - reserved - damaged - quarantined`
If damaged/quarantined are stored outside sellable on-hand, adapt the formula to avoid double-counting. Choose one convention and document it consistently.

Movement types may include:
- RECEIPT
- RESERVATION
- RESERVATION_RELEASE
- DISPATCH
- CUSTOMER_RETURN_RESTOCK
- CUSTOMER_RETURN_QUARANTINE
- DAMAGE
- ADJUSTMENT_IN
- ADJUSTMENT_OUT
- TRANSFER_OUT
- TRANSFER_IN
- REVERSAL

For a warehouse transfer, create linked out/in movements. If transit is modeled, use a transit location/status and only add destination availability when receipt is confirmed.

## 7. Order state machine
Suggested statuses:
- DRAFT
- CONFIRMED
- PICKING
- PARTIALLY_FULFILLED
- FULFILLED
- CANCELLED
- RETURNED
- PARTIALLY_RETURNED

Transitions must be explicit and validated by the service. For example:
- DRAFT → CONFIRMED (reserve stock)
- DRAFT → CANCELLED
- CONFIRMED → PICKING
- CONFIRMED/PICKING → PARTIALLY_FULFILLED (one shipment posted)
- CONFIRMED/PICKING/PARTIALLY_FULFILLED → FULFILLED (all ordered quantities dispatched)
- CONFIRMED → CANCELLED (release all undispatched reservations)
- FULFILLED → PARTIALLY_RETURNED/RETURNED (accepted returns)
Do not allow a transition to change history retroactively.

## 8. Vercel deployment considerations
- Use Vercel environment variables for production/preview/development separately.
- Configure MongoDB Atlas network access according to current Vercel connectivity guidance; do not expose broad network access unnecessarily. If a stable egress IP is required by the chosen plan/security posture, evaluate Vercel's available networking options.
- Cache/reuse MongoDB connections in serverless execution environments; do not open a new connection for every query.
- Keep serverless functions within platform execution limits; large reports should use bounded queries and possibly background processing in a later phase.
- Do not assume long-running jobs or persistent sockets are available in standard serverless functions.
- Use preview deployments for testing and a separate database or isolated data set for non-production.
- Configure a custom domain and HTTPS only after environment variables and database access are validated.

## 9. Environment variables
See `.env.example`. Validate required variables at startup using a typed environment module. Never prefix server secrets with `NEXT_PUBLIC_`.

## 10. Observability
- Structured logs with request ID and safe entity IDs.
- Error tracking for unhandled exceptions.
- Audit log for business events; error logs are not a replacement for audit logs.
- Monitor API errors, failed transactions, stock reconciliation discrepancies, and authentication failures.
