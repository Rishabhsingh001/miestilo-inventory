# Database Schema and Data Rules

This document defines a suggested MongoDB/Mongoose model design. Antigravity may refine field names, but must preserve invariants, relationships, indexes, and history.

## 1. Shared conventions
- Use MongoDB ObjectId identifiers.
- `createdAt` and `updatedAt` are UTC timestamps.
- Use integer numbers for stock quantities.
- Use decimal-safe monetary representation: Decimal128 or integer minor units (e.g. paise). Do not use binary floating point for money.
- Use enums for status and movement types.
- Validate at API and schema levels.
- Use soft archive (`isActive`/`archivedAt`) for entities referenced by history.
- Store order-line snapshots so historical orders remain accurate after catalogue edits.
- Store actor/user IDs for posted operations.

## 2. User
Fields:
- `_id`
- `name`
- `email` (normalized lowercase, unique)
- `passwordHash` only if using credentials auth; otherwise provider identity fields
- `role` or role assignments
- `permissions` only if using explicit overrides
- `isActive`
- `lastLoginAt`
- timestamps

Indexes: unique normalized email.

## 3. Product
Fields:
- `_id`
- `name`
- `slug` (optional)
- `categoryId`
- `description`
- `brand` (optional)
- `attributes`: size, material/fabric, GSM, thread count, color, weave, packaging, custom attributes
- `unit` (e.g. PIECE, SET, PACK, CARTON)
- `imageUrls[]`
- `reorderLevel` integer
- `defaultCostMinor` or Decimal128 (restricted)
- `defaultSellingPriceMinor` or Decimal128
- `isActive`
- `archivedAt`
- timestamps

Important: SKU belongs to a sellable variant when the product has multiple sizes/materials. If a product has no variants, a single default SKU may be used. Do not permit duplicate active SKUs.

## 4. ProductVariant / SKU
Fields:
- `_id`
- `productId`
- `sku` (unique normalized string)
- `variantName`
- `attributes` (size, fabric, GSM, color, thread count, etc.)
- `barcode` (optional, unique when provided)
- `unit`
- `reorderLevel`
- `costMinor` (restricted)
- `sellingPriceMinor`
- `isActive`
- timestamps

Indexes:
- unique `sku`
- sparse/partial unique `barcode` if supplied
- `{ productId: 1, isActive: 1 }`

## 5. Category
Fields: `_id`, `name`, `slug`, `description`, `isActive`, timestamps.
Index unique normalized slug.

Suggested defaults: Bedsheets, Towels, Pillow Covers, Duvet Covers, Duvets, Bed Runners, Bath Mats, Other Hotel Linen. Categories must remain configurable.

## 6. Warehouse
Fields:
- `_id`
- `code` (unique)
- `name`
- `address`
- `contactName`
- `contactPhone`
- `isActive`
- optional `locations[]` or separate BinLocation model
- timestamps

## 7. StockBalance
One balance per SKU + warehouse + optional bin + stock bucket.
Fields:
- `_id`
- `skuId`
- `warehouseId`
- `binLocationId` (nullable)
- `onHand` integer
- `reserved` integer
- `damaged` integer if damaged stock is included in onHand; otherwise use a separate bucket consistently
- `quarantined` integer if included in onHand; use one convention
- `version` / updated timestamp
- timestamps

Unique compound index on `{ skuId, warehouseId, binLocationId }` with a deliberate representation for null bins. Do not allow duplicate balance rows for the same stock location.

Calculated available quantity must follow one documented convention. Recommended if damaged/quarantined are included in onHand:
`available = onHand - reserved - damaged - quarantined`.
Ensure `reserved <= sellable onHand`, and never allow negative available stock by default.

## 8. StockMovement (immutable ledger)
Fields:
- `_id`
- `movementNumber` (unique human-readable identifier)
- `type` enum
- `skuId`
- `warehouseId`
- `binLocationId` (optional)
- `quantityDelta` signed integer for on-hand changes, where applicable
- `reservedDelta` signed integer for reservation changes
- `damagedDelta` / `quarantinedDelta` if using explicit buckets
- `referenceType` (ORDER, SHIPMENT, RECEIPT, TRANSFER, RETURN, ADJUSTMENT, STOCKTAKE)
- `referenceId`
- `correlationId` / operation ID
- `reasonCode`
- `notes`
- `actorUserId`
- `occurredAt`
- `reversalOfMovementId` optional
- `metadata` safe structured fields
- `createdAt`

Indexes: `{ skuId: 1, occurredAt: -1 }`, `{ warehouseId: 1, occurredAt: -1 }`, `{ referenceType: 1, referenceId: 1 }`, unique movement number, unique idempotency key or operation key where appropriate.

