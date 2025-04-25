/**
 * Location utility functions for TIKO platform
 */

// Default coordinates (used only as a last resort)
const DEFAULT_COORDINATES = {
  latitude: 40.7128,
  longitude: -74.0060,
  city: "New York",
  region: "NY",
  country: "United States"
};

/**
 * Get user location from browser
 * @returns {Promise<Object>} User location object with coordinates
 */
export async function getUserLocationFromBrowser() {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Get city name from coordinates using reverse geocoding
            const { latitude, longitude } = position.coords;
            const locationInfo = await getCityFromCoordinates(latitude, longitude);
            
            resolve({
              latitude,
              longitude,
              ...locationInfo
            });
          } catch (error) {
            console.error("Error getting city from coordinates:", error);
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              city: "Unknown",
              region: "Unknown",
              country: "Unknown"
            });
          }
        },
        (error) => {
          console.error("Geolocation error:", error.message);
          reject(error);
        },
        { timeout: 10000, maximumAge: 600000 } // 10s timeout, 10min cache
      );
    } else {
      reject(new Error("Geolocation not available"));
    }
  });
}

/**
 * Get city name from coordinates using reverse geocoding
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {Promise<Object>} Location info with city, region, country
 */
async function getCityFromCoordinates(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      { headers: { 'User-Agent': 'TIKO Music Platform' } }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      return {
        city: data.address.city || data.address.town || data.address.village || "Unknown",
        region: data.address.state || data.address.county || "Unknown",
        country: data.address.country || "Unknown"
      };
    }
    
    throw new Error("Failed to get location info");
  } catch (error) {
    console.error("Error in reverse geocoding:", error);
    return {
      city: "Unknown",
      region: "Unknown",
      country: "Unknown"
    };
  }
}

/**
 * Get user location from IP address
 * @returns {Promise<Object>} User location object with coordinates
 */
export async function getUserLocationFromIP() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    
    if (response.ok) {
      const data = await response.json();
      
      if (data && data.latitude && data.longitude) {
        return {
          latitude: data.latitude,
          longitude: data.longitude,
          city: data.city || "Unknown",
          region: data.region || "Unknown",
          country: data.country_name || "Unknown"
        };
      }
    }
    
    throw new Error("Failed to get location from IP");
  } catch (error) {
    console.error("Error getting location from IP:", error);
    return null;
  }
}

/**
 * Get user location from query parameters
 * @param {Object} query - Query parameters
 * @returns {Object|null} User location object with coordinates or null
 */
export function getUserLocationFromQuery(query) {
  if (query?.lat && query?.lon) {
    const lat = parseFloat(query.lat);
    const lon = parseFloat(query.lon);
    
    if (!isNaN(lat) && !isNaN(lon)) {
      return {
        latitude: lat,
        longitude: lon,
        city: query.city || "Unknown",
        region: query.region || "Unknown",
        country: query.country || "Unknown"
      };
    }
  }
  
  return null;
}

/**
 * Get user location with multiple fallbacks
 * @param {Object} req - Request object
 * @returns {Promise<Object>} User location object with coordinates
 */
export async function getUserLocation(req) {
  try {
    // First try to get location from query parameters
    const queryLocation = req?.query ? getUserLocationFromQuery(req.query) : null;
    
    if (queryLocation) {
      console.log(`User location from query: ${queryLocation.city}, ${queryLocation.region}, ${queryLocation.country}`);
      return queryLocation;
    }
    
    // Then try to get location from IP address
    const ipLocation = await getUserLocationFromIP();
    
    if (ipLocation) {
      console.log(`User location from IP: ${ipLocation.city}, ${ipLocation.region}, ${ipLocation.country}`);
      return ipLocation;
    }
    
    // If all else fails, return default coordinates
    console.log("Using default coordinates");
    return DEFAULT_COORDINATES;
  } catch (error) {
    console.error("Error in getUserLocation:", error);
    return DEFAULT_COORDINATES;
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

export default {
  getUserLocation,
  getUserLocationFromBrowser,
  getUserLocationFromIP,
  getUserLocationFromQuery,
  getDistance
};
