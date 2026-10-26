import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { dispatchShipment } from '@/services/order.service';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const shipmentSchema = z.object({
  carrier: z.string().optional(),
  trackingNumber: z.string().optional(),
  packageCount: z.number().int().default(1),
  dispatchNotes: z.string().optional(),
  lines: z
    .array(
      z.object({
        skuId: z.string().min(1),
        qty: z.number().int().min(1),
      })
    )
    .min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'orders:dispatch')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to dispatch shipments.', 403);
    }

    const { id } = await params;
    const body = await req.json();
    const data = shipmentSchema.parse(body);

    const user = session || {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@misteriolifestyle.com',
      role: 'ADMIN' as const,
    };

    const result = await dispatchShipment(id, data, user);
    return successResponse(result, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
