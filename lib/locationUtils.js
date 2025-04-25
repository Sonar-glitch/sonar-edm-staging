/**
 * Location utility functions for TIKO platform
 */

// Default Toronto coordinates
const TORONTO_COORDINATES = {
  latitude: 43.6532,
  longitude: -79.3832,
  city: "Toronto",
  region: "Ontario",
  country: "Canada"
};

/**
 * Get user location with Toronto as fallback
 * @returns {Object} User location object with coordinates
 */
export async function getUserLocation(req) {
  try {
    // Try to get location from request headers
    const forwarded = req?.headers?.['x-forwarded-for'];
    const ip = forwarded ? forwarded.split(/, /)[0] : req?.connection?.remoteAddress;
    
    if (ip) {
      try {
        // Try to get location from IP using a geolocation service
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        
        if (response.ok) {
          const data = await response.json();
          
          // Check if we got valid coordinates
          if (data && data.latitude && data.longitude) {
            console.log(`User location from IP: ${data.city}, ${data.region}, ${data.country}`);
            
            return {
              latitude: data.latitude,
              longitude: data.longitude,
              city: data.city || "Unknown",
              region: data.region || "Unknown",
              country: data.country_name || "Unknown"
            };
          }
        }
      } catch (error) {
        console.error("Error getting location from IP:", error.message);
      }
    }
    
    // If we couldn't get location from IP, check for query parameters
    if (req?.query?.lat && req?.query?.lon) {
      const lat = parseFloat(req.query.lat);
      const lon = parseFloat(req.query.lon);
      
      if (!isNaN(lat) && !isNaN(lon)) {
        console.log(`User location from query params: ${lat}, ${lon}`);
        
        return {
          latitude: lat,
          longitude: lon,
          city: req.query.city || "Unknown",
          region: req.query.region || "Unknown",
          country: req.query.country || "Unknown"
        };
      }
    }
    
    // If all else fails, return Toronto coordinates
    console.log("Using default Toronto coordinates");
    return TORONTO_COORDINATES;
  } catch (error) {
    console.error("Error in getUserLocation:", error);
    return TORONTO_COORDINATES;
  }
}

/**
 * Get cached location or fetch new location
 * @param {Object} req - Request object
 * @param {Object} cache - Cache object
 * @returns {Object} User location object with coordinates
 */
export async function getCachedLocation(req, cache) {
  try {
    // Try to get location from cache
    if (cache && typeof cache.get === 'function') {
      const cachedLocation = await cache.get('user-location');
      
      if (cachedLocation && cachedLocation.latitude && cachedLocation.longitude) {
        console.log("Using cached location data");
        return cachedLocation;
      }
    }
    
    // If not in cache, get location and cache it
    const location = await getUserLocation(req);
    
    if (cache && typeof cache.set === 'function') {
      await cache.set('user-location', location, 86400); // Cache for 24 hours
    }
    
    return location;
  } catch (error) {
    console.error("Error in getCachedLocation:", error);
    return TORONTO_COORDINATES;
  }
}

/**
 * Calculate distance between two coordinates in kilometers
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Export Toronto coordinates as default
export default TORONTO_COORDINATES;
