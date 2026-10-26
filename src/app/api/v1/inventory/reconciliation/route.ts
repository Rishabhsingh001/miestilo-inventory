import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { reconcileBalances } from '@/services/inventory.service';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'inventory:reconcile')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to view reconciliation.', 403);
    }

    const warehouseId = req.nextUrl.searchParams.get('warehouseId') || undefined;
    const report = await reconcileBalances(warehouseId);
    return successResponse(report);
  } catch (error) {
    return handleApiError(error);
  }
}
