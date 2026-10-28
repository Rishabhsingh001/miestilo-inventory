import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { Customer } from '@/models/Customer';
import { AuditEvent } from '@/models/AuditEvent';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const updateCustomerSchema = z.object({
  companyName: z.string().min(1).optional(),
  contactName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  billingAddress: z.string().min(1).optional(),
  shippingAddresses: z.array(
    z.object({
      label: z.string().default('Main Hotel / Resort'),
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      isDefault: z.boolean().default(true),
    })
  ).optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return errorResponse('NOT_FOUND', 'Customer not found.', 404);
    }
    return successResponse(customer);
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
      return errorResponse('FORBIDDEN', 'Access denied. Only Super Admin (Founder & MD) can edit client records.', 403);
    }

    const { id } = await params;
    const customer = await Customer.findById(id);
    if (!customer) {
      return errorResponse('NOT_FOUND', 'Customer not found.', 404);
    }

    const body = await req.json();
    const data = updateCustomerSchema.parse(body);

    if (data.companyName) customer.companyName = data.companyName.trim();
    if (data.contactName) customer.contactName = data.contactName.trim();
    if (data.email) customer.email = data.email.toLowerCase().trim();
    if (data.phone) customer.phone = data.phone.trim();
    if (data.billingAddress) customer.billingAddress = data.billingAddress.trim();
    if (data.shippingAddresses) customer.shippingAddresses = data.shippingAddresses;
    if (typeof data.taxId === 'string') customer.taxId = data.taxId.trim();
    if (typeof data.notes === 'string') customer.notes = data.notes.trim();
    if (typeof data.isActive === 'boolean') customer.isActive = data.isActive;

    await customer.save();

    await AuditEvent.create({
      action: 'CUSTOMER_UPDATED',
      entity: 'CUSTOMER',
      entityId: customer._id.toString(),
      actorId: session.id,
      actorName: session.name,
      details: {
        companyName: customer.companyName,
        customerCode: customer.customerCode,
      },
    });

    return successResponse(customer);
  } catch (error) {
    return handleApiError(error);
  }
}
