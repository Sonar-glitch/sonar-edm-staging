/**
 * Enhanced MongoDB Client Module
 * 
 * This module provides a robust MongoDB connection with:
 * - Proper error handling
 * - Development/production environment detection
 * - Mock database fallback when no connection is available
 * - Connection caching to prevent connection limits
 * - Consistent interface for all MongoDB operations
 */

import { MongoClient } from 'mongodb';

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'sonar_edm_db';
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

// Connection tracking
let client;
let clientPromise;

// Logging function that can be easily toggled
const log = (message, type = 'info') => {
  const prefix = '[MongoDB]';
  
  switch (type) {
    case 'error':
      console.error(`${prefix} ERROR: ${message}`);
      break;
    case 'warn':
      console.warn(`${prefix} WARNING: ${message}`);
      break;
    case 'debug':
      if (process.env.NODE_ENV === 'development') {
        console.log(`${prefix} DEBUG: ${message}`);
      }
      break;
    default:
      console.log(`${prefix} ${message}`);
  }
};

// Create a mock client for development/testing when no MongoDB URI is available
const createMockClient = () => {
  log('MongoDB URI not found. Using mock database.', 'warn');
  
  // Mock collections with common operations
  const createMockCollection = (collectionName) => ({
    find: (query = {}) => ({
      toArray: async () => {
        log(`Mock find on ${collectionName} with query: ${JSON.stringify(query)}`, 'debug');
        return [];
      }
    }),
    findOne: async (query = {}) => {
      log(`Mock findOne on ${collectionName} with query: ${JSON.stringify(query)}`, 'debug');
      return null;
    },
    insertOne: async (doc) => {
      log(`Mock insertOne on ${collectionName}: ${JSON.stringify(doc)}`, 'debug');
      return { insertedId: `mock-id-${Date.now()}` };
    },
    deleteOne: async (query) => {
      log(`Mock deleteOne on ${collectionName} with query: ${JSON.stringify(query)}`, 'debug');
      return { deletedCount: 1 };
    },
    updateOne: async (query, update) => {
      log(`Mock updateOne on ${collectionName} with query: ${JSON.stringify(query)}`, 'debug');
      return { modifiedCount: 1 };
    }
  });

  // Mock database with collection factory
  const mockDb = new Proxy({}, {
    get: (target, prop) => {
      if (prop === 'collection') {
        return (collectionName) => createMockCollection(collectionName);
      }
      return undefined;
    }
  });

  // Mock client with db method
  const mockClient = {
    db: (dbName) => {
      log(`Mock database requested: ${dbName}`, 'debug');
      return mockDb;
    },
    connect: async () => {
      log('Mock connection established', 'debug');
      return mockClient;
    },
    close: async () => {
      log('Mock connection closed', 'debug');
      return true;
    }
  };

  return mockClient;
};

// Initialize MongoDB connection or mock
if (!MONGODB_URI) {
  const mockClient = createMockClient();
  clientPromise = Promise.resolve(mockClient);
} else {
  // Use different connection strategies for development and production
  if (process.env.NODE_ENV === 'development') {
    // In development, use a global variable to preserve connection across hot reloads
    if (!global._mongoClientPromise) {
      log('Creating new MongoDB connection for development');
      client = new MongoClient(MONGODB_URI, options);
      global._mongoClientPromise = client.connect()
        .catch(err => {
          log(`Failed to connect to MongoDB: ${err.message}`, 'error');
          return createMockClient();
        });
    } else {
      log('Reusing existing MongoDB connection from global cache');
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production, create a new connection
    log('Creating new MongoDB connection for production');
    client = new MongoClient(MONGODB_URI, options);
    clientPromise = client.connect()
      .catch(err => {
        log(`Failed to connect to MongoDB: ${err.message}`, 'error');
        return createMockClient();
      });
  }
}

/**
 * Helper function to get a database instance with error handling
 * @param {string} dbName - Optional database name (defaults to MONGODB_DB)
 * @returns {Promise<Object>} - MongoDB database instance
 */
export async function getDatabase(dbName = MONGODB_DB) {
  try {
    const client = await clientPromise;
    return client.db(dbName);
  } catch (error) {
    log(`Error getting database: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Helper function to get a collection with error handling
 * @param {string} collectionName - Collection name
 * @param {string} dbName - Optional database name (defaults to MONGODB_DB)
 * @returns {Promise<Object>} - MongoDB collection
 */
export async function getCollection(collectionName, dbName = MONGODB_DB) {
  try {
    const db = await getDatabase(dbName);
    return db.collection(collectionName);
  } catch (error) {
    log(`Error getting collection ${collectionName}: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * Check if the MongoDB connection is healthy
 * @returns {Promise<boolean>} - True if connection is healthy
 */
export async function checkConnection() {
  try {
    const client = await clientPromise;
    // Ping the database to check connection
    await client.db(MONGODB_DB).command({ ping: 1 });
    return true;
  } catch (error) {
    log(`MongoDB connection check failed: ${error.message}`, 'error');
    return false;
  }
}

// Export the client promise as default for backward compatibility
export default clientPromise;
