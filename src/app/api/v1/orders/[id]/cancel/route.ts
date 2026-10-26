import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { cancelOrder } from '@/services/order.service';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const cancelSchema = z.object({
  reason: z.string().min(1).default('Customer requested cancellation'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'orders:cancel')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to cancel orders.', 403);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { reason } = cancelSchema.parse(body);

    const user = session || {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@misteriolifestyle.com',
      role: 'ADMIN' as const,
    };

    const order = await cancelOrder(id, reason, user);
    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}
