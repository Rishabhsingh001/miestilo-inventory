# API Specification

Use versioned, typed REST-style Route Handlers under `/api/v1`. Exact route naming may be refined, but preserve behavior, permission checks, validation, and response consistency.

## 1. Response conventions
Success:
```json
{ "data": {}, "meta": { "requestId": "..." } }
```
List:
```json
{ "data": [], "meta": { "page": 1, "pageSize": 25, "total": 0, "requestId": "..." } }
```
Error:
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Please review the highlighted fields.", "details": [] }, "meta": { "requestId": "..." } }
```
Never return stack traces, secrets, raw database errors, or sensitive internal fields to the client.

## 2. Authentication and authorization
All routes except login/session and health checks require an authenticated user. Every route checks a permission such as `inventory.read`, `inventory.receive`, `inventory.adjust`, `orders.read`, `orders.create`, `orders.confirm`, `orders.dispatch`, `orders.cancel`, `returns.process`, `customers.manage`, `reports.export`, `users.manage`, or `audit.read`.

## 3. Products and SKUs
- `GET /api/v1/products`: query `q`, `categoryId`, `isActive`, `page`, `pageSize`, `sort`.
- `POST /api/v1/products`: create product and optional variants.
- `GET /api/v1/products/:id`: product, variants, and permitted stock summary.
- `PATCH /api/v1/products/:id`: update allowed catalogue fields.
- `POST /api/v1/products/:id/archive`: archive product.
- `POST /api/v1/skus`: create SKU/variant.
- `PATCH /api/v1/skus/:id`: update allowed fields.
- `GET /api/v1/skus/:id/stock`: balances by warehouse.

## 4. Inventory
- `GET /api/v1/inventory/balances`: filters `skuId`, `warehouseId`, `categoryId`, `lowStock`, `q`, `page`, `pageSize`.
- `GET /api/v1/inventory/movements`: filters `skuId`, `warehouseId`, `type`, `referenceType`, `from`, `to`, `page`, `pageSize`.
- `POST /api/v1/inventory/receipts`: create draft receipt.
- `POST /api/v1/inventory/receipts/:id/post`: post receipt and increase stock.
- `POST /api/v1/inventory/transfers`: create draft transfer.
- `POST /api/v1/inventory/transfers/:id/dispatch`: move source stock into transit if transit is modeled.
- `POST /api/v1/inventory/transfers/:id/receive`: receive transfer at destination.
- `POST /api/v1/inventory/adjustments`: create adjustment request.
- `POST /api/v1/inventory/adjustments/:id/approve`: approve if required.
- `POST /api/v1/inventory/adjustments/:id/post`: post approved adjustment.
- `GET /api/v1/inventory/reconciliation`: restricted report for ledger/balance mismatch.

## 5. Customers
- `GET /api/v1/customers`: query `q`, `status`, pagination.
- `POST /api/v1/customers`: create customer.
- `GET /api/v1/customers/:id`: customer profile and paginated order history.
- `PATCH /api/v1/customers/:id`: update permitted fields.
- `POST /api/v1/customers/:id/archive`: archive customer.

## 6. Sales orders
- `GET /api/v1/orders`: filters `q`, `customerId`, `status`, `warehouseId`, `from`, `to`, pagination.
- `POST /api/v1/orders`: create draft.
- `GET /api/v1/orders/:id`: detail, line items, shipments, returns, timeline.
- `PATCH /api/v1/orders/:id`: edit draft only unless explicitly allowed by policy.
- `POST /api/v1/orders/:id/confirm`: validate stock and reserve quantities atomically.
- `POST /api/v1/orders/:id/cancel`: cancel if transition is allowed and release undispatched reservations.
- `POST /api/v1/orders/:id/start-picking`: move to picking if allowed.
- `POST /api/v1/orders/:id/shipments`: create shipment draft.
- `POST /api/v1/orders/:id/shipments/:shipmentId/dispatch`: post shipment and stock movements.
- `POST /api/v1/orders/:id/shipments/:shipmentId/deliver`: record delivery if delivery tracking is enabled.

## 7. Returns
- `POST /api/v1/returns`: create return draft linked to order/shipment.
- `GET /api/v1/returns`: list and filter returns.
- `GET /api/v1/returns/:id`: return detail.
- `POST /api/v1/returns/:id/receive`: record physical receipt.
- `POST /api/v1/returns/:id/inspect`: set condition/disposition.
- `POST /api/v1/returns/:id/post`: update stock buckets and ledger.

## 8. Dashboard and reports
- `GET /api/v1/dashboard/summary?warehouseId=&from=&to=`
- `GET /api/v1/reports/stock-movements?from=&to=&warehouseId=&skuId=`
- `GET /api/v1/reports/daily-stock-flow?from=&to=&warehouseId=`
- `GET /api/v1/reports/customer-orders?customerId=&from=&to=`
- `GET /api/v1/reports/order-fulfillment?status=&from=&to=`
- `GET /api/v1/reports/low-stock?warehouseId=`
- `GET /api/v1/reports/stock-valuation?warehouseId=` (only if cost data and valuation method are configured)
- `GET /api/v1/reports/:reportType/export.csv` with same permission and filters as report view.

## 9. Warehouses and users
- `GET/POST /api/v1/warehouses`
- `GET/PATCH /api/v1/warehouses/:id`
- `GET/POST /api/v1/users` (restricted)
- `PATCH /api/v1/users/:id` (restricted)
- `GET /api/v1/audit-events` (audit.read only)

## 10. Request safeguards
- Validate body, params, and query using Zod.
- Limit `pageSize` (e.g. max 100).
- Require idempotency key for stock-posting operations and dispatch/confirmation where duplicate retry could double-post.
- Reject invalid status transitions with `409 CONFLICT`.
- Reject insufficient stock with a structured `INSUFFICIENT_STOCK` error including SKU and available/requested quantities where the user is authorized to see them.
- Use consistent date parsing and timezone boundaries.
- Rate-limit authentication and other abuse-sensitive endpoints.
- CSV exports must escape spreadsheet formula-leading values (`=`, `+`, `-`, `@`) to prevent CSV injection.
