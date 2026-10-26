import mongoose, { Schema, Document } from 'mongoose';

export interface IAdjustmentLine {
  skuId: mongoose.Types.ObjectId;
  targetBucket: 'onHand' | 'damaged' | 'quarantined';
  deltaQuantity: number; // Signed: positive adds, negative removes
}

export interface IStockAdjustment extends Document {
  adjustmentNumber: string;
  warehouseId: mongoose.Types.ObjectId;
  reasonCode: 'CYCLE_COUNT_DISCREPANCY' | 'DAMAGED_IN_WAREHOUSE' | 'EXPIRED_DEFECTIVE' | 'FOUND_STOCK' | 'OTHER';
  notes: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'POSTED' | 'REJECTED';
  lines: IAdjustmentLine[];
  requiresApproval: boolean;
  approvedBy?: string;
  approvedAt?: Date;
  postedBy?: string;
  postedAt?: Date;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdjustmentLineSchema = new Schema<IAdjustmentLine>({
  skuId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  targetBucket: { type: String, enum: ['onHand', 'damaged', 'quarantined'], default: 'onHand' },
  deltaQuantity: { type: Number, required: true },
});

const StockAdjustmentSchema = new Schema<IStockAdjustment>(
  {
    adjustmentNumber: { type: String, required: true, unique: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    reasonCode: {
      type: String,
      required: true,
      enum: ['CYCLE_COUNT_DISCREPANCY', 'DAMAGED_IN_WAREHOUSE', 'EXPIRED_DEFECTIVE', 'FOUND_STOCK', 'OTHER'],
    },
    notes: { type: String, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_APPROVAL', 'POSTED', 'REJECTED'],
      default: 'DRAFT',
    },
    lines: [AdjustmentLineSchema],
    requiresApproval: { type: Boolean, default: false },
    approvedBy: { type: String },
    approvedAt: { type: Date },
    postedBy: { type: String },
    postedAt: { type: Date },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const StockAdjustment =
  mongoose.models.StockAdjustment || mongoose.model<IStockAdjustment>('StockAdjustment', StockAdjustmentSchema);
