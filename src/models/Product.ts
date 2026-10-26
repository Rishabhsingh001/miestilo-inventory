import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  slug: string;
  categoryId: mongoose.Types.ObjectId;
  description?: string;
  brand: string;
  unit: string; // PIECE, SET, PACK, CARTON
  imageUrls: string[];
  reorderLevel: number;
  defaultCostMinor?: number; // Restricted to admin/super admin
  defaultSellingPriceMinor: number;
  isActive: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String },
    brand: { type: String, default: 'miestilo Lifestyle' },
    unit: { type: String, default: 'PIECE' },
    imageUrls: [{ type: String }],
    reorderLevel: { type: Number, default: 20 },
    defaultCostMinor: { type: Number },
    defaultSellingPriceMinor: { type: Number, required: true, default: 0 },
    isActive: { type: Boolean, default: true },
    archivedAt: { type: Date },
  },
  { timestamps: true }
);

ProductSchema.index({ categoryId: 1, isActive: 1 });
ProductSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema);
