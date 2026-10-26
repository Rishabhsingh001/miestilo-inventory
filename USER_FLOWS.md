# User Flows

## 1. Receive new stock
1. Inventory Manager opens Inventory → Receive Stock.
2. Selects warehouse and optional supplier/source.
3. Adds SKU lines and positive integer quantities; cost fields appear only for permitted roles.
4. Saves as draft; balances remain unchanged.
5. Reviews summary and clicks Post Receipt.
6. Server validates permission, receipt state, SKU activity, and quantities.
7. Server posts stock movements and updates balances atomically where supported.
8. UI shows receipt number and updated stock; audit event is recorded.

Acceptance: repeated posting request does not add stock twice.

## 2. Create and confirm a customer order
1. Sales user selects or creates a customer.
2. Creates draft order and selects ship-to address and warehouse.
3. Adds SKU quantities and pricing.
4. UI shows available stock as advisory only; server is authoritative.
5. Saves draft.
6. On Confirm, server rechecks stock and reserves quantities in a safe transaction.
7. If insufficient, order stays draft and user sees the exact shortage.
8. On success, order becomes Confirmed and reservation movements are recorded.

Acceptance: two simultaneous confirmations cannot reserve the same units twice.

## 3. Pick, pack, and dispatch
1. Warehouse staff opens orders ready for picking.
2. Opens order and creates a shipment draft.
3. Selects actual quantities to ship, up to remaining reserved quantity.
4. Adds carrier/tracking/package information if available.
5. Reviews shipment summary and dispatches.
6. Server reduces on-hand and reserved quantities, creates dispatch movements, and posts shipment status atomically.
7. Order becomes Partially Fulfilled or Fulfilled based on remaining quantities.
8. Customer/order timeline shows shipment details.

Acceptance: duplicate dispatch cannot deduct stock twice; dispatch cannot exceed reserved quantity.

## 4. Cancel order
1. Authorized user opens an order.
2. If no dispatch has occurred, selects Cancel and enters a reason.
3. Server validates state and releases undispatched reservations.
4. Order becomes Cancelled; history remains visible.
5. If some units were already dispatched, the app does not silently cancel shipped quantities; user follows a return/credit workflow.

## 5. Customer return
1. Authorized staff starts a return against an original order and shipment.
2. Adds SKU and quantity; system verifies eligible dispatched quantity.
3. Records received condition.
4. Inspector selects Restock, Quarantine, Repair, or Scrap.
5. On posting, stock is moved into the appropriate bucket and ledger events are recorded.
6. Order history shows returned quantities and disposition.

## 6. Stock adjustment
1. Inventory Manager chooses warehouse and SKU.
2. Enters count or adjustment delta, reason code, and notes.
3. If approval threshold applies, request waits for approval.
4. Authorized approver reviews expected vs counted quantities.
5. Posting creates an immutable movement; original posted adjustment cannot be edited.
6. Reconciliation report can explain the new balance.

## 7. Daily management review
1. Owner opens Dashboard.
2. Reviews available units, active SKUs, open orders, low-stock items, and dispatched today.
3. Changes date range/warehouse.
4. Opens stock movement report to see daily in/out quantities.
5. Exports CSV if permitted.
6. Uses order and customer pages to trace a specific dispatch.

## 8. Exception flows
- SKU archived while referenced: preserve historical records; prevent new orders for that SKU.
- Insufficient stock: no partial reservation unless the order workflow explicitly supports it.
- Database/transaction failure: show safe error; do not report success or leave a silently half-posted operation.
- Duplicate request: idempotency response returns the original result or a conflict without duplicate movement.
- Unauthorized action: return 403 and show access-denied UI.
- Concurrent stock update: retry safely where appropriate or return a conflict for user review.
