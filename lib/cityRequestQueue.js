const fs = require('fs');
const path = require('path');

// File-based queue for city requests (zero-risk approach)
const QUEUE_FILE_PATH = path.join(process.cwd(), 'city_requests.json');
const PROCESSED_FILE_PATH = path.join(process.cwd(), 'processed_cities.json');

/**
 * ENHANCED: Bidirectional country mapping for maximum compatibility
 */
const COUNTRY_MAPPINGS = {
  // Full name to code
  'Canada': 'CA', 'United States': 'US', 'USA': 'US',
  'United Kingdom': 'GB', 'UK': 'GB', 'Germany': 'DE',
  'France': 'FR', 'Netherlands': 'NL', 'Spain': 'ES',
  'Italy': 'IT', 'Australia': 'AU', 'Brazil': 'BR',
  'Mexico': 'MX', 'Japan': 'JP', 'South Korea': 'KR',
  
  // Code to full name (reverse mapping)
  'CA': 'Canada', 'US': 'United States', 'GB': 'United Kingdom',
  'DE': 'Germany', 'FR': 'France', 'NL': 'Netherlands',
  'ES': 'Spain', 'IT': 'Italy', 'AU': 'Australia',
  'BR': 'Brazil', 'MX': 'Mexico', 'JP': 'Japan', 'KR': 'South Korea'
};

/**
 * ENHANCED: Normalize country input to full name
 */
function normalizeCountryName(input) {
  if (!input) return null;
  
  const trimmed = input.trim();
  
  // Direct mapping lookup
  if (COUNTRY_MAPPINGS[trimmed]) {
    // If it's a code, return full name; if it's already full name, return as-is
    const mapped = COUNTRY_MAPPINGS[trimmed];
    // Ensure we always return the full name
    return mapped.length > 3 ? mapped : COUNTRY_MAPPINGS[mapped] || mapped;
  }
  
  // Case-insensitive lookup
  const lowerCase = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(COUNTRY_MAPPINGS)) {
    if (key.toLowerCase() === lowerCase) {
      // Return full name
      return value.length > 3 ? value : COUNTRY_MAPPINGS[value] || value;
    }
  }
  
  return null;
}

/**
 * ENHANCED: Get country code from any country input
 */
function getCountryCode(countryInput) {
  const fullName = normalizeCountryName(countryInput);
  if (!fullName) return null;
  
  // Find the code for this full name
  for (const [key, value] of Object.entries(COUNTRY_MAPPINGS)) {
    if (value === fullName && key.length <= 3) {
      return key;
    }
  }
  
  return null;
}

/**
 * ENHANCED: Check if country is supported (accepts both codes and full names)
 */
function isCountrySupported(countryInput) {
  return normalizeCountryName(countryInput) !== null;
}

/**
 * Read city requests from file
 */
