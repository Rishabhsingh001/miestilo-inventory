import mongoose from 'mongoose';
import { connectToDatabase } from '@/lib/db/connection';
import { ProductVariant } from '@/models/ProductVariant';
import { StockBalance, calculateAvailable } from '@/models/StockBalance';
import { StockMovement } from '@/models/StockMovement';
import { SalesOrder } from '@/models/SalesOrder';
import { CustomerReturn } from '@/models/CustomerReturn';

export interface DashboardSummary {
  kpis: {
    totalSkus: number;
    totalAvailableUnits: number;
    lowStockCount: number;
    openOrdersCount: number;
    dispatchedToday: number;
  };
  chartData: Array<{ date: string; inbound: number; outbound: number }>;
  recentMovements: unknown[];
  attentionItems: {
    lowStock: unknown[];
    ordersAwaitingDispatch: unknown[];
    pendingReturns: unknown[];
  };
}

export async function getDashboardSummary(warehouseId?: string): Promise<DashboardSummary> {
  await connectToDatabase();

  const query: Record<string, unknown> = {};
  if (warehouseId) {
    query.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }

  // 1. Total active SKUs
  const totalSkus = await ProductVariant.countDocuments({ isActive: true });

  // 2. Balances & low stock
  const balances = await StockBalance.find(query).populate('skuId');
  let totalAvailableUnits = 0;
  let lowStockCount = 0;
  const lowStockItems: unknown[] = [];

  for (const b of balances) {
    const available = calculateAvailable(b);
    totalAvailableUnits += available;
    const reorderLevel = (b.skuId as any)?.reorderLevel || 20;
    if (available <= reorderLevel) {
      lowStockCount++;
      if (lowStockItems.length < 5) {
        lowStockItems.push({
          sku: (b.skuId as any)?.sku || 'SKU',
          name: (b.skuId as any)?.variantName || 'Product',
          available,
          reorderLevel,
        });
      }
    }
  }

  // 3. Open orders count
  const openOrderQuery: Record<string, unknown> = {
    status: { $in: ['CONFIRMED', 'PICKING', 'PARTIALLY_FULFILLED'] },
  };
  if (warehouseId) {
    openOrderQuery.warehouseId = new mongoose.Types.ObjectId(warehouseId);
  }
  const openOrdersCount = await SalesOrder.countDocuments(openOrderQuery);
  const ordersAwaitingDispatch = await SalesOrder.find(openOrderQuery)
    .sort({ orderDate: 1 })
    .limit(5)
    .select('orderNumber customerSnapshot status orderDate lines');

  // 4. Dispatched today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dispatchMovements = await StockMovement.aggregate([
    {
      $match: {
        type: 'DISPATCH',
        occurredAt: { $gte: startOfDay },
        ...(warehouseId ? { warehouseId: new mongoose.Types.ObjectId(warehouseId) } : {}),
      },
    },
    {
      $group: {
        _id: null,
        totalDispatched: { $sum: '$quantityDelta' },
      },
    },
  ]);
  const dispatchedToday = Math.abs(dispatchMovements[0]?.totalDispatched || 0);

  // 5. 7-day stock flow chart
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const chartMovements = await StockMovement.find({
    occurredAt: { $gte: sevenDaysAgo },
    ...(warehouseId ? { warehouseId: new mongoose.Types.ObjectId(warehouseId) } : {}),
  }).sort({ occurredAt: 1 });

  const chartMap: Record<string, { inbound: number; outbound: number }> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    chartMap[key] = { inbound: 0, outbound: 0 };
  }

  for (const m of chartMovements) {
    const key = new Date(m.occurredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (chartMap[key]) {
      if (m.quantityDelta > 0) {
        chartMap[key].inbound += m.quantityDelta;
      } else if (m.quantityDelta < 0) {
        chartMap[key].outbound += Math.abs(m.quantityDelta);
      }
    }
  }

  const chartData = Object.entries(chartMap).map(([date, val]) => ({
    date,
    inbound: val.inbound,
    outbound: val.outbound,
  }));

  // 6. Recent stock movements
  const recentMovements = await StockMovement.find(
    warehouseId ? { warehouseId: new mongoose.Types.ObjectId(warehouseId) } : {}
  )
    .sort({ occurredAt: -1 })
    .limit(8)
    .populate('skuId', 'sku variantName');

  // 7. Pending returns
  const pendingReturns = await CustomerReturn.find({
    status: { $in: ['DRAFT', 'RECEIVED', 'INSPECTED'] },
  })
    .sort({ createdAt: -1 })
    .limit(5);

  return {
    kpis: {
      totalSkus,
      totalAvailableUnits,
      lowStockCount,
      openOrdersCount,
      dispatchedToday,
    },
    chartData,
    recentMovements,
    attentionItems: {
      lowStock: lowStockItems,
      ordersAwaitingDispatch,
      pendingReturns,
    },
  };
}

/**
 * Sanitize cell values against CSV injection attacks (=, +, -, @ prefix)
 */
export function escapeCsvCell(val: unknown): string {
  if (val === null || val === undefined) return '""';
  let str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}
