import mongoose, { Schema, Document } from 'mongoose';

export interface IVariantAttributes {
  size?: string;
  color?: string;
  fabric?: string;
  gsm?: number;
  threadCount?: number;
  weave?: string;
  packaging?: string;
}

export interface IProductVariant extends Document {
  productId: mongoose.Types.ObjectId;
  sku: string; // Unique, uppercase normalized
  variantName: string;
  attributes: IVariantAttributes;
  barcode?: string;
  unit: string;
  reorderLevel: number;
  costMinor?: number; // Restricted to admin/super admin
  sellingPriceMinor: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ProductVariantSchema = new Schema<IProductVariant>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    variantName: { type: String, required: true, trim: true },
    attributes: {
      size: { type: String },
      color: { type: String },
      fabric: { type: String },
      gsm: { type: Number },
      threadCount: { type: Number },
      weave: { type: String },
      packaging: { type: String },
    },
    barcode: { type: String, sparse: true, trim: true },
    unit: { type: String, default: 'PIECE' },
    reorderLevel: { type: Number, default: 20 },
    costMinor: { type: Number },
    sellingPriceMinor: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ProductVariantSchema.index({ productId: 1, isActive: 1 });

export const ProductVariant =
  mongoose.models.ProductVariant || mongoose.model<IProductVariant>('ProductVariant', ProductVariantSchema);
