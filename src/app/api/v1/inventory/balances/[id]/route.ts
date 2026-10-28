import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { StockBalance, calculateAvailable } from '@/models/StockBalance';
import { StockMovement } from '@/models/StockMovement';
import { AuditEvent } from '@/models/AuditEvent';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const updateBalanceSchema = z.object({
  onHand: z.number().int().min(0, 'Physical on-hand quantity cannot be negative'),
  damaged: z.number().int().min(0, 'Damaged quantity cannot be negative').optional(),
  quarantined: z.number().int().min(0, 'Quarantined quantity cannot be negative').optional(),
  reason: z.string().min(3, 'A clear reason for manual stock balance edit is mandatory'),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    // Super Admin only can directly override stock balance records
    if (session.role !== 'SUPER_ADMIN') {
      return errorResponse(
        'FORBIDDEN',
        'Access denied. Only Super Admin (Founder & MD) can edit stock balances & inventory visibility directly.',
        403
      );
    }

    const { id } = await params;
    const balance = await StockBalance.findById(id).populate('skuId').populate('warehouseId');
    if (!balance) {
      return errorResponse('NOT_FOUND', 'Stock balance record not found.', 404);
    }

    const body = await req.json();
    const data = updateBalanceSchema.parse(body);

    const oldOnHand = balance.onHand;
    const oldDamaged = balance.damaged;
    const oldQuarantined = balance.quarantined;

    const newOnHand = data.onHand;
    const newDamaged = data.damaged !== undefined ? data.damaged : balance.damaged;
    const newQuarantined = data.quarantined !== undefined ? data.quarantined : balance.quarantined;

    const deltaOnHand = newOnHand - oldOnHand;

    // Apply updates
    balance.onHand = newOnHand;
    balance.damaged = newDamaged;
    balance.quarantined = newQuarantined;
    balance.version = (balance.version || 1) + 1;
    await balance.save();

    // If on-hand changed, write immutable StockMovement ledger entry
    if (deltaOnHand !== 0) {
      await StockMovement.create({
        skuId: balance.skuId._id || balance.skuId,
        warehouseId: balance.warehouseId._id || balance.warehouseId,
        binLocationId: balance.binLocationId,
        movementType: 'ADJUSTMENT',
        quantity: Math.abs(deltaOnHand),
        direction: deltaOnHand > 0 ? 'IN' : 'OUT',
        referenceType: 'MANUAL_BALANCE_EDIT',
        referenceId: `ADJ-BAL-${Date.now()}`,
        reason: data.reason.trim(),
        performedBy: session.name || session.email,
        occurredAt: new Date(),
      });
    }

    // Record audit event for compliance
    await AuditEvent.create({
      action: 'STOCK_BALANCE_OVERRIDE',
      entity: 'STOCK_BALANCE',
      entityId: balance._id.toString(),
      actorId: session.id,
      actorName: session.name,
      details: {
        sku: (balance.skuId as any)?.sku,
        warehouse: (balance.warehouseId as any)?.name,
        oldOnHand,
        newOnHand,
        oldDamaged,
        newDamaged,
        oldQuarantined,
        newQuarantined,
        reason: data.reason.trim(),
      },
    });

    const available = calculateAvailable(balance);
    const reorderLevel = (balance.skuId as any)?.reorderLevel || 20;

    return successResponse({
      balance: {
        ...balance.toObject(),
        available,
        isLowStock: available <= reorderLevel,
      },
      message: 'Stock balance and visibility updated successfully.',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
