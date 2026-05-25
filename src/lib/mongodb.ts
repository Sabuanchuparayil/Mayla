import mongoose from 'mongoose';

type MongooseCache = { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };

const globalForMongoose = globalThis as unknown as { mongoose?: MongooseCache };

const cached: MongooseCache = globalForMongoose.mongoose ?? { conn: null, promise: null };

if (!globalForMongoose.mongoose) {
  globalForMongoose.mongoose = cached;
}

const MONGO_OPTIONS = {
  bufferCommands: false,
  serverSelectionTimeoutMS: 2500,
  connectTimeoutMS: 2500,
  socketTimeoutMS: 2500,
};

function getMongoUri(): string {
  return process.env.MONGODB_URL ?? process.env.MONGODB_URI ?? '';
}

function resetCache() {
  cached.conn = null;
  cached.promise = null;
}

/** Lazy MongoDB connection — only call when chat features are needed. */
export async function connectMongoDB(): Promise<typeof mongoose> {
  const uri = getMongoUri();
  if (!uri) {
    throw new Error('MONGODB_URL (or MONGODB_URI) is not defined');
  }

  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, MONGO_OPTIONS).catch((error) => {
      resetCache();
      throw error;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export async function isMongoDBAvailable(): Promise<boolean> {
  const uri = getMongoUri();
  if (!uri) return false;

  if (cached.conn && mongoose.connection.readyState === 1) {
    return true;
  }

  try {
    await connectMongoDB();
    return mongoose.connection.readyState === 1;
  } catch {
    resetCache();
    return false;
  }
}
