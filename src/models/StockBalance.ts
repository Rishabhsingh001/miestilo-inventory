import mongoose, { Schema, Document } from 'mongoose';

export interface IStockBalance extends Document {
  skuId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  binLocationId?: mongoose.Types.ObjectId;
  onHand: number;
  reserved: number;
  damaged: number;
  quarantined: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const StockBalanceSchema = new Schema<IStockBalance>(
  {
    skuId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    binLocationId: { type: Schema.Types.ObjectId, default: null },
    onHand: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    damaged: { type: Number, default: 0, min: 0 },
    quarantined: { type: Number, default: 0, min: 0 },
    version: { type: Number, default: 1 },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per SKU + Warehouse (+ optional Bin)
StockBalanceSchema.index({ skuId: 1, warehouseId: 1, binLocationId: 1 }, { unique: true });

export function calculateAvailable(balance: {
  onHand: number;
  reserved: number;
  damaged: number;
  quarantined: number;
}): number {
  return Math.max(0, balance.onHand - balance.reserved - balance.damaged - balance.quarantined);
}

export const StockBalance =
  mongoose.models.StockBalance || mongoose.model<IStockBalance>('StockBalance', StockBalanceSchema);
