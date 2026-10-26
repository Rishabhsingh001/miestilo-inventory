import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { SalesOrder } from '@/models/SalesOrder';
import { Shipment } from '@/models/Shipment';
import { CustomerReturn } from '@/models/CustomerReturn';
import { StockMovement } from '@/models/StockMovement';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const order = await SalesOrder.findById(id).populate('warehouseId', 'name code address city');
    if (!order) {
      return errorResponse('NOT_FOUND', 'Order not found.', 404);
    }

    const shipments = await Shipment.find({ orderId: order._id }).sort({ createdAt: -1 });
    const returns = await CustomerReturn.find({ orderId: order._id }).sort({ createdAt: -1 });
    const movements = await StockMovement.find({
      referenceType: { $in: ['ORDER', 'SHIPMENT', 'RETURN'] },
      referenceId: {
        $in: [
          order.orderNumber,
          ...shipments.map((s) => s.shipmentNumber),
          ...returns.map((r) => r.returnNumber),
        ],
      },
    }).sort({ occurredAt: -1 });

    return successResponse({
      order,
      shipments,
      returns,
      movements,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
