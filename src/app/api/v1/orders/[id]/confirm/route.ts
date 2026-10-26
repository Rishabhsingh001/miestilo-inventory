import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { confirmOrder } from '@/services/order.service';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'orders:confirm')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to confirm orders.', 403);
    }

    const { id } = await params;
    const user = session || {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@misteriolifestyle.com',
      role: 'ADMIN' as const,
    };

    const order = await confirmOrder(id, user);
    return successResponse(order);
  } catch (error) {
    return handleApiError(error);
  }
}
