import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { AuditEvent } from '@/models/AuditEvent';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'audit:read')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to view audit logs.', 403);
    }

    await connectToDatabase();
    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '50', 10)));

    const total = await AuditEvent.countDocuments();
    const events = await AuditEvent.find()
      .sort({ timestamp: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return successResponse(events, { page, pageSize, total });
  } catch (error) {
    return handleApiError(error);
  }
}
