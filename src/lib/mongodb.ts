import { MongoClient } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not defined');
  throw new Error('Please define the MONGODB_URI environment variable');
}

const uri = process.env.MONGODB_URI;
console.log('MongoDB URI:', uri.substring(0, 15) + '...');

const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  console.log('Using development MongoDB connection');
  let globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    console.log('Creating new MongoDB client connection');
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  } else {
    console.log('Using existing MongoDB client connection');
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  console.log('Using production MongoDB connection');
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export async function connectToDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    const client = await clientPromise;
    const dbName = process.env.MONGODB_DB || 'saccos-bnb';
    console.log('Using database:', dbName);
    const db = client.db(dbName);
    console.log('MongoDB connection successful');
    return { client, db };
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    throw error;
  }
} 