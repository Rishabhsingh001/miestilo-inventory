import { NextRequest } from 'next/server';
import { z } from 'zod';
import { connectToDatabase } from '@/lib/db/connection';
import { Product } from '@/models/Product';
import { ProductVariant } from '@/models/ProductVariant';
import { Category } from '@/models/Category';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/permissions/roles';
import { successResponse, errorResponse, handleApiError } from '@/lib/errors/api';

const createProductSchema = z.object({
  name: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().optional(),
  brand: z.string().default('Misterio Lifestyle'),
  unit: z.string().default('PIECE'),
  reorderLevel: z.number().default(20),
  defaultSellingPriceMinor: z.number().min(0),
  defaultCostMinor: z.number().optional(),
  variants: z
    .array(
      z.object({
        sku: z.string().min(1),
        variantName: z.string().min(1),
        size: z.string().optional(),
        color: z.string().optional(),
        fabric: z.string().optional(),
        gsm: z.number().optional(),
        threadCount: z.number().optional(),
        sellingPriceMinor: z.number().min(0),
        costMinor: z.number().optional(),
        reorderLevel: z.number().default(20),
      })
    )
    .min(1),
});

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = req.nextUrl;
    const q = searchParams.get('q');
    const categoryId = searchParams.get('categoryId');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10)));

    const filter: Record<string, unknown> = { isActive: true };
    if (categoryId) {
      filter.categoryId = categoryId;
    }
    if (q) {
      filter.name = { $regex: q, $options: 'i' };
    }

    const total = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('categoryId', 'name slug')
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .sort({ createdAt: -1 })
      .lean();

    // Attach variants to products
    const productIds = products.map((p) => p._id);
    const variants = await ProductVariant.find({ productId: { $in: productIds }, isActive: true }).lean();

    const variantsByProduct = variants.reduce((acc: Record<string, unknown[]>, v: any) => {
      const pid = v.productId.toString();
      if (!acc[pid]) acc[pid] = [];
      acc[pid].push(v);
      return acc;
    }, {});

    const enriched = products.map((p: any) => ({
      ...p,
      variants: variantsByProduct[p._id.toString()] || [],
    }));

    return successResponse(enriched, { page, pageSize, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (session && !hasPermission(session.role, 'products:manage')) {
      return errorResponse('FORBIDDEN', 'Insufficient permissions to create products.', 403);
    }

    const body = await req.json();
    const data = createProductSchema.parse(body);

    await connectToDatabase();

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const product = await Product.create({
      name: data.name,
      slug: `${slug}-${Date.now().toString(36)}`,
      categoryId: data.categoryId,
      description: data.description,
      brand: data.brand,
      unit: data.unit,
      reorderLevel: data.reorderLevel,
      defaultSellingPriceMinor: data.defaultSellingPriceMinor,
      defaultCostMinor: data.defaultCostMinor,
    });

    const createdVariants = [];
    for (const v of data.variants) {
      const variant = await ProductVariant.create({
        productId: product._id,
        sku: v.sku.toUpperCase().trim(),
        variantName: v.variantName,
        attributes: {
          size: v.size,
          color: v.color,
          fabric: v.fabric,
          gsm: v.gsm,
          threadCount: v.threadCount,
        },
        unit: data.unit,
        reorderLevel: v.reorderLevel || data.reorderLevel,
        sellingPriceMinor: v.sellingPriceMinor || data.defaultSellingPriceMinor,
        costMinor: v.costMinor || data.defaultCostMinor,
      });
      createdVariants.push(variant);
    }

    return successResponse({ product, variants: createdVariants }, {}, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
