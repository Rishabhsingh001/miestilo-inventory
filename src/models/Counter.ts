import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter extends Document {
  key: string;
  sequence: number;
}

const CounterSchema = new Schema<ICounter>({
  key: { type: String, required: true, unique: true },
  sequence: { type: Number, default: 0 },
});

export const Counter = mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

export async function getNextSequence(key: string, prefix: string): Promise<string> {
  const year = new Date().getFullYear();
  const fullKey = `${key}_${year}`;
  const counter = await Counter.findOneAndUpdate(
    { key: fullKey },
    { $inc: { sequence: 1 } },
    { new: true, upsert: true }
  );
  const padded = String(counter.sequence).padStart(6, '0');
  return `${prefix}-${year}-${padded}`;
}
