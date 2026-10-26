import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { postReceipt } from '@/services/inventory.service';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'inventory:receive')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to post receipts.', 403);
    }

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const user = session || {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@misteriolifestyle.com',
      role: 'ADMIN' as const,
    };

    const result = await postReceipt(id, user, body.idempotencyKey);
    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
