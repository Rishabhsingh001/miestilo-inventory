import { z } from 'zod';

const envSchema = z.object({
  MONGODB_URI: z.string().default('mongodb://127.0.0.1:27017/misterio_inventory'),
  MONGODB_DB_NAME: z.string().default('misterio_inventory'),
  AUTH_SECRET: z.string().default('misterio-super-secret-inventory-jwt-key-32-chars-min'),
  APP_NAME: z.string().default('miestilo Lifestyle Inventory'),
  DEFAULT_TIMEZONE: z.string().default('Asia/Kolkata'),
  DEFAULT_CURRENCY: z.string().default('INR'),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

export const env = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI || undefined,
  MONGODB_DB_NAME: process.env.MONGODB_DB_NAME || undefined,
  AUTH_SECRET: process.env.AUTH_SECRET || undefined,
  APP_NAME: process.env.APP_NAME || undefined,
  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || undefined,
  DEFAULT_CURRENCY: process.env.DEFAULT_CURRENCY || undefined,
  NODE_ENV: process.env.NODE_ENV || 'development',
});
