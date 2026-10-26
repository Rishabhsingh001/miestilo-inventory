import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { StockTransfer } from '@/models/StockTransfer';
import { getNextSequence } from '@/models/Counter';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const transferSchema = z.object({
  sourceWarehouseId: z.string().min(1),
  destinationWarehouseId: z.string().min(1),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        skuId: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

export async function GET() {
  try {
    await connectToDatabase();
    const transfers = await StockTransfer.find()
      .populate('sourceWarehouseId', 'name code')
      .populate('destinationWarehouseId', 'name code')
      .populate('lines.skuId', 'sku variantName')
      .sort({ createdAt: -1 })
      .limit(50);
    return successResponse(transfers);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'inventory:transfer')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to create transfers.', 403);
    }

    const body = await req.json();
    const data = transferSchema.parse(body);

    if (data.sourceWarehouseId === data.destinationWarehouseId) {
      return errorResponse('VALIDATION_ERROR', 'Source and destination warehouses must be different.', 422);
    }

    await connectToDatabase();
    const transferNumber = await getNextSequence('stock_transfer', 'ML-TRF');

    const transfer = await StockTransfer.create({
      transferNumber,
      sourceWarehouseId: data.sourceWarehouseId,
      destinationWarehouseId: data.destinationWarehouseId,
      lines: data.lines,
      notes: data.notes,
      status: 'DRAFT',
      createdBy: session?.name || 'System Admin',
    });

    return successResponse(transfer, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
