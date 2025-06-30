/**
 * Enhanced Location utility functions for TIKO platform
 * With Google API integration, IP fallback, and robust error handling
 */

// Toronto coordinates (used as default for Canadian users)
const TORONTO_COORDINATES = {
  latitude: 43.6532,
  longitude: -79.3832,
  city: "Toronto",
  region: "ON",
  country: "Canada"
};

// Default coordinates (used only as a last resort)
const DEFAULT_COORDINATES = {
  latitude: 40.7128,
  longitude: -74.0060,
  city: "New York",
  region: "NY",
  country: "United States"
};

/**
 * Get city name from coordinates using Google Geocoding API with OpenStreetMap fallback
 */
async function getCityFromCoordinates(latitude, longitude) {
  console.log(`🔍 Getting city from coordinates: ${latitude}, ${longitude}`);
  
  // Try Google Geocoding API first
  try {
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (googleApiKey) {
      console.log('🌍 Trying Google Geocoding API...');
      
      const googleResponse = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${googleApiKey}`,
        { 
          headers: { 'User-Agent': 'TIKO Music Platform' },
          signal: AbortSignal.timeout(5000) // 5 second timeout
        }
      );
      
      if (googleResponse.ok) {
        const googleData = await googleResponse.json();
        
        if (googleData.status === 'OK' && googleData.results.length > 0) {
          const result = googleData.results[0];
          const addressComponents = result.address_components;
          
          let city = null;
          let region = null;
          let country = null;
          
          // Extract city, region, and country from address components
          for (const component of addressComponents) {
            const types = component.types;
            
            if (types.includes('locality') || types.includes('administrative_area_level_2')) {
              city = component.long_name;
            }
            if (types.includes('administrative_area_level_1')) {
              region = component.short_name;
            }
            if (types.includes('country')) {
              country = component.long_name;
            }
          }
          
          // Special handling for Canadian users - default to Toronto
          if (country === "Canada") {
            console.log("🍁 Canadian user detected, using Toronto as default location");
            return TORONTO_COORDINATES;
          }
          
          if (city && region && country) {
            console.log(`✅ Google API geocoding successful: ${city}, ${region}, ${country}`);
            return {
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              city: city,
              region: region,
              country: country
            };
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️ Google API geocoding failed:', error.message);
  }
  
  // Fallback to OpenStreetMap Nominatim
  try {
    console.log('🗺️ Trying OpenStreetMap fallback...');
    
    const osmResponse = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10`,
      { 
        headers: { 'User-Agent': 'TIKO Music Platform' },
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );
    
    if (osmResponse.ok) {
      const osmData = await osmResponse.json();
      
      if (osmData.address) {
        const address = osmData.address;
        
        // Special handling for Canadian users - default to Toronto
        if (address.country === "Canada") {
          console.log("🍁 Canadian user detected (OSM), using Toronto as default location");
          return TORONTO_COORDINATES;
        }
        
        const city = address.city || address.town || address.village || address.municipality || 'Unknown';
        const region = address.state || address.region || address.stateCode || 'Unknown';
        const country = address.country || 'Unknown';
        
        console.log(`✅ OpenStreetMap geocoding successful: ${city}, ${region}, ${country}`);
        return {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          city: city,
          region: region,
          country: country
        };
      }
    }
  } catch (error) {
    console.log('⚠️ OpenStreetMap geocoding failed:', error.message);
  }
  
  // If all geocoding fails, return coordinates with unknown city
  console.log('❌ All geocoding services failed, using coordinates with unknown city');
  return {
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    city: 'Unknown',
    region: 'Unknown',
    country: 'Unknown'
  };
}

/**
 * Get user location from browser geolocation API
 */
function getUserLocationFromBrowser() {
  return new Promise((resolve, reject) => {
    console.log('📍 Attempting browser geolocation...');
    
    if (!navigator.geolocation) {
      console.log('❌ Geolocation not supported by browser');
      reject(new Error('Geolocation not supported'));
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          console.log('✅ Browser geolocation successful');
          const { latitude, longitude } = position.coords;
          
          // Get city name from coordinates
          const locationInfo = await getCityFromCoordinates(latitude, longitude);
          
          console.log('📍 Final location detected:', locationInfo);
          resolve(locationInfo);
        } catch (error) {
          console.log('❌ Error processing geolocation:', error.message);
          reject(error);
        }
      },
      (error) => {
        console.log('❌ Browser geolocation failed:', error.message);
        reject(error);
      },
      options
    );
  });
}

