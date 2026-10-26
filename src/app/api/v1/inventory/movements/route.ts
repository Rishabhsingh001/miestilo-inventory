import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { StockMovement } from '@/models/StockMovement';
import { successResponse, handleApiError } from '@/lib/errors/api';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = req.nextUrl;
    const warehouseId = searchParams.get('warehouseId');
    const skuId = searchParams.get('skuId');
    const type = searchParams.get('type');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10)));

    const filter: Record<string, unknown> = {};
    if (warehouseId) filter.warehouseId = warehouseId;
    if (skuId) filter.skuId = skuId;
    if (type) filter.type = type;

    const total = await StockMovement.countDocuments(filter);
    const movements = await StockMovement.find(filter)
      .populate('skuId', 'sku variantName')
      .populate('warehouseId', 'name code')
      .sort({ occurredAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .lean();

    return successResponse(movements, { page, pageSize, total });
  } catch (error) {
    return handleApiError(error);
  }
}
