# Product Requirements Document (PRD)
## Misterio Lifestyle Inventory & Order Management System

**Document status:** Build specification  
**Version:** 1.0  
**Primary users:** Owners, inventory/warehouse staff, sales/order staff, management  
**Primary business:** Hotel and hospitality linen products

## 1. Product vision
Create a secure, easy-to-use internal web application that gives Misterio Lifestyle one dependable view of stock, customer orders, dispatches, returns, and daily movement across its warehouse(s). The system should reduce manual spreadsheets, prevent accidental overselling, and make it easy to answer: what do we have, where is it, what is committed, what went out today, and which customer received it?

## 2. Business outcomes
- Know current available stock by SKU and warehouse.
- Trace every stock change to a user, timestamp, reason, and related document.
- Track the lifecycle of each order from draft to dispatch/delivery.
- View daily stock-in and stock-out summaries.
- Find customer order history quickly.
- Identify low-stock products before they run out.
- Reduce duplicate entry and reconciliation effort.
- Provide management with clear operational dashboards and exports.

## 3. Users and roles
### Owner / Super Admin
Full access to configuration, users, products, warehouses, stock, orders, reports, audit logs, and settings.

### Admin / Operations Manager
Manage products, warehouses, customers, stock operations, orders, reports, and most settings. Cannot remove the final owner or bypass audit requirements.

### Inventory Manager
Manage receipts, transfers, adjustments, damaged stock, cycle counts, and stock reports. Can view orders but cannot change commercial settings unless granted.

### Sales / Order Manager
Manage customers and sales orders; view available stock; confirm orders if authorized. Cannot make direct stock adjustments.

### Warehouse / Dispatch Staff
View pick lists, record packing and dispatch, and record received returns. Cannot edit product costs or customer pricing.

### Read-only / Management
View dashboards and reports without modifying records.

All roles and permissions must be configurable or represented by a central permission matrix. Enforce permissions in server code, not just the interface.

## 4. Scope
### MVP — required
1. Authentication and role-based authorization.
2. Dashboard with KPIs and recent activity.
3. Product catalogue with category, SKU, variants, unit, image, status, reorder level, and optional cost/selling price.
4. Warehouse and optional bin/location management.
5. Stock ledger and current stock balances.
6. Stock receipt/inward.
7. Stock transfer between warehouses.
8. Stock adjustment with mandatory reason and audit event.
9. Damaged/quarantined stock tracking.
10. Customer directory and customer details.
11. Sales order creation and editing while draft.
12. Order confirmation and stock reservation.
13. Pick/pack/dispatch workflow, including partial dispatch.
14. Order cancellation and reservation release.
15. Returns and restocking/disposition.
16. Search, filters, sorting, pagination, and CSV exports.
17. Low-stock indicators and dashboard alerts.
18. Audit log for sensitive operations.
19. Responsive desktop/tablet/mobile layouts.
20. Error, loading, empty, and access-denied states.

### Phase 2 — designed for, not necessarily MVP
- Supplier directory and purchase orders.
- Barcode/QR scanning.
- Batch/lot tracking and manufacturing/production batches.
- Customer-specific price lists.
- Invoice and GST integration.
- Courier tracking integration.
- Email notifications.
- Multi-company / tenant support.
- Import products and opening balances from validated CSV.
- Stocktake/cycle count workflow.
- Approval workflow for high-value adjustments.

### Out of scope for initial MVP
- Full accounting/ERP.
- Payroll and HR.
- Manufacturing planning/MRP.
- Public customer portal.
- Automatic payments.
- Guaranteed GST/legal compliance without a validated invoice/tax specification.

## 5. Core domain definitions
- **Product:** General item, e.g. Hotel Bedsheet.
- **SKU / Variant:** Specific sellable configuration, e.g. Queen white cotton bedsheet, 300 TC. Each variant has a unique SKU.
- **Warehouse:** Physical stockholding site.
- **Bin/location:** Optional internal location within a warehouse.
- **On-hand:** Physical quantity currently recorded at a location, including any stock marked damaged if the business chooses that definition. UI must clearly define the number.
- **Available:** Sellable on-hand minus reserved and unavailable/damaged/quarantined stock.
- **Reserved:** Quantity committed to confirmed orders but not yet dispatched.
- **Dispatched:** Quantity shipped out of inventory; it is no longer on-hand.
- **Stock movement:** Immutable event recording quantity movement and reason.
- **Sales order:** Customer demand and fulfillment record.
- **Shipment:** One dispatch event; an order can have multiple shipments.
- **Return:** Returned quantity with a disposition such as restock, quarantine, repair, or scrap.

## 6. Product requirements and acceptance criteria
### PR-01 Dashboard
- Show total active SKUs, total available units, low-stock SKU count, open orders, units dispatched today, and recent movements.
- Filters: date range and warehouse where applicable.
- Every KPI must come from database queries/aggregations, not hard-coded numbers.
- Clicking a KPI opens a filtered list.

### PR-02 Product catalogue
- Create, view, edit, archive, and search products.
- SKU is required, unique, and immutable after transactions exist; SKU changes must use a controlled admin workflow if ever allowed.
- Capture name, category, SKU, description, unit, size, fabric/material, GSM/thread count when relevant, color, image, reorder level, cost price (restricted), selling price, active status.
- Variants are first-class records or clearly normalized subdocuments with unique SKU indexes.
- Prevent deletion of products referenced by orders or stock movements; allow archive instead.

### PR-03 Stock visibility
- View on-hand, reserved, available, damaged/quarantined, and location-wise balances.
- Stock numbers must reconcile with the ledger.
- Prevent negative available stock by default.
- Every stock change has a movement record and reason.
- Use idempotency keys for operations where duplicate submission could double-post stock.

