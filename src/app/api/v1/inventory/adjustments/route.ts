import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { StockAdjustment } from '@/models/StockAdjustment';
import { getNextSequence } from '@/models/Counter';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const adjustmentSchema = z.object({
  warehouseId: z.string().min(1),
  reasonCode: z.enum([
    'CYCLE_COUNT_DISCREPANCY',
    'DAMAGED_IN_WAREHOUSE',
    'EXPIRED_DEFECTIVE',
    'FOUND_STOCK',
    'OTHER',
  ]),
  notes: z.string().min(1),
  lines: z
    .array(
      z.object({
        skuId: z.string().min(1),
        targetBucket: z.enum(['onHand', 'damaged', 'quarantined']).default('onHand'),
        deltaQuantity: z.number().int(),
      })
    )
    .min(1),
});

export async function GET() {
  try {
    await connectToDatabase();
    const adjustments = await StockAdjustment.find()
      .populate('warehouseId', 'name code')
      .populate('lines.skuId', 'sku variantName')
      .sort({ createdAt: -1 })
      .limit(50);
    return successResponse(adjustments);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'inventory:adjust')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to create stock adjustments.', 403);
    }

    const body = await req.json();
    const data = adjustmentSchema.parse(body);

    await connectToDatabase();
    const adjustmentNumber = await getNextSequence('stock_adjustment', 'ML-ADJ');

    const adjustment = await StockAdjustment.create({
      adjustmentNumber,
      warehouseId: data.warehouseId,
      reasonCode: data.reasonCode,
      notes: data.notes,
      lines: data.lines,
      status: 'DRAFT',
      createdBy: session?.name || 'System Admin',
    });

    return successResponse(adjustment, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
