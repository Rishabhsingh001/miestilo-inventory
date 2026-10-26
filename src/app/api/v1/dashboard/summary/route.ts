import { NextRequest } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { getDashboardSummary } from '@/services/reporting.service';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    // Allow demo/dev reading if not logged in or return session
    const warehouseId = req.nextUrl.searchParams.get('warehouseId') || undefined;
    const summary = await getDashboardSummary(warehouseId);
    return successResponse(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
