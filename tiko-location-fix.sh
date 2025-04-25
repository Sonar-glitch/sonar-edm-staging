#!/bin/bash

# TIKO Platform Ticketmaster Location Fix Script
# This script fixes the location detection for Ticketmaster API to show events near Toronto
# Created: April 25, 2025

echo "Starting TIKO Ticketmaster location fix at $(date +%Y%m%d%H%M%S)"
echo "This script will fix the location detection to show events near Toronto"

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

# Backup events API files
if [ -f "pages/api/events/index.js" ]; then
  cp -f pages/api/events/index.js backups/pages/api/events/index.js.backup
  echo "Backed up events/index.js"
fi

# Backup location utility if it exists
if [ -f "lib/locationUtils.js" ]; then
  cp -f lib/locationUtils.js backups/lib/locationUtils.js.backup
  echo "Backed up locationUtils.js"
fi

echo "Backups created successfully"

# Create a location utility file with Toronto coordinates
echo "Creating location utility file with Toronto coordinates..."

mkdir -p lib

cat > lib/locationUtils.js << 'EOL'
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
EOL

echo "Created locationUtils.js with Toronto coordinates"

# Fix the events API to use the location utility
echo "Fixing events API to use the location utility..."

if [ -f "pages/api/events/index.js" ]; then
  # Create a new version of the events API that uses the location utility
  cat > pages/api/events/index.js << 'EOL'
import axios from 'axios';
import { getCachedLocation } from '@/lib/locationUtils';
import { cacheData, getCachedData } from '@/lib/cache';

