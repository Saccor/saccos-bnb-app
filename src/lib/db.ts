import mongoose from 'mongoose';

interface GlobalMongoose {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

declare global {
  var mongoose: GlobalMongoose['mongoose'];
}

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached?.conn) {
    return cached.conn;
  }

  if (!cached?.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
      family: 4,
    };

    cached = global.mongoose = {
      conn: null,
      promise: mongoose.connect(MONGODB_URI, opts)
    };
  }

  try {
    const mongoose = await cached.promise;
    cached.conn = mongoose;
  } catch (e) {
    cached.promise = null;
    
    if (e instanceof Error) {
      if (e.message.includes('ECONNREFUSED')) {
        console.error('MongoDB Connection Error: Could not connect to MongoDB server.');
        console.error('Please make sure MongoDB is running on the specified host and port.');
        console.error('Current connection string:', MONGODB_URI.replace(/\/\/([^:]+):[^@]+@/, '//***:***@'));
      }
    }
    
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;