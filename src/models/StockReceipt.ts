import mongoose, { Schema, Document } from 'mongoose';

export interface IReceiptLine {
  skuId: mongoose.Types.ObjectId;
  quantity: number;
  unitCostMinor?: number;
}

export interface IStockReceipt extends Document {
  receiptNumber: string;
  reference?: string;
  supplierName?: string;
  warehouseId: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'POSTED' | 'CANCELLED';
  lines: IReceiptLine[];
  notes?: string;
  idempotencyKey?: string;
  postedAt?: Date;
  postedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReceiptLineSchema = new Schema<IReceiptLine>({
  skuId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true, min: 1 },
  unitCostMinor: { type: Number },
});

const StockReceiptSchema = new Schema<IStockReceipt>(
  {
    receiptNumber: { type: String, required: true, unique: true },
    reference: { type: String },
    supplierName: { type: String },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    status: { type: String, enum: ['DRAFT', 'POSTED', 'CANCELLED'], default: 'DRAFT' },
    lines: [ReceiptLineSchema],
    notes: { type: String },
    idempotencyKey: { type: String, sparse: true, unique: true },
    postedAt: { type: Date },
    postedBy: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const StockReceipt =
  mongoose.models.StockReceipt || mongoose.model<IStockReceipt>('StockReceipt', StockReceiptSchema);
