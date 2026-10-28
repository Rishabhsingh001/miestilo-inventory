import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { SalesOrder } from '@/models/SalesOrder';
import { Customer } from '@/models/Customer';
import { ProductVariant } from '@/models/ProductVariant';
import { getNextSequence } from '@/models/Counter';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const orderSchema = z.object({
  customerId: z.string().min(1),
  warehouseId: z.string().min(1),
  requiredDispatchDate: z.string().optional(),
  expectedDeliveryDate: z.string().optional(),
  notes: z.string().optional(),
  customGstin: z.string().optional(),
  manualTaxAmountMinor: z.number().int().min(0).optional(),
  lines: z
    .array(
      z.object({
        skuId: z.string().min(1),
        orderedQty: z.number().int().min(1),
        unitPriceMinor: z.number().int().min(0),
        discountMinor: z.number().int().default(0),
        taxRatePercent: z.number().min(0).max(100).default(12),
      })
    )
    .min(1),
});

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = req.nextUrl;
    const q = searchParams.get('q');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const warehouseId = searchParams.get('warehouseId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10)));

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (customerId) filter.customerId = customerId;
    if (warehouseId) filter.warehouseId = warehouseId;
    if (q) {
      filter.$or = [
        { orderNumber: { $regex: q, $options: 'i' } },
        { 'customerSnapshot.companyName': { $regex: q, $options: 'i' } },
        { 'customerSnapshot.contactName': { $regex: q, $options: 'i' } },
      ];
    }

    const total = await SalesOrder.countDocuments(filter);
    const orders = await SalesOrder.find(filter)
      .populate('warehouseId', 'name code city')
      .sort({ orderDate: -1 })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return successResponse(orders, { page, pageSize, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'orders:create')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to create orders.', 403);
    }

    const body = await req.json();
    const data = orderSchema.parse(body);

    await connectToDatabase();

    const customer = await Customer.findById(data.customerId);
    if (!customer) {
      return errorResponse('NOT_FOUND', 'Customer not found.', 404);
    }

    const defaultAddress =
      customer.shippingAddresses.find((a: any) => a.isDefault) || customer.shippingAddresses[0] || {
        street: customer.billingAddress,
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
      };

    const orderNumber = await getNextSequence('sales_order', 'ML-ORD');

    // Build line items with snapshots and calculations
    let subtotalMinor = 0;
    let discountTotalMinor = 0;
    let taxTotalMinor = 0;
    const lines = [];

    for (const item of data.lines) {
      const variant = await ProductVariant.findById(item.skuId).populate('productId');
      if (!variant) {
        return errorResponse('NOT_FOUND', `SKU not found for ID: ${item.skuId}`, 404);
      }

      const itemSubtotal = item.orderedQty * item.unitPriceMinor;
      const itemTax = Math.round(((itemSubtotal - item.discountMinor) * item.taxRatePercent) / 100);
      const lineTotal = itemSubtotal - item.discountMinor + itemTax;

      subtotalMinor += itemSubtotal;
      discountTotalMinor += item.discountMinor;
      taxTotalMinor += itemTax;

      lines.push({
        skuId: variant._id,
        skuSnapshot: {
          sku: variant.sku,
          name: (variant.productId as any)?.name || variant.variantName,
          variantName: variant.variantName,
          unit: variant.unit || 'PIECE',
          size: variant.attributes?.size,
          color: variant.attributes?.color,
          fabric: variant.attributes?.fabric,
          gsm: variant.attributes?.gsm,
          threadCount: variant.attributes?.threadCount,
        },
        orderedQty: item.orderedQty,
        reservedQty: 0,
        dispatchedQty: 0,
        returnedQty: 0,
        unitPriceMinor: item.unitPriceMinor,
        discountMinor: item.discountMinor,
        taxRatePercent: item.taxRatePercent,
        taxAmountMinor: itemTax,
        lineTotalMinor: lineTotal,
      });
    }

    if (data.manualTaxAmountMinor !== undefined) {
      taxTotalMinor = data.manualTaxAmountMinor;
    }
    const grandTotalMinor = subtotalMinor - discountTotalMinor + taxTotalMinor;

    const order = await SalesOrder.create({
      orderNumber,
      customerId: customer._id,
      customerSnapshot: {
        customerCode: customer.customerCode,
        companyName: customer.companyName,
        contactName: customer.contactName,
        email: customer.email,
        phone: customer.phone,
        taxId: data.customGstin || customer.taxId || '',
      },
      shipToSnapshot: {
        street: defaultAddress.street,
        city: defaultAddress.city,
        state: defaultAddress.state,
        postalCode: defaultAddress.postalCode,
      },
      warehouseId: data.warehouseId,
      requiredDispatchDate: data.requiredDispatchDate ? new Date(data.requiredDispatchDate) : undefined,
      expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : undefined,
      notes: data.notes,
      lines,
      currency: 'INR',
      subtotalMinor,
      discountTotalMinor,
      taxTotalMinor,
      grandTotalMinor,
      status: 'DRAFT',
      createdBy: session?.name || 'System Admin',
    });

    return successResponse(order, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
