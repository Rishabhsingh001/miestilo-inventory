import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { Product } from '@/models/Product';
import { ProductVariant } from '@/models/ProductVariant';
import { AuditEvent } from '@/models/AuditEvent';
import { getSession } from '@/lib/auth/session';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const updateProductSchema = z.object({
  name: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  reorderLevel: z.number().optional(),
  defaultSellingPriceMinor: z.number().min(0).optional(),
  defaultCostMinor: z.number().min(0).optional(),
  variants: z.array(
    z.object({
      _id: z.string().optional(),
      sku: z.string().min(1),
      variantName: z.string().min(1),
      size: z.string().optional(),
      color: z.string().optional(),
      fabric: z.string().optional(),
      gsm: z.number().optional(),
      threadCount: z.number().optional(),
      sellingPriceMinor: z.number().min(0),
      costMinor: z.number().min(0).optional(),
      reorderLevel: z.number().optional(),
    })
  ).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const product = await Product.findById(id).populate('categoryId', 'name slug');
    if (!product) {
      return errorResponse('NOT_FOUND', 'Product not found.', 404);
    }

    const variants = await ProductVariant.find({ productId: product._id, isActive: true });
    return successResponse({ product, variants });
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

    // Strictly enforce: Super Admin ONLY can edit
    if (session.role !== 'SUPER_ADMIN') {
      return errorResponse('FORBIDDEN', 'Access denied. Only Super Admin (Founder & MD) can edit products.', 403);
    }

    const { id } = await params;
    const product = await Product.findById(id);
    if (!product) {
      return errorResponse('NOT_FOUND', 'Product not found.', 404);
    }

    const body = await req.json();
    const data = updateProductSchema.parse(body);

    if (data.name) product.name = data.name.trim();
    if (data.categoryId) product.categoryId = data.categoryId;
    if (typeof data.description === 'string') product.description = data.description.trim();
    if (data.brand) product.brand = data.brand.trim();
    if (data.unit) product.unit = data.unit;
    if (typeof data.reorderLevel === 'number') product.reorderLevel = data.reorderLevel;
    if (typeof data.defaultSellingPriceMinor === 'number') product.defaultSellingPriceMinor = data.defaultSellingPriceMinor;
    if (typeof data.defaultCostMinor === 'number') product.defaultCostMinor = data.defaultCostMinor;

    await product.save();

    // Update variant details if provided
    if (data.variants && data.variants.length > 0) {
      for (const v of data.variants) {
        if (v._id) {
          await ProductVariant.findByIdAndUpdate(v._id, {
            variantName: v.variantName,
            sellingPriceMinor: v.sellingPriceMinor,
            costMinor: v.costMinor,
            size: v.size,
            color: v.color,
            fabric: v.fabric,
            gsm: v.gsm,
            threadCount: v.threadCount,
            reorderLevel: v.reorderLevel,
          });
        }
      }
    }

    await AuditEvent.create({
      action: 'PRODUCT_UPDATED',
      entity: 'PRODUCT',
      entityId: product._id.toString(),
      actorId: session.id,
      actorName: session.name,
      details: {
        name: product.name,
        defaultSellingPriceMinor: product.defaultSellingPriceMinor,
      },
    });

    const updatedVariants = await ProductVariant.find({ productId: product._id, isActive: true });
    return successResponse({ product, variants: updatedVariants });
  } catch (error) {
    return handleApiError(error);
  }
}