/**
 * Get user location from IP address
 */
async function getUserLocationFromIP() {
  console.log('🌐 Attempting IP-based location detection...');
  
  try {
    const response = await fetch('https://ipapi.co/json/', {
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.latitude && data.longitude) {
        console.log('✅ IP-based location successful');
        
        // Special handling for Canadian users - default to Toronto
        if (data.country_name === "Canada") {
          console.log("🍁 Canadian user detected (IP), using Toronto as default location");
          return TORONTO_COORDINATES;
        }
        
        return {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
          city: data.city || 'Unknown',
          region: data.region || data.region_code || 'Unknown',
          country: data.country_name || 'Unknown'
        };
      }
    }
  } catch (error) {
    console.log('❌ IP-based location failed:', error.message);
  }
  
  return null;
}

/**
 * Main function to get user location with multiple fallback methods
 */
export async function getUserLocation() {
  console.log('🎯 Starting comprehensive location detection...');
  
  try {
    // Method 1: Browser geolocation (most accurate)
    console.log('📍 Method 1: Browser geolocation');
    const browserLocation = await getUserLocationFromBrowser();
    if (browserLocation) {
      console.log('✅ Browser geolocation successful, using result');
      return browserLocation;
    }
  } catch (error) {
    console.log('⚠️ Browser geolocation failed, trying IP fallback');
  }
  
  try {
    // Method 2: IP-based location (fallback)
    console.log('🌐 Method 2: IP-based location');
    const ipLocation = await getUserLocationFromIP();
    if (ipLocation) {
      console.log('✅ IP-based location successful, using result');
      return ipLocation;
    }
  } catch (error) {
    console.log('⚠️ IP-based location failed, using default');
  }
  
  // Method 3: Default location (last resort)
  console.log('🏠 Method 3: Using default Toronto location');
  return TORONTO_COORDINATES;
}

/**
 * Search for cities using Google Places API
 */
export async function searchCities(query) {
  console.log(`🔍 Searching cities for: "${query}"`);
  
  try {
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      console.log('❌ Google API key not available for city search');
      return [];
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${googleApiKey}`,
      {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'OK' && data.predictions) {
        console.log(`✅ Found ${data.predictions.length} city suggestions`);
        
        // Convert predictions to our format
        const cities = data.predictions.map(prediction => ({
          id: prediction.place_id,
          name: prediction.description,
          structured_formatting: prediction.structured_formatting
        }));
        
        return cities;
      }
    }
  } catch (error) {
    console.log('❌ City search failed:', error.message);
  }
  
  return [];
}

/**
 * Get coordinates for a specific place ID from Google Places API
 */
export async function getCoordinatesFromPlaceId(placeId) {
  console.log(`📍 Getting coordinates for place ID: ${placeId}`);
  
  try {
    const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!googleApiKey) {
      console.log('❌ Google API key not available for place details');
      return null;
    }
    
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,address_components&key=${googleApiKey}`,
      {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.status === 'OK' && data.result) {
        const result = data.result;
        const location = result.geometry.location;
        const addressComponents = result.address_components;
        
        let city = null;
        let region = null;
        let country = null;
        
        // Extract city, region, and country from address components
        for (const component of addressComponents) {
          const types = component.types;
          
          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            city = component.long_name;
          }
          if (types.includes('administrative_area_level_1')) {
            region = component.short_name;
          }
          if (types.includes('country')) {
            country = component.long_name;
          }
        }
        
        console.log(`✅ Place details successful: ${city}, ${region}, ${country}`);
        return {
          latitude: location.lat,
          longitude: location.lng,
          city: city || 'Unknown',
          region: region || 'Unknown',
          country: country || 'Unknown'
        };
      }
    }
  } catch (error) {
    console.log('❌ Place details failed:', error.message);
  }
  
  return null;
}

// Legacy exports for backward compatibility
export { getUserLocationFromBrowser };
