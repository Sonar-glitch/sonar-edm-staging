const { connectToDatabase } = require('./mongodb');

// Country code mapping for priority calculation
const COUNTRY_CODES = {
  'Canada': 'CA', 'United States': 'US', 'USA': 'US',
  'United Kingdom': 'GB', 'UK': 'GB', 'Germany': 'DE',
  'France': 'FR', 'Netherlands': 'NL', 'Spain': 'ES',
  'Italy': 'IT', 'Australia': 'AU', 'Brazil': 'BR',
  'Mexico': 'MX', 'Japan': 'JP', 'South Korea': 'KR'
};

/**
 * Get country code from country name
 */
function getCountryCode(countryName) {
  if (!countryName) return null;
  
  const normalized = countryName.trim();
  if (COUNTRY_CODES[normalized]) {
    return COUNTRY_CODES[normalized];
  }
  
  // Case-insensitive lookup
  const lowerCase = normalized.toLowerCase();
  for (const [country, code] of Object.entries(COUNTRY_CODES)) {
    if (country.toLowerCase() === lowerCase) {
      return code;
    }
  }
  
  return null;
}

/**
 * Check if country is supported by Ticketmaster
 */
function isCountrySupported(countryName) {
  return getCountryCode(countryName) !== null;
}

/**
 * Get regional priority for processing order
 */
function getRegionalPriority(countryCode) {
  const priorities = {
    'US': 100, 'CA': 95, 'GB': 90, 'AU': 85,
    'DE': 80, 'FR': 75, 'NL': 70, 'ES': 65,
    'IT': 60, 'BR': 55, 'MX': 50, 'JP': 45
  };
  
  return priorities[countryCode] || 30;
}

/**
 * Add a new city request to the MongoDB queue
 */
async function addCityRequest(city, country, latitude, longitude) {
  try {
    // Validate country support
    const countryCode = getCountryCode(country);
    if (!countryCode) {
      throw new Error(`Country "${country}" is not supported by Ticketmaster`);
    }
    
    const { db } = await connectToDatabase();
    const cityRequestsCollection = db.collection('cityRequests');
    
    // Check if city already exists
    const existingRequest = await cityRequestsCollection.findOne({
      city: city.trim().toLowerCase(),
      country: country.trim().toLowerCase()
    });
    
    const now = new Date();
    
    if (existingRequest) {
      // Update existing request
      const updateData = {
        requestCount: (existingRequest.requestCount || 1) + 1,
        lastRequestedAt: now,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      };
      
      // Reset status to pending if it was completed
      if (existingRequest.status === 'completed') {
        updateData.status = 'pending';
        updateData.priority = getRegionalPriority(countryCode);
      }
      
      await cityRequestsCollection.updateOne(
        { _id: existingRequest._id },
        { $set: updateData }
      );
      
      console.log(`🔄 Updated existing request for ${city}, ${country} (${countryCode})`);
      return {
        success: true,
        city: city.trim(),
        country: country.trim(),
        countryCode,
        isNew: false,
        priority: existingRequest.priority || getRegionalPriority(countryCode)
      };
    } else {
      // Add new request
      const priority = getRegionalPriority(countryCode);
      const newRequest = {
        city: city.trim(),
        country: country.trim(),
        countryCode,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        requestedAt: now,
        lastRequestedAt: now,
        requestCount: 1,
        status: 'pending',
        priority
      };
      
      await cityRequestsCollection.insertOne(newRequest);
      
      console.log(`✅ Added new request for ${city}, ${country} (${countryCode})`);
      return {
        success: true,
        city: city.trim(),
        country: country.trim(),
        countryCode,
        isNew: true,
        priority
      };
    }
    
  } catch (error) {
    console.error('Error adding city request:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get pending city requests for worker processing
 */
async function getPendingCityRequests() {
  try {
    const { db } = await connectToDatabase();
    const cityRequestsCollection = db.collection('cityRequests');
    
    const pendingRequests = await cityRequestsCollection
      .find({ status: 'pending' })
      .sort({ priority: -1, requestCount: -1, requestedAt: 1 })
      .toArray();
    
    return pendingRequests;
  } catch (error) {
    console.error('Error getting pending city requests:', error);
    return [];
  }
}

/**
 * Mark city request as processing
 */
async function markCityAsProcessing(city, country) {
  try {
    const { db } = await connectToDatabase();
    const cityRequestsCollection = db.collection('cityRequests');
    
    const result = await cityRequestsCollection.updateOne(
      { 
        city: city.trim().toLowerCase(), 
        country: country.trim().toLowerCase() 
      },
      { 
        $set: { 
          status: 'processing',
          processingStartedAt: new Date()
        }
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking city as processing:', error);
    return false;
  }
}

/**
 * Mark city request as completed
 */
async function markCityAsCompleted(city, country, eventCount = 0) {
  try {
    const { db } = await connectToDatabase();
    const cityRequestsCollection = db.collection('cityRequests');
    
    const result = await cityRequestsCollection.updateOne(
      { 
        city: city.trim().toLowerCase(), 
        country: country.trim().toLowerCase() 
      },
      { 
        $set: { 
          status: 'completed',
          completedAt: new Date(),
          eventCount
        }
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking city as completed:', error);
    return false;
  }
}

/**
 * Mark city request as error
 */
async function markCityAsError(city, country, errorMessage) {
  try {
    const { db } = await connectToDatabase();
    const cityRequestsCollection = db.collection('cityRequests');
    
    const result = await cityRequestsCollection.updateOne(
      { 
        city: city.trim().toLowerCase(), 
        country: country.trim().toLowerCase() 
      },
      { 
        $set: { 
          status: 'error',
          errorMessage,
          errorAt: new Date()
        }
      }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking city as error:', error);
    return false;
  }
}

/**
 * Get queue statistics
 */
async function getQueueStats() {
  try {
    const { db } = await connectToDatabase();
    const cityRequestsCollection = db.collection('cityRequests');
    
    const stats = await cityRequestsCollection.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    const result = {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      error: 0,
      topCountries: {}
    };
    
    stats.forEach(stat => {
      result[stat._id] = stat.count;
      result.total += stat.count;
    });
    
    // Get top countries
    const countries = await cityRequestsCollection.aggregate([
      {
        $group: {
          _id: '$country',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]).toArray();
    
    countries.forEach(country => {
      result.topCountries[country._id] = country.count;
    });
    
    return result;
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return {
      total: 0,
      pending: 0,
      processing: 0,
      completed: 0,
      error: 0,
      topCountries: {}
    };
  }
}

/**
 * Clean up old completed requests (keep system lean)
 */
async function cleanupOldRequests() {
  try {
    const { db } = await connectToDatabase();
    const cityRequestsCollection = db.collection('cityRequests');
    
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const result = await cityRequestsCollection.deleteMany({
      status: 'completed',
      completedAt: { $lt: oneWeekAgo }
    });
    
    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} old city requests`);
    }
    
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up old requests:', error);
    return 0;
  }
}

// Legacy function names for backward compatibility
const readCityRequests = getPendingCityRequests;

module.exports = {
  connectToDatabase,
  addCityRequest,
  getPendingCityRequests,
  markCityAsProcessing,
  markCityAsCompleted,
  markCityAsError,
  getQueueStats,
  cleanupOldRequests,
  isCountrySupported,
  getCountryCode,
  readCityRequests // Legacy compatibility
};
