import mongoose from 'mongoose';
import { connectToDatabase, withTransaction } from '@/lib/db/connection';
import { SalesOrder, OrderStatus, IOrderLine } from '@/models/SalesOrder';
import { StockBalance, calculateAvailable } from '@/models/StockBalance';
import { StockMovement, MovementType, ReferenceType } from '@/models/StockMovement';
import { Shipment } from '@/models/Shipment';
import { CustomerReturn, ReturnDisposition } from '@/models/CustomerReturn';
import { getNextSequence } from '@/models/Counter';
import { logAuditEvent } from '@/services/audit.service';
import { SessionUser } from '@/lib/auth/session';

export async function confirmOrder(orderId: string, user: SessionUser) {
  await connectToDatabase();

  return await withTransaction(async (session) => {
    const order = await SalesOrder.findById(orderId).session(session);
    if (!order) throw new Error('NOT_FOUND: Order not found.');
    if (order.status !== 'DRAFT') {
      throw new Error(`CONFLICT: Cannot confirm order in status '${order.status}'. Only DRAFT orders can be confirmed.`);
    }

    // 1. Verify availability for each SKU line atomically
    for (const line of order.lines) {
      const balance = await StockBalance.findOne({
        skuId: line.skuId,
        warehouseId: order.warehouseId,
        binLocationId: null,
      }).session(session);

      if (!balance) {
        throw new Error(
          `INSUFFICIENT_STOCK: SKU '${line.skuSnapshot.sku}' has zero recorded inventory in this warehouse.`
        );
      }

      const available = calculateAvailable(balance);
      if (available < line.orderedQty) {
        throw new Error(
          `INSUFFICIENT_STOCK: SKU '${line.skuSnapshot.sku}' requested ${line.orderedQty}, available ${available}.`
        );
      }

      // 2. Reserve stock atomically
      balance.reserved += line.orderedQty;
      await balance.save({ session });

      // Update line reserved quantity
      line.reservedQty = line.orderedQty;

      // 3. Write RESERVATION movement
      const movementNumber = await getNextSequence('stock_movement', 'ML-MOV');
      await StockMovement.create(
        [
          {
            movementNumber,
            type: 'RESERVATION' as MovementType,
            skuId: line.skuId,
            warehouseId: order.warehouseId,
            quantityDelta: 0,
            reservedDelta: line.orderedQty,
            referenceType: 'ORDER' as ReferenceType,
            referenceId: order.orderNumber,
            notes: `Stock reserved for order ${order.orderNumber}`,
            actorUserId: user.id,
            actorName: user.name,
          },
        ],
        { session }
      );
    }

    order.status = 'CONFIRMED';
    order.confirmedBy = user.name;
    order.confirmedAt = new Date();
    await order.save({ session });

    await logAuditEvent({
      actorUserId: user.id,
      actorName: user.name,
      action: 'ORDER_CONFIRMED',
      entityType: 'SalesOrder',
      entityId: order._id.toString(),
      afterSummary: {
        orderNumber: order.orderNumber,
        status: order.status,
        grandTotalMinor: order.grandTotalMinor,
      },
    });

    return order;
  });
}

export async function cancelOrder(orderId: string, reason: string, user: SessionUser) {
  await connectToDatabase();

  return await withTransaction(async (session) => {
    const order = await SalesOrder.findById(orderId).session(session);
    if (!order) throw new Error('NOT_FOUND: Order not found.');
    if (order.status === 'CANCELLED') return order;
    if (order.status === 'FULFILLED') {
      throw new Error('CONFLICT: Cannot cancel a fulfilled order. Process a customer return instead.');
    }

    // Release any undispatched reservations
    for (const line of order.lines) {
      const remainingReserved = line.reservedQty - line.dispatchedQty;
      if (remainingReserved > 0) {
        const balance = await StockBalance.findOne({
          skuId: line.skuId,
          warehouseId: order.warehouseId,
          binLocationId: null,
        }).session(session);

        if (balance) {
          balance.reserved = Math.max(0, balance.reserved - remainingReserved);
          await balance.save({ session });
        }

        const movementNumber = await getNextSequence('stock_movement', 'ML-MOV');
        await StockMovement.create(
          [
            {
              movementNumber,
              type: 'RESERVATION_RELEASE' as MovementType,
              skuId: line.skuId,
              warehouseId: order.warehouseId,
              quantityDelta: 0,
              reservedDelta: -remainingReserved,
              referenceType: 'ORDER' as ReferenceType,
              referenceId: order.orderNumber,
              notes: `Reservation released due to order cancellation: ${reason}`,
              actorUserId: user.id,
              actorName: user.name,
            },
          ],
          { session }
        );

        line.reservedQty = line.dispatchedQty;
      }
    }

    order.status = 'CANCELLED';
    order.cancelledBy = user.name;
    order.cancelledAt = new Date();
    order.cancellationReason = reason;
    await order.save({ session });

    await logAuditEvent({
      actorUserId: user.id,
      actorName: user.name,
      action: 'ORDER_CANCELLED',
      entityType: 'SalesOrder',
      entityId: order._id.toString(),
      afterSummary: { orderNumber: order.orderNumber, reason },
    });

    return order;
  });
}

