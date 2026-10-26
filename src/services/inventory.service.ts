import mongoose from 'mongoose';
import { connectToDatabase, withTransaction } from '@/lib/db/connection';
import { StockBalance, calculateAvailable } from '@/models/StockBalance';
import { StockMovement, MovementType, ReferenceType } from '@/models/StockMovement';
import { StockReceipt } from '@/models/StockReceipt';
import { StockTransfer } from '@/models/StockTransfer';
import { StockAdjustment } from '@/models/StockAdjustment';
import { getNextSequence } from '@/models/Counter';
import { logAuditEvent } from '@/services/audit.service';
import { SessionUser } from '@/lib/auth/session';

export interface PostReceiptResult {
  receipt: unknown;
  movementsCount: number;
}

export async function postReceipt(
  receiptId: string,
  user: SessionUser,
  idempotencyKey?: string
): Promise<PostReceiptResult> {
  await connectToDatabase();

  return await withTransaction(async (session) => {
    const receipt = await StockReceipt.findById(receiptId).session(session);
    if (!receipt) {
      throw new Error('NOT_FOUND: Receipt not found.');
    }
    if (receipt.status === 'POSTED') {
      return { receipt, movementsCount: 0 };
    }
    if (receipt.status === 'CANCELLED') {
      throw new Error('CONFLICT: Cannot post a cancelled receipt.');
    }

    if (idempotencyKey && receipt.idempotencyKey === idempotencyKey) {
      return { receipt, movementsCount: 0 };
    }

    const movementIds: mongoose.Types.ObjectId[] = [];

    for (const line of receipt.lines) {
      // 1. Update or create StockBalance for this SKU & Warehouse
      const balance = await StockBalance.findOneAndUpdate(
        { skuId: line.skuId, warehouseId: receipt.warehouseId, binLocationId: null },
        {
          $inc: { onHand: line.quantity, version: 1 },
        },
        { upsert: true, returnDocument: 'after', session }
      );

      // 2. Create immutable StockMovement
      const movementNumber = await getNextSequence('stock_movement', 'ML-MOV');
      const movement = await StockMovement.create(
        [
          {
            movementNumber,
            type: 'RECEIPT' as MovementType,
            skuId: line.skuId,
            warehouseId: receipt.warehouseId,
            quantityDelta: line.quantity,
            reservedDelta: 0,
            referenceType: 'RECEIPT' as ReferenceType,
            referenceId: receipt.receiptNumber,
            reasonCode: 'PURCHASE_INWARD',
            notes: receipt.notes || `Stock inward from ${receipt.supplierName || 'Supplier'}`,
            actorUserId: user.id,
            actorName: user.name,
            occurredAt: new Date(),
          },
        ],
        { session }
      );

      movementIds.push(movement[0]._id as mongoose.Types.ObjectId);
    }

    receipt.status = 'POSTED';
    receipt.postedAt = new Date();
    receipt.postedBy = user.name;
    if (idempotencyKey) {
      receipt.idempotencyKey = idempotencyKey;
    }
    await receipt.save({ session });

    await logAuditEvent({
      actorUserId: user.id,
      actorName: user.name,
      action: 'STOCK_RECEIPT_POSTED',
      entityType: 'StockReceipt',
      entityId: receipt._id.toString(),
      afterSummary: {
        receiptNumber: receipt.receiptNumber,
        warehouseId: receipt.warehouseId.toString(),
        linesCount: receipt.lines.length,
      },
    });

    return { receipt, movementsCount: movementIds.length };
  });
}

export async function dispatchTransfer(
  transferId: string,
  user: SessionUser
): Promise<unknown> {
  await connectToDatabase();

  return await withTransaction(async (session) => {
    const transfer = await StockTransfer.findById(transferId).session(session);
    if (!transfer) throw new Error('NOT_FOUND: Transfer not found.');
    if (transfer.status !== 'DRAFT') throw new Error('CONFLICT: Transfer must be in DRAFT to dispatch.');

    for (const line of transfer.lines) {
      const sourceBalance = await StockBalance.findOne({
        skuId: line.skuId,
        warehouseId: transfer.sourceWarehouseId,
        binLocationId: null,
      }).session(session);

      if (!sourceBalance) {
        throw new Error(`INSUFFICIENT_STOCK: No stock found at source warehouse for SKU.`);
      }

      const available = calculateAvailable(sourceBalance);
      if (available < line.quantity) {
        throw new Error(
          `INSUFFICIENT_STOCK: Required ${line.quantity}, available at source is only ${available}.`
        );
      }

      // Deduct from source warehouse
      sourceBalance.onHand -= line.quantity;
      await sourceBalance.save({ session });

      const movementNumber = await getNextSequence('stock_movement', 'ML-MOV');
      await StockMovement.create(
        [
          {
            movementNumber,
            type: 'TRANSFER_OUT' as MovementType,
            skuId: line.skuId,
            warehouseId: transfer.sourceWarehouseId,
            quantityDelta: -line.quantity,
            referenceType: 'TRANSFER' as ReferenceType,
            referenceId: transfer.transferNumber,
            notes: `Transfer out to destination warehouse`,
            actorUserId: user.id,
            actorName: user.name,
          },
        ],
        { session }
      );
    }

    transfer.status = 'IN_TRANSIT';
    transfer.dispatchedAt = new Date();
    transfer.dispatchedBy = user.name;
    await transfer.save({ session });

    return transfer;
  });
}

