import mongoose, { Schema, Document } from 'mongoose';

export interface ITransferLine {
  skuId: mongoose.Types.ObjectId;
  quantity: number;
}

export interface IStockTransfer extends Document {
  transferNumber: string;
  sourceWarehouseId: mongoose.Types.ObjectId;
  destinationWarehouseId: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'IN_TRANSIT' | 'RECEIVED' | 'CANCELLED';
  lines: ITransferLine[];
  notes?: string;
  dispatchedAt?: Date;
  dispatchedBy?: string;
  receivedAt?: Date;
  receivedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const TransferLineSchema = new Schema<ITransferLine>({
  skuId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  quantity: { type: Number, required: true, min: 1 },
});

const StockTransferSchema = new Schema<IStockTransfer>(
  {
    transferNumber: { type: String, required: true, unique: true },
    sourceWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    destinationWarehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'],
      default: 'DRAFT',
    },
    lines: [TransferLineSchema],
    notes: { type: String },
    dispatchedAt: { type: Date },
    dispatchedBy: { type: String },
    receivedAt: { type: Date },
    receivedBy: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const StockTransfer =
  mongoose.models.StockTransfer || mongoose.model<IStockTransfer>('StockTransfer', StockTransferSchema);
