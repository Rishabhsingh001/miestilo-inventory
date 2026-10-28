import mongoose, { Schema, Document } from 'mongoose';

export type OrderStatus =
  | 'DRAFT'
  | 'CONFIRMED'
  | 'PACKED'
  | 'PICKING'
  | 'PARTIALLY_FULFILLED'
  | 'FULFILLED'
  | 'CANCELLED'
  | 'RETURNED'
  | 'PARTIALLY_RETURNED';

export interface ISkuSnapshot {
  sku: string;
  name: string;
  variantName: string;
  unit: string;
  size?: string;
  color?: string;
  fabric?: string;
  gsm?: number;
  threadCount?: number;
}

export interface IOrderLine {
  _id?: mongoose.Types.ObjectId;
  skuId: mongoose.Types.ObjectId;
  skuSnapshot: ISkuSnapshot;
  orderedQty: number;
  reservedQty: number;
  dispatchedQty: number;
  returnedQty: number;
  unitPriceMinor: number; // e.g. 150000 = Rs 1,500.00
  discountMinor: number;
  taxRatePercent: number; // e.g. 12%
  taxAmountMinor: number;
  lineTotalMinor: number;
}

export interface ISalesOrder extends Document {
  orderNumber: string; // Unique: ML-ORD-2026-000001
  customerId: mongoose.Types.ObjectId;
  customerSnapshot: {
    customerCode: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string;
  };
  shipToSnapshot: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  orderDate: Date;
  requiredDispatchDate?: Date;
  expectedDeliveryDate?: Date;
  warehouseId: mongoose.Types.ObjectId;
  status: OrderStatus;
  lines: IOrderLine[];
  currency: string;
  subtotalMinor: number;
  discountTotalMinor: number;
  taxTotalMinor: number;
  grandTotalMinor: number;
  notes?: string;
  packingDetails?: {
    packedAt?: Date;
    packedBy?: string;
    packageCount?: number;
    grossWeightKg?: number;
    sealNumbers?: string;
    packingNotes?: string;
  };
  idempotencyKey?: string;
  createdBy: string;
  confirmedBy?: string;
  confirmedAt?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderLineSchema = new Schema<IOrderLine>({
  skuId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
  skuSnapshot: {
    sku: { type: String, required: true },
    name: { type: String, required: true },
    variantName: { type: String, required: true },
    unit: { type: String, default: 'PIECE' },
    size: { type: String },
    color: { type: String },
    fabric: { type: String },
    gsm: { type: Number },
    threadCount: { type: Number },
  },
  orderedQty: { type: Number, required: true, min: 1 },
  reservedQty: { type: Number, default: 0, min: 0 },
  dispatchedQty: { type: Number, default: 0, min: 0 },
  returnedQty: { type: Number, default: 0, min: 0 },
  unitPriceMinor: { type: Number, required: true, default: 0 },
  discountMinor: { type: Number, default: 0 },
  taxRatePercent: { type: Number, default: 12 },
  taxAmountMinor: { type: Number, default: 0 },
  lineTotalMinor: { type: Number, required: true, default: 0 },
});

const SalesOrderSchema = new Schema<ISalesOrder>(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    customerSnapshot: {
      customerCode: { type: String, required: true },
      companyName: { type: String, required: true },
      contactName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
    },
    shipToSnapshot: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
    orderDate: { type: Date, default: () => new Date() },
    requiredDispatchDate: { type: Date },
    expectedDeliveryDate: { type: Date },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    status: {
      type: String,
      enum: [
        'DRAFT',
        'CONFIRMED',
        'PACKED',
        'PICKING',
        'PARTIALLY_FULFILLED',
        'FULFILLED',
        'CANCELLED',
        'RETURNED',
        'PARTIALLY_RETURNED',
      ],
      default: 'DRAFT',
    },
    lines: [OrderLineSchema],
    currency: { type: String, default: 'INR' },
    subtotalMinor: { type: Number, default: 0 },
    discountTotalMinor: { type: Number, default: 0 },
    taxTotalMinor: { type: Number, default: 0 },
    grandTotalMinor: { type: Number, default: 0 },
    notes: { type: String },
    packingDetails: {
      packedAt: { type: Date },
      packedBy: { type: String },
      packageCount: { type: Number, default: 1 },
      grossWeightKg: { type: Number },
      sealNumbers: { type: String },
      packingNotes: { type: String },
    },
    idempotencyKey: { type: String, sparse: true, unique: true },
    createdBy: { type: String, required: true },
    confirmedBy: { type: String },
    confirmedAt: { type: Date },
    cancelledBy: { type: String },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
  },
  { timestamps: true }
);

SalesOrderSchema.index({ customerId: 1, orderDate: -1 });
SalesOrderSchema.index({ status: 1, orderDate: -1 });

export const SalesOrder =
  mongoose.models.SalesOrder || mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);