### PR-04 Stock inward
- Record receipt reference, date, warehouse, supplier/source, SKU lines, quantity, unit cost where relevant, and notes.
- Validate positive integer quantities.
- Posting a receipt updates stock and writes ledger movements atomically where supported.
- Draft receipts do not affect stock.

### PR-05 Transfers
- Transfer from one warehouse/location to another.
- Prevent transfer quantity from exceeding available stock at source.
- Record dispatch and receipt stages if transit tracking is enabled.
- Do not count in-transit stock as available at the destination until received.
- Keep origin and destination movement links.

### PR-06 Adjustments and stocktake
- Adjustment requires reason code, notes, user, timestamp, and optional approval.
- High-impact adjustments can require manager approval.
- A posted adjustment cannot be edited or deleted; correct it with a reversing/corrective movement.
- Provide reconciliation report between counted and system quantities.

### PR-07 Customers
- Store customer/company name, customer code, contacts, email, phone, billing address, shipping addresses, tax identifier if applicable, notes, and status.
- Avoid duplicate customers by warning on matching name/email/phone.
- Customer detail page shows orders, dispatches, returns, and sales totals.

### PR-08 Sales orders
- Create draft order with customer, ship-to address, SKU lines, quantity, unit price, discounts/tax if configured, requested date, and notes.
- Draft order does not reserve or deduct stock.
- Confirming an order checks availability and reserves stock in a server-side atomic operation.
- If stock is insufficient, clearly show missing quantity and allow backorder only if an authorized setting permits it.
- Order number must be unique and human-readable, e.g. `ML-ORD-2026-000001`.
- Order status transitions must be validated by a central state machine.
- Allow multiple shipments per order and partial fulfillment.
- Cancelling a confirmed but unshipped order releases reservations.
- Dispatched quantities cannot be silently cancelled; use return/credit process.
- Preserve snapshots of SKU name, SKU code, unit price, and relevant product attributes on order lines so history remains readable if the catalogue changes.

### PR-09 Dispatch
- Build a pick/pack list from order lines.
- Dispatch staff record actual quantity shipped, shipment date, carrier, tracking reference, packages, and notes.
- Dispatch quantity cannot exceed confirmed/reserved unshipped quantity.
- On dispatch, reserved quantity decreases and on-hand quantity decreases; ledger records the movement.
- A partially shipped order remains partially fulfilled.
- Shipment record must be linked to order and movement records.

### PR-10 Returns
- Record original order/shipment, SKU, quantity, reason, condition, and disposition.
- Restock only when approved as sellable.
- Damaged returns go to quarantine/damaged inventory, not available stock.
- Prevent returned quantity from exceeding previously dispatched quantity minus previous accepted returns.
- Preserve a return audit trail.

### PR-11 Reporting
- Daily stock in/out report by date, SKU, category, warehouse, and movement reason.
- Customer order history and customer-wise sales.
- Open/pending/partially fulfilled orders.
- Low-stock list using configurable reorder levels.
- Stock valuation only where reliable cost data exists; display valuation method and do not imply accounting-grade valuation unless implemented.
- CSV exports honor the user's permissions and filters.
- Report date boundaries use the configured business timezone.

### PR-12 Search and usability
- Search products by SKU/name; customers by name/code/email/phone; orders by order number/customer/tracking reference.
- Provide filters, sort, pagination, loading states, empty states, and clear validation errors.
- Destructive actions require confirmation.
- Forms should preserve input after recoverable errors.

### PR-13 Audit and history
- Record actor, action, entity type/id, timestamp, request/correlation ID, and safe before/after summary for critical actions.
- Never log passwords, tokens, database credentials, or unnecessary personal data.
- Audit events cannot be edited from the normal application UI.

## 7. Main screens
- Login / access denied
- Overview dashboard
- Inventory list
- Product detail / create / edit
- Stock movements
- Receive stock
- Transfers
- Adjustments / stocktake
- Orders list
- Create/edit order
- Order detail with timeline
- Pick/pack/dispatch
- Returns
- Customers list/detail
- Warehouses and locations
- Reports
- User and role management
- Audit log
- Settings

## 8. Key business metrics
- Available units by warehouse and category.
- Low-stock SKU count.
- Daily inbound quantity.
- Daily dispatched quantity.
- Orders awaiting confirmation, picking, dispatch, or delivery.
- Fulfillment rate = dispatched quantity / confirmed quantity for selected cohort, with the denominator clearly stated.
- Inventory turnover and valuation are optional until costs and reporting methodology are reliable.

## 9. Non-functional requirements
- Responsive at 360px mobile width through desktop.
- WCAG-aware keyboard navigation, visible focus, labels, and contrast.
- Server-side authorization for all protected endpoints.
- Validate all input server-side.
- Use indexes for common filters and unique identifiers.
- Pagination for large lists; avoid unbounded database queries.
- Graceful errors with safe messages and server-side diagnostic logging.
- Database backups and restore procedures documented.
- Target: common dashboard/list operations under 2 seconds for normal data volumes, excluding network conditions and cold starts; measure rather than promise.
- Use UTC storage and explicit display timezone.
- Do not expose cost price to unauthorized roles.

## 10. Success metrics
- Stock discrepancy rate reduces over time.
- Every dispatch can be traced to an order and stock movement.
- Users can answer daily stock-out and customer dispatch questions without manual spreadsheet reconciliation.
- No unexplained negative stock in production.
- Critical workflows have automated regression tests.
