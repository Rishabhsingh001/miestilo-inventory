import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { Customer } from '@/models/Customer';
import { getNextSequence } from '@/models/Counter';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const customerSchema = z.object({
  companyName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  billingAddress: z.string().min(1),
  shippingAddresses: z.array(
    z.object({
      label: z.string().default('Main Hotel / Resort'),
      street: z.string().min(1),
      city: z.string().min(1),
      state: z.string().min(1),
      postalCode: z.string().min(1),
      isDefault: z.boolean().default(true),
    })
  ).min(1),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = req.nextUrl;
    const q = searchParams.get('q');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10)));

    const filter: Record<string, unknown> = { isActive: true };
    if (q) {
      filter.$or = [
        { companyName: { $regex: q, $options: 'i' } },
        { contactName: { $regex: q, $options: 'i' } },
        { customerCode: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } },
      ];
    }

    const total = await Customer.countDocuments(filter);
    const customers = await Customer.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return successResponse(customers, { page, pageSize, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'customers:manage')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to create customers.', 403);
    }

    const body = await req.json();
    const data = customerSchema.parse(body);

    await connectToDatabase();
    const customerCode = await getNextSequence('customer', 'CUST');

    const customer = await Customer.create({
      ...data,
      customerCode,
      createdBy: session?.name || 'System Admin',
    });

    return successResponse(customer, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
