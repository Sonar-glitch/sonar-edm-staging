import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

// Mock database for development/testing
const mockDatabase = {
  collection: (name) => ({
    find: () => ({
      toArray: async () => {
        console.log(`Mock database: Returning empty array for collection ${name}`);
        return [];
      }
    }),
    insertOne: async (doc) => {
      console.log(`Mock database: Insert operation for collection ${name}`, doc);
      return { insertedId: 'mock-id-' + Date.now() };
    },
    updateOne: async (filter, update) => {
      console.log(`Mock database: Update operation for collection ${name}`, filter, update);
      return { modifiedCount: 1 };
    },
    deleteOne: async (filter) => {
      console.log(`Mock database: Delete operation for collection ${name}`, filter);
      return { deletedCount: 1 };
    }
  })
};

if (!uri) {
  console.warn('MongoDB URI not found. Using mock database for development.');
  clientPromise = Promise.resolve({
    db: () => mockDatabase
  });
} else {
  if (process.env.NODE_ENV === 'development') {
    // In development mode, use a global variable to preserve the connection
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, create a new connection
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
}

export default clientPromise;

// Helper function to get database with error handling
export async function getDatabase() {
  try {
    const client = await clientPromise;
    return client.db('sonar_edm_db');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return mockDatabase;
  }
}

// Helper function to get collection with error handling
export async function getCollection(collectionName) {
  try {
    const db = await getDatabase();
    return db.collection(collectionName);
  } catch (error) {
    console.error(`Error getting collection ${collectionName}:`, error);
    return mockDatabase.collection(collectionName);
  }
}
