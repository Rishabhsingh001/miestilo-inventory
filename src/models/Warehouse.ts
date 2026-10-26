import mongoose, { Schema, Document } from 'mongoose';

export interface IBinLocation {
  _id?: string;
  code: string;
  zone?: string;
  aisle?: string;
  shelf?: string;
}

export interface IWarehouse extends Document {
  code: string;
  name: string;
  address: string;
  city: string;
  contactName?: string;
  contactPhone?: string;
  isActive: boolean;
  locations: IBinLocation[];
  createdAt: Date;
  updatedAt: Date;
}

const BinLocationSchema = new Schema<IBinLocation>({
  code: { type: String, required: true },
  zone: { type: String },
  aisle: { type: String },
  shelf: { type: String },
});

const WarehouseSchema = new Schema<IWarehouse>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    contactName: { type: String },
    contactPhone: { type: String },
    isActive: { type: Boolean, default: true },
    locations: [BinLocationSchema],
  },
  { timestamps: true }
);

export const Warehouse = mongoose.models.Warehouse || mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
