import { NextRequest } from 'next/server';
import { connectToDatabase } from '@/lib/db/connection';
import { Category } from '@/models/Category';
import { successResponse, handleApiError } from '@/lib/errors/api';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    return successResponse(categories);
  } catch (error) {
    return handleApiError(error);
  }
}
