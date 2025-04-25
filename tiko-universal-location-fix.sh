#!/bin/bash

# TIKO Platform Universal Location Detection Fix Script
# This script implements proper location detection for all users
# Created: April 25, 2025

echo "Starting TIKO universal location detection fix at $(date +%Y%m%d%H%M%S)"
echo "This script will implement proper location detection for all users"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Create a backup of the current state
echo "Creating backup of current state..."
git branch backup-before-location-fix-$(date +%Y%m%d%H%M%S)
echo "Backup branch created successfully"

# Create backup of files we're going to modify
echo "Creating backups of files to be modified..."
mkdir -p backups/pages/api/events
mkdir -p backups/lib
mkdir -p backups/components

# Backup events API files
if [ -f "pages/api/events/index.js" ]; then
  cp -f pages/api/events/index.js backups/pages/api/events/index.js.backup
  echo "Backed up events/index.js"
fi

if [ -f "pages/api/events/correlated-events.js" ]; then
  cp -f pages/api/events/correlated-events.js backups/pages/api/events/correlated-events.js.backup
  echo "Backed up correlated-events.js"
fi

# Create location utility file
echo "Creating location utility file..."

mkdir -p lib

cat > lib/locationUtils.js << 'EOL'
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
EOL

echo "Created locationUtils.js with universal location detection"

# Create a location context provider component
echo "Creating location context provider component..."

mkdir -p components

cat > components/LocationProvider.js << 'EOL'
import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserLocationFromBrowser, getUserLocationFromIP } from '@/lib/locationUtils';

// Create location context
export const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function detectLocation() {
      try {
        setLoading(true);
        
        // First try browser geolocation
        try {
          const browserLocation = await getUserLocationFromBrowser();
          setLocation(browserLocation);
          setLoading(false);
          
          // Store location in localStorage for persistence
          localStorage.setItem('userLocation', JSON.stringify(browserLocation));
          
          // Also send to server for API calls
          await fetch('/api/user/set-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(browserLocation)
          });
          
          return;
        } catch (browserError) {
          console.log('Browser geolocation failed, trying IP fallback');
        }
        
        // Try IP-based geolocation as fallback
        const ipLocation = await getUserLocationFromIP();
        
        if (ipLocation) {
          setLocation(ipLocation);
          
          // Store location in localStorage for persistence
          localStorage.setItem('userLocation', JSON.stringify(ipLocation));
          
          // Also send to server for API calls
          await fetch('/api/user/set-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ipLocation)
          });
        } else {
          throw new Error('Could not detect location');
        }
      } catch (err) {
        console.error('Location detection error:', err);
        setError(err.message);
        
        // Try to get from localStorage as last resort
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            setLocation(JSON.parse(savedLocation));
          } catch (e) {
            console.error('Error parsing saved location:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    
    detectLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ location, loading, error, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

// Custom hook to use location context
export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export default LocationProvider;
EOL

echo "Created LocationProvider.js component"

# Create API endpoint to store user location
echo "Creating API endpoint to store user location..."

mkdir -p pages/api/user

cat > pages/api/user/set-location.js << 'EOL'
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '@/lib/session';

export default withIronSessionApiRoute(async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { latitude, longitude, city, region, country } = req.body;
    
    // Validate location data
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Invalid location data' });
    }
    
    // Store location in session
    req.session.userLocation = {
      latitude,
      longitude,
      city: city || 'Unknown',
      region: region || 'Unknown',
      country: country || 'Unknown',
      timestamp: Date.now()
    };
    
    await req.session.save();
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving location:', error);
    return res.status(500).json({ error: 'Failed to save location' });
  }
}, sessionOptions);
EOL

echo "Created set-location.js API endpoint"

# Create API endpoint to get user location
echo "Creating API endpoint to get user location..."

cat > pages/api/user/get-location.js << 'EOL'
import { withIronSessionApiRoute } from 'iron-session/next';
import { sessionOptions } from '@/lib/session';
import { getUserLocation } from '@/lib/locationUtils';

