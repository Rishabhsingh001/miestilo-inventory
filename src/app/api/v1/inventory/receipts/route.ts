import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { StockReceipt } from '@/models/StockReceipt';
import { getNextSequence } from '@/models/Counter';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const receiptSchema = z.object({
  warehouseId: z.string().min(1),
  supplierName: z.string().optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  lines: z
    .array(
      z.object({
        skuId: z.string().min(1),
        quantity: z.number().int().min(1),
        unitCostMinor: z.number().optional(),
      })
    )
    .min(1),
});

export async function GET() {
  try {
    await connectToDatabase();
    const receipts = await StockReceipt.find()
      .populate('warehouseId', 'name code')
      .populate('lines.skuId', 'sku variantName')
      .sort({ createdAt: -1 })
      .limit(50);
    return successResponse(receipts);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'inventory:receive')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to create stock receipts.', 403);
    }

    const body = await req.json();
    const data = receiptSchema.parse(body);

    await connectToDatabase();
    const receiptNumber = await getNextSequence('stock_receipt', 'ML-REC');

    const receipt = await StockReceipt.create({
      receiptNumber,
      warehouseId: data.warehouseId,
      supplierName: data.supplierName,
      reference: data.reference,
      notes: data.notes,
      lines: data.lines,
      status: 'DRAFT',
      createdBy: session?.name || 'System Admin',
    });

    return successResponse(receipt, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
