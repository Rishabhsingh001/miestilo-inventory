import mongoose, { Schema, Document } from 'mongoose';

export type ReturnDisposition = 'RESTOCK' | 'QUARANTINE' | 'REPAIR' | 'SCRAP';

export interface IReturnLine {
  skuId: mongoose.Types.ObjectId;
  qty: number;
  condition?: string;
  disposition: ReturnDisposition;
}

export interface ICustomerReturn extends Document {
  returnNumber: string; // ML-RET-YYYY-XXXXXX
  orderId: mongoose.Types.ObjectId;
  shipmentId?: mongoose.Types.ObjectId;
  customerId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  lines: IReturnLine[];
  reason: string;
  status: 'DRAFT' | 'RECEIVED' | 'INSPECTED' | 'POSTED' | 'REJECTED';
  receivedAt?: Date;
  inspectedBy?: string;
  postedBy?: string;
  postedAt?: Date;
  stockMovementIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ReturnLineSchema = new Schema<IReturnLine>({
  skuId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  qty: { type: Number, required: true, min: 1 },
  condition: { type: String },
  disposition: {
    type: String,
    enum: ['RESTOCK', 'QUARANTINE', 'REPAIR', 'SCRAP'],
    default: 'RESTOCK',
  },
});

const CustomerReturnSchema = new Schema<ICustomerReturn>(
  {
    returnNumber: { type: String, required: true, unique: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    shipmentId: { type: Schema.Types.ObjectId, ref: 'Shipment' },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    lines: [ReturnLineSchema],
    reason: { type: String, required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'RECEIVED', 'INSPECTED', 'POSTED', 'REJECTED'],
      default: 'DRAFT',
    },
    receivedAt: { type: Date },
    inspectedBy: { type: String },
    postedBy: { type: String },
    postedAt: { type: Date },
    stockMovementIds: [{ type: Schema.Types.ObjectId, ref: 'StockMovement' }],
  },
  { timestamps: true }
);

CustomerReturnSchema.index({ orderId: 1, createdAt: -1 });
CustomerReturnSchema.index({ customerId: 1, createdAt: -1 });

export const CustomerReturn =
  mongoose.models.CustomerReturn || mongoose.model<ICustomerReturn>('CustomerReturn', CustomerReturnSchema);