export interface DispatchLineInput {
  skuId: string;
  qty: number;
}

export interface DispatchInput {
  carrier?: string;
  trackingNumber?: string;
  packageCount?: number;
  dispatchNotes?: string;
  lines: DispatchLineInput[];
}

export async function dispatchShipment(
  orderId: string,
  input: DispatchInput,
  user: SessionUser
) {
  await connectToDatabase();

  return await withTransaction(async (session) => {
    const order = await SalesOrder.findById(orderId).session(session);
    if (!order) throw new Error('NOT_FOUND: Order not found.');
    if (!['CONFIRMED', 'PICKING', 'PARTIALLY_FULFILLED'].includes(order.status)) {
      throw new Error(`CONFLICT: Order cannot be dispatched in status '${order.status}'.`);
    }

    const shipmentNumber = await getNextSequence('shipment', 'ML-SHP');
    const movementIds: mongoose.Types.ObjectId[] = [];

    for (const item of input.lines) {
      const line = order.lines.find(
        (l: IOrderLine) => l.skuId.toString() === item.skuId.toString()
      );
      if (!line) {
        throw new Error(`NOT_FOUND: SKU line not found on order.`);
      }

      const pendingQty = line.orderedQty - line.dispatchedQty;
      if (item.qty > pendingQty) {
        throw new Error(
          `CONFLICT: Cannot dispatch ${item.qty} units of SKU '${line.skuSnapshot.sku}'. Only ${pendingQty} pending.`
        );
      }

      // Deduct from balance: onHand decreases, reserved decreases
      const balance = await StockBalance.findOne({
        skuId: line.skuId,
        warehouseId: order.warehouseId,
        binLocationId: null,
      }).session(session);

      if (!balance || balance.onHand < item.qty) {
        throw new Error(`INSUFFICIENT_STOCK: Insufficient physical stock on hand to dispatch.`);
      }

      balance.onHand -= item.qty;
      balance.reserved = Math.max(0, balance.reserved - item.qty);
      await balance.save({ session });

      // Update line dispatchedQty
      line.dispatchedQty += item.qty;

      // Write DISPATCH movement
      const movementNumber = await getNextSequence('stock_movement', 'ML-MOV');
      const movement = await StockMovement.create(
        [
          {
            movementNumber,
            type: 'DISPATCH' as MovementType,
            skuId: line.skuId,
            warehouseId: order.warehouseId,
            quantityDelta: -item.qty,
            reservedDelta: -item.qty,
            referenceType: 'SHIPMENT' as ReferenceType,
            referenceId: shipmentNumber,
            notes: `Dispatched for order ${order.orderNumber} via ${input.carrier || 'Courier'}`,
            actorUserId: user.id,
            actorName: user.name,
          },
        ],
        { session }
      );

      movementIds.push(movement[0]._id as mongoose.Types.ObjectId);
    }

    // Determine new order status
    const allFulfilled = order.lines.every((l: IOrderLine) => l.dispatchedQty >= l.orderedQty);
    order.status = allFulfilled ? 'FULFILLED' : 'PARTIALLY_FULFILLED';
    await order.save({ session });

    // Create Shipment record
    const shipment = await Shipment.create(
      [
        {
          shipmentNumber,
          orderId: order._id,
          warehouseId: order.warehouseId,
          status: 'DISPATCHED',
          lines: input.lines.map((l) => ({
            skuId: new mongoose.Types.ObjectId(l.skuId),
            qty: l.qty,
          })),
          carrier: input.carrier,
          trackingNumber: input.trackingNumber,
          packageCount: input.packageCount || 1,
          dispatchNotes: input.dispatchNotes,
          dispatchedBy: user.name,
          stockMovementIds: movementIds,
          dispatchDate: new Date(),
        },
      ],
      { session }
    );

    await logAuditEvent({
      actorUserId: user.id,
      actorName: user.name,
      action: 'ORDER_DISPATCHED',
      entityType: 'Shipment',
      entityId: shipment[0]._id.toString(),
      afterSummary: {
        orderNumber: order.orderNumber,
        shipmentNumber,
        orderStatus: order.status,
      },
    });

    return { order, shipment: shipment[0] };
  });
}

