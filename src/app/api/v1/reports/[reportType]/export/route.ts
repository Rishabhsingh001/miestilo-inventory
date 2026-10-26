import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { StockBalance, calculateAvailable } from '@/models/StockBalance';
import { StockMovement } from '@/models/StockMovement';
import { SalesOrder } from '@/models/SalesOrder';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { escapeCsvCell } from '@/services/reporting.service';
import { errorResponse, handleApiError } from '@/lib/errors/api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reportType: string }> }
) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'reports:export')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to export reports.', 403);
    }

    const { reportType } = await params;
    await connectToDatabase();

    let csvContent = '';
    const now = new Date().toISOString().split('T')[0];

    if (reportType === 'inventory' || reportType === 'stock-balances') {
      const balances = await StockBalance.find()
        .populate('skuId')
        .populate('warehouseId', 'name code');

      const headers = ['SKU', 'Variant Name', 'Warehouse', 'On Hand', 'Reserved', 'Damaged', 'Quarantined', 'Available'];
      const rows = balances.map((b: any) => [
        escapeCsvCell(b.skuId?.sku),
        escapeCsvCell(b.skuId?.variantName),
        escapeCsvCell(b.warehouseId?.name),
        escapeCsvCell(b.onHand),
        escapeCsvCell(b.reserved),
        escapeCsvCell(b.damaged),
        escapeCsvCell(b.quarantined),
        escapeCsvCell(calculateAvailable(b)),
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (reportType === 'movements') {
      const movements = await StockMovement.find()
        .populate('skuId', 'sku variantName')
        .populate('warehouseId', 'name code')
        .sort({ occurredAt: -1 })
        .limit(1000);

      const headers = ['Movement No', 'Type', 'Occurred At', 'SKU', 'Warehouse', 'Qty Delta', 'Reserved Delta', 'Reference Type', 'Reference ID', 'Actor', 'Notes'];
      const rows = movements.map((m: any) => [
        escapeCsvCell(m.movementNumber),
        escapeCsvCell(m.type),
        escapeCsvCell(m.occurredAt?.toISOString()),
        escapeCsvCell(m.skuId?.sku),
        escapeCsvCell(m.warehouseId?.name),
        escapeCsvCell(m.quantityDelta),
        escapeCsvCell(m.reservedDelta),
        escapeCsvCell(m.referenceType),
        escapeCsvCell(m.referenceId),
        escapeCsvCell(m.actorName),
        escapeCsvCell(m.notes),
      ]);

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else if (reportType === 'orders') {
      const orders = await SalesOrder.find()
        .populate('warehouseId', 'name code')
        .sort({ orderDate: -1 })
        .limit(1000);

      const headers = ['Order No', 'Date', 'Customer', 'Warehouse', 'Status', 'Ordered Units', 'Dispatched Units', 'Grand Total (INR)'];
      const rows = orders.map((o: any) => {
        const totalOrdered = o.lines.reduce((s: number, l: any) => s + l.orderedQty, 0);
        const totalDispatched = o.lines.reduce((s: number, l: any) => s + l.dispatchedQty, 0);
        return [
          escapeCsvCell(o.orderNumber),
          escapeCsvCell(o.orderDate?.toISOString().split('T')[0]),
          escapeCsvCell(o.customerSnapshot?.companyName),
          escapeCsvCell(o.warehouseId?.name),
          escapeCsvCell(o.status),
          escapeCsvCell(totalOrdered),
          escapeCsvCell(totalDispatched),
          escapeCsvCell((o.grandTotalMinor / 100).toFixed(2)),
        ];
      });

      csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    } else {
      return errorResponse('NOT_FOUND', `Unsupported report type '${reportType}'.`, 404);
    }

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="miestilo_${reportType}_${now}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
