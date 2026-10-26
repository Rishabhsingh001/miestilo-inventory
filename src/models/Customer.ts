import mongoose, { Schema, Document } from 'mongoose';

export interface IShippingAddress {
  _id?: string;
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
}

export interface ICustomer extends Document {
  customerCode: string; // Unique, e.g. CUST-0001
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  billingAddress: string;
  shippingAddresses: IShippingAddress[];
  taxId?: string; // GSTIN
  notes?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ShippingAddressSchema = new Schema<IShippingAddress>({
  label: { type: String, default: 'Primary Destination' },
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
});

const CustomerSchema = new Schema<ICustomer>(
  {
    customerCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    billingAddress: { type: String, required: true },
    shippingAddresses: [ShippingAddressSchema],
    taxId: { type: String, trim: true },
    notes: { type: String },
    isActive: { type: Boolean, default: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

CustomerSchema.index({ companyName: 'text', contactName: 'text', email: 'text', customerCode: 'text' });

export const Customer = mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
