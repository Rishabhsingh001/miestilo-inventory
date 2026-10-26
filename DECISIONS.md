# Decisions Log

Record decisions that affect the data model, security, business rules, or deployment. Do not silently change a rule after data has been created.

| ID | Decision | Default recommendation | Status |
|---|---|---|---|
| D-001 | Business timezone | Asia/Kolkata | Confirmed & Adopted |
| D-002 | Default currency | INR | Confirmed & Adopted |
| D-003 | Base inventory unit | Piece; with unit label support (Piece, Set, Pack, Carton) | Confirmed & Adopted |
| D-004 | Warehouse count | Multi-warehouse support from day one (Central Hub, Regional Depot) | Confirmed & Adopted |
| D-005 | Stock balance convention | `available = onHand - reserved - damaged - quarantined` | Confirmed & Adopted |
| D-006 | Order reservation | Reserve on confirmation; draft orders never reserve | Confirmed & Adopted |
| D-007 | Backorders | Disabled by default; insufficient stock blocks confirmation | Confirmed & Adopted |
| D-008 | Stock negative override | Disabled by default; zero overselling allowed | Confirmed & Adopted |
| D-009 | Product variants | Each sellable variation has a unique normalized SKU | Confirmed & Adopted |
| D-010 | Tax/invoicing | Configurable tax rates (e.g. 5%, 12%, 18% GST); minor units (paise) | Confirmed & Adopted |
| D-011 | Auth provider | Secure cookie JWT session with preconfigured RBAC roles | Confirmed & Adopted |
| D-012 | Database connection | MongoDB Mongoose with graceful in-memory replica fallback for local/dev | Confirmed & Adopted |

## Resolved architectural decisions
1. **Warehouses & Bins**: Defaults to multi-warehouse (e.g., Mumbai Central Warehouse, Delhi Regional Distribution Center) with optional bin/location tagging.
2. **Base Units**: Physical inventory stored as integer base pieces; packaging units displayed on product variants.
3. **Product Catalog**: Built for hotel linen (Bedsheets, Towels, Pillow Covers, Duvets, Duvet Covers, Bed Runners, Bath Mats, Other Hotel Linen).
4. **Order Concurrency**: Atomic conditional updates (`$gte`) to prevent race condition overselling.
5. **Ledger Immutability**: All stock mutations are append-only in `StockMovement`. Corrections use reversal movements.

