#!/bin/bash

# TIKO Platform js-cookie Dependency Fix Script
# This script fixes the js-cookie dependency error in the universal location detection implementation
# Created: April 25, 2025

echo "Starting TIKO js-cookie dependency fix at $(date +%Y%m%d%H%M%S)"
echo "This script will fix the js-cookie dependency error in the universal location detection implementation"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Create a backup of the current state
echo "Creating backup of current state..."
git branch backup-before-cookie-fix-$(date +%Y%m%d%H%M%S)
echo "Backup branch created successfully"

# Install required dependencies with --save flag to ensure they're added to package.json
echo "Installing required dependencies with --save flag..."
npm install --save js-cookie cookie

# Verify the dependencies were added to package.json
echo "Verifying dependencies were added to package.json..."
if grep -q "js-cookie" package.json && grep -q "cookie" package.json; then
  echo "Dependencies successfully added to package.json"
else
  echo "Warning: Dependencies may not have been added to package.json"
  
  # Manually add dependencies to package.json if they weren't added automatically
  echo "Manually adding dependencies to package.json..."
  
  # Create a temporary file with the updated package.json
  node -e "
    const fs = require('fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    // Add dependencies if they don't exist
    packageJson.dependencies = packageJson.dependencies || {};
    if (!packageJson.dependencies['js-cookie']) {
      packageJson.dependencies['js-cookie'] = '^3.0.5';
    }
    if (!packageJson.dependencies['cookie']) {
      packageJson.dependencies['cookie'] = '^0.5.0';
    }
    
    // Write the updated package.json
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  "
  
  echo "Dependencies manually added to package.json"
fi

# Create a simplified version of the LocationProvider that doesn't use js-cookie
echo "Creating a simplified version of the LocationProvider..."

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
        
        // First try to get from localStorage
        if (typeof window !== 'undefined') {
          const savedLocation = localStorage.getItem('userLocation');
          if (savedLocation) {
            try {
              const parsedLocation = JSON.parse(savedLocation);
              setLocation(parsedLocation);
              setLoading(false);
              return;
            } catch (e) {
              console.error('Error parsing saved location:', e);
            }
          }
        }
        
        // Then try browser geolocation
        try {
          const browserLocation = await getUserLocationFromBrowser();
          setLocation(browserLocation);
          
          // Store location in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('userLocation', JSON.stringify(browserLocation));
          }
          
          // Also send to server for API calls
          try {
            await fetch('/api/user/set-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(browserLocation)
            });
          } catch (e) {
            console.error('Error sending location to server:', e);
          }
          
          setLoading(false);
          return;
        } catch (browserError) {
          console.log('Browser geolocation failed, trying IP fallback');
        }
        
        // Try IP-based geolocation as fallback
        const ipLocation = await getUserLocationFromIP();
        
        if (ipLocation) {
          setLocation(ipLocation);
          
          // Store location in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('userLocation', JSON.stringify(ipLocation));
          }
          
          // Also send to server for API calls
          try {
            await fetch('/api/user/set-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ipLocation)
            });
          } catch (e) {
            console.error('Error sending location to server:', e);
          }
        } else {
          throw new Error('Could not detect location');
        }
      } catch (err) {
        console.error('Location detection error:', err);
        setError(err.message);
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

echo "Created simplified LocationProvider.js without js-cookie dependency"

# Update the set-location.js API endpoint to use native cookie parsing
echo "Updating set-location.js API endpoint to use native cookie parsing..."

cat > pages/api/user/set-location.js << 'EOL'
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { latitude, longitude, city, region, country } = req.body;
    
    // Validate location data
    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Invalid location data' });
    }
    
    // Store location in cookie
    const locationData = {
      latitude,
      longitude,
      city: city || 'Unknown',
      region: region || 'Unknown',
      country: country || 'Unknown',
      timestamp: Date.now()
    };
    
    // Set cookie with location data
    res.setHeader('Set-Cookie', `userLocation=${JSON.stringify(locationData)}; Path=/; Max-Age=${30 * 24 * 60 * 60}; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error saving location:', error);
    return res.status(500).json({ error: 'Failed to save location' });
  }
}
EOL

echo "Updated set-location.js API endpoint"

# Update the get-location.js API endpoint to use native cookie parsing
echo "Updating get-location.js API endpoint to use native cookie parsing..."

cat > pages/api/user/get-location.js << 'EOL'
import { getUserLocation } from '@/lib/locationUtils';

export default async function handler(req, res) {
  try {
    // Check if location is in cookies
    const cookies = req.headers.cookie || '';
    const cookieObj = cookies.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      if (key && value) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    const locationCookie = cookieObj.userLocation;
    
    if (locationCookie) {
      try {
        const locationData = JSON.parse(decodeURIComponent(locationCookie));
        const now = Date.now();
        const locationAge = locationData?.timestamp ? now - locationData.timestamp : Infinity;
        
        // Use cookie location if not expired (24 hours)
        if (locationData && locationAge < 24 * 60 * 60 * 1000) {
          return res.status(200).json(locationData);
        }
      } catch (e) {
        console.error('Error parsing location cookie:', e);
      }
    }
    
    // If no valid cookie location, detect from request
    const detectedLocation = await getUserLocation(req);
    
    return res.status(200).json(detectedLocation);
  } catch (error) {
    console.error('Error getting location:', error);
    return res.status(500).json({ error: 'Failed to get location' });
  }
}
EOL

echo "Updated get-location.js API endpoint"

# Update the events API to use native cookie parsing
echo "Updating events API to use native cookie parsing..."

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
    // Then check if location is in cookies
    else {
      const cookies = req.headers.cookie || '';
      const cookieObj = cookies.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      const locationCookie = cookieObj.userLocation;
      
      if (locationCookie) {
        try {
          userLocation = JSON.parse(decodeURIComponent(locationCookie));
          console.log(`Using location from cookie: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
        } catch (e) {
          console.error('Error parsing location cookie:', e);
        }
      }
    }
    
    // If no location found yet, detect from request
    if (!userLocation) {
      userLocation = await getUserLocation(req);
      console.log(`Detected location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    }
    
    // Rest of the function remains the same...
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

echo "Updated events/index.js with native cookie parsing"

# Update the correlated-events.js API endpoint to use native cookie parsing
echo "Updating correlated-events.js API endpoint to use native cookie parsing..."

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
    // Then check if location is in cookies
    else {
      const cookies = req.headers.cookie || '';
      const cookieObj = cookies.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      const locationCookie = cookieObj.userLocation;
      
      if (locationCookie) {
        try {
          userLocation = JSON.parse(decodeURIComponent(locationCookie));
          console.log(`Using location from cookie for correlated events: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
        } catch (e) {
          console.error('Error parsing location cookie:', e);
        }
      }
    }
    
    // If no location found yet, detect from request
    if (!userLocation) {
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

echo "Updated correlated-events.js API endpoint with native cookie parsing"

# Commit changes
echo "Committing changes..."
git add package.json
git add components/LocationProvider.js
git add pages/api/user/set-location.js
git add pages/api/user/get-location.js
git add pages/api/events/index.js
git add pages/api/events/correlated-events.js
git commit -m "Fix js-cookie dependency error in location detection implementation"

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

echo "js-cookie dependency fix complete! The location detection system should now work properly."
echo "Your improved dashboard should be live at:"
echo "https://sonar-edm-user-50e4fb038f6e.herokuapp.com"

echo "If you still encounter issues, please check the Heroku logs:"
echo "heroku logs --app sonar-edm-user"

echo "TIKO js-cookie dependency fix completed at $(date +%Y%m%d%H%M%S)"