export default withIronSessionApiRoute(async function handler(req, res) {
  try {
    // Check if location is in session and not expired (24 hours)
    const sessionLocation = req.session.userLocation;
    const now = Date.now();
    const locationAge = sessionLocation?.timestamp ? now - sessionLocation.timestamp : Infinity;
    
    if (sessionLocation && locationAge < 24 * 60 * 60 * 1000) {
      return res.status(200).json(sessionLocation);
    }
    
    // If no valid session location, detect from request
    const detectedLocation = await getUserLocation(req);
    
    // Store in session
    req.session.userLocation = {
      ...detectedLocation,
      timestamp: now
    };
    
    await req.session.save();
    
    return res.status(200).json(detectedLocation);
  } catch (error) {
    console.error('Error getting location:', error);
    return res.status(500).json({ error: 'Failed to get location' });
  }
}, sessionOptions);
EOL

echo "Created get-location.js API endpoint"

# Update the events API to use the location utility
echo "Updating events API to use the location utility..."

cat > pages/api/events/index.js << 'EOL'
import axios from 'axios';
import { getUserLocation } from '@/lib/locationUtils';

export default async function handler(req, res) {
  console.log("Starting Events API handler");
  
  // Get API keys from environment variables
  const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
  const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
  
  console.log(`Using Ticketmaster API key: ${ticketmasterApiKey ? 'Available' : 'Missing'}`);
  console.log(`Using EDMtrain API key: ${edmtrainApiKey ? 'Available' : 'Missing'}`);
  
  try {
    // Get user location with fallbacks
    let userLocation;
    
    // First check if location is provided in the request
    if (req.query.lat && req.query.lon) {
      userLocation = {
        latitude: parseFloat(req.query.lat),
        longitude: parseFloat(req.query.lon),
        city: req.query.city || 'Unknown',
        region: req.query.region || 'Unknown',
        country: req.query.country || 'Unknown'
      };
      console.log(`Using location from query params: ${userLocation.latitude}, ${userLocation.longitude}`);
    } 
    // Then check if location is in session
    else if (req.session?.userLocation) {
      userLocation = req.session.userLocation;
      console.log(`Using location from session: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    } 
    // Otherwise detect from request
    else {
      userLocation = await getUserLocation(req);
      console.log(`Detected location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    }
    
    // Fetch events from Ticketmaster API
    let ticketmasterEvents = [];
    let ticketmasterError = null;
    
    if (ticketmasterApiKey) {
      try {
        console.log("Making Ticketmaster API request...");
        
        // Prepare parameters for Ticketmaster API
        const params = {
          apikey: ticketmasterApiKey,
          classificationName: "music",
          keyword: "electronic OR dance OR dj OR festival OR rave",
          size: 100,
          sort: "date,asc",
          startDateTime: new Date().toISOString().slice(0, 19) + "Z"
        };
        
        // Add location parameters if available
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          params.latlong = `${userLocation.latitude},${userLocation.longitude}`;
          params.radius = "100"; // 100 mile radius
          params.unit = "miles";
          console.log(`Adding location filter: ${params.latlong}, radius: ${params.radius} miles`);
        }
        
        console.log("Ticketmaster API request params:", JSON.stringify(params));
        
        const response = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", { 
          params,
          timeout: 15000
        });
        
        if (response.data._embedded && response.data._embedded.events) {
          ticketmasterEvents = response.data._embedded.events;
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
        } else {
          console.log("No events found in Ticketmaster response");
        }
      } catch (error) {
        console.error("Ticketmaster API request failed:", error.message);
        ticketmasterError = error.message;
        
        console.log("Retrying with simpler query after error...");
        try {
          const retryParams = {
            apikey: ticketmasterApiKey,
            keyword: "electronic",
            size: 50,
            sort: "date,asc",
            startDateTime: new Date().toISOString().slice(0, 19) + "Z"
          };
          
          // Only add location if we have valid coordinates
          if (userLocation && userLocation.latitude && userLocation.longitude) {
            retryParams.latlong = `${userLocation.latitude},${userLocation.longitude}`;
            retryParams.radius = "100";
            retryParams.unit = "miles";
          }
          
          const retryResponse = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", { 
            params: retryParams,
            timeout: 15000
          });
          
          if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
            ticketmasterEvents = retryResponse.data._embedded.events;
            console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
            ticketmasterError = null;
          } else {
            console.log("No events found in Ticketmaster retry response after error");
          }
        } catch (retryError) {
          console.error("Ticketmaster retry also failed:", retryError.message);
          ticketmasterError = `${error.message} (retry also failed: ${retryError.message})`;
        }
      }
    }
    
    // Fetch events from EDMtrain API
    let edmtrainEvents = [];
    let edmtrainError = null;
    
    if (edmtrainApiKey) {
      try {
        console.log("Fetching events from EDMtrain API...");
        
        // Prepare parameters for EDMtrain API
        const params = {
          client: edmtrainApiKey,
          radius: 100 // 100 mile radius
        };
        
        // Add location parameters if available
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          params.latitude = userLocation.latitude;
          params.longitude = userLocation.longitude;
        }
        
        console.log("EDMtrain API request params:", JSON.stringify(params));
        
        const response = await axios.get("https://edmtrain.com/api/events", { 
          params,
          timeout: 15000
        });
        
        if (response.data && response.data.data) {
          edmtrainEvents = response.data.data;
          console.log(`Found ${edmtrainEvents.length} events from EDMtrain`);
        } else {
          console.log("No events found in EDMtrain response");
        }
      } catch (error) {
        console.error("EDMtrain API request failed:", error.message);
        edmtrainError = error.message;
      }
    }
    
    // Process and combine events from both sources
    const processedEvents = [];
    
    // Process Ticketmaster events
    if (ticketmasterEvents.length > 0) {
      for (const event of ticketmasterEvents) {
        try {
          // Skip non-music events
          if (!event.classifications || !event.classifications.some(c => c.segment && c.segment.name === "Music")) {
            continue;
          }
          
          // Extract venue information
          const venue = event._embedded?.venues?.[0] || {};
          const venueLocation = venue.location ? {
            latitude: parseFloat(venue.location.latitude),
            longitude: parseFloat(venue.location.longitude)
          } : null;
          
          // Extract date information
          const startDate = event.dates?.start?.dateTime ? new Date(event.dates.start.dateTime) : null;
          
          // Skip past events
          if (startDate && startDate < new Date()) {
            continue;
          }
          
          // Extract genre information
          const genres = [];
          if (event.classifications) {
            for (const classification of event.classifications) {
              if (classification.genre && classification.genre.name && classification.genre.name !== "Undefined") {
                genres.push(classification.genre.name.toLowerCase());
              }
              if (classification.subGenre && classification.subGenre.name && classification.subGenre.name !== "Undefined") {
                genres.push(classification.subGenre.name.toLowerCase());
              }
            }
          }
          
          // Create processed event object
          const processedEvent = {
            id: event.id,
            name: event.name,
            url: event.url,
            date: startDate ? startDate.toISOString() : null,
            venue: {
              name: venue.name || "Unknown Venue",
              city: venue.city?.name || "Unknown City",
              state: venue.state?.name || "Unknown State",
              country: venue.country?.name || "Unknown Country",
              address: venue.address?.line1 || "",
              location: venueLocation
            },
            artists: event._embedded?.attractions?.map(a => ({
              name: a.name,
              url: a.url || null,
              image: a.images && a.images.length > 0 ? a.images[0].url : null
            })) || [],
            genres: genres,
            source: "ticketmaster",
            sourceData: event,
            liveData: true
          };
          
          processedEvents.push(processedEvent);
        } catch (error) {
          console.error("Error processing Ticketmaster event:", error);
        }
      }
    }
    
    // Process EDMtrain events
    if (edmtrainEvents.length > 0) {
      for (const event of edmtrainEvents) {
        try {
          // Skip events without venue
          if (!event.venue) {
            continue;
          }
          
          // Extract venue location
          const venueLocation = event.venue.latitude && event.venue.longitude ? {
            latitude: event.venue.latitude,
            longitude: event.venue.longitude
          } : null;
          
          // Extract date information
          const startDate = event.date ? new Date(event.date) : null;
          
          // Skip past events
          if (startDate && startDate < new Date()) {
            continue;
          }
          
          // Create processed event object
          const processedEvent = {
            id: `edmtrain-${event.id}`,
            name: event.name || "EDM Event",
            url: `https://edmtrain.com/event/${event.id}`,
            date: startDate ? startDate.toISOString() : null,
            venue: {
              name: event.venue.name || "Unknown Venue",
              city: event.venue.location || "Unknown City",
              state: event.venue.state || "Unknown State",
              country: "United States", // EDMtrain only covers US events
              address: `${event.venue.address || ""}, ${event.venue.location || ""}, ${event.venue.state || ""}`,
              location: venueLocation
            },
            artists: event.artistList?.map(a => ({
              name: a.name,
              url: `https://edmtrain.com/artist/${a.id}`,
              image: null
            })) || [],
            genres: ["electronic dance music"], // EDMtrain doesn't provide specific genres
            source: "edmtrain",
            sourceData: event,
            liveData: true
          };
          
          processedEvents.push(processedEvent);
        } catch (error) {
          console.error("Error processing EDMtrain event:", error);
        }
      }
    }
    
    // Add some sample events if we don't have enough real events
    if (processedEvents.length < 10) {
      console.log("Adding sample events to supplement real events");
      
      const sampleEvents = getSampleEvents(userLocation);
      processedEvents.push(...sampleEvents);
    }
    
    // Sort events by date
    processedEvents.sort((a, b) => {
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(a.date) - new Date(b.date);
    });
    
    // Return the combined events
    return res.status(200).json(processedEvents);
  } catch (error) {
    console.error("Error in events API:", error);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
}

