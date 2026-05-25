import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI ?? '';

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined in environment variables');

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
const g = globalThis as unknown as { mongoose?: MongooseCache };
const cached: MongooseCache = g.mongoose ?? { conn: null, promise: null };
if (!g.mongoose) g.mongoose = cached;

export async function connectMongoDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    mongoose.connection.on('error', (err) => console.error('[MongoDB] Error:', err));
    mongoose.connection.on('disconnected', () => console.warn('[MongoDB] Disconnected'));
    mongoose.connection.on('reconnected', () => console.warn('[MongoDB] Reconnected'));

    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5_000,
      socketTimeoutMS: 45_000,
      heartbeatFrequencyMS: 10_000,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
