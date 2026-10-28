import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { SalesOrder } from '@/models/SalesOrder';
import { Shipment } from '@/models/Shipment';
import { CustomerReturn } from '@/models/CustomerReturn';
import { StockMovement } from '@/models/StockMovement';
import { AuditEvent } from '@/models/AuditEvent';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const updateOrderSchema = z.object({
  notes: z.string().optional(),
  requiredDispatchDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  taxTotalMinor: z.number().int().min(0).optional(),
  customerGstin: z.string().optional(),
  shipToSnapshot: z.object({
    street: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
  }).optional(),
});

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

    // Strictly enforce: Super Admin ONLY
    if (session.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Access denied. Only Super Admin (Founder & MD) can edit order parameters.', 403);
    }

    const { id } = await params;
    const order = await SalesOrder.findById(id);
    if (!order) {
      return errorResponse('NOT_FOUND', 'Order not found.', 404);
    }

    const body = await req.json();
    const data = updateOrderSchema.parse(body);

    if (typeof data.notes === 'string') order.notes = data.notes.trim();
    if (data.requiredDispatchDate) order.requiredDispatchDate = new Date(data.requiredDispatchDate);
    if (data.expectedDeliveryDate) order.expectedDeliveryDate = new Date(data.expectedDeliveryDate);
    if (data.shipToSnapshot) order.shipToSnapshot = data.shipToSnapshot;
    if (data.taxTotalMinor !== undefined) {
      order.taxTotalMinor = data.taxTotalMinor;
      order.grandTotalMinor = order.subtotalMinor - order.discountTotalMinor + order.taxTotalMinor;
    }
    if (data.customerGstin !== undefined) {
      order.customerSnapshot = {
        ...order.customerSnapshot,
        taxId: data.customerGstin.trim(),
      };
    }

    await order.save();

    await AuditEvent.create({
      action: 'ORDER_UPDATED',
      entity: 'SALES_ORDER',
      entityId: order._id.toString(),
      actorId: session.id,
      actorName: session.name,
      details: {
        orderNumber: order.orderNumber,
        notes: order.notes,
      },
    });

    return successResponse({ order, message: 'Order details updated successfully.' });
  } catch (error) {
    return handleApiError(error);
  }
}