Ledger records are append-only. Corrections create reversal/corrective records, never edits/deletes.

## 9. Customer
Fields:
- `_id`
- `customerCode` unique
- `companyName` or `name`
- `contactName`
- `email`
- `phone`
- `billingAddress`
- `shippingAddresses[]` with labels and default flag
- `taxId` optional and access-restricted as appropriate
- `notes`
- `isActive`
- `createdBy`
- timestamps

Indexes: unique customer code; searchable normalized name/email/phone as appropriate.

## 10. Supplier (Phase 2 or optional MVP)
Fields: `_id`, `supplierCode`, `name`, contacts, addresses, tax ID, notes, status, timestamps.

## 11. SalesOrder
Fields:
- `_id`
- `orderNumber` unique
- `customerId`
- `customerSnapshot`
- `shipToSnapshot`
- `orderDate`
- `requiredDispatchDate`
- `expectedDeliveryDate`
- `warehouseId` or allocation strategy
- `status`
- `lines[]`: `skuId`, `skuSnapshot`, `orderedQty`, `reservedQty`, `dispatchedQty`, `returnedQty`, `unitPriceMinor`, `discountMinor`, `taxCode`/tax fields if configured, `lineTotalMinor`
- `currency` default INR, configurable
- `subtotalMinor`, `discountTotalMinor`, `taxTotalMinor`, `grandTotalMinor`
- `notes`
- `createdBy`, `confirmedBy`, `confirmedAt`
- `cancelledBy`, `cancelledAt`, `cancellationReason`
- timestamps
- optional idempotency key

Indexes: unique order number; `{ customerId: 1, orderDate: -1 }`; `{ status: 1, orderDate: -1 }`.

## 12. Shipment
Fields:
- `_id`
- `shipmentNumber` unique
- `orderId`
- `warehouseId`
- `status` (DRAFT, DISPATCHED, DELIVERED, CANCELLED if policy permits)
- `lines[]`: `skuId`, `qty`
- `carrier`
- `trackingNumber`
- `dispatchDate`
- `expectedDeliveryDate`
- `deliveredAt`
- `packageCount`
- `dispatchNotes`
- `dispatchedBy`
- `stockMovementIds[]`
- timestamps

Indexes: unique shipment number; `{ orderId: 1, dispatchDate: -1 }`; optional tracking index.

## 13. CustomerReturn
Fields:
- `_id`
- `returnNumber` unique
- `orderId`
- `shipmentId`
- `customerId`
- `lines[]`: `skuId`, `qty`, `condition`, `disposition` (RESTOCK, QUARANTINE, REPAIR, SCRAP)
- `reason`
- `status` (DRAFT, RECEIVED, INSPECTED, POSTED, REJECTED)
- `receivedAt`
- `inspectedBy`
- `postedBy`
- `stockMovementIds[]`
- timestamps

## 14. StockReceipt / StockTransfer / StockAdjustment
Use explicit documents for each workflow:
- Receipt: draft/posted, reference, supplier/source, warehouse, lines, quantity, cost, received date, created/posted by.
- Transfer: source warehouse, destination warehouse, lines, status (DRAFT, IN_TRANSIT, RECEIVED, CANCELLED), movement links.
- Adjustment: warehouse, lines, expected/count/adjusted quantity, reason code, approval status, notes, posted by.
Posted documents are immutable except safe annotations; corrections use reversal documents.

## 15. AuditEvent
Fields:
- `_id`
- `actorUserId`
- `action`
- `entityType`
- `entityId`
- `timestamp`
- `requestId`
- `beforeSummary` / `afterSummary` with sensitive fields excluded
- `ipHash` or minimal security metadata only if justified and legally reviewed
- `metadata`
Indexes: `{ entityType: 1, entityId: 1, timestamp: -1 }`, `{ actorUserId: 1, timestamp: -1 }`.

## 16. Settings / counters
Use a counters collection or a safe atomic sequence strategy for human-readable order, shipment, movement, receipt, transfer, and return numbers. Do not generate numbers using a simple count query because concurrent requests can duplicate values.

## 17. Data integrity rules
- Validate positive integer quantities at the API boundary.
- Do not allow deletion of referenced SKUs/customers/warehouses; archive instead.
- Every posted stock operation creates ledger movements and updates balances in the same transaction where supported.
- Use idempotency keys for operations that might be retried.
- Order line quantities must reconcile: ordered = dispatched + remaining-to-dispatch; returned quantity cannot exceed dispatched quantity minus already accepted returns.
- A shipment cannot exceed reserved/unshipped quantities.
- A cancellation releases only undispatched reservations.
- Maintain a reconciliation report for balance projection vs ledger totals.
