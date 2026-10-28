import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { SalesOrder } from '@/models/SalesOrder';
import { AuditEvent } from '@/models/AuditEvent';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const packOrderSchema = z.object({
  packageCount: z.number().int().min(1).default(1),
  grossWeightKg: z.number().positive().optional(),
  sealNumbers: z.string().optional(),
  packingNotes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    if (!hasPermission(session.role, 'orders:pack') && session.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to pack orders.', 403);
    }

    const { id } = await params;
    const order = await SalesOrder.findById(id);
    if (!order) {
      return errorResponse('NOT_FOUND', 'Sales order not found.', 404);
    }

    if (order.status !== 'CONFIRMED' && order.status !== 'PICKING' && order.status !== 'PACKED') {
      return errorResponse(
        'INVALID_STATUS',
        `Cannot pack order in '${order.status}' status. Order must be CONFIRMED or PICKING.`,
        400
      );
    }

    const body = await req.json();
    const data = packOrderSchema.parse(body);

    order.status = 'PACKED';
    order.packingDetails = {
      packedAt: new Date(),
      packedBy: session.name,
      packageCount: data.packageCount,
      grossWeightKg: data.grossWeightKg,
      sealNumbers: data.sealNumbers?.trim(),
      packingNotes: data.packingNotes?.trim(),
    };

    await order.save();

    await AuditEvent.create({
      action: 'ORDER_PACKED',
      entity: 'SALES_ORDER',
      entityId: order._id.toString(),
      actorId: session.id,
      actorName: session.name,
      details: {
        orderNumber: order.orderNumber,
        packageCount: data.packageCount,
        grossWeightKg: data.grossWeightKg,
        sealNumbers: data.sealNumbers,
      },
    });

    return successResponse({
      order,
      message: `Order ${order.orderNumber} successfully packed (${data.packageCount} carton${data.packageCount === 1 ? '' : 's'}). Ready for dispatch.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
