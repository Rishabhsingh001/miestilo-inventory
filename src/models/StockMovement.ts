import mongoose, { Schema, Document } from 'mongoose';

export type MovementType =
  | 'RECEIPT'
  | 'RESERVATION'
  | 'RESERVATION_RELEASE'
  | 'DISPATCH'
  | 'CUSTOMER_RETURN_RESTOCK'
  | 'CUSTOMER_RETURN_QUARANTINE'
  | 'DAMAGE'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'REVERSAL';

export type ReferenceType =
  | 'ORDER'
  | 'SHIPMENT'
  | 'RECEIPT'
  | 'TRANSFER'
  | 'RETURN'
  | 'ADJUSTMENT'
  | 'STOCKTAKE';

export interface IStockMovement extends Document {
  movementNumber: string;
  type: MovementType;
  skuId: mongoose.Types.ObjectId;
  warehouseId: mongoose.Types.ObjectId;
  binLocationId?: mongoose.Types.ObjectId;
  quantityDelta: number; // Signed integer for on-hand changes
  reservedDelta: number; // Signed integer for reservation changes
  damagedDelta: number; // Signed integer for damaged changes
  quarantinedDelta: number; // Signed integer for quarantine changes
  referenceType: ReferenceType;
  referenceId: string;
  correlationId?: string;
  reasonCode?: string;
  notes?: string;
  actorUserId?: string;
  actorName?: string;
  occurredAt: Date;
  reversalOfMovementId?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    movementNumber: { type: String, required: true, unique: true },
    type: {
      type: String,
      required: true,
      enum: [
        'RECEIPT',
        'RESERVATION',
        'RESERVATION_RELEASE',
        'DISPATCH',
        'CUSTOMER_RETURN_RESTOCK',
        'CUSTOMER_RETURN_QUARANTINE',
        'DAMAGE',
        'ADJUSTMENT_IN',
        'ADJUSTMENT_OUT',
        'TRANSFER_OUT',
        'TRANSFER_IN',
        'REVERSAL',
      ],
    },
    skuId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    binLocationId: { type: Schema.Types.ObjectId, default: null },
    quantityDelta: { type: Number, default: 0 },
    reservedDelta: { type: Number, default: 0 },
    damagedDelta: { type: Number, default: 0 },
    quarantinedDelta: { type: Number, default: 0 },
    referenceType: {
      type: String,
      required: true,
      enum: ['ORDER', 'SHIPMENT', 'RECEIPT', 'TRANSFER', 'RETURN', 'ADJUSTMENT', 'STOCKTAKE'],
    },
    referenceId: { type: String, required: true },
    correlationId: { type: String },
    reasonCode: { type: String },
    notes: { type: String },
    actorUserId: { type: String },
    actorName: { type: String },
    occurredAt: { type: Date, default: () => new Date() },
    reversalOfMovementId: { type: Schema.Types.ObjectId, ref: 'StockMovement' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

StockMovementSchema.index({ skuId: 1, occurredAt: -1 });
StockMovementSchema.index({ warehouseId: 1, occurredAt: -1 });
StockMovementSchema.index({ referenceType: 1, referenceId: 1 });
StockMovementSchema.index({ occurredAt: -1 });

export const StockMovement =
  mongoose.models.StockMovement || mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