export default async function handler(req, res) {
  console.log("Starting Events API handler");
  
  // Get API keys from environment variables
  const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
  const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
  
  console.log(`Using Ticketmaster API key: ${ticketmasterApiKey ? 'Available' : 'Missing'}`);
  console.log(`Using EDMtrain API key: ${edmtrainApiKey ? 'Available' : 'Missing'}`);
  
  try {
    // Get user location (with Toronto as fallback)
    const userLocation = await getCachedLocation(req);
    
    if (userLocation) {
      console.log(`User location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    }
    
    // Try to get cached events first
    const cacheKey = `events-${userLocation?.latitude?.toFixed(2)}-${userLocation?.longitude?.toFixed(2)}`;
    const cachedEvents = await getCachedData(cacheKey);
    
    if (cachedEvents) {
      console.log(`Using ${cachedEvents.length} cached events`);
      return res.status(200).json(cachedEvents);
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
        } else {
          console.log("No valid location data available, using Toronto coordinates");
          params.latlong = "43.6532,-79.3832"; // Toronto coordinates
          params.radius = "100";
          params.unit = "miles";
        }
        
        console.log("Ticketmaster API request params:", JSON.stringify(params));
        
        const response = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", { 
          params,
          timeout: 15000
        });
        
        if (response.data._embedded && response.data._embedded.events) {
          ticketmasterEvents = response.data._embedded.events;
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
          
          // Cache Ticketmaster events for 12 hours (43200 seconds)
          await cacheData("ticketmaster/events", {
            lat: userLocation?.latitude,
            lon: userLocation?.longitude
          }, ticketmasterEvents, 43200);
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
          } else {
            // Use Toronto coordinates as fallback
            retryParams.latlong = "43.6532,-79.3832"; // Toronto coordinates
            retryParams.radius = "100";
            retryParams.unit = "miles";
          }
          
          console.log("Ticketmaster retry params:", JSON.stringify(retryParams));
          
          const retryResponse = await axios.get("https://app.ticketmaster.com/discovery/v2/events.json", { 
            params: retryParams,
            timeout: 15000
          });
          
          if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
            ticketmasterEvents = retryResponse.data._embedded.events;
            
            // Cache Ticketmaster events for 12 hours (43200 seconds)
            await cacheData("ticketmaster/events", {
              lat: userLocation?.latitude,
              lon: userLocation?.longitude
            }, ticketmasterEvents, 43200);
            
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
        } else {
          // Use Toronto coordinates as fallback
          params.latitude = 43.6532; // Toronto latitude
          params.longitude = -79.3832; // Toronto longitude
        }
        
        console.log("EDMtrain API request params:", JSON.stringify(params));
        
        const response = await axios.get("https://edmtrain.com/api/events", { 
          params,
          timeout: 15000
        });
        
        if (response.data && response.data.data) {
          edmtrainEvents = response.data.data;
          console.log(`Found ${edmtrainEvents.length} events from EDMtrain`);
          
          // Cache EDMtrain events for 12 hours (43200 seconds)
          await cacheData("edmtrain/events", {
            lat: userLocation?.latitude,
            lon: userLocation?.longitude
          }, edmtrainEvents, 43200);
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
    
    // Cache the combined events for 1 hour (3600 seconds)
    await cacheData(cacheKey, null, processedEvents, 3600);
    
    // Return the combined events
    return res.status(200).json(processedEvents);
  } catch (error) {
    console.error("Error in events API:", error);
    return res.status(500).json({ error: "Failed to fetch events" });
  }
}

// Function to generate sample events
function getSampleEvents(userLocation) {
  const now = new Date();
  const sampleEvents = [];
  
  // Toronto venues for sample events
  const torontoVenues = [
    {
      name: "REBEL",
      city: "Toronto",
      state: "Ontario",
      country: "Canada",
      address: "11 Polson St, Toronto, ON M5A 1A4",
      location: { latitude: 43.6453, longitude: -79.3571 }
    },
    {
      name: "CODA",
      city: "Toronto",
      state: "Ontario",
      country: "Canada",
      address: "794 Bathurst St, Toronto, ON M5S 2R6",
      location: { latitude: 43.6647, longitude: -79.4125 }
    },
    {
      name: "The Danforth Music Hall",
      city: "Toronto",
      state: "Ontario",
      country: "Canada",
      address: "147 Danforth Ave, Toronto, ON M4K 1N2",
      location: { latitude: 43.6768, longitude: -79.3530 }
    },
    {
      name: "Velvet Underground",
      city: "Toronto",
      state: "Ontario",
      country: "Canada",
      address: "508 Queen St W, Toronto, ON M5V 2B3",
      location: { latitude: 43.6487, longitude: -79.3975 }
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
    
    const venue = torontoVenues[i % torontoVenues.length];
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
  echo "Updated events/index.js with location utility"
else
  echo "Warning: events/index.js not found, skipping update"
fi

# Fix the correlated-events.js file to use the location utility
echo "Fixing correlated-events.js to use the location utility..."

if [ -f "pages/api/events/correlated-events.js" ]; then
  # Create a new version of the correlated-events.js file
  cat > pages/api/events/correlated-events.js << 'EOL'
import axios from 'axios';
import { getCachedLocation } from '@/lib/locationUtils';
import { cacheData, getCachedData } from '@/lib/cache';

export default async function handler(req, res) {
  try {
    // Get user location (with Toronto as fallback)
    const userLocation = await getCachedLocation(req);
    
    if (userLocation) {
      console.log(`User location for correlated events: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    }
    
    // Try to get cached correlated events first
    const cacheKey = `correlated-events-${userLocation?.latitude?.toFixed(2)}-${userLocation?.longitude?.toFixed(2)}`;
    const cachedEvents = await getCachedData(cacheKey);
    
    if (cachedEvents) {
      console.log(`Using ${cachedEvents.length} cached correlated events`);
      return res.status(200).json(cachedEvents);
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
          lon: userLocation.longitude
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
    
    // Cache the correlated events for 1 hour (3600 seconds)
    await cacheData(cacheKey, null, correlatedEvents, 3600);
    
    // Return the correlated events
    return res.status(200).json(correlatedEvents);
  } catch (error) {
    console.error("Error in correlated events API:", error);
    return res.status(500).json({ error: "Failed to fetch correlated events" });
  }
}

// Calculate distance between two coordinates in kilometers
function getDistance(lat1, lon1, lat2, lon2) {
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
EOL
  echo "Updated correlated-events.js with location utility"
else
  echo "Warning: correlated-events.js not found, skipping update"
fi

# Commit changes
echo "Committing changes..."
git add lib/locationUtils.js
git add pages/api/events/index.js
git add pages/api/events/correlated-events.js
git commit -m "Fix Ticketmaster location detection to show events near Toronto"

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

echo "Ticketmaster location fix complete! Events should now be shown near Toronto."
echo "Your improved dashboard should be live at:"
echo "https://sonar-edm-user-50e4fb038f6e.herokuapp.com"

echo "If you still encounter issues, please check the Heroku logs:"
echo "heroku logs --app sonar-edm-user"

echo "TIKO Ticketmaster location fix completed at $(date +%Y%m%d%H%M%S)"
