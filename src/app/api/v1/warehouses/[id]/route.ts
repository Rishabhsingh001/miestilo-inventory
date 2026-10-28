import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { Warehouse } from '@/models/Warehouse';
import { AuditEvent } from '@/models/AuditEvent';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const updateWarehouseSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  contactName: z.string().optional(),
  contactPhone: z.string().optional(),
  capacity: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return errorResponse('NOT_FOUND', 'Warehouse not found.', 404);
    }
    return successResponse(warehouse);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    // Super Admin ONLY
    if (session.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Access denied. Only Super Admin (Founder & MD) can edit warehouses.', 403);
    }

    const { id } = await params;
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return errorResponse('NOT_FOUND', 'Warehouse not found.', 404);
    }

    const body = await req.json();
    const data = updateWarehouseSchema.parse(body);

    if (data.name) warehouse.name = data.name.trim();
    if (data.code) warehouse.code = data.code.trim();
    if (data.address) warehouse.address = data.address.trim();
    if (data.city) warehouse.city = data.city.trim();
    if (typeof data.contactName === 'string') warehouse.contactName = data.contactName.trim();
    if (typeof data.contactPhone === 'string') warehouse.contactPhone = data.contactPhone.trim();
    if (typeof data.capacity === 'number') warehouse.capacity = data.capacity;
    if (typeof data.isActive === 'boolean') warehouse.isActive = data.isActive;

    await warehouse.save();

    await AuditEvent.create({
      action: 'WAREHOUSE_UPDATED',
      entity: 'WAREHOUSE',
      entityId: warehouse._id.toString(),
      actorId: session.id,
      actorName: session.name,
      details: { name: warehouse.name, code: warehouse.code },
    });

    return successResponse(warehouse);
  } catch (error) {
    return handleApiError(error);
  }
}
