import { connectToDatabase } from './cityRequestQueue'; // CORRECTED PATH using import syntax
// Cache TTL values in seconds
const TTL = {
  USER_PROFILE: 7 * 24 * 60 * 60, // 7 days
  TOP_ARTISTS: 24 * 60 * 60, // 24 hours
  TOP_TRACKS: 24 * 60 * 60, // 24 hours
  EVENTS: 12 * 60 * 60, // 12 hours
  LOCATION: 24 * 60 * 60, // 24 hours
  DEFAULT: 60 * 60 // 1 hour
};

// Add the missing cacheData function that's being imported by API files
export async function cacheData(key, data, type = 'DEFAULT') {
  return setCachedData(key, data, type);
}

export async function getCachedData(key, type = 'DEFAULT') {
  try {
    const { db } = await connectToDatabase();
    
    const cachedData = await db.collection('apiCache').findOne({ key });
    
    if (!cachedData) {
      return null;
    }
    
    // Check if cache is expired
    const now = new Date();
    if (now > cachedData.expiresAt) {
      // Cache expired, remove it
      await db.collection('apiCache').deleteOne({ key });
      return null;
    }
    
    // Update hit count
    await db.collection('apiCache').updateOne(
      { key },
      { $inc: { hits: 1 } }
    );
    
    return cachedData.data;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

export async function setCachedData(key, data, type = 'DEFAULT') {
  try {
    const { db } = await connectToDatabase();
    
    const ttl = TTL[type] || TTL.DEFAULT;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    
    await db.collection('apiCache').updateOne(
      { key },
      { 
        $set: { 
          data,
          expiresAt,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now,
          hits: 0
        }
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Cache storage error:', error);
    return false;
  }
}

export async function invalidateCache(keyPattern) {
  try {
    const { db } = await connectToDatabase();
    
    const result = await db.collection('apiCache').deleteMany({
      key: { $regex: keyPattern }
    });
    
    return result.deletedCount;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

// Add the missing saveUserPreferences function that's being imported by API files
export async function saveUserPreferences(userId, preferences) {
  try {
    const { db } = await connectToDatabase();
    
    const now = new Date();
    
    await db.collection('userPreferences').updateOne(
      { userId },
      { 
        $set: { 
          ...preferences,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Save user preferences error:', error);
    return false;
  }
}

// Add function to get user preferences
export async function getUserPreferences(userId) {
  try {
    const { db } = await connectToDatabase();
    
    const preferences = await db.collection('userPreferences').findOne({ userId });
    
    return preferences || {};
  } catch (error) {
    console.error('Get user preferences error:', error);
    return {};
  }
}