export async function receiveTransfer(
  transferId: string,
  user: SessionUser
): Promise<unknown> {
  await connectToDatabase();

  return await withTransaction(async (session) => {
    const transfer = await StockTransfer.findById(transferId).session(session);
    if (!transfer) throw new Error('NOT_FOUND: Transfer not found.');
    if (transfer.status !== 'IN_TRANSIT') {
      throw new Error('CONFLICT: Transfer must be IN_TRANSIT to receive.');
    }

    for (const line of transfer.lines) {
      await StockBalance.findOneAndUpdate(
        { skuId: line.skuId, warehouseId: transfer.destinationWarehouseId, binLocationId: null },
        { $inc: { onHand: line.quantity, version: 1 } },
        { upsert: true, session }
      );

      const movementNumber = await getNextSequence('stock_movement', 'ML-MOV');
      await StockMovement.create(
        [
          {
            movementNumber,
            type: 'TRANSFER_IN' as MovementType,
            skuId: line.skuId,
            warehouseId: transfer.destinationWarehouseId,
            quantityDelta: line.quantity,
            referenceType: 'TRANSFER' as ReferenceType,
            referenceId: transfer.transferNumber,
            notes: `Transfer received at destination`,
            actorUserId: user.id,
            actorName: user.name,
          },
        ],
        { session }
      );
    }

    transfer.status = 'RECEIVED';
    transfer.receivedAt = new Date();
    transfer.receivedBy = user.name;
    await transfer.save({ session });

    return transfer;
  });
}

export async function postAdjustment(
  adjustmentId: string,
  user: SessionUser
): Promise<unknown> {
  await connectToDatabase();

  return await withTransaction(async (session) => {
    const adj = await StockAdjustment.findById(adjustmentId).session(session);
    if (!adj) throw new Error('NOT_FOUND: Adjustment not found.');
    if (adj.status === 'POSTED') return adj;

    for (const line of adj.lines) {
      const balance = await StockBalance.findOne({
        skuId: line.skuId,
        warehouseId: adj.warehouseId,
        binLocationId: null,
      }).session(session);

      if (!balance && line.deltaQuantity < 0) {
        throw new Error('INSUFFICIENT_STOCK: Cannot deduct stock when no balance exists.');
      }

      const currentBalance = balance || (await StockBalance.create([{
        skuId: line.skuId,
        warehouseId: adj.warehouseId,
        onHand: 0,
        reserved: 0,
        damaged: 0,
        quarantined: 0,
      }], { session }))[0];

      if (line.targetBucket === 'onHand') {
        const newOnHand = currentBalance.onHand + line.deltaQuantity;
        if (newOnHand < currentBalance.reserved) {
          throw new Error('INSUFFICIENT_STOCK: On-hand stock cannot be reduced below reserved quantity.');
        }
        currentBalance.onHand = newOnHand;
      } else if (line.targetBucket === 'damaged') {
        currentBalance.damaged = Math.max(0, currentBalance.damaged + line.deltaQuantity);
      } else if (line.targetBucket === 'quarantined') {
        currentBalance.quarantined = Math.max(0, currentBalance.quarantined + line.deltaQuantity);
      }

      await currentBalance.save({ session });

      const movementNumber = await getNextSequence('stock_movement', 'ML-MOV');
      const movementType: MovementType =
        line.targetBucket === 'damaged'
          ? 'DAMAGE'
          : line.deltaQuantity >= 0
          ? 'ADJUSTMENT_IN'
          : 'ADJUSTMENT_OUT';

      await StockMovement.create(
        [
          {
            movementNumber,
            type: movementType,
            skuId: line.skuId,
            warehouseId: adj.warehouseId,
            quantityDelta: line.targetBucket === 'onHand' ? line.deltaQuantity : 0,
            damagedDelta: line.targetBucket === 'damaged' ? line.deltaQuantity : 0,
            quarantinedDelta: line.targetBucket === 'quarantined' ? line.deltaQuantity : 0,
            referenceType: 'ADJUSTMENT' as ReferenceType,
            referenceId: adj.adjustmentNumber,
            reasonCode: adj.reasonCode,
            notes: adj.notes,
            actorUserId: user.id,
            actorName: user.name,
          },
        ],
        { session }
      );
    }

    adj.status = 'POSTED';
    adj.postedAt = new Date();
    adj.postedBy = user.name;
    await adj.save({ session });

    return adj;
  });
}

/**
 * Reconcile StockBalance projections against the sum of immutable StockMovement events.
 */
export async function reconcileBalances(warehouseId?: string) {
  await connectToDatabase();
  const query: Record<string, unknown> = {};
  if (warehouseId) {
    query.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }

  const balances = await StockBalance.find(query).populate('skuId').populate('warehouseId');
  const discrepancies: Array<{
    skuId: string;
    warehouseId: string;
    skuName: string;
    projectedOnHand: number;
    ledgerOnHand: number;
    difference: number;
  }> = [];

  for (const b of balances) {
    const movements = await StockMovement.aggregate([
      {
        $match: {
          skuId: b.skuId._id || b.skuId,
          warehouseId: b.warehouseId._id || b.warehouseId,
        },
      },
      {
        $group: {
          _id: null,
          totalQtyDelta: { $sum: '$quantityDelta' },
        },
      },
    ]);

    const ledgerOnHand = movements[0]?.totalQtyDelta || 0;
    if (b.onHand !== ledgerOnHand) {
      discrepancies.push({
        skuId: b.skuId.toString(),
        warehouseId: b.warehouseId.toString(),
        skuName: (b.skuId as any)?.sku || 'SKU',
        projectedOnHand: b.onHand,
        ledgerOnHand,
        difference: b.onHand - ledgerOnHand,
      });
    }
  }

  return {
    totalChecked: balances.length,
    discrepanciesCount: discrepancies.length,
    discrepancies,
    reconciledAt: new Date(),
  };
}
