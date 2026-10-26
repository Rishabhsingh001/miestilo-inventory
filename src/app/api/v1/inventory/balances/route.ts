import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { StockBalance, calculateAvailable } from '@/models/StockBalance';
import { successResponse, handleApiError } from '@/lib/errors/api';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = req.nextUrl;
    const warehouseId = searchParams.get('warehouseId');
    const lowStock = searchParams.get('lowStock') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(300, Math.max(1, parseInt(searchParams.get('pageSize') || '100', 10)));

    const filter: Record<string, unknown> = {};
    if (warehouseId) {
      filter.warehouseId = warehouseId;
    }

    const balances = await StockBalance.find(filter)
      .populate({
        path: 'skuId',
        populate: { path: 'productId', select: 'name categoryId unit' },
      })
      .populate('warehouseId', 'name code city')
      .lean();

    // Map derived available quantity and filter by lowStock if requested
    let results = balances.map((b: any) => {
      const available = calculateAvailable(b);
      const reorderLevel = b.skuId?.reorderLevel || 20;
      return {
        ...b,
        available,
        isLowStock: available <= reorderLevel,
      };
    });

    if (lowStock) {
      results = results.filter((r) => r.isLowStock);
    }

    const total = results.length;
    const paginated = results.slice((page - 1) * pageSize, page * pageSize);

    return successResponse(paginated, { page, pageSize, total });
  } catch (error) {
    return handleApiError(error);
  }
}
