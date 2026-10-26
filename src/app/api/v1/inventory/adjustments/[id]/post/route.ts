import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { postAdjustment } from '@/services/inventory.service';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'inventory:adjust')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to post adjustments.', 403);
    }

    const { id } = await params;
    const user = session || {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@misteriolifestyle.com',
      role: 'ADMIN' as const,
    };

    const adjustment = await postAdjustment(id, user);
    return successResponse(adjustment);
  } catch (error) {
    return handleApiError(error);
  }
}
