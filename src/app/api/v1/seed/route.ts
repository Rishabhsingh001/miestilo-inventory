import { NextRequest } from 'next/server';
import { runSeed } from '../../../../../scripts/seed';
import { successResponse, handleApiError } from '@/lib/errors/api';

export async function POST(req: NextRequest) {
  try {
    const result = await runSeed();
    return successResponse({
      message: 'Demo database seeded successfully with realistic hotel linen inventory.',
      result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