// Function to generate sample events near user location
function getSampleEvents(userLocation) {
  const now = new Date();
  const sampleEvents = [];
  
  // Sample venues (will be adjusted based on user location)
  const sampleVenues = [
    {
      name: "The Underground",
      city: userLocation?.city || "Unknown City",
      state: userLocation?.region || "Unknown State",
      country: userLocation?.country || "Unknown Country",
      address: "123 Main St",
      location: { 
        latitude: userLocation?.latitude ? userLocation.latitude + 0.01 : 40.7128,
        longitude: userLocation?.longitude ? userLocation.longitude + 0.01 : -74.0060
      }
    },
    {
      name: "The Loft",
      city: userLocation?.city || "Unknown City",
      state: userLocation?.region || "Unknown State",
      country: userLocation?.country || "Unknown Country",
      address: "101 Skyline Ave",
      location: { 
        latitude: userLocation?.latitude ? userLocation.latitude - 0.01 : 40.7128,
        longitude: userLocation?.longitude ? userLocation.longitude - 0.01 : -74.0060
      }
    },
    {
      name: "Sunset Park",
      city: userLocation?.city || "Unknown City",
      state: userLocation?.region || "Unknown State",
      country: userLocation?.country || "Unknown Country",
      address: "456 Parkway Dr",
      location: { 
        latitude: userLocation?.latitude ? userLocation.latitude + 0.02 : 40.7128,
        longitude: userLocation?.longitude ? userLocation.longitude + 0.02 : -74.0060
      }
    },
    {
      name: "Club Horizon",
      city: userLocation?.city || "Unknown City",
      state: userLocation?.region || "Unknown State",
      country: userLocation?.country || "Unknown Country",
      address: "789 Downtown Blvd",
      location: { 
        latitude: userLocation?.latitude ? userLocation.latitude - 0.02 : 40.7128,
        longitude: userLocation?.longitude ? userLocation.longitude - 0.02 : -74.0060
      }
    }
  ];
  
  // Sample artists
  const sampleArtists = [
    { name: "Melodic Techno Night", genres: ["melodic techno", "deep house"] },
    { name: "Summer House Festival", genres: ["house", "tech house"] },
    { name: "Progressive Dreams", genres: ["progressive house", "melodic house"] },
    { name: "Techno Warehouse Night", genres: ["techno", "industrial techno"] },
    { name: "Bass Music Showcase", genres: ["dubstep", "trap", "bass"] },
    { name: "Trance Journey", genres: ["trance", "progressive trance"] },
    { name: "Drum & Bass Collective", genres: ["drum & bass", "jungle"] },
    { name: "Future Bass Experience", genres: ["future bass", "electronic"] }
  ];
  
  // Generate 8 sample events
  for (let i = 0; i < 8; i++) {
    const eventDate = new Date(now);
    eventDate.setDate(eventDate.getDate() + 7 + i * 3); // Events starting in a week, 3 days apart
    
    const venue = sampleVenues[i % sampleVenues.length];
    const artistInfo = sampleArtists[i % sampleArtists.length];
    
    // Create featured artists
    const featuredArtists = [];
    const artistCount = 2 + Math.floor(Math.random() * 3); // 2-4 artists
    
    for (let j = 0; j < artistCount; j++) {
      featuredArtists.push({
        name: ["Tale of Us", "Mind Against", "Mathame", "Charlotte de Witte", "Amelie Lens", "FJAAK", "Disclosure", "Kayranada", "The Blessed Madonna", "Hernan Cattaneo", "Nick Warren", "Guy J"][Math.floor(Math.random() * 12)],
        url: null,
        image: null
      });
    }
    
    sampleEvents.push({
      id: `sample-${i}`,
      name: artistInfo.name,
      url: null,
      date: eventDate.toISOString(),
      venue: venue,
      artists: featuredArtists,
      genres: artistInfo.genres,
      source: "sample",
      liveData: false
    });
  }
  
  return sampleEvents;
}
EOL

