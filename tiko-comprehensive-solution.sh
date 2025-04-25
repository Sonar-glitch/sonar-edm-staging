#!/bin/bash

# TIKO Platform Comprehensive Solution Script
# This script addresses all identified issues:
# 1. Ticketmaster API integration with proper location parameters
# 2. User flow to ensure dashboard is the first landing page after login
# 3. Event clicking functionality to open ticket links
# 4. Event pagination and "View All Events" button functionality
# 5. Location detection with Toronto override
# Created: April 25, 2025

echo "Starting TIKO comprehensive solution at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Create a backup of the current state
echo "Creating backup of current state..."
BACKUP_DIR="./backups/$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup files we're going to modify
echo "Creating backups of files to be modified..."
mkdir -p "$BACKUP_DIR/pages/api/auth"
mkdir -p "$BACKUP_DIR/pages/api/events"
mkdir -p "$BACKUP_DIR/pages/api/spotify"
mkdir -p "$BACKUP_DIR/pages/users"
mkdir -p "$BACKUP_DIR/components"
mkdir -p "$BACKUP_DIR/lib"
mkdir -p "$BACKUP_DIR/styles"

# Backup key files
cp -f pages/_app.js "$BACKUP_DIR/pages/" 2>/dev/null || echo "Warning: Could not backup _app.js"
cp -f pages/index.js "$BACKUP_DIR/pages/" 2>/dev/null || echo "Warning: Could not backup index.js"
cp -f pages/dashboard.js "$BACKUP_DIR/pages/" 2>/dev/null || echo "Warning: Could not backup dashboard.js"
cp -f pages/users/music-taste.js "$BACKUP_DIR/pages/users/" 2>/dev/null || echo "Warning: Could not backup music-taste.js"
cp -f pages/api/auth/[...nextauth].js "$BACKUP_DIR/pages/api/auth/" 2>/dev/null || echo "Warning: Could not backup [...nextauth].js"
cp -f pages/api/events/index.js "$BACKUP_DIR/pages/api/events/" 2>/dev/null || echo "Warning: Could not backup events/index.js"
cp -f pages/api/events/correlated-events.js "$BACKUP_DIR/pages/api/events/" 2>/dev/null || echo "Warning: Could not backup correlated-events.js"
cp -f pages/api/spotify/user-taste.js "$BACKUP_DIR/pages/api/spotify/" 2>/dev/null || echo "Warning: Could not backup user-taste.js"
cp -f components/EnhancedEventList.js "$BACKUP_DIR/components/" 2>/dev/null || echo "Warning: Could not backup EnhancedEventList.js"

echo "Backups created successfully at $BACKUP_DIR"

# 1. Fix authentication flow to ensure dashboard is landing page
echo "Fixing authentication flow to ensure dashboard is landing page..."

# Update _app.js to handle authentication and routing
cat > pages/_app.js << 'EOL'
import { SessionProvider, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import "../styles/globals.css";

// Component to handle protected routes and redirects
function Auth({ children, requiredAuth }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isUser = !!session?.user;
  const loading = status === "loading";
  const currentPath = router.pathname;

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // If authentication is required but user is not logged in, redirect to login
    if (requiredAuth && !loading && !isUser) {
      router.push("/");
      return;
    }

    // If user is logged in and on the root path, redirect to dashboard
    if (isUser && currentPath === "/") {
      router.push("/dashboard");
      return;
    }

    // If user is logged in and on the music-taste path, allow access
    if (isUser && currentPath.includes("/users/music-taste")) {
      return;
    }

    // If user is logged in and on any other path, allow access
    if (isUser) {
      return;
    }
  }, [isUser, loading, requiredAuth, router, currentPath]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If authentication is required and user is not logged in, show nothing
  if (requiredAuth && !isUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If we get here, show the page
  return children;
}

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  // Check if the page requires authentication
  const requiredAuth = Component.auth?.requiredAuth;

  return (
    <SessionProvider session={session}>
      {requiredAuth ? (
        <Auth requiredAuth={requiredAuth}>
          <Component {...pageProps} />
        </Auth>
      ) : (
        <Component {...pageProps} />
      )}
    </SessionProvider>
  );
}

export default MyApp;
EOL

# Update index.js to redirect to dashboard if logged in
cat > pages/index.js << 'EOL'
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // If user is logged in, redirect to dashboard
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  // If loading, show loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-black">
        <div className="w-12 h-12 border-t-4 border-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in, show login page
  return (
    <div className="min-h-screen bg-black text-white">
      <Head>
        <title>TIKO - Electronic Music Events</title>
      </Head>

      <main className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl font-bold text-cyan-500 mb-8">TIKO</h1>
        <p className="text-xl mb-8 text-center">Discover electronic music events that match your taste</p>
        
        <Link href="/api/auth/signin/spotify" className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-fuchsia-500 rounded-full font-medium hover:opacity-90 transition-opacity">
          Login with Spotify
        </Link>
      </main>
    </div>
  );
}
EOL

# Update NextAuth configuration to redirect to dashboard after login
mkdir -p pages/api/auth
cat > pages/api/auth/\[...nextauth\].js << 'EOL'
import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

export default NextAuth({
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
      authorization: {
        params: {
          scope: "user-read-email user-top-read user-read-recently-played user-read-private"
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account && profile) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
        token.profile = profile;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to dashboard after login
      return `${baseUrl}/dashboard`;
    }
  },
  pages: {
    signIn: "/",
    error: "/"
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development"
});
EOL

# 2. Fix Spotify authentication issues in user-taste.js
echo "Fixing Spotify authentication issues in user-taste.js..."

mkdir -p pages/api/spotify
cat > pages/api/spotify/user-taste.js << 'EOL'
// pages/api/spotify/user-taste.js - Fixed version with improved token handling

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  getTopArtists,
  getTopTracks,
  getAudioFeaturesForTracks,
  refreshAccessToken
} from "@/lib/spotify";
import { getTopGenres, getSeasonalMood } from "@/lib/moodUtils";