export interface ReturnItemInput {
  skuId: string;
  qty: number;
  condition?: string;
  disposition: ReturnDisposition;
}

export async function processCustomerReturn(
  orderId: string,
  shipmentId: string | undefined,
  reason: string,
  items: ReturnItemInput[],
  user: SessionUser
) {
  await connectToDatabase();

  return await withTransaction(async (session) => {
    const order = await SalesOrder.findById(orderId).session(session);
    if (!order) throw new Error('NOT_FOUND: Order not found.');

    const returnNumber = await getNextSequence('customer_return', 'ML-RET');
    const movementIds: mongoose.Types.ObjectId[] = [];

    for (const item of items) {
      const line = order.lines.find(
        (l: IOrderLine) => l.skuId.toString() === item.skuId.toString()
      );
      if (!line) throw new Error(`NOT_FOUND: SKU line not found on order.`);

      const maxEligible = line.dispatchedQty - line.returnedQty;
      if (item.qty > maxEligible) {
        throw new Error(
          `CONFLICT: Cannot return ${item.qty} units. Maximum eligible returned quantity is ${maxEligible}.`
        );
      }

      line.returnedQty += item.qty;

      // Update stock bucket according to disposition
      const balance = await StockBalance.findOne({
        skuId: line.skuId,
        warehouseId: order.warehouseId,
        binLocationId: null,
      }).session(session);

      if (!balance) {
        throw new Error('NOT_FOUND: Stock balance record not found.');
      }

      const movementNumber = await getNextSequence('stock_movement', 'ML-MOV');

      if (item.disposition === 'RESTOCK') {
        balance.onHand += item.qty;
        await StockMovement.create(
          [
            {
              movementNumber,
              type: 'CUSTOMER_RETURN_RESTOCK' as MovementType,
              skuId: line.skuId,
              warehouseId: order.warehouseId,
              quantityDelta: item.qty,
              referenceType: 'RETURN' as ReferenceType,
              referenceId: returnNumber,
              reasonCode: 'CUSTOMER_RETURN',
              notes: `Restocked return from order ${order.orderNumber}: ${reason}`,
              actorUserId: user.id,
              actorName: user.name,
            },
          ],
          { session }
        );
      } else if (item.disposition === 'QUARANTINE' || item.disposition === 'REPAIR') {
        balance.quarantined += item.qty;
        await StockMovement.create(
          [
            {
              movementNumber,
              type: 'CUSTOMER_RETURN_QUARANTINE' as MovementType,
              skuId: line.skuId,
              warehouseId: order.warehouseId,
              quantityDelta: 0,
              quarantinedDelta: item.qty,
              referenceType: 'RETURN' as ReferenceType,
              referenceId: returnNumber,
              notes: `Quarantined return: ${reason}`,
              actorUserId: user.id,
              actorName: user.name,
            },
          ],
          { session }
        );
      }

      await balance.save({ session });
    }

    const allReturned = order.lines.every((l: IOrderLine) => l.returnedQty >= l.dispatchedQty && l.dispatchedQty > 0);
    order.status = allReturned ? 'RETURNED' : 'PARTIALLY_RETURNED';
    await order.save({ session });

    const customerReturn = await CustomerReturn.create(
      [
        {
          returnNumber,
          orderId: order._id,
          shipmentId: shipmentId ? new mongoose.Types.ObjectId(shipmentId) : undefined,
          customerId: order.customerId,
          warehouseId: order.warehouseId,
          lines: items.map((i) => ({
            skuId: new mongoose.Types.ObjectId(i.skuId),
            qty: i.qty,
            condition: i.condition,
            disposition: i.disposition,
          })),
          reason,
          status: 'POSTED',
          postedBy: user.name,
          postedAt: new Date(),
          stockMovementIds: movementIds,
        },
      ],
      { session }
    );

    return { order, customerReturn: customerReturn[0] };
  });
}
