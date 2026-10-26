import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { CustomerReturn } from '@/models/CustomerReturn';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { processCustomerReturn } from '@/services/order.service';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const returnSchema = z.object({
  orderId: z.string().min(1),
  shipmentId: z.string().optional(),
  reason: z.string().min(1),
  items: z
    .array(
      z.object({
        skuId: z.string().min(1),
        qty: z.number().int().min(1),
        condition: z.string().optional(),
        disposition: z.enum(['RESTOCK', 'QUARANTINE', 'REPAIR', 'SCRAP']),
      })
    )
    .min(1),
});

export async function GET() {
  try {
    await connectToDatabase();
    const returns = await CustomerReturn.find()
      .populate('orderId', 'orderNumber status')
      .populate('customerId', 'companyName contactName')
      .populate('warehouseId', 'name code')
      .populate('lines.skuId', 'sku variantName')
      .sort({ createdAt: -1 })
      .limit(50);

    return successResponse(returns);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'returns:process')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to process returns.', 403);
    }

    const body = await req.json();
    const data = returnSchema.parse(body);

    const user = session || {
      id: 'usr_admin',
      name: 'System Admin',
      email: 'admin@misteriolifestyle.com',
      role: 'ADMIN' as const,
    };

    const result = await processCustomerReturn(
      data.orderId,
      data.shipmentId,
      data.reason,
      data.items,
      user
    );

    return successResponse(result, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
