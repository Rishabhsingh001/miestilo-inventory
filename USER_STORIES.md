# User Stories and Acceptance Checklist

## Owner
- As an owner, I want to see available stock and open orders immediately so I can make daily decisions.
- As an owner, I want daily stock-out and customer reports so I can understand what moved and where it went.
- As an owner, I want audit history so stock changes can be investigated.

## Inventory manager
- As an inventory manager, I want to receive stock against a reference so inward stock is traceable.
- As an inventory manager, I want to transfer stock between warehouses without losing location accuracy.
- As an inventory manager, I want to record damage and adjustments with a reason.
- As an inventory manager, I want to see low-stock items before they run out.

## Sales/order manager
- As a sales manager, I want to create a draft order for a customer.
- As a sales manager, I want confirmation to reserve available stock so the same stock is not promised twice.
- As a sales manager, I want to see previous orders for a customer.
- As a sales manager, I want to know whether an order is pending, partially shipped, fulfilled, or cancelled.

## Warehouse staff
- As warehouse staff, I want a pick list showing SKU and quantity.
- As warehouse staff, I want to record partial shipments.
- As warehouse staff, I want shipment tracking information stored with the order.
- As warehouse staff, I want returned stock classified as sellable or damaged before it becomes available.

## Acceptance checklist
- [ ] User can find a SKU and see balances by warehouse.
- [ ] User can see all movements for a SKU and the linked business reference.
- [ ] User can create a customer and see its order history.
- [ ] User can create an order draft without changing stock.
- [ ] Authorized user can confirm order and reserve stock.
- [ ] Authorized user can dispatch all or part of an order.
- [ ] Daily report correctly totals stock receipts and dispatches.
- [ ] Unauthorized user cannot bypass permissions through direct API calls.