// Fallback data for when Spotify API is unavailable
const FALLBACK_DATA = {
  artists: {
    items: [
      {
        id: "fallback-artist-1",
        name: "Boris Brejcha",
        genres: ["melodic techno", "minimal techno"],
        images: [{ url: "/placeholder-artist.jpg" }]
      },
      {
        id: "fallback-artist-2",
        name: "Mathame",
        genres: ["tech house", "melodic house"],
        images: [{ url: "/placeholder-artist.jpg" }]
      }
    ]
  },
  tracks: {
    items: [
      {
        id: "fallback-track-1",
        name: "Realm of Consciousness",
        artists: [{ name: "Boris Brejcha" }]
      }
    ]
  },
  mood: "Late-Night Melodic Wave",
  genreProfile: {
    "Melodic Techno": 75,
    "Progressive House": 60, 
    "Dark Techno": 45,
    "Organic Grooves": 55
  }
};

export default async function handler(req, res) {
  try {
    // Get session and token
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      console.log("No session found, returning 401");
      return res.status(401).json({ error: "Not authenticated" });
    }

    let token = session.accessToken;
    
    if (!token) {
      console.log("Missing access token in session");
      return res.status(401).json({ error: "No access token available" });
    }

    // Check if token is expired and refresh if needed
    if (session.expires && new Date(session.expires) < new Date()) {
      console.log("Token expired, attempting to refresh...");
      try {
        const refreshedSession = await refreshAccessToken(session);
        if (refreshedSession && refreshedSession.accessToken) {
          token = refreshedSession.accessToken;
          console.log("Token refreshed successfully");
        } else {
          console.log("Token refresh failed");
          return res.status(401).json({ error: "Authentication expired" });
        }
      } catch (refreshError) {
        console.error("Error refreshing token:", refreshError);
        return res.status(401).json({ error: "Authentication refresh failed" });
      }
    }

    try {
      // Attempt to fetch data from Spotify
      console.log("Fetching data from Spotify API...");
      const [topArtists, topTracks] = await Promise.all([
        getTopArtists(token),
        getTopTracks(token)
      ]);

      // Extract track IDs
      const trackIds = topTracks?.items?.map(track => track.id).slice(0, 10) || [];
      
      // Attempt to get audio features only if we have track IDs
      let audioFeatures = null;
      if (trackIds.length > 0) {
        try {
          const featuresResponse = await getAudioFeaturesForTracks(token, trackIds);
          audioFeatures = featuresResponse.audio_features;
        } catch (error) {
          console.log("Error fetching audio features:", error.message);
          // Continue without audio features
        }
      }

      // Generate genre profile from artists data
      const genreProfile = topArtists?.items?.length > 0 
        ? getTopGenres(topArtists.items)
        : FALLBACK_DATA.genreProfile;

      // Determine mood from audio features
      const mood = audioFeatures
        ? getSeasonalMood(audioFeatures)
        : FALLBACK_DATA.mood;

      // Return the complete data
      console.log("Successfully fetched user taste data from Spotify");
      return res.status(200).json({
        artists: topArtists,
        tracks: topTracks,
        audioFeatures,
        mood,
        genreProfile
      });
    } catch (error) {
      console.error("Spotify API Failure:", error);
      
      // Check for specific error types
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          console.log("Authentication error with Spotify API");
          return res.status(401).json({ error: "Spotify authentication failed" });
        }
      }
      
      // For other errors, return fallback data with 200 status
      console.log("Using fallback data due to API error");
      return res.status(200).json(FALLBACK_DATA);
    }
  } catch (error) {
    console.error("Unhandled error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
EOL

# 3. Fix Ticketmaster API integration with proper location parameters
echo "Fixing Ticketmaster API integration with proper location parameters..."

# Create location utilities
mkdir -p lib
cat > lib/locationUtils.js << 'EOL'
/**
 * Location utility functions for TIKO platform
 * With Toronto override for Canadian users
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
            
            // Check if user is in Canada, if so use Toronto as default
            if (locationInfo.country === "Canada") {
              console.log("Canadian user detected, using Toronto as default location");
              resolve(TORONTO_COORDINATES);
              return;
            }
            
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
      
      // Check if user is in Canada
      if (data.address && data.address.country === "Canada") {
        return TORONTO_COORDINATES;
      }
      
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
      
      // Check if user is in Canada, if so use Toronto as default
      if (data && data.country_name === "Canada") {
        console.log("Canadian IP detected, using Toronto as default location");
        return TORONTO_COORDINATES;
      }
      
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
    // Default to Toronto for any errors
    return TORONTO_COORDINATES;
  }
}

/**
 * Get user location from query parameters
 * @param {Object} query - Query parameters
 * @returns {Object|null} User location object with coordinates or null
 */
export function getUserLocationFromQuery(query) {
  // Check for Toronto override
  if (query?.city?.toLowerCase() === "toronto" || query?.location?.toLowerCase() === "toronto") {
    return TORONTO_COORDINATES;
  }
  
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
    // First check for Toronto override in cookies or headers
    if (req?.headers?.cookie && req.headers.cookie.includes('location=toronto')) {
      console.log("Toronto override detected in cookies");
      return TORONTO_COORDINATES;
    }
    
    // Then try to get location from query parameters
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
    
    // If all else fails, return Toronto coordinates
    console.log("Using Toronto coordinates as default");
    return TORONTO_COORDINATES;
  } catch (error) {
    console.error("Error in getUserLocation:", error);
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

export default {
  getUserLocation,
  getUserLocationFromBrowser,
  getUserLocationFromIP,
  getUserLocationFromQuery,
  getDistance,
  TORONTO_COORDINATES,
  DEFAULT_COORDINATES
};
EOL

# Update events API to fix location parameters
mkdir -p pages/api/events
cat > pages/api/events/index.js << 'EOL'
import axios from 'axios';
import { getUserLocation } from '@/lib/locationUtils';
import { getCachedData, cacheData } from '@/lib/cache';

// Default Toronto coordinates
const DEFAULT_LAT = 43.6532;
const DEFAULT_LON = -79.3832;

export default async function handler(req, res) {
  console.log('Starting Events API handler');
  
  // Check if API keys are available
  const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
  const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
  
  console.log(`Using Ticketmaster API key: ${ticketmasterApiKey ? 'Available' : 'Missing'}`);
  console.log(`Using EDMtrain API key: ${edmtrainApiKey ? 'Available' : 'Missing'}`);
  
  // Get user location
  let userLocation;
  try {
    userLocation = await getUserLocation(req);
    console.log(`User location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
  } catch (locationError) {
    console.error('Error getting user location:', locationError);
    userLocation = {
      latitude: DEFAULT_LAT,
      longitude: DEFAULT_LON,
      city: 'Toronto',
      region: 'ON',
      country: 'Canada'
    };
  }
  
  // Ensure location coordinates are valid numbers
  if (isNaN(parseFloat(userLocation.latitude)) || isNaN(parseFloat(userLocation.longitude))) {
    console.log('Invalid location coordinates, using defaults');
    userLocation.latitude = DEFAULT_LAT;
    userLocation.longitude = DEFAULT_LON;
  }
  
  // Try to get cached events first
  const cacheKey = 'events/all';
  const cacheParams = { 
    lat: userLocation.latitude,
    lon: userLocation.longitude
  };
  
  const cachedEvents = await getCachedData(cacheKey, cacheParams);
  
  if (cachedEvents) {
    console.log('Using cached events data');
    return res.status(200).json({
      success: true,
      events: cachedEvents,
      userLocation,
      source: 'cache'
    });
  }
  
  // Arrays to store events from different sources
  let ticketmasterEvents = [];
  let edmtrainEvents = [];
  let ticketmasterError = null;
  let edmtrainError = null;
  
  // Fetch events from Ticketmaster
  if (ticketmasterApiKey) {
    try {
      // Check for cached Ticketmaster events
      const cachedTicketmasterEvents = await getCachedData('ticketmaster/events', {
        lat: userLocation.latitude,
        lon: userLocation.longitude
      });
      
      if (cachedTicketmasterEvents) {
        console.log('Using cached Ticketmaster events');
        ticketmasterEvents = cachedTicketmasterEvents;
      } else {
        console.log('Fetching events from Ticketmaster API...');
        
        // Prepare parameters for Ticketmaster API
        const params = {
          apikey: ticketmasterApiKey,
          classificationName: 'music',
          genreId: 'KnvZfZ7vAvF', // Electronic music genre ID
          size: 50, // Number of events to return
          sort: 'date,asc',
          startDateTime: new Date().toISOString().slice(0, 19) + 'Z' // Current date in ISO format
        };
        
        // Add location filter if available
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          params.latlong = `${userLocation.latitude},${userLocation.longitude}`;
          params.radius = '100'; // 100 mile radius
          params.unit = 'miles';
          console.log(`Adding location filter: ${params.latlong}, radius: ${params.radius} miles`);
        } else {
          console.log('No valid location data available, skipping location filter');
        }
        
        const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
          params,
          timeout: 15000 // 15 second timeout
        });
        
        if (response.data._embedded && response.data._embedded.events) {
          ticketmasterEvents = response.data._embedded.events;
          
          // Cache Ticketmaster events for 12 hours (43200 seconds)
          await cacheData('ticketmaster/events', {
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, ticketmasterEvents, 43200);
          
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster API`);
        } else {
          console.log('No events found in Ticketmaster response');
        }
      }
    } catch (error) {
      console.error('Ticketmaster API request failed:', error.message);
      ticketmasterError = error.message;
      
      // Retry with simpler query
      console.log('Retrying with simpler query after error...');
      try {
        const retryParams = {
          apikey: ticketmasterApiKey,
          keyword: 'electronic',
          size: 50,
          sort: 'date,asc',
          startDateTime: new Date().toISOString().slice(0, 19) + 'Z'
        };
        
        // Only add location if we have valid coordinates
        if (userLocation && userLocation.latitude && userLocation.longitude) {
          retryParams.latlong = `${userLocation.latitude},${userLocation.longitude}`;
          retryParams.radius = '100';
          retryParams.unit = 'miles';
        }
        
        console.log('Ticketmaster retry params:', JSON.stringify(retryParams));
        
        const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
          params: retryParams,
          timeout: 15000
        });
        
        if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
          ticketmasterEvents = retryResponse.data._embedded.events;
          
          // Cache Ticketmaster events for 12 hours (43200 seconds)
          await cacheData('ticketmaster/events', {
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, ticketmasterEvents, 43200);
          
          console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry after error`);
          ticketmasterError = null;
        } else {
          console.log('No events found in Ticketmaster retry response after error');
        }
      } catch (retryError) {
        console.error('Ticketmaster retry also failed:', retryError.message);
        ticketmasterError = `${error.message} (retry also failed: ${retryError.message})`;
      }
    }
  } else {
    console.log('Skipping Ticketmaster API due to missing API key');
  }
  
  // Fetch events from EDMtrain
  if (edmtrainApiKey) {
    try {
      // Check for cached EDMtrain events
      const cachedEdmtrainEvents = await getCachedData('edmtrain/events', {
        lat: userLocation.latitude,
        lon: userLocation.longitude
      });
      
      if (cachedEdmtrainEvents) {
        console.log('Using cached EDMtrain events');
        edmtrainEvents = cachedEdmtrainEvents;
      } else {
        console.log('Fetching events from EDMtrain API...');
        
        // Prepare parameters for EDMtrain API
        const params = {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          radius: 100 // 100 mile radius
        };
        
        const response = await axios.get('https://edmtrain.com/api/events', { 
          params,
          headers: {
            'Authorization': edmtrainApiKey
          },
          timeout: 15000 // 15 second timeout
        });
        
        if (response.data && response.data.data) {
          edmtrainEvents = response.data.data;
          
          // Cache EDMtrain events for 12 hours (43200 seconds)
          await cacheData('edmtrain/events', {
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, edmtrainEvents, 43200);
          
          console.log(`Found ${edmtrainEvents.length} events from EDMtrain API`);
        } else {
          console.log('No events found in EDMtrain response');
        }
      }
    } catch (error) {
      console.error('EDMtrain API request failed:', error.message);
      edmtrainError = error.message;
    }
  } else {
    console.log('Skipping EDMtrain API due to missing API key');
  }
  
  // Process Ticketmaster events
  const processedTicketmasterEvents = ticketmasterEvents.map(event => {
    // Extract venue information
    const venue = event._embedded?.venues?.[0] || {};
    const venueLocation = venue.location ? {
      latitude: parseFloat(venue.location.latitude),
      longitude: parseFloat(venue.location.longitude)
    } : null;
    
    // Extract artist information
    const artists = event._embedded?.attractions?.map(attraction => attraction.name) || [];
    
    // Extract genre information
    const genres = event.classifications?.map(classification => 
      classification.genre?.name || classification.subGenre?.name || 'Electronic'
    ).filter(Boolean) || ['Electronic'];
    
    // Extract ticket information
    const ticketUrl = event.url || null;
    
    // Extract image
    const image = event.images?.find(img => img.ratio === '16_9' && img.width > 500)?.url || 
                 event.images?.[0]?.url || null;
    
    return {
      id: event.id,
      name: event.name,
      date: event.dates?.start?.dateTime || null,
      venue: venue.name || 'Unknown Venue',
      venueType: getVenueType(venue.name, event.name),
      address: formatAddress(venue),
      headliners: artists,
      genres,
      ticketUrl,
      image,
      location: venueLocation,
      source: 'ticketmaster'
    };
  });
  
  // Process EDMtrain events
  const processedEdmtrainEvents = edmtrainEvents.map(event => {
    // Extract venue information
    const venue = event.venue || {};
    const venueLocation = venue.latitude && venue.longitude ? {
      latitude: venue.latitude,
      longitude: venue.longitude
    } : null;
    
    // Extract artist information
    const artists = event.artistList?.map(artist => artist.name) || [];
    
    return {
      id: `edmtrain-${event.id}`,
      name: event.name || artists.join(', '),
      date: event.date,
      venue: venue.name || 'Unknown Venue',
      venueType: getVenueType(venue.name, event.name),
      address: venue.address ? `${venue.address}, ${venue.city}, ${venue.state}` : null,
      headliners: artists,
      genres: ['Electronic'], // EDMtrain doesn't provide genre information
      ticketUrl: event.ticketLink || null,
      image: null, // EDMtrain doesn't provide images
      location: venueLocation,
      source: 'edmtrain'
    };
  });
  
  // Combine events from all sources
  let allEvents = [...processedTicketmasterEvents, ...processedEdmtrainEvents];
  
  // If we have no events, add Toronto-specific sample events
  if (allEvents.length === 0) {
    console.log('No events found from APIs, adding sample events');
    
    // Check if user is near Toronto
    const isNearToronto = userLocation.city === 'Toronto' || 
                          userLocation.country === 'Canada' ||
                          (userLocation.latitude > 42 && userLocation.latitude < 45 && 
                           userLocation.longitude > -81 && userLocation.longitude < -78);
    
    // Add sample events based on location
    if (isNearToronto) {
      allEvents = getTorontoSampleEvents();
    } else {
      allEvents = getGenericSampleEvents(userLocation);
    }
  }
  
  // Sort events by date
  allEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Cache the combined events for 12 hours (43200 seconds)
  await cacheData(cacheKey, cacheParams, allEvents, 43200);
  
  // Return the events
  return res.status(200).json({
    success: true,
    events: allEvents,
    userLocation,
    errors: {
      ticketmaster: ticketmasterError,
      edmtrain: edmtrainError
    },
    source: 'api'
  });
}

/**
 * Format venue address
 * @param {Object} venue - Venue object from Ticketmaster API
 * @returns {string|null} Formatted address or null
 */
function formatAddress(venue) {
  if (!venue) return null;
  
  const addressLine = venue.address?.line1;
  const city = venue.city?.name;
  const state = venue.state?.stateCode || venue.state?.name;
  
  if (!addressLine && !city && !state) return null;
  
  let address = '';
  
  if (addressLine) address += addressLine;
  if (city) {
    if (address) address += ', ';
    address += city;
  }
  if (state) {
    if (address) address += ', ';
    address += state;
  }
  
  return address;
}

/**
 * Determine venue type based on venue name and event name
 * @param {string} venueName - Name of the venue
 * @param {string} eventName - Name of the event
 * @returns {string} Venue type (Club, Warehouse, Festival, Rooftop, Other)
 */
function getVenueType(venueName, eventName) {
  if (!venueName && !eventName) return 'Other';
  
  const venueNameLower = (venueName || '').toLowerCase();
  const eventNameLower = (eventName || '').toLowerCase();
  
  // Check for festival
  if (eventNameLower.includes('festival') || 
      eventNameLower.includes('fest') || 
      venueNameLower.includes('festival') ||
      venueNameLower.includes('grounds')) {
    return 'Festival';
  }
  
  // Check for warehouse
  if (venueNameLower.includes('warehouse') || 
      venueNameLower.includes('factory') || 
      eventNameLower.includes('warehouse')) {
    return 'Warehouse';
  }
  
  // Check for rooftop
  if (venueNameLower.includes('rooftop') || 
      venueNameLower.includes('terrace') || 
      eventNameLower.includes('rooftop')) {
    return 'Rooftop';
  }
  
  // Check for club
  if (venueNameLower.includes('club') || 
      venueNameLower.includes('lounge') || 
      venueNameLower.includes('bar') ||
      venueNameLower.includes('hall')) {
    return 'Club';
  }
  
  // Default to Other
  return 'Other';
}

/**
 * Get sample events for Toronto
 * @returns {Array} Array of sample events
 */
function getTorontoSampleEvents() {
  const now = new Date();
  
  return [
    {
      id: 'sample-toronto-1',
      name: 'Techno Warehouse Night',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'REBEL',
      venueType: 'Club',
      address: '11 Polson St, Toronto, ON, Canada',
      headliners: ['Charlotte de Witte', 'Amelie Lens', 'FJAAK'],
      genres: ['Techno', 'Hard Techno'],
      ticketUrl: 'https://www.ticketmaster.ca/rebel-tickets-toronto/venue/132037',
      image: null,
      location: {
        latitude: 43.6442,
        longitude: -79.3551
      },
      source: 'sample'
    },
    {
      id: 'sample-toronto-2',
      name: 'Melodic Techno Night',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'CODA',
      venueType: 'Club',
      address: '794 Bathurst St, Toronto, ON, Canada',
      headliners: ['Tale Of Us', 'Mind Against', 'Mathame'],
      genres: ['Melodic Techno', 'Progressive House'],
      ticketUrl: 'https://codatoronto.electrostub.com/events/',
      image: null,
      location: {
        latitude: 43.6651,
        longitude: -79.4111
      },
      source: 'sample'
    },
    {
      id: 'sample-toronto-3',
      name: 'Summer House Festival',
      date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'The Danforth Music Hall',
      venueType: 'Festival',
      address: '147 Danforth Ave, Toronto, ON, Canada',
      headliners: ['Disclosure', 'Kaytranada', 'The Blessed Madonna'],
      genres: ['House', 'Tech House'],
      ticketUrl: 'https://www.ticketmaster.ca/the-danforth-music-hall-tickets-toronto/venue/131326',
      image: null,
      location: {
        latitude: 43.6765,
        longitude: -79.3531
      },
      source: 'sample'
    },
    {
      id: 'sample-toronto-4',
      name: 'Progressive Dreams',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Velvet Underground',
      venueType: 'Club',
      address: '508 Queen St W, Toronto, ON, Canada',
      headliners: ['Hernan Cattaneo', 'Nick Warren', 'Guy J'],
      genres: ['Progressive House', 'Deep House'],
      ticketUrl: 'https://www.ticketweb.ca/venue/velvet-underground-toronto-on/23681',
      image: null,
      location: {
        latitude: 43.6481,
        longitude: -79.3998
      },
      source: 'sample'
    }
  ];
}

/**
 * Get generic sample events based on user location
 * @param {Object} userLocation - User location object
 * @returns {Array} Array of sample events
 */
function getGenericSampleEvents(userLocation) {
  const now = new Date();
  
  // Create events with locations near the user
  return [
    {
      id: 'sample-1',
      name: 'Techno Warehouse Night',
      date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'The Underground',
      venueType: 'Warehouse',
      address: `123 Industrial Ave, ${userLocation.city || 'Downtown'}, ${userLocation.region || ''}`,
      headliners: ['Charlotte de Witte', 'Amelie Lens', 'FJAAK'],
      genres: ['Techno', 'Hard Techno'],
      ticketUrl: 'https://www.ticketmaster.com/event/sample1',
      image: null,
      location: {
        latitude: userLocation.latitude + 0.02,
        longitude: userLocation.longitude - 0.01
      },
      source: 'sample'
    },
    {
      id: 'sample-2',
      name: 'Summer House Festival',
      date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Sunset Park',
      venueType: 'Festival',
      address: `456 Parkway Dr, ${userLocation.city || 'Downtown'}, ${userLocation.region || ''}`,
      headliners: ['Disclosure', 'Kaytranada', 'The Blessed Madonna'],
      genres: ['House', 'Tech House'],
      ticketUrl: 'https://www.ticketmaster.com/event/sample2',
      image: null,
      location: {
        latitude: userLocation.latitude - 0.03,
        longitude: userLocation.longitude + 0.02
      },
      source: 'sample'
    },
    {
      id: 'sample-3',
      name: 'Progressive Dreams',
      date: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'Club Horizon',
      venueType: 'Club',
      address: `789 Downtown Blvd, ${userLocation.city || 'Downtown'}, ${userLocation.region || ''}`,
      headliners: ['Hernan Cattaneo', 'Nick Warren', 'Guy J'],
      genres: ['Progressive House', 'Deep House'],
      ticketUrl: 'https://www.ticketmaster.com/event/sample3',
      image: null,
      location: {
        latitude: userLocation.latitude + 0.01,
        longitude: userLocation.longitude + 0.01
      },
      source: 'sample'
    },
    {
      id: 'sample-4',
      name: 'Melodic Techno Night',
      date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      venue: 'The Loft',
      venueType: 'Rooftop',
      address: `101 Skyline Ave, ${userLocation.city || 'Downtown'}, ${userLocation.region || ''}`,
      headliners: ['Tale Of Us', 'Mind Against', 'Mathame'],
      genres: ['Melodic Techno', 'Progressive House'],
      ticketUrl: 'https://www.ticketmaster.com/event/sample4',
      image: null,
      location: {
        latitude: userLocation.latitude - 0.02,
        longitude: userLocation.longitude - 0.02
      },
      source: 'sample'
    }
  ];
}
EOL

# 4. Fix event clicking functionality to open ticket links
echo "Fixing event clicking functionality to open ticket links..."

# Update EnhancedEventList component
mkdir -p components
cat > components/EnhancedEventList.js << 'EOL'
import React, { useState } from 'react';
import styles from '@/styles/EnhancedEventList.module.css';

export default function EnhancedEventList({ events, loading, error }) {
  const [visibleEvents, setVisibleEvents] = useState(4);
  
  // Handle click on event card
  const handleEventClick = (event) => {
    if (event.ticketUrl) {
      window.open(event.ticketUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('No ticket link available for this event');
    }
  };
  
  // Show more events
  const handleShowMore = () => {
    setVisibleEvents(prev => prev + 8);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Finding events that match your vibe...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // No events state
  if (!events || events.length === 0) {
    return (
      <div className={styles.noEventsContainer}>
        <p>No events found matching your criteria.</p>
        <p>Try adjusting your filters or check back later.</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.eventList}>
        {events.slice(0, visibleEvents).map((event) => (
          <div 
            key={event.id} 
            className={styles.eventCard}
            onClick={() => handleEventClick(event)}
          >
            <div className={styles.eventHeader}>
              <div className={styles.dateBox}>
                <span className={styles.date}>{formatDate(event.date)}</span>
              </div>
              <div className={styles.matchScore}>
                <div 
                  className={styles.matchCircle}
                  style={{
                    background: `conic-gradient(
                      rgba(0, 255, 255, 0.8) ${event.matchScore}%,
                      rgba(0, 255, 255, 0.2) ${event.matchScore}%
                    )`
                  }}
                >
                  <span>{event.matchScore}%</span>
                </div>
              </div>
            </div>
            
            <div className={styles.eventContent}>
              <h3 className={styles.eventName}>{event.name}</h3>
              
              <div className={styles.venueInfo}>
                <span className={styles.venueName}>{event.venue}</span>
                {event.address && (
                  <span className={styles.venueAddress}>{event.address}</span>
                )}
              </div>
              
              <div className={styles.artistList}>
                {event.headliners && event.headliners.map((artist, index) => (
                  <span key={index} className={styles.artist}>
                    {artist}{index < event.headliners.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
            
            <div className={styles.eventFooter}>
              <span className={styles.venueType}>{event.venueType}</span>
              <span className={`${styles.sourceTag} ${event.source === 'sample' ? styles.sampleTag : styles.liveTag}`}>
                {event.source === 'sample' ? 'Sample' : 'Live Data'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {events.length > visibleEvents && (
        <div className={styles.showMoreContainer}>
          <button 
            className={styles.showMoreButton}
            onClick={handleShowMore}
          >
            View All Events
          </button>
        </div>
      )}
    </div>
  );
}
EOL

# Create styles for EnhancedEventList
mkdir -p styles
cat > styles/EnhancedEventList.module.css << 'EOL'
.container {
  margin-top: 2rem;
}

.eventList {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.eventCard {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.1);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.eventCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 255, 255, 0.1);
  border-color: rgba(0, 255, 255, 0.3);
}

.eventHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.2);
}

.dateBox {
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
}

.date {
  font-size: 0.9rem;
  font-weight: 500;
  color: #fff;
}

.matchScore {
  display: flex;
  align-items: center;
}

.matchCircle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  background: conic-gradient(
    rgba(0, 255, 255, 0.8) 75%,
    rgba(0, 255, 255, 0.2) 0%
  );
}

.eventContent {
  padding: 1rem;
}

.eventName {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #fff;
}

.venueInfo {
  margin-bottom: 0.75rem;
}

.venueName {
  display: block;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
}

.venueAddress {
  display: block;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}

.artistList {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
}

.artist {
  display: inline;
}

.eventFooter {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.2);
  font-size: 0.8rem;
}

.venueType {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.sourceTag {
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.liveTag {
  background: rgba(0, 255, 0, 0.1);
  color: rgba(0, 255, 0, 0.8);
}

.sampleTag {
  background: rgba(255, 165, 0, 0.1);
  color: rgba(255, 165, 0, 0.8);
}

.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 0;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid rgba(0, 255, 255, 0.1);
  border-top: 3px solid rgba(0, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.errorContainer {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 0, 0, 0.1);
  border-radius: 0.5rem;
  margin: 2rem 0;
}

.errorMessage {
  color: rgba(255, 100, 100, 0.9);
  margin-bottom: 1rem;
}

.retryButton {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: none;
  padding: 0.5rem 1.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.retryButton:hover {
  background: rgba(255, 255, 255, 0.2);
}

.noEventsContainer {
  text-align: center;
  padding: 3rem 0;
  color: rgba(255, 255, 255, 0.7);
}

.showMoreContainer {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

.showMoreButton {
  background: linear-gradient(90deg, rgba(0, 200, 255, 0.5), rgba(0, 100, 255, 0.5));
  color: #fff;
  border: none;
  padding: 0.75rem 2rem;
  border-radius: 2rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.showMoreButton:hover {
  background: linear-gradient(90deg, rgba(0, 200, 255, 0.7), rgba(0, 100, 255, 0.7));
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .eventList {
    grid-template-columns: 1fr;
  }
}
EOL

# 5. Update dashboard.js to include LocationDisplay
cat > pages/dashboard.js << 'EOL'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SideBySideLayout from '@/components/SideBySideLayout';
import CompactSoundCharacteristics from '@/components/CompactSoundCharacteristics';
import CompactSeasonalVibes from '@/components/CompactSeasonalVibes';
import EnhancedEventList from '@/components/EnhancedEventList';
import MobileOptimizedVibeQuiz from '@/components/MobileOptimizedVibeQuiz';
import LocationDisplay from '@/components/LocationDisplay';
import styles from '@/styles/Dashboard.module.css';

// Set auth requirement for this page
Dashboard.auth = {
  requiredAuth: true
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);
  const [vibeMatchFilter, setVibeMatchFilter] = useState(70);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);

  // Fetch user profile and events when session is available
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchUserProfile();
      fetchUserLocation();
      fetchEvents();
    } else if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch user location
  const fetchUserLocation = async () => {
    try {
      const response = await fetch('/api/user/get-location');
      if (response.ok) {
        const data = await response.json();
        setUserLocation(data);
      } else {
        // If API fails, try browser geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                city: 'Your Location',
                region: '',
                country: ''
              });
            },
            (error) => {
              console.error('Geolocation error:', error);
              // Default to Toronto
              setUserLocation({
                latitude: 43.6532,
                longitude: -79.3832,
                city: 'Toronto',
                region: 'ON',
                country: 'Canada'
              });
            }
          );
        } else {
          // Default to Toronto if geolocation not available
          setUserLocation({
            latitude: 43.6532,
            longitude: -79.3832,
            city: 'Toronto',
            region: 'ON',
            country: 'Canada'
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user location:', err);
      // Default to Toronto
      setUserLocation({
        latitude: 43.6532,
        longitude: -79.3832,
        city: 'Toronto',
        region: 'ON',
        country: 'Canada'
      });
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/spotify/user-taste');
      if (response.ok) {
        const data = await response.json();
        
        // Transform data into the format expected by the components
        const transformedProfile = {
          name: session?.user?.name || 'EDM Enthusiast',
          soundCharacteristics: [
            { name: 'Melody', value: calculateCharacteristic(data, 'melody', 85) },
            { name: 'Danceability', value: calculateCharacteristic(data, 'danceability', 75) },
            { name: 'Energy', value: calculateCharacteristic(data, 'energy', 65) },
            { name: 'Tempo', value: calculateCharacteristic(data, 'tempo', 60) },
            { name: 'Obscurity', value: calculateCharacteristic(data, 'obscurity', 55) }
          ],
          seasonalVibes: {
            yearRound: {
              text: 'Your taste evolves from deep house vibes in winter to high-energy techno in summer, with a consistent appreciation for melodic elements year-round.'
            },
            seasons: [
              {
                name: 'Spring',
                current: getCurrentSeason() === 'spring',
                vibe: 'House, Progressive',
                description: 'Fresh beats & uplifting vibes',
                icon: '🌸'
              },
              {
                name: 'Summer',
                current: getCurrentSeason() === 'summer',
                vibe: 'Techno, Tech House',
                description: 'High energy open air sounds',
                icon: '☀️'
              },
              {
                name: 'Fall',
                current: getCurrentSeason() === 'fall',
                vibe: 'Organic House, Downtempo',
                description: 'Mellow grooves & deep beats',
                icon: '🍂'
              },
              {
                name: 'Winter',
                current: getCurrentSeason() === 'winter',
                vibe: 'Deep House, Ambient Techno',
                description: 'Hypnotic journeys & warm basslines',
                icon: '❄️'
              }
            ]
          },
          preferences: {
            genres: Object.keys(data.genreProfile || {}).slice(0, 3),
            mood: ['Melodic', 'Energetic'],
            tempo: ['Medium', 'Building'],
            discovery: ['Underground', 'Emerging'],
            venues: ['Clubs', 'Festivals']
          }
        };
        
        setUserProfile(transformedProfile);
      } else {
        // Use mock data if API fails
        setUserProfile({
          name: session?.user?.name || 'EDM Enthusiast',
          soundCharacteristics: [
            { name: 'Melody', value: 85 },
            { name: 'Danceability', value: 75 },
            { name: 'Energy', value: 65 },
            { name: 'Tempo', value: 60 },
            { name: 'Obscurity', value: 55 }
          ],
          seasonalVibes: {
            yearRound: {
              text: 'Your taste evolves from deep house vibes in winter to high-energy techno in summer, with a consistent appreciation for melodic elements year-round.'
            },
            seasons: [
              {
                name: 'Spring',
                current: getCurrentSeason() === 'spring',
                vibe: 'House, Progressive',
                description: 'Fresh beats & uplifting vibes',
                icon: '🌸'
              },
              {
                name: 'Summer',
                current: getCurrentSeason() === 'summer',
                vibe: 'Techno, Tech House',
                description: 'High energy open air sounds',
                icon: '☀️'
              },
              {
                name: 'Fall',
                current: getCurrentSeason() === 'fall',
                vibe: 'Organic House, Downtempo',
                description: 'Mellow grooves & deep beats',
                icon: '🍂'
              },
              {
                name: 'Winter',
                current: getCurrentSeason() === 'winter',
                vibe: 'Deep House, Ambient Techno',
                description: 'Hypnotic journeys & warm basslines',
                icon: '❄️'
              }
            ]
          },
          preferences: {
            genres: ['House', 'Techno', 'Progressive'],
            mood: ['Melodic', 'Energetic'],
            tempo: ['Medium', 'Building'],
            discovery: ['Underground', 'Emerging'],
            venues: ['Clubs', 'Festivals']
          }
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load your profile. Please try again later.');
    }
  };

  // Calculate sound characteristic value from user taste data
  const calculateCharacteristic = (data, characteristic, defaultValue) => {
    if (!data) return defaultValue;
    
    switch (characteristic) {
      case 'melody':
        // Calculate from audio features if available
        if (data.audioFeatures && data.audioFeatures.length > 0) {
          const avgAcousticness = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.acousticness || 0), 0) / data.audioFeatures.length;
          const avgInstrumentalness = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.instrumentalness || 0), 0) / data.audioFeatures.length;
          return Math.round((avgAcousticness * 50 + avgInstrumentalness * 50) * 100);
        }
        return defaultValue;
        
      case 'danceability':
        // Direct from audio features
        if (data.audioFeatures && data.audioFeatures.length > 0) {
          const avgDanceability = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.danceability || 0), 0) / data.audioFeatures.length;
          return Math.round(avgDanceability * 100);
        }
        return defaultValue;
        
      case 'energy':
        // Direct from audio features
        if (data.audioFeatures && data.audioFeatures.length > 0) {
          const avgEnergy = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.energy || 0), 0) / data.audioFeatures.length;
          return Math.round(avgEnergy * 100);
        }
        return defaultValue;
        
      case 'tempo':
        // Normalize tempo from BPM to 0-100 scale
        if (data.audioFeatures && data.audioFeatures.length > 0) {
          const avgTempo = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.tempo || 120), 0) / data.audioFeatures.length;
          // Map typical EDM tempo range (90-150 BPM) to 0-100
          return Math.round(Math.min(100, Math.max(0, (avgTempo - 90) / (150 - 90) * 100)));
        }
        return defaultValue;
        
      case 'obscurity':
        // Inverse of artist popularity
        if (data.artists && data.artists.items && data.artists.items.length > 0) {
          const avgPopularity = data.artists.items.reduce((sum, artist) => 
            sum + (artist.popularity || 50), 0) / data.artists.items.length;
          // Invert popularity (100 - popularity) to get obscurity
          return Math.round(100 - avgPopularity);
        }
        return defaultValue;
        
      default:
        return defaultValue;
    }
  };

  // Get current season
  function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  // Fetch events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Prepare query parameters
      const params = new URLSearchParams();
      
      // Add location if available
      if (userLocation) {
        params.append('lat', userLocation.latitude);
        params.append('lon', userLocation.longitude);
      }
      
      // Fetch events from API
      const response = await fetch(`/api/events/correlated-events?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.events)) {
          // Filter events based on user preferences
          const filteredEvents = data.events
            .filter(event => event.correlationScore >= vibeMatchFilter)
            .filter(event => eventTypeFilter === 'all' || 
                   (event.venueType && event.venueType.toLowerCase() === eventTypeFilter.toLowerCase()))
            .filter(event => {
              if (distanceFilter === 'all') return true;
              if (!event.distance) return true;
              
              switch (distanceFilter) {
                case 'local':
                  return event.distance <= 25; // Within 25 km
                case 'national':
                  return event.distance > 25 && event.distance <= 500; // 25-500 km
                case 'international':
                  return event.distance > 500; // Over 500 km
                default:
                  return true;
              }
            })
            .sort((a, b) => b.correlationScore - a.correlationScore); // Sort by match score descending
          
          setEvents(filteredEvents);
        } else {
          setError('No events found. Please try again later.');
        }
      } else {
        setError('Failed to load events. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle vibe quiz submission
  const handleVibeQuizSave = async (selections) => {
    try {
      // In a real app, this would be an API call to update the user profile
      console.log('Saving user preferences with higher weightage:', selections);
      
      // Update local state to reflect changes
      setUserProfile(prev => ({
        ...prev,
        preferences: selections
      }));
      
      // Close the quiz
      setShowVibeQuiz(false);
      
      // Refetch events with updated preferences
      fetchEvents();
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Failed to save your preferences. Please try again.');
    }
  };

  // Handle filter changes
  useEffect(() => {
    if (userProfile) {
      fetchEvents();
    }
  }, [vibeMatchFilter, eventTypeFilter, distanceFilter, userLocation]);

  // If loading
  if (status === 'loading' || !userProfile) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.pulseLoader}></div>
        <p>Loading your personalized dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>TIKO | Your Dashboard</title>
        <meta name="description" content="Your personalized electronic music dashboard" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>TIKO</h1>
          <div className={styles.nav}>
            <span className={styles.activeNavItem}>Dashboard</span>
            <span className={styles.navItem} onClick={() => router.push('/users/music-taste')}>Music Taste</span>
            <span className={styles.navItem}>Events</span>
            <span className={styles.navItem}>Profile</span>
          </div>
        </div>
        
        <div className={styles.summary}>
          You're all about <span className={styles.highlight1}>house</span> + <span className={styles.highlight2}>techno</span> with a vibe shift toward <span className={styles.highlight3}>fresh sounds</span>.
        </div>
        
        {/* Location display */}
        {userLocation && <LocationDisplay location={userLocation} />}
        
        {/* Side-by-side layout for sound characteristics and seasonal vibes */}
        <SideBySideLayout>
          <CompactSoundCharacteristics data={userProfile.soundCharacteristics} />
          <CompactSeasonalVibes 
            data={userProfile.seasonalVibes} 
            onFeedbackClick={() => setShowVibeQuiz(true)}
          />
        </SideBySideLayout>
        
        {/* Event filters */}
        <div className={styles.filtersSection}>
          <h3 className={styles.filtersTitle}>Events Matching Your Vibe</h3>
          
          <div className={styles.vibeMatchFilter}>
            <label htmlFor="vibeMatch">Vibe Match: {vibeMatchFilter}%+</label>
            <input
              type="range"
              id="vibeMatch"
              min="0"
              max="100"
              value={vibeMatchFilter}
              onChange={(e) => setVibeMatchFilter(parseInt(e.target.value))}
              className={styles.slider}
            />
          </div>
          
          <div className={styles.moreFiltersToggle}>
            <button 
              className={styles.moreFiltersButton}
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              {showMoreFilters ? 'Hide Filters' : 'More Filters'}
            </button>
          </div>
          
          {showMoreFilters && (
            <div className={styles.additionalFilters}>
              <div className={styles.filterGroup}>
                <label>Event Type:</label>
                <div className={styles.filterOptions}>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'all' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'club' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('club')}
                  >
                    Club
                  </button>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'warehouse' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('warehouse')}
                  >
                    Warehouse
                  </button>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'festival' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('festival')}
                  >
                    Festival
                  </button>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'rooftop' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('rooftop')}
                  >
                    Rooftop
                  </button>
                </div>
              </div>
              
              <div className={styles.filterGroup}>
                <label>Distance:</label>
                <div className={styles.filterOptions}>
                  <button 
                    className={`${styles.filterOption} ${distanceFilter === 'all' ? styles.activeFilter : ''}`}
                    onClick={() => setDistanceFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`${styles.filterOption} ${distanceFilter === 'local' ? styles.activeFilter : ''}`}
                    onClick={() => setDistanceFilter('local')}
                  >
                    Local
                  </button>
                  <button 
                    className={`${styles.filterOption} ${distanceFilter === 'national' ? styles.activeFilter : ''}`}
                    onClick={() => setDistanceFilter('national')}
                  >
                    National
                  </button>
                  <button 
                    className={`${styles.filterOption} ${distanceFilter === 'international' ? styles.activeFilter : ''}`}
                    onClick={() => setDistanceFilter('international')}
                  >
                    International
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced event list */}
        <EnhancedEventList 
          events={events} 
          loading={loading} 
          error={error} 
        />
        
        {/* Mobile-optimized vibe quiz (shown when user clicks "No" on "Did we get it right?") */}
        {showVibeQuiz && (
          <div className={styles.modalOverlay}>
            <MobileOptimizedVibeQuiz 
              onSave={handleVibeQuizSave}
              onClose={() => setShowVibeQuiz(false)}
              initialSelections={userProfile.preferences}
            />
          </div>
        )}
      </div>
    </>
  );
}
EOL

# Create deployment script
echo "Creating deployment script..."

cat > deploy.sh << 'EOL'
#!/bin/bash

# TIKO Platform Deployment Script
# This script commits and deploys the changes to Heroku

echo "Starting deployment at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Commit changes
echo "Committing changes..."
git add .
git commit -m "Comprehensive fix for Ticketmaster API, user flow, and event functionality"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
EOL

chmod +x deploy.sh

echo "Comprehensive solution script created successfully!"
echo "To implement the solution, run this script in your project directory:"
echo "1. Copy this script to /c/sonar/users/sonar-edm-user/"
echo "2. Make it executable: chmod +x tiko-comprehensive-solution.sh"
echo "3. Run it: ./tiko-comprehensive-solution.sh"
echo "4. Deploy the changes: ./deploy.sh"
