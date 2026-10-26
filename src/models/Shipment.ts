import mongoose, { Schema, Document } from 'mongoose';

export interface IShipmentLine {
  skuId: mongoose.Types.ObjectId;
  qty: number;
}

export interface IShipment extends Document {
  shipmentNumber: string; // ML-SHP-YYYY-XXXXXX
  orderId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  status: 'DRAFT' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  lines: IShipmentLine[];
  carrier?: string;
  trackingNumber?: string;
  dispatchDate: Date;
  expectedDeliveryDate?: Date;
  deliveredAt?: Date;
  packageCount?: number;
  dispatchNotes?: string;
  dispatchedBy?: string;
  stockMovementIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ShipmentLineSchema = new Schema<IShipmentLine>({
  skuId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  qty: { type: Number, required: true, min: 1 },
});

const ShipmentSchema = new Schema<IShipment>(
  {
    shipmentNumber: { type: String, required: true, unique: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    status: {
      type: String,
      enum: ['DRAFT', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
      default: 'DRAFT',
    },
    lines: [ShipmentLineSchema],
    carrier: { type: String },
    trackingNumber: { type: String },
    dispatchDate: { type: Date, default: () => new Date() },
    expectedDeliveryDate: { type: Date },
    deliveredAt: { type: Date },
    packageCount: { type: Number, default: 1 },
    dispatchNotes: { type: String },
    dispatchedBy: { type: String },
    stockMovementIds: [{ type: Schema.Types.ObjectId, ref: 'StockMovement' }],
  },
  { timestamps: true }
);

ShipmentSchema.index({ orderId: 1, dispatchDate: -1 });

export const Shipment = mongoose.models.Shipment || mongoose.model<IShipment>('Shipment', ShipmentSchema);
