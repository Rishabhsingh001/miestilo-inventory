import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { Warehouse } from '@/models/Warehouse';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const warehouseSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
});

export async function GET() {
  try {
    await connectToDatabase();
    const warehouses = await Warehouse.find({ isActive: true }).sort({ name: 1 });
    return successResponse(warehouses);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'inventory:adjust')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to create warehouses.', 403);
    }

    const body = await req.json();
    const data = warehouseSchema.parse(body);

    await connectToDatabase();
    const warehouse = await Warehouse.create(data);
    return successResponse(warehouse, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
