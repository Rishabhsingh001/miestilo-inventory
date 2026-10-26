import { getSession, clearSession } from '@/lib/auth/session';
import { successResponse, errorResponse } from '@/lib/errors/api';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return errorResponse('UNAUTHORIZED', 'Not authenticated.', 401);
  }
  return successResponse(session);
}

export async function POST() {
  await clearSession();
  return successResponse({ message: 'Logged out successfully.' });
}