function readCityRequests() {
  try {
    if (!fs.existsSync(QUEUE_FILE_PATH)) {
      return [];
    }
    
    const data = fs.readFileSync(QUEUE_FILE_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading city requests:', error);
    return [];
  }
}

/**
 * Write city requests to file
 */
function writeCityRequests(requests) {
  try {
    fs.writeFileSync(QUEUE_FILE_PATH, JSON.stringify(requests, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing city requests:', error);
    return false;
  }
}

/**
 * ENHANCED: Add a new city request with flexible country input
 */
function addCityRequest(city, countryInput, latitude, longitude) {
  try {
    console.log(`🔍 Processing city request: ${city}, ${countryInput}`);
    
    // ENHANCED: Normalize country input to full name
    const countryFullName = normalizeCountryName(countryInput);
    const countryCode = getCountryCode(countryInput);
    
    console.log(`🔍 Country normalization: "${countryInput}" → "${countryFullName}" (${countryCode})`);
    
    if (!countryFullName || !countryCode) {
      const supportedCountries = Object.keys(COUNTRY_MAPPINGS)
        .filter(key => key.length > 3) // Only full names
        .sort();
      throw new Error(`Country "${countryInput}" is not supported by Ticketmaster. Supported countries: ${supportedCountries.join(', ')}`);
    }
    
    const requests = readCityRequests();
    
    // Check if city already exists (using normalized country name)
    const existingIndex = requests.findIndex(req => 
      req.city.toLowerCase() === city.toLowerCase() && 
      req.country.toLowerCase() === countryFullName.toLowerCase()
    );
    
    const now = new Date().toISOString();
    
    if (existingIndex >= 0) {
      // Update existing request
      requests[existingIndex].requestedAt = now;
      requests[existingIndex].priority += 1;
      requests[existingIndex].latitude = latitude;
      requests[existingIndex].longitude = longitude;
      requests[existingIndex].countryCode = countryCode; // Update code
      
      console.log(`🔄 Updated existing request for ${city}, ${countryFullName} (priority: ${requests[existingIndex].priority})`);
      
      if (writeCityRequests(requests)) {
        return {
          success: true,
          isNew: false,
          city: city,
          country: countryFullName,
          countryCode: countryCode,
          priority: requests[existingIndex].priority
        };
      } else {
        throw new Error('Failed to update city request');
      }
    } else {
      // Add new request
      const newRequest = {
        id: `${city.toLowerCase()}_${countryCode.toLowerCase()}_${Date.now()}`,
        city: city,
        country: countryFullName, // Store full name
        countryCode: countryCode, // Store code for API calls
        latitude: latitude,
        longitude: longitude,
        requestedAt: now,
        status: 'pending',
        priority: 1,
        attempts: 0
      };
      
      requests.push(newRequest);
      
      console.log(`✅ Added new request for ${city}, ${countryFullName} (${countryCode})`);
      
      if (writeCityRequests(requests)) {
        return {
          success: true,
          isNew: true,
          city: city,
          country: countryFullName,
          countryCode: countryCode,
          priority: 1
        };
      } else {
        throw new Error('Failed to add city request');
      }
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
 * Get pending city requests
 */
function getPendingCityRequests() {
  const requests = readCityRequests();
  return requests
    .filter(req => req.status === 'pending')
    .sort((a, b) => b.priority - a.priority || new Date(a.requestedAt) - new Date(b.requestedAt));
}

/**
 * Mark city as processing
 */
function markCityAsProcessing(cityId) {
  const requests = readCityRequests();
  const index = requests.findIndex(req => req.id === cityId);
  
  if (index >= 0) {
    requests[index].status = 'processing';
    requests[index].processingStartedAt = new Date().toISOString();
    requests[index].attempts += 1;
    return writeCityRequests(requests);
  }
  
  return false;
}

/**
 * Mark city as completed
 */
function markCityAsCompleted(cityId, eventsCount = 0) {
  const requests = readCityRequests();
  const index = requests.findIndex(req => req.id === cityId);
  
  if (index >= 0) {
    requests[index].status = 'completed';
    requests[index].completedAt = new Date().toISOString();
    requests[index].eventsFound = eventsCount;
    return writeCityRequests(requests);
  }
  
  return false;
}

/**
 * Mark city as error
 */
function markCityAsError(cityId, errorMessage) {
  const requests = readCityRequests();
  const index = requests.findIndex(req => req.id === cityId);
  
  if (index >= 0) {
    requests[index].status = 'error';
    requests[index].errorAt = new Date().toISOString();
    requests[index].errorMessage = errorMessage;
    return writeCityRequests(requests);
  }
  
  return false;
}

/**
 * Clean up old requests
 */
function cleanupOldRequests() {
  const requests = readCityRequests();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  
  const filteredRequests = requests.filter(req => {
    const requestDate = new Date(req.requestedAt);
    return requestDate > oneWeekAgo || req.status === 'pending';
  });
  
  if (filteredRequests.length !== requests.length) {
    writeCityRequests(filteredRequests);
    console.log(`🧹 Cleaned up ${requests.length - filteredRequests.length} old requests`);
  }
}

/**
 * Get queue statistics
 */
function getQueueStats() {
  const requests = readCityRequests();
  
  return {
    total: requests.length,
    pending: requests.filter(req => req.status === 'pending').length,
    processing: requests.filter(req => req.status === 'processing').length,
    completed: requests.filter(req => req.status === 'completed').length,
    error: requests.filter(req => req.status === 'error').length
  };
}

module.exports = {
  addCityRequest,
  getPendingCityRequests,
  markCityAsProcessing,
  markCityAsCompleted,
  markCityAsError,
  cleanupOldRequests,
  getQueueStats,
  isCountrySupported,
  normalizeCountryName,
  getCountryCode
};