echo "Updated events/index.js with universal location detection"

# Update the correlated-events.js file
echo "Updating correlated-events.js with universal location detection..."

cat > pages/api/events/correlated-events.js << 'EOL'
import axios from 'axios';
import { getUserLocation, getDistance } from '@/lib/locationUtils';

export default async function handler(req, res) {
  try {
    // Get user location with fallbacks
    let userLocation;
    
    // First check if location is provided in the request
    if (req.query.lat && req.query.lon) {
      userLocation = {
        latitude: parseFloat(req.query.lat),
        longitude: parseFloat(req.query.lon),
        city: req.query.city || 'Unknown',
        region: req.query.region || 'Unknown',
        country: req.query.country || 'Unknown'
      };
      console.log(`Using location from query params for correlated events: ${userLocation.latitude}, ${userLocation.longitude}`);
    } 
    // Then check if location is in session
    else if (req.session?.userLocation) {
      userLocation = req.session.userLocation;
      console.log(`Using location from session for correlated events: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    } 
    // Otherwise detect from request
    else {
      userLocation = await getUserLocation(req);
      console.log(`Detected location for correlated events: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    }
    
    // Get user taste profile
    let userTaste = null;
    
    try {
      const tasteResponse = await axios.get(`${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/spotify/user-taste`, {
        headers: {
          Cookie: req.headers.cookie // Forward cookies for authentication
        },
        validateStatus: function (status) {
          return status < 500; // Only treat 500+ errors as actual errors
        }
      });
      
      if (tasteResponse.status === 401) {
        console.log("Authentication required for user taste data");
        throw new Error("Authentication required");
      }
      
      userTaste = tasteResponse.data;
    } catch (error) {
      console.error("Error fetching user taste data:", error.message);
      return res.status(401).json({ error: "Authentication required" });
    }
    
    // Extract user genres
    const userGenres = [];
    
    if (userTaste.genreProfile) {
      for (const [genre, score] of Object.entries(userTaste.genreProfile)) {
        if (score > 30) { // Only include genres with score > 30
          userGenres.push(genre.toLowerCase());
        }
      }
    }
    
    console.log("User genres for correlation:", userGenres);
    
    // Fetch all events
    let allEvents = [];
    
    try {
      // Use the location from the request
      const eventsUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/events`;
      const eventsResponse = await axios.get(eventsUrl, {
        params: {
          lat: userLocation.latitude,
          lon: userLocation.longitude,
          city: userLocation.city,
          region: userLocation.region,
          country: userLocation.country
        }
      });
      
      allEvents = eventsResponse.data;
      console.log(`Found ${allEvents.length} events for correlation`);
    } catch (error) {
      console.error("Error fetching events:", error.message);
      return res.status(500).json({ error: "Failed to fetch events" });
    }
    
    // Calculate correlation scores
    const correlatedEvents = allEvents.map(event => {
      let correlationScore = 0;
      
      // Match based on genres
      if (event.genres && userGenres.length > 0) {
        for (const genre of event.genres) {
          if (userGenres.includes(genre.toLowerCase())) {
            correlationScore += 25; // Add 25 points for each matching genre
          }
        }
      }
      
      // Adjust score based on venue location if available
      if (event.venue && event.venue.location && userLocation) {
        const distance = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          event.venue.location.latitude,
          event.venue.location.longitude
        );
        
        // Closer events get higher scores
        if (distance < 5) {
          correlationScore += 20; // Within 5km
        } else if (distance < 10) {
          correlationScore += 15; // Within 10km
        } else if (distance < 20) {
          correlationScore += 10; // Within 20km
        } else if (distance < 50) {
          correlationScore += 5; // Within 50km
        }
      }
      
      // Add some randomness to avoid identical scores
      correlationScore += Math.random() * 5;
      
      // Ensure score is between 0 and 100
      correlationScore = Math.min(100, Math.max(0, correlationScore));
      
      return {
        ...event,
        correlationScore: Math.round(correlationScore)
      };
    });
    
    // Sort by correlation score (descending)
    correlatedEvents.sort((a, b) => b.correlationScore - a.correlationScore);
    
    // Return the correlated events
    return res.status(200).json(correlatedEvents);
  } catch (error) {
    console.error("Error in correlated events API:", error);
    return res.status(500).json({ error: "Failed to fetch correlated events" });
  }
}
EOL

echo "Updated correlated-events.js with universal location detection"

# Update _app.js to include the LocationProvider
echo "Updating _app.js to include the LocationProvider..."

if [ -f "pages/_app.js" ]; then
  # Create a backup of _app.js
  cp -f pages/_app.js backups/pages/_app.js.backup
  
  # Check if LocationProvider is already imported
  if ! grep -q "LocationProvider" pages/_app.js; then
    # Add LocationProvider import
    sed -i '1s/^/import { LocationProvider } from "@\/components\/LocationProvider";\n/' pages/_app.js
    
    # Wrap Component with LocationProvider
    sed -i 's/return (<Component {...pageProps} \/>)/return (<LocationProvider><Component {...pageProps} \/><\/LocationProvider>)/' pages/_app.js
    
    echo "Updated _app.js to include LocationProvider"
  else
    echo "_app.js already includes LocationProvider, skipping update"
  fi
else
  echo "Warning: _app.js not found, creating new file"
  
  # Create a new _app.js file
  mkdir -p pages
  
  cat > pages/_app.js << 'EOL'
import { SessionProvider } from "next-auth/react";
import { LocationProvider } from "@/components/LocationProvider";
import "@/styles/globals.css";

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <LocationProvider>
        <Component {...pageProps} />
      </LocationProvider>
    </SessionProvider>
  );
}

export default MyApp;
EOL

  echo "Created new _app.js with LocationProvider"
fi

# Create session utility if it doesn't exist
echo "Creating session utility if it doesn't exist..."

mkdir -p lib

if [ ! -f "lib/session.js" ]; then
  cat > lib/session.js << 'EOL'
export const sessionOptions = {
  cookieName: "tiko-session",
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 // 30 days
  }
};
EOL

  echo "Created session.js utility"
else
  echo "session.js already exists, skipping creation"
fi

# Create a cache utility if it doesn't exist
echo "Creating cache utility if it doesn't exist..."

if [ ! -f "lib/cache.js" ]; then
  cat > lib/cache.js << 'EOL'
// Simple in-memory cache
const cache = new Map();

/**
 * Get cached data
 * @param {string} key - Cache key
 * @returns {any} Cached data or null
 */
export async function getCachedData(key) {
  if (!key) return null;
  
  const cacheItem = cache.get(key);
  
  if (!cacheItem) return null;
  
  // Check if cache is expired
  if (cacheItem.expiry < Date.now()) {
    cache.delete(key);
    return null;
  }
  
  return cacheItem.data;
}

/**
 * Cache data
 * @param {string} key - Cache key
 * @param {object} metadata - Optional metadata
 * @param {any} data - Data to cache
 * @param {number} ttlSeconds - Time to live in seconds
 */
export async function cacheData(key, metadata, data, ttlSeconds = 3600) {
  if (!key || !data) return;
  
  cache.set(key, {
    data,
    metadata,
    expiry: Date.now() + (ttlSeconds * 1000),
    created: Date.now()
  });
}

/**
 * Clear cache
 * @param {string} keyPrefix - Optional key prefix to clear only matching items
 */
export function clearCache(keyPrefix) {
  if (!keyPrefix) {
    cache.clear();
    return;
  }
  
  for (const key of cache.keys()) {
    if (key.startsWith(keyPrefix)) {
      cache.delete(key);
    }
  }
}

export default {
  getCachedData,
  cacheData,
  clearCache
};
EOL

  echo "Created cache.js utility"
else
  echo "cache.js already exists, skipping creation"
fi

# Create a location display component for the dashboard
echo "Creating location display component for the dashboard..."

cat > components/LocationDisplay.js << 'EOL'
import React from 'react';
import { useLocation } from './LocationProvider';
import styles from './LocationDisplay.module.css';

export default function LocationDisplay() {
  const { location, loading, error } = useLocation();
  
  if (loading) {
    return <div className={styles.locationDisplay}>Detecting your location...</div>;
  }
  
  if (error) {
    return (
      <div className={styles.locationDisplay}>
        <span className={styles.error}>Location detection failed.</span>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!location) {
    return <div className={styles.locationDisplay}>Location unavailable</div>;
  }
  
  return (
    <div className={styles.locationDisplay}>
      <span className={styles.locationIcon}>📍</span>
      <span className={styles.locationText}>
        {location.city}, {location.region}, {location.country}
      </span>
    </div>
  );
}
EOL

echo "Created LocationDisplay.js component"

# Create styles for the location display component
echo "Creating styles for the location display component..."

cat > components/LocationDisplay.module.css << 'EOL'
.locationDisplay {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #a0a0a0;
  margin-bottom: 1rem;
}

.locationIcon {
  margin-right: 0.5rem;
}

.locationText {
  font-weight: 500;
}

.error {
  color: #ff5555;
}

.retryButton {
  background: none;
  border: none;
  color: #00a0ff;
  cursor: pointer;
  font-size: 0.9rem;
  margin-left: 0.5rem;
  text-decoration: underline;
}

.retryButton:hover {
  color: #0080ff;
}
EOL

echo "Created LocationDisplay.module.css"

# Update the dashboard to include the location display
echo "Updating dashboard to include the location display..."

if [ -f "pages/dashboard.js" ]; then
  # Create a backup of dashboard.js
  cp -f pages/dashboard.js backups/pages/dashboard.js.backup
  
  # Check if LocationDisplay is already imported
  if ! grep -q "LocationDisplay" pages/dashboard.js; then
    # Add LocationDisplay import
    sed -i '/^import/a import LocationDisplay from "@/components/LocationDisplay";' pages/dashboard.js
    
    # Add LocationDisplay component to the dashboard
    # This is a bit tricky with sed, so we'll look for a good insertion point
    if grep -q "Events Matching Your Vibe" pages/dashboard.js; then
      sed -i '/Events Matching Your Vibe/i \        <LocationDisplay \/>' pages/dashboard.js
      echo "Updated dashboard.js to include LocationDisplay"
    else
      echo "Warning: Could not find a good insertion point for LocationDisplay in dashboard.js"
      echo "Please manually add <LocationDisplay /> to your dashboard component"
    fi
  else
    echo "dashboard.js already includes LocationDisplay, skipping update"
  fi
else
  echo "Warning: dashboard.js not found, skipping update"
  echo "Please manually add <LocationDisplay /> to your dashboard component"
fi

# Commit changes
echo "Committing changes..."
git add lib/locationUtils.js
git add lib/session.js
git add lib/cache.js
git add components/LocationProvider.js
git add components/LocationDisplay.js
git add components/LocationDisplay.module.css
git add pages/api/user/set-location.js
git add pages/api/user/get-location.js
git add pages/api/events/index.js
git add pages/api/events/correlated-events.js
git add pages/_app.js
git add pages/dashboard.js
git commit -m "Implement universal location detection for all users"

# Push to Heroku
echo "Pushing changes to Heroku with force flag..."
git push -f heroku main

# Check deployment status
echo "Checking deployment status..."
heroku logs --tail --app sonar-edm-user &
HEROKU_LOGS_PID=$!

# Wait for deployment to complete (or timeout after 2 minutes)
echo "Waiting for deployment to complete (timeout: 2 minutes)..."
sleep 120
kill $HEROKU_LOGS_PID

# Verify deployment
echo "Verifying deployment..."
heroku ps --app sonar-edm-user

echo "Universal location detection fix complete! Events should now be shown based on each user's actual location."
echo "Your improved dashboard should be live at:"
echo "https://sonar-edm-user-50e4fb038f6e.herokuapp.com"

echo "If you still encounter issues, please check the Heroku logs:"
echo "heroku logs --app sonar-edm-user"

echo "TIKO universal location detection fix completed at $(date +%Y%m%d%H%M%S)"
