import mongoose from 'mongoose';
import { env } from '@/lib/env';

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };
if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      dbName: env.MONGODB_DB_NAME,
      maxPoolSize: 10,
    };

    cached.promise = mongoose.connect(env.MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

/**
 * Execute an operation within a MongoDB transaction if replica set / Atlas supports it,
 * otherwise execute gracefully while logging the environment transaction capability.
 */
export async function withTransaction<T>(
  callback: (session: mongoose.ClientSession | null) => Promise<T>
): Promise<T> {
  const mongooseInstance = await connectToDatabase();
  let session: mongoose.ClientSession | null = null;

  try {
    session = await mongooseInstance.startSession();
    session.startTransaction();
    const result = await callback(session);
    await session.commitTransaction();
    return result;
  } catch (error: unknown) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch {
        // Ignore abort failure if transaction was already aborted or unsupported
      }
    }

    const errMessage = error instanceof Error ? error.message : String(error);
    // If standalone MongoDB does not support replica set transactions, fallback to direct execution
    if (
      errMessage.includes('Transaction numbers are only allowed on a replica set') ||
      errMessage.includes('This MongoDB deployment does not support retryable writes')
    ) {
      console.warn('[DB] Replica set transaction unsupported in this tier. Executing non-transactional fallback.');
      return await callback(null);
    }

    throw error;
  } finally {
    if (session) {
      session.endSession();
    }
  }
}
