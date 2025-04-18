import clientPromise from './mongodb';

// Cache collection name
const CACHE_COLLECTION = 'apiCache';
const USER_PREFS_COLLECTION = 'userPreferences';

/**
 * Get cached data from MongoDB
 * @param {string} endpoint - API endpoint
 * @param {Object} parameters - Query parameters
 * @returns {Promise<Object|null>} - Cached data or null if not found
 */
export async function getCachedData(endpoint, parameters) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Create a query to find the cached data
    const query = {
      endpoint,
      parameters: JSON.stringify(parameters),
      expiresAt: { $gt: new Date() }
    };
    
    // Find the cached data
    const cachedData = await collection.findOne(query);
    
    if (cachedData) {
      // Update hit count
      await collection.updateOne(
        { _id: cachedData._id },
        { $inc: { hitCount: 1 } }
      );
      
      console.log(`Cache hit for ${endpoint}`);
      return cachedData.response;
    }
    
    console.log(`Cache miss for ${endpoint}`);
    return null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

/**
 * Cache data in MongoDB
 * @param {string} endpoint - API endpoint
 * @param {Object} parameters - Query parameters
 * @param {Object} response - API response
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - Success status
 */
export async function cacheData(endpoint, parameters, response, ttl = 3600) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Create expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + ttl);
    
    // Create cache document
    const cacheDoc = {
      endpoint,
      parameters: JSON.stringify(parameters),
      response,
      createdAt: new Date(),
      expiresAt,
      hitCount: 0
    };
    
    // Check if cache already exists
    const existingCache = await collection.findOne({
      endpoint,
      parameters: JSON.stringify(parameters)
    });
    
    if (existingCache) {
      // Update existing cache
      await collection.updateOne(
        { _id: existingCache._id },
        { $set: {
          response,
          expiresAt,
          updatedAt: new Date()
        }}
      );
    } else {
      // Insert new cache
      await collection.insertOne(cacheDoc);
    }
    
    console.log(`Cached data for ${endpoint} with TTL ${ttl}s`);
    return true;
  } catch (error) {
    console.error('Error caching data:', error);
    return false;
  }
}

/**
 * Invalidate cached data
 * @param {string} endpoint - API endpoint
 * @param {Object} parameters - Query parameters (optional)
 * @returns {Promise<boolean>} - Success status
 */
export async function invalidateCache(endpoint, parameters = null) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Create query
    const query = { endpoint };
    if (parameters) {
      query.parameters = JSON.stringify(parameters);
    }
    
    // Delete matching cache entries
    const result = await collection.deleteMany(query);
    
    console.log(`Invalidated ${result.deletedCount} cache entries for ${endpoint}`);
    return true;
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return false;
  }
}

/**
 * Get user preferences from MongoDB
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - User preferences or null if not found
 */
export async function getUserPreferences(userId) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(USER_PREFS_COLLECTION);
    
    // Find user preferences
    const userPrefs = await collection.findOne({ userId });
    
    return userPrefs ? userPrefs.preferences : null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
}

/**
 * Save user preferences to MongoDB
 * @param {string} userId - User ID
 * @param {Object} preferences - User preferences
 * @returns {Promise<boolean>} - Success status
 */
export async function saveUserPreferences(userId, preferences) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(USER_PREFS_COLLECTION);
    
    // Check if user preferences already exist
    const existingPrefs = await collection.findOne({ userId });
    
    if (existingPrefs) {
      // Update existing preferences
      await collection.updateOne(
        { userId },
        { $set: {
          preferences,
          updatedAt: new Date()
        }}
      );
    } else {
      // Insert new preferences
      await collection.insertOne({
        userId,
        preferences,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`Saved preferences for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
}

/**
 * Clean up expired cache entries
 * @returns {Promise<number>} - Number of deleted entries
 */
export async function cleanupExpiredCache() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Delete expired cache entries
    const result = await collection.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`Cleaned up ${result.deletedCount} expired cache entries`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired cache:', error);
    return 0;
  }
}
