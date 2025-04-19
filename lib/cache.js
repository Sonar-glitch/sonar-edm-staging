import clientPromise from './mongodb';

// Cache TTL values in seconds
const TTL = {
  USER_PROFILE: 7 * 24 * 60 * 60, // 7 days
  TOP_ARTISTS: 24 * 60 * 60, // 24 hours
  TOP_TRACKS: 24 * 60 * 60, // 24 hours
  EVENTS: 12 * 60 * 60, // 12 hours
  LOCATION: 24 * 60 * 60, // 24 hours
  DEFAULT: 60 * 60 // 1 hour
};

export async function getCachedData(key, type = 'DEFAULT') {
  try {
    const client = await clientPromise;
    const db = client.db();
    
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
    const client = await clientPromise;
    const db = client.db();
    
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
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('apiCache').deleteMany({
      key: { $regex: keyPattern }
    });
    
    return result.deletedCount;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}
