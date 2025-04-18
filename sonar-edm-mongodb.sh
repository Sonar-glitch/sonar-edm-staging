#!/bin/bash

# Sonar EDM Platform - MongoDB Caching System Implementation
# This script implements a MongoDB caching system to reduce API calls
# and avoid hitting rate limits.

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform - MongoDB Caching System Implementation ===${NC}"
echo -e "${BLUE}This script will implement a MongoDB caching system to reduce API calls${NC}"
echo -e "${BLUE}and avoid hitting rate limits.${NC}\n"

# Check if we're in the project directory
if [ ! -d "./pages" ] || [ ! -d "./components" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory.${NC}"
  echo -e "${YELLOW}Please navigate to your project directory and run this script again.${NC}"
  exit 1
fi

# Create backup directory
BACKUP_DIR="./backups/mongodb_cache_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR/lib"
mkdir -p "$BACKUP_DIR/pages/api/spotify"
mkdir -p "$BACKUP_DIR/pages/api/events"
mkdir -p "$BACKUP_DIR/pages/api/user"

echo -e "${YELLOW}Creating backups of files to be modified...${NC}"

# Backup files before modification if they exist
[ -f ./pages/api/spotify/user-taste.js ] && cp ./pages/api/spotify/user-taste.js "$BACKUP_DIR/pages/api/spotify/"
[ -f ./pages/api/events/index.js ] && cp ./pages/api/events/index.js "$BACKUP_DIR/pages/api/events/"
[ -f ./pages/api/events/correlated-events.js ] && cp ./pages/api/events/correlated-events.js "$BACKUP_DIR/pages/api/events/"
[ -f ./pages/api/user/update-taste-preferences.js ] && cp ./pages/api/user/update-taste-preferences.js "$BACKUP_DIR/pages/api/user/"

echo -e "${GREEN}Backups created in $BACKUP_DIR${NC}\n"

# Create lib directory for MongoDB utilities
echo -e "${YELLOW}Creating MongoDB utilities...${NC}"
mkdir -p ./lib

# Create MongoDB connection utility
cat > ./lib/mongodb.js << 'EOL'
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!uri) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;
EOL

# Create MongoDB caching utility
cat > ./lib/cache.js << 'EOL'
import clientPromise from './mongodb';

// Cache collection name
const CACHE_COLLECTION = 'apiCache';
const USER_PREFS_COLLECTION = 'userPreferences';

/**
 * Get cached data from MongoDB
 * @param {string} endpoint - API endpoint
 * @param {Object} parameters - Query parameters
 * @returns {Promise<Object|null>} - Cached data or null if not found
 */
export async function getCachedData(endpoint, parameters) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Create a query to find the cached data
    const query = {
      endpoint,
      parameters: JSON.stringify(parameters),
      expiresAt: { $gt: new Date() }
    };
    
    // Find the cached data
    const cachedData = await collection.findOne(query);
    
    if (cachedData) {
      // Update hit count
      await collection.updateOne(
        { _id: cachedData._id },
        { $inc: { hitCount: 1 } }
      );
      
      console.log(`Cache hit for ${endpoint}`);
      return cachedData.response;
    }
    
    console.log(`Cache miss for ${endpoint}`);
    return null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

/**
 * Cache data in MongoDB
 * @param {string} endpoint - API endpoint
 * @param {Object} parameters - Query parameters
 * @param {Object} response - API response
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - Success status
 */
export async function cacheData(endpoint, parameters, response, ttl = 3600) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Create expiration date
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + ttl);
    
    // Create cache document
    const cacheDoc = {
      endpoint,
      parameters: JSON.stringify(parameters),
      response,
      createdAt: new Date(),
      expiresAt,
      hitCount: 0
    };
    
    // Check if cache already exists
    const existingCache = await collection.findOne({
      endpoint,
      parameters: JSON.stringify(parameters)
    });
    
    if (existingCache) {
      // Update existing cache
      await collection.updateOne(
        { _id: existingCache._id },
        { $set: {
          response,
          expiresAt,
          updatedAt: new Date()
        }}
      );
    } else {
      // Insert new cache
      await collection.insertOne(cacheDoc);
    }
    
    console.log(`Cached data for ${endpoint} with TTL ${ttl}s`);
    return true;
  } catch (error) {
    console.error('Error caching data:', error);
    return false;
  }
}

/**
 * Invalidate cached data
 * @param {string} endpoint - API endpoint
 * @param {Object} parameters - Query parameters (optional)
 * @returns {Promise<boolean>} - Success status
 */
export async function invalidateCache(endpoint, parameters = null) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Create query
    const query = { endpoint };
    if (parameters) {
      query.parameters = JSON.stringify(parameters);
    }
    
    // Delete matching cache entries
    const result = await collection.deleteMany(query);
    
    console.log(`Invalidated ${result.deletedCount} cache entries for ${endpoint}`);
    return true;
  } catch (error) {
    console.error('Error invalidating cache:', error);
    return false;
  }
}

/**
 * Get user preferences from MongoDB
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} - User preferences or null if not found
 */
export async function getUserPreferences(userId) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(USER_PREFS_COLLECTION);
    
    // Find user preferences
    const userPrefs = await collection.findOne({ userId });
    
    return userPrefs ? userPrefs.preferences : null;
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return null;
  }
}

/**
 * Save user preferences to MongoDB
 * @param {string} userId - User ID
 * @param {Object} preferences - User preferences
 * @returns {Promise<boolean>} - Success status
 */
export async function saveUserPreferences(userId, preferences) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(USER_PREFS_COLLECTION);
    
    // Check if user preferences already exist
    const existingPrefs = await collection.findOne({ userId });
    
    if (existingPrefs) {
      // Update existing preferences
      await collection.updateOne(
        { userId },
        { $set: {
          preferences,
          updatedAt: new Date()
        }}
      );
    } else {
      // Insert new preferences
      await collection.insertOne({
        userId,
        preferences,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    
    console.log(`Saved preferences for user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error saving user preferences:', error);
    return false;
  }
}

/**
 * Clean up expired cache entries
 * @returns {Promise<number>} - Number of deleted entries
 */
export async function cleanupExpiredCache() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Delete expired cache entries
    const result = await collection.deleteMany({
      expiresAt: { $lt: new Date() }
    });
    
    console.log(`Cleaned up ${result.deletedCount} expired cache entries`);
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired cache:', error);
    return 0;
  }
}
EOL

echo -e "${GREEN}Created MongoDB utilities${NC}\n"

# Update user-taste.js API to use MongoDB caching
echo -e "${YELLOW}Updating user-taste.js API to use MongoDB caching...${NC}"

cat > ./pages/api/spotify/user-taste.js << 'EOL'
import { getSession } from 'next-auth/react';
import axios from 'axios';
import { getCachedData, cacheData } from '../../../lib/cache';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Get user ID for caching
    const userId = session.user.id || session.user.email || 'anonymous';
    
    // Try to get cached data first
    const cacheKey = `spotify/user-taste`;
    const cacheParams = { userId };
    const cachedData = await getCachedData(cacheKey, cacheParams);
    
    if (cachedData) {
      console.log('Using cached user taste data');
      return res.status(200).json(cachedData);
    }
    
    // Get base URL for API calls
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    
    // Get user location for event suggestions
    let userLocation = null;
    try {
      // Try to get cached location data
      const cachedLocation = await getCachedData('ipapi/location', {});
      
      if (cachedLocation) {
        userLocation = cachedLocation;
      } else {
        const ipResponse = await axios.get('https://ipapi.co/json/');
        userLocation = {
          latitude: ipResponse.data.latitude,
          longitude: ipResponse.data.longitude,
          city: ipResponse.data.city,
          region: ipResponse.data.region,
          country: ipResponse.data.country_name
        };
        
        // Cache location data for 24 hours (86400 seconds)
        await cacheData('ipapi/location', {}, userLocation, 86400);
      }
      
      console.log(`User location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
    } catch (error) {
      console.error('Error getting user location:', error.message);
      // Use fallback location
      userLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: "New York",
        region: "NY",
        country: "United States"
      };
      console.log('Using fallback location:', userLocation.city);
    }
    
    // Try to get real Spotify data if available
    let spotifyData = null;
    let usingRealData = false;
    
    if (session.accessToken) {
      try {
        // Check for cached Spotify data
        const cachedSpotify = await getCachedData('spotify/real-data', { userId });
        
        if (cachedSpotify) {
          spotifyData = cachedSpotify;
          usingRealData = true;
        } else {
          // Make parallel requests to Spotify API
          const [topArtistsRes, topTracksRes, userProfileRes] = await Promise.all([
            axios.get('https://api.spotify.com/v1/me/top/artists?limit=10&time_range=medium_term', {
              headers: { Authorization: `Bearer ${session.accessToken}` }
            }),
            axios.get('https://api.spotify.com/v1/me/top/tracks?limit=10&time_range=medium_term', {
              headers: { Authorization: `Bearer ${session.accessToken}` }
            }),
            axios.get('https://api.spotify.com/v1/me', {
              headers: { Authorization: `Bearer ${session.accessToken}` }
            })
          ]);
          
          // Process top artists
          const topArtists = topArtistsRes.data.items.map((artist, index) => ({
            id: artist.id,
            name: artist.name,
            images: artist.images,
            genres: artist.genres,
            popularity: artist.popularity,
            rank: index + 1,
            correlation: 1 - (index * 0.1), // Decreasing correlation based on rank
            similarArtists: [] // Will be populated later
          }));
          
          // Process top tracks
          const topTracks = topTracksRes.data.items.map((track, index) => ({
            id: track.id,
            name: track.name,
            artist: track.artists[0].name,
            image: track.album.images[0]?.url,
            preview: track.preview_url,
            duration_ms: track.duration_ms,
            popularity: track.popularity,
            rank: index + 1
          }));
          
          // Extract genres from top artists
          const genreCounts = {};
          topArtists.forEach(artist => {
            artist.genres.forEach(genre => {
              genreCounts[genre] = (genreCounts[genre] || 0) + 1;
            });
          });
          
          // Convert genre counts to array and sort
          const topGenres = Object.entries(genreCounts)
            .map(([name, count]) => ({
              name,
              value: Math.min(100, Math.round((count / topArtists.length) * 100))
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
          
          // Create seasonal mood data based on genres
          const seasonalMood = {
            winter: { 
              genres: topGenres.slice(0, 2).map(g => g.name), 
              mood: 'Introspective' 
            },
            spring: { 
              genres: topGenres.slice(1, 3).map(g => g.name), 
              mood: 'Uplifting' 
            },
            summer: { 
              genres: topGenres.slice(2, 4).map(g => g.name), 
              mood: 'Energetic' 
            },
            fall: { 
              genres: topGenres.slice(3, 5).map(g => g.name), 
              mood: 'Melancholic' 
            },
            current: getCurrentSeason(),
            currentSeason: {
              name: getCurrentSeason(),
              primaryMood: getCurrentSeason() === 'winter' ? 'Introspective' : 
                          getCurrentSeason() === 'spring' ? 'Uplifting' : 
                          getCurrentSeason() === 'summer' ? 'Energetic' : 'Melancholic',
              topGenres: topGenres.slice(0, 2).map(g => g.name)
            },
            seasons: [
              {
                name: 'Winter',
                primaryMood: 'Introspective',
                topGenres: topGenres.slice(0, 2).map(g => g.name)
              },
              {
                name: 'Spring',
                primaryMood: 'Uplifting',
                topGenres: topGenres.slice(1, 3).map(g => g.name)
              },
              {
                name: 'Summer',
                primaryMood: 'Energetic',
                topGenres: topGenres.slice(2, 4).map(g => g.name)
              },
              {
                name: 'Fall',
                primaryMood: 'Melancholic',
                topGenres: topGenres.slice(3, 5).map(g => g.name)
              }
            ]
          };
          
          // Combine all data
          spotifyData = {
            topGenres,
            topArtists,
            topTracks,
            seasonalMood,
            tasteLabels: topGenres.map(g => g.name)
          };
          
          // Cache Spotify data for 24 hours (86400 seconds)
          await cacheData('spotify/real-data', { userId }, spotifyData, 86400);
          usingRealData = true;
        }
      } catch (spotifyError) {
        console.error('Error fetching Spotify data:', spotifyError.message);
        console.log('Falling back to mock data');
      }
    }
    
    // Use mock data if real data is not available
    if (!spotifyData) {
      spotifyData = {
        topGenres: [
          { name: 'Melodic House', value: 90 },
          { name: 'Techno', value: 80 },
          { name: 'Progressive House', value: 70 },
          { name: 'Trance', value: 60 },
          { name: 'Deep House', value: 50 }
        ],
        topArtists: [
          { 
            name: 'Max Styler', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb8cbc5b79c7ab0ac7e6c0ff03',
            genres: ['melodic house', 'edm'],
            popularity: 90,
            rank: 1,
            similarArtists: [
              { name: 'Autograf', image: 'https://i.scdn.co/image/ab6761610000e5eb8a7af5d1f7eacb6addae5493' },
              { name: 'Amtrac', image: 'https://i.scdn.co/image/ab6761610000e5eb90c4c8a6fb0b4142c57e0bce' }
            ]
          },
          { 
            name: 'ARTBAT', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
            genres: ['melodic techno', 'organic house'],
            popularity: 85,
            rank: 2,
            similarArtists: [
              { name: 'Anyma', image: 'https://i.scdn.co/image/ab6761610000e5eb4c7c1e59b3e8c594dce7c2d2' },
              { name: 'Mathame', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' }
            ]
          },
          { 
            name: 'Lane 8', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb7f6d6a0a5b0d5e0747e01522',
            genres: ['progressive house', 'melodic house'],
            popularity: 80,
            rank: 3,
            similarArtists: [
              { name: 'Yotto', image: 'https://i.scdn.co/image/ab6761610000e5eb5d27d18dfef4c76f1b3a0f32' },
              { name: 'Ben Böhmer', image: 'https://i.scdn.co/image/ab6761610000e5eb7eb7d559b43f5e9775b20d9a' }
            ]
          },
          { 
            name: 'Boris Brejcha', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb7324ce0b63aec68c638e26f6',
            genres: ['german techno', 'minimal techno'],
            popularity: 75,
            rank: 4,
            similarArtists: [
              { name: 'Stephan Bodzin', image: 'https://i.scdn.co/image/ab6761610000e5eb4e8b9c8e5c628c4d0d64b463' },
              { name: 'Worakls', image: 'https://i.scdn.co/image/ab6761610000e5eb2d7d5f1fe46b7d1c0d11e0c0' }
            ]
          },
          { 
            name: 'Nora En Pure', 
            image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2',
            genres: ['deep house', 'organic house'],
            popularity: 70,
            rank: 5,
            similarArtists: [
              { name: 'EDX', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' },
              { name: 'Klingande', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' }
            ]
          }
        ],
        topTracks: [
          {
            name: 'Techno Cat',
            artist: 'Max Styler',
            image: 'https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 1,
            popularity: 85
          },
          {
            name: 'Return To Oz (ARTBAT Remix) ',
            artist: 'Monolink',
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 2,
            popularity: 80
          },
          {
            name: 'Atlas',
            artist: 'Lane 8',
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 3,
            popularity: 75
          },
          {
            name: 'Purple Noise',
            artist: 'Boris Brejcha',
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 4,
            popularity: 70
          },
          {
            name: 'Come With Me',
            artist: 'Nora En Pure',
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
            rank: 5,
            popularity: 65
          }
        ],
        seasonalMood: {
          winter: { genres: ['Deep House', 'Ambient Techno'], mood: 'Introspective' },
          spring: { genres: ['Progressive House', 'Melodic House'], mood: 'Uplifting' },
          summer: { genres: ['Tech House', 'House'], mood: 'Energetic' },
          fall: { genres: ['Organic House', 'Downtempo'], mood: 'Melancholic' },
          current: getCurrentSeason(),
          currentSeason: {
            name: getCurrentSeason(),
            primaryMood: getCurrentSeason() === 'winter' ? 'Introspective' : 
                        getCurrentSeason() === 'spring' ? 'Uplifting' : 
                        getCurrentSeason() === 'summer' ? 'Energetic' : 'Melancholic',
            topGenres: ['Progressive House', 'Melodic House']
          },
          seasons: [
            {
              name: 'Winter',
              primaryMood: 'Introspective',
              topGenres: ['Deep House', 'Ambient Techno']
            },
            {
              name: 'Spring',
              primaryMood: 'Uplifting',
              topGenres: ['Progressive House', 'Melodic House']
            },
            {
              name: 'Summer',
              primaryMood: 'Energetic',
              topGenres: ['Tech House', 'House']
            },
            {
              name: 'Fall',
              primaryMood: 'Melancholic',
              topGenres: ['Organic House', 'Downtempo']
            }
          ]
        },
        tasteLabels: ['Melodic', 'Progressive', 'Deep', 'Atmospheric', 'Energetic']
      };
    }
    
    // Try to fetch suggested events from the events API
    let suggestedEvents = [];
    try {
      // Check for cached events
      const cachedEvents = await getCachedData('events/suggested', { 
        userId,
        lat: userLocation.latitude,
        lon: userLocation.longitude
      });
      
      if (cachedEvents) {
        suggestedEvents = cachedEvents;
      } else {
        // First try to get correlated events
        const eventsResponse = await axios.get(`${baseUrl}/api/events/correlated-events`, {
          params: {
            lat: userLocation.latitude,
            lon: userLocation.longitude
          },
          timeout: 5000 // 5 second timeout
        });
        
        if (eventsResponse.data && eventsResponse.data.success && Array.isArray(eventsResponse.data.events)) {
          suggestedEvents = eventsResponse.data.events.map(event => ({
            id: event.id,
            name: event.name,
            date: event.date,
            venue: event.venue,
            time: '19:00:00',
            price: '$20-50',
            artists: event.artists,
            image: event.image,
            ticketLink: event.ticketUrl,
            correlation: event.correlationScore / 100,
            matchFactors: {
              genreMatch: Math.round(Math.random() * 40),
              artistMatch: Math.round(Math.random() * 25),
              locationMatch: Math.round(Math.random() * 15)
            }
          }));
          
          // Cache events for 12 hours (43200 seconds)
          await cacheData('events/suggested', { 
            userId,
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, suggestedEvents, 43200);
        }
      }
    } catch (correlatedError) {
      console.error('Error fetching correlated events:', correlatedError.message);
      
      // Fallback to regular events API
      try {
        // Check for cached regular events
        const cachedRegularEvents = await getCachedData('events/regular', { 
          userId,
          lat: userLocation.latitude,
          lon: userLocation.longitude
        });
        
        if (cachedRegularEvents) {
          suggestedEvents = cachedRegularEvents;
        } else {
          const regularEventsResponse = await axios.get(`${baseUrl}/api/events`, {
            timeout: 5000 // 5 second timeout
          });
          
          if (regularEventsResponse.data && Array.isArray(regularEventsResponse.data.events)) {
            suggestedEvents = regularEventsResponse.data.events.slice(0, 5).map(event => ({
              id: event.id,
              name: event.name,
              date: event.date,
              venue: event.venue.name,
              time: '19:00:00',
              price: '$20-50',
              artists: ['Artist 1', 'Artist 2'],
              image: event.image,
              ticketLink: event.ticketLink,
              correlation: 0.7,
              matchFactors: {
                genreMatch: Math.round(Math.random() * 40),
                artistMatch: Math.round(Math.random() * 25),
                locationMatch: Math.round(Math.random() * 15)
              }
            }));
            
            // Cache regular events for 12 hours (43200 seconds)
            await cacheData('events/regular', { 
              userId,
              lat: userLocation.latitude,
              lon: userLocation.longitude
            }, suggestedEvents, 43200);
          }
        }
      } catch (regularError) {
        console.error('Error fetching regular events:', regularError.message);
        
        // Use mock events as final fallback
        suggestedEvents = [
          {
            id: 'evt1',
            name: 'Melodic Nights',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            venue: 'Echostage',
            time: '19:00:00',
            price: '$25-45',
            artists: ['Lane 8', 'Yotto'],
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            ticketLink: 'https://example.com/tickets/1',
            correlation: 0.85,
            matchFactors: {
              genreMatch: 35,
              artistMatch: 20,
              locationMatch: 12
            }
          },
          {
            id: 'evt2',
            name: 'Techno Revolution',
            date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            venue: 'Club Space',
            time: '22:00:00',
            price: '$30-60',
            artists: ['Boris Brejcha', 'ANNA'],
            image: 'https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c',
            ticketLink: 'https://example.com/tickets/2',
            correlation: 0.75,
            matchFactors: {
              genreMatch: 30,
              artistMatch: 22,
              locationMatch: 8
            }
          },
          {
            id: 'evt3',
            name: 'Deep Vibes',
            date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            venue: 'Sound Bar',
            time: '20:00:00',
            price: '$20-40',
            artists: ['Nora En Pure', 'Ben Böhmer'],
            image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
            ticketLink: 'https://example.com/tickets/3',
            correlation: 0.65,
            matchFactors: {
              genreMatch: 25,
              artistMatch: 18,
              locationMatch: 10
            }
          }
        ];
      }
    }
    
    // Combine all data
    const responseData = {
      ...spotifyData,
      suggestedEvents,
      userLocation,
      usingRealData
    };
    
    // Cache the final response for 1 hour (3600 seconds)
    await cacheData(cacheKey, cacheParams, responseData, 3600);
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching user taste:', error);
    return res.status(500).json({ error: 'Failed to fetch music taste data' });
  }
}

// Helper function to get current season
function getCurrentSeason() {
  const now = new Date();
  const month = now.getMonth();
  
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}
EOL

echo -e "${GREEN}Updated user-taste.js API to use MongoDB caching${NC}\n"

# Update events API to use MongoDB caching
echo -e "${YELLOW}Updating events API to use MongoDB caching...${NC}"

cat > ./pages/api/events/index.js << 'EOL'
import axios from 'axios';
import { getCachedData, cacheData } from '../../../lib/cache';

// Helper function to calculate distance between two coordinates using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in miles
}

export default async function handler(req, res) {
  try {
    console.log('Starting Events API handler');
    
    // Get API keys from environment variables
    const ticketmasterApiKey = process.env.TICKETMASTER_API_KEY;
    const edmtrainApiKey = process.env.EDMTRAIN_API_KEY;
    
    console.log('Using Ticketmaster API key:', ticketmasterApiKey ? 'Available' : 'Not available');
    console.log('Using EDMtrain API key:', edmtrainApiKey ? 'Available' : 'Not available');
    
    if (!ticketmasterApiKey && !edmtrainApiKey) {
      return res.status(500).json({ 
        success: false, 
        error: 'No API keys configured for event sources' 
      });
    }
    
    // Get user's location
    let userLocation;
    try {
      // Check for cached location data
      const cachedLocation = await getCachedData('ipapi/location', {});
      
      if (cachedLocation) {
        userLocation = cachedLocation;
        console.log('Using cached location data');
      } else {
        console.log('Fetching user location...');
        const ipResponse = await axios.get('https://ipapi.co/json/');
        userLocation = {
          latitude: ipResponse.data.latitude,
          longitude: ipResponse.data.longitude,
          city: ipResponse.data.city,
          region: ipResponse.data.region,
          country: ipResponse.data.country_name
        };
        
        // Cache location data for 24 hours (86400 seconds)
        await cacheData('ipapi/location', {}, userLocation, 86400);
        
        console.log(`User location: ${userLocation.city}, ${userLocation.region}, ${userLocation.country}`);
        console.log(`Coordinates: ${userLocation.latitude}, ${userLocation.longitude}`);
      }
    } catch (error) {
      console.error('Error getting user location:', error.message);
      console.log('Will use default search without location filtering');
      
      // Use fallback location if ipapi fails
      userLocation = {
        latitude: 40.7128,
        longitude: -74.0060,
        city: "New York",
        region: "NY",
        country: "United States"
      };
      console.log('Using fallback location:', userLocation.city);
    }
    
    // Get user taste data to calculate match percentages
    let userTaste;
    try {
      // Check for cached user taste data
      const cachedTaste = await getCachedData('events/user-taste', {});
      
      if (cachedTaste) {
        userTaste = cachedTaste;
        console.log('Using cached user taste data');
      } else {
        const userTasteResponse = await axios.get(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/spotify/user-taste`);
        userTaste = userTasteResponse.data;
        
        // Cache user taste data for 24 hours (86400 seconds)
        await cacheData('events/user-taste', {}, userTaste, 86400);
        
        console.log('Successfully fetched user taste data');
      }
    } catch (error) {
      console.error('Error fetching user taste data:', error.message);
      // Continue with default taste data if user taste can't be fetched
      userTaste = {
        genres: [
          { name: 'House', score: 85 },
          { name: 'Techno', score: 70 },
          { name: 'Trance', score: 60 },
          { name: 'Dubstep', score: 40 },
          { name: 'Drum & Bass', score: 75 },
          { name: 'Future Bass', score: 55 }
        ]
      };
      console.log('Using default taste data instead');
    }
    
    // Extract user's top genres for matching
    const userGenres = userTaste.genres ? 
      userTaste.genres.map(genre => genre.name.toLowerCase()) : 
      ['house', 'techno', 'trance', 'electronic', 'dance'];
    
    console.log('User genres for matching:', userGenres);
    
    // Initialize arrays for events from different sources
    let ticketmasterEvents = [];
    let edmtrainEvents = [];
    let ticketmasterError = null;
    let edmtrainError = null;
    
    // Fetch from Ticketmaster API
    if (ticketmasterApiKey) {
      try {
        // Check for cached Ticketmaster events
        const cacheParams = {
          lat: userLocation.latitude,
          lon: userLocation.longitude
        };
        const cachedTicketmaster = await getCachedData('ticketmaster/events', cacheParams);
        
        if (cachedTicketmaster) {
          console.log('Using cached Ticketmaster events');
          ticketmasterEvents = cachedTicketmaster;
        } else {
          console.log('Making Ticketmaster API request...');
          
          // Set up parameters for Ticketmaster API
          const params = {
            apikey: ticketmasterApiKey,
            classificationName: 'music',
            // Broader keyword search to catch more EDM events
            keyword: 'electronic OR dance OR dj OR festival OR rave',
            size: 100, // Increased from 50 to get more results
            sort: 'date,asc',
            startDateTime: new Date().toISOString().slice(0, 19) + 'Z' // Current time in ISO format
          };
          
          // Add location parameters if user location is available
          if (userLocation) {
            params.latlong = `${userLocation.latitude},${userLocation.longitude}`;
            params.radius = '100'; // 100 mile radius
            params.unit = 'miles';
            console.log(`Adding location filter: ${params.latlong}, radius: ${params.radius} miles`);
          }
          
          console.log('Ticketmaster API request params:', JSON.stringify(params));
          
          const response = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
            params,
            timeout: 15000 // 15 second timeout
          });
          
          console.log('Ticketmaster API request successful');
          
          // Check if we have events in the response
          if (response.data._embedded && response.data._embedded.events) {
            ticketmasterEvents = response.data._embedded.events;
            
            // Cache Ticketmaster events for 12 hours (43200 seconds)
            await cacheData('ticketmaster/events', cacheParams, ticketmasterEvents, 43200);
            
            console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster`);
          } else {
            console.log('No events found in Ticketmaster response');
            ticketmasterError = 'No events found from Ticketmaster';
            
            // Try one more time with a simpler query
            console.log('Retrying with simpler query...');
            params.keyword = 'electronic';
            delete params.classificationName; // Remove classification to broaden search
            
            const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
              params,
              timeout: 15000
            });
            
            if (retryResponse.data._embedded && retryResponse.data._embedded.events) {
              ticketmasterEvents = retryResponse.data._embedded.events;
              
              // Cache Ticketmaster events for 12 hours (43200 seconds)
              await cacheData('ticketmaster/events', cacheParams, ticketmasterEvents, 43200);
              
              console.log(`Found ${ticketmasterEvents.length} events from Ticketmaster retry`);
              ticketmasterError = null;
            } else {
              console.log('No events found in Ticketmaster retry response');
            }
          }
        }
      } catch (error) {
        console.error('Ticketmaster API request failed:', error.message);
        ticketmasterError = error.message;
        
        // Try one more time with a simpler query
        try {
          console.log('Retrying with simpler query after error...');
          const params = {
            apikey: ticketmasterApiKey,
            keyword: 'electronic',
            size: 50,
            sort: 'date,asc',
            startDateTime: new Date().toISOString().slice(0, 19) + 'Z'
          };
          
          const retryResponse = await axios.get('https://app.ticketmaster.com/discovery/v2/events.json', { 
            params,
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
      console.log('Skipping Ticketmaster API call - no API key configured');
      ticketmasterError = 'Ticketmaster API key not configured';
    }
    
    // Process Ticketmaster events if available
    const processedTicketmasterEvents = ticketmasterEvents.map(event => {
      // Extract event genres
      let eventGenres = [];
      if (event.classifications && event.classifications.length > 0) {
        const classification = event.classifications[0];
        if (classification.genre && classification.genre.name !== 'Undefined') {
          eventGenres.push(classification.genre.name);
        }
        if (classification.subGenre && classification.subGenre.name !== 'Undefined') {
          eventGenres.push(classification.subGenre.name);
        }
        if (classification.segment && classification.segment.name !== 'Undefined') {
          eventGenres.push(classification.segment.name);
        }
      }
      
      // If no genres found, extract from name or use defaults
      if (eventGenres.length === 0) {
        const eventName = event.name.toLowerCase();
        if (eventName.includes('techno')) eventGenres.push('Techno');
        if (eventName.includes('house')) eventGenres.push('House');
        if (eventName.includes('trance')) eventGenres.push('Trance');
        if (eventName.includes('dubstep')) eventGenres.push('Dubstep');
        if (eventName.includes('drum') && eventName.includes('bass')) eventGenres.push('Drum & Bass');
        if (eventName.includes('edm')) eventGenres.push('EDM');
        if (eventName.includes('dj')) eventGenres.push('DJ');
        if (eventName.includes('electronic')) eventGenres.push('Electronic');
        if (eventName.includes('dance')) eventGenres.push('Dance');
        if (eventName.includes('festival')) eventGenres.push('Festival');
        
        // If still no genres, use default
        if (eventGenres.length === 0) {
          eventGenres = ['Electronic', 'Dance'];
        }
      }
      
      // Calculate match percentage
      let matchScore = 0;
      let matchCount = 0;
      
      eventGenres.forEach(eventGenre => {
        const normalizedEventGenre = eventGenre.toLowerCase();
        
        userGenres.forEach((userGenre, index) => {
          // Check for partial matches in genre names
          if (normalizedEventGenre.includes(userGenre) || userGenre.includes(normalizedEventGenre)) {
            // Weight the match by the genre's importance to the user
            const genreWeight = userTaste.genres && userTaste.genres[index] ? 
              userTaste.genres[index].score / 100 : 0.5;
            matchScore += genreWeight;
            matchCount++;
          }
        });
      });
      
      // Calculate final match percentage
      let match = 0;
      if (matchCount > 0) {
        match = Math.round((matchScore / matchCount) * 100);
      } else {
        // Base match for all EDM events
        match = 20;
      }
      
      // Ensure match is between 0-100
      match = Math.max(0, Math.min(100, match));
      
      // Extract venue information
      const venue = event._embedded?.venues?.[0] || {};
      
      // Calculate distance from user if location is available
      let distance = null;
      if (userLocation && venue.location) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(venue.location.latitude),
          parseFloat(venue.location.longitude)
        );
      }
      
      // Format event data
      return {
        id: event.id,
        source: 'ticketmaster',
        name: event.name,
        date: event.dates.start.dateTime,
        image: event.images && event.images.length > 0 
          ? event.images.find(img => img.ratio === '16_9')?.url || event.images[0].url 
          : null,
        venue: {
          id: venue.id,
          name: venue.name || 'Unknown Venue',
          location: venue.city ? `${venue.city.name}, ${venue.state?.stateCode || ''}` : 'Location Unknown',
          address: venue.address?.line1,
          coordinates: venue.location ? {
            latitude: venue.location.latitude,
            longitude: venue.location.longitude
          } : null
        },
        genres: eventGenres,
        match: match,
        ticketLink: event.url,
        distance: distance
      };
    });
    
    // Fetch from EDMtrain API
    if (edmtrainApiKey) {
      try {
        // Check for cached EDMtrain events
        const cacheParams = {
          lat: userLocation.latitude,
          lon: userLocation.longitude
        };
        const cachedEdmtrain = await getCachedData('edmtrain/events', cacheParams);
        
        if (cachedEdmtrain) {
          console.log('Using cached EDMtrain events');
          edmtrainEvents = cachedEdmtrain;
        } else {
          console.log('Fetching events from EDMtrain API...');
          
          // Construct EDMtrain API request
          let edmtrainUrl = 'https://edmtrain.com/api/events';
          let edmtrainParams = { client: edmtrainApiKey };
          
          // Add location parameters if available
          if (userLocation) {
            if (userLocation.city && userLocation.region) {
              edmtrainParams.city = userLocation.city;
              edmtrainParams.state = userLocation.region;
            } else {
              // Use latitude/longitude with radius
              edmtrainParams.latitude = userLocation.latitude;
              edmtrainParams.longitude = userLocation.longitude;
              edmtrainParams.radius = 100; // 100 mile radius
            }
          }
          
          console.log('EDMtrain API request params:', JSON.stringify(edmtrainParams));
          
          const edmtrainResponse = await axios.get(edmtrainUrl, { 
            params: edmtrainParams,
            timeout: 15000
          });
          
          if (edmtrainResponse.data && edmtrainResponse.data.data) {
            edmtrainEvents = edmtrainResponse.data.data;
            
            // Cache EDMtrain events for 12 hours (43200 seconds)
            await cacheData('edmtrain/events', cacheParams, edmtrainEvents, 43200);
            
            console.log(`Found ${edmtrainEvents.length} events from EDMtrain`);
          } else {
            console.log('No events found in EDMtrain response');
            edmtrainError = 'No events found from EDMtrain';
          }
        }
      } catch (error) {
        console.error('EDMtrain API request failed:', error.message);
        edmtrainError = error.message;
        
        // Try one more time with a simpler query
        try {
          console.log('Retrying EDMtrain with simpler query...');
          const edmtrainUrl = 'https://edmtrain.com/api/events';
          const edmtrainParams = { client: edmtrainApiKey };
          
          const retryResponse = await axios.get(edmtrainUrl, { 
            params: edmtrainParams,
            timeout: 15000
          });
          
          if (retryResponse.data && retryResponse.data.data) {
            edmtrainEvents = retryResponse.data.data;
            
            // Cache EDMtrain events for 12 hours (43200 seconds)
            await cacheData('edmtrain/events', {
              lat: userLocation.latitude,
              lon: userLocation.longitude
            }, edmtrainEvents, 43200);
            
            console.log(`Found ${edmtrainEvents.length} events from EDMtrain retry`);
            edmtrainError = null;
          } else {
            console.log('No events found in EDMtrain retry response');
          }
        } catch (retryError) {
          console.error('EDMtrain retry also failed:', retryError.message);
          edmtrainError = `${error.message} (retry also failed: ${retryError.message})`;
        }
      }
    } else {
      console.log('Skipping EDMtrain API call - no API key configured');
      edmtrainError = 'EDMtrain API key not configured';
    }
    
    // Process EDMtrain events
    const processedEdmtrainEvents = edmtrainEvents.map(event => {
      // Extract genres from artists
      let eventGenres = [];
      if (event.artistList && event.artistList.length > 0) {
        event.artistList.forEach(artist => {
          if (artist.genre) {
            eventGenres.push(artist.genre);
          }
        });
      }
      
      // If no genres found, use default EDM genres
      if (eventGenres.length === 0) {
        eventGenres = ['Electronic', 'Dance'];
      }
      
      // Calculate match percentage
      let matchScore = 0;
      let matchCount = 0;
      
      eventGenres.forEach(eventGenre => {
        const normalizedEventGenre = eventGenre.toLowerCase();
        
        userGenres.forEach((userGenre, index) => {
          // Check for partial matches in genre names
          if (normalizedEventGenre.includes(userGenre) || userGenre.includes(normalizedEventGenre)) {
            // Weight the match by the genre's importance to the user
            const genreWeight = userTaste.genres && userTaste.genres[index] ? 
              userTaste.genres[index].score / 100 : 0.5;
            matchScore += genreWeight;
            matchCount++;
          }
        });
      });
      
      // Calculate final match percentage
      let match = 0;
      if (matchCount > 0) {
        match = Math.round((matchScore / matchCount) * 100);
      } else {
        // Base match for all EDM events
        match = 20;
      }
      
      // Ensure match is between 0-100
      match = Math.max(0, Math.min(100, match));
      
      // Extract venue information
      const venue = event.venue || {};
      
      // Calculate distance from user if location is available
      let distance = null;
      if (userLocation && venue.latitude && venue.longitude) {
        distance = calculateDistance(
          userLocation.latitude,
          userLocation.longitude,
          parseFloat(venue.latitude),
          parseFloat(venue.longitude)
        );
      }
      
      // Extract artists
      const artists = event.artistList ? event.artistList.map(artist => artist.name) : [];
      
      // Format event data
      return {
        id: `edmtrain-${event.id}`,
        source: 'edmtrain',
        name: event.name || artists.join(' & ') || 'EDM Event',
        date: event.date,
        image: null, // EDMtrain doesn't provide images
        venue: {
          id: `venue-${venue.id}`,
          name: venue.name || 'Unknown Venue',
          location: venue.location || 'Location Unknown',
          address: venue.address,
          coordinates: venue.latitude && venue.longitude ? {
            latitude: venue.latitude,
            longitude: venue.longitude
          } : null
        },
        genres: eventGenres,
        match: match,
        ticketLink: event.ticketLink,
        distance: distance,
        artists: artists
      };
    });
    
    // Combine events from both sources
    const allEvents = [...processedTicketmasterEvents, ...processedEdmtrainEvents];
    
    // Sort events by match percentage (highest first)
    allEvents.sort((a, b) => b.match - a.match);
    
    // Return events
    return res.status(200).json({
      success: true,
      events: allEvents,
      userLocation,
      sources: {
        ticketmaster: {
          success: !ticketmasterError,
          error: ticketmasterError,
          count: processedTicketmasterEvents.length
        },
        edmtrain: {
          success: !edmtrainError,
          error: edmtrainError,
          count: processedEdmtrainEvents.length
        }
      }
    });
  } catch (error) {
    console.error('Error in events API:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      message: error.message
    });
  }
}
EOL

echo -e "${GREEN}Updated events API to use MongoDB caching${NC}\n"

# Update correlated-events API to use MongoDB caching
echo -e "${YELLOW}Updating correlated-events API to use MongoDB caching...${NC}"

cat > ./pages/api/events/correlated-events.js << 'EOL'
import { getSession } from 'next-auth/react';
import axios from 'axios';
import { getCachedData, cacheData } from '../../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    // Get user ID for caching
    const userId = session.user.id || session.user.email || 'anonymous';
    
    // Try to get cached data first
    const cacheKey = 'events/correlated';
    const cacheParams = { 
      userId,
      lat: req.query.lat,
      lon: req.query.lon
    };
    const cachedData = await getCachedData(cacheKey, cacheParams);
    
    if (cachedData) {
      console.log('Using cached correlated events data');
      return res.status(200).json(cachedData);
    }
    
    // Get user location from query params or use IP geolocation
    let userLocation = null;
    if (req.query.lat && req.query.lon) {
      userLocation = {
        latitude: parseFloat(req.query.lat),
        longitude: parseFloat(req.query.lon)
      };
    } else {
      // Check for cached location data
      const cachedLocation = await getCachedData('ipapi/location', {});
      
      if (cachedLocation) {
        userLocation = cachedLocation;
        console.log('Using cached location data');
      } else {
        // Fallback to IP geolocation
        try {
          const geoResponse = await axios.get('https://ipapi.co/json/');
          userLocation = {
            latitude: geoResponse.data.latitude,
            longitude: geoResponse.data.longitude,
            city: geoResponse.data.city,
            region: geoResponse.data.region
          };
          
          // Cache location data for 24 hours (86400 seconds)
          await cacheData('ipapi/location', {}, userLocation, 86400);
        } catch (geoError) {
          console.warn('Could not determine user location:', geoError);
          
          // Use fallback location
          userLocation = {
            latitude: 40.7128,
            longitude: -74.0060,
            city: "New York",
            region: "NY",
            country: "United States"
          };
        }
      }
    }
    
    // Fetch user's music taste data
    let userTaste;
    try {
      // Check for cached user taste data
      const cachedTaste = await getCachedData('spotify/user-taste', { userId });
      
      if (cachedTaste) {
        userTaste = cachedTaste;
        console.log('Using cached user taste data');
      } else {
        // In a production environment, you would fetch this from your database
        // For this example, we'll use the API
        const tasteResponse = await axios.get(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/spotify/user-taste`, {
          headers: {
            Cookie: req.headers.cookie // Forward cookies for authentication
          }
        });
        
        userTaste = tasteResponse.data;
        
        // Cache user taste data for 1 hour (3600 seconds)
        await cacheData('spotify/user-taste', { userId }, userTaste, 3600);
      }
    } catch (tasteError) {
      console.warn('Could not fetch user taste data:', tasteError);
      
      // Use mock data as fallback
      userTaste = {
        topGenres: [
          { name: 'Melodic House', weight: 0.9 },
          { name: 'Techno', weight: 0.8 },
          { name: 'Progressive House', weight: 0.7 },
          { name: 'Trance', weight: 0.6 },
          { name: 'Deep House', weight: 0.5 }
        ],
        topArtists: [
          { name: 'Max Styler', weight: 0.9 },
          { name: 'ARTBAT', weight: 0.85 },
          { name: 'Lane 8', weight: 0.8 },
          { name: 'Boris Brejcha', weight: 0.75 },
          { name: 'Nora En Pure', weight: 0.7 }
        ]
      };
    }
    
    // Try to fetch real events from the events API
    let realEvents = [];
    try {
      // Check for cached events
      const cachedEvents = await getCachedData('events/all', { 
        lat: userLocation.latitude,
        lon: userLocation.longitude
      });
      
      if (cachedEvents) {
        realEvents = cachedEvents;
        console.log('Using cached events data');
      } else {
        const eventsResponse = await axios.get(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/events`, {
          timeout: 5000 // 5 second timeout
        });
        
        if (eventsResponse.data && eventsResponse.data.success && Array.isArray(eventsResponse.data.events)) {
          realEvents = eventsResponse.data.events;
          
          // Cache events for 12 hours (43200 seconds)
          await cacheData('events/all', { 
            lat: userLocation.latitude,
            lon: userLocation.longitude
          }, realEvents, 43200);
        }
      }
    } catch (eventsError) {
      console.warn('Could not fetch real events:', eventsError);
    }
    
    // Use real events if available, otherwise use mock events
    let events = [];
    if (realEvents.length > 0) {
      events = realEvents;
    } else {
      // Mock events as fallback
      events = [
        {
          id: 'evt1',
          name: 'Melodic Nights',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Echostage',
          genres: ['Melodic House', 'Progressive House'],
          artists: ['Lane 8', 'Yotto'],
          image: 'https://example.com/event1.jpg',
          ticketUrl: 'https://example.com/tickets/1',
          location: {
            latitude: userLocation ? userLocation.latitude + 0.02 : 0,
            longitude: userLocation ? userLocation.longitude - 0.01 : 0
          }
        },
        {
          id: 'evt2',
          name: 'Techno Revolution',
          date: new Date(Date.now()  + 14 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Club Space',
          genres: ['Techno', 'Dark Techno'],
          artists: ['Boris Brejcha', 'ANNA'],
          image: 'https://example.com/event2.jpg',
          ticketUrl: 'https://example.com/tickets/2',
          location: {
            latitude: userLocation ? userLocation.latitude - 0.03 : 0,
            longitude: userLocation ? userLocation.longitude + 0.02 : 0
          }
        },
        {
          id: 'evt3',
          name: 'Deep Vibes',
          date: new Date(Date.now()  + 3 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Sound Bar',
          genres: ['Deep House', 'Organic House'],
          artists: ['Nora En Pure', 'Ben Böhmer'],
          image: 'https://example.com/event3.jpg',
          ticketUrl: 'https://example.com/tickets/3',
          location: {
            latitude: userLocation ? userLocation.latitude + 0.01 : 0,
            longitude: userLocation ? userLocation.longitude + 0.01 : 0
          }
        },
        {
          id: 'evt4',
          name: 'Trance Journey',
          date: new Date(Date.now()  + 21 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Avalon',
          genres: ['Trance', 'Progressive Trance'],
          artists: ['Above & Beyond', 'Armin van Buuren'],
          image: 'https://example.com/event4.jpg',
          ticketUrl: 'https://example.com/tickets/4',
          location: {
            latitude: userLocation ? userLocation.latitude - 0.02 : 0,
            longitude: userLocation ? userLocation.longitude - 0.02 : 0
          }
        },
        {
          id: 'evt5',
          name: 'House Classics',
          date: new Date(Date.now()  + 10 * 24 * 60 * 60 * 1000).toISOString(),
          venue: 'Ministry of Sound',
          genres: ['House', 'Tech House'],
          artists: ['CamelPhat', 'Solardo'],
          image: 'https://example.com/event5.jpg',
          ticketUrl: 'https://example.com/tickets/5',
          location: {
            latitude: userLocation ? userLocation.latitude + 0.04 : 0,
            longitude: userLocation ? userLocation.longitude - 0.03 : 0
          }
        }
      ];
    }
    
    // Calculate correlation scores for each event
    const correlatedEvents = events.map(event => {
      // Extract genres from event
      const eventGenres = event.genres || [];
      
      // Extract artists from event
      const eventArtists = event.artists || 
                          (event.artistList ? event.artistList.map(a => a.name) : []);
      
      // Calculate genre match
      const genreMatch = eventGenres.reduce((score, genre)  => {
        const matchingGenre = userTaste.topGenres ? 
          userTaste.topGenres.find(g => g.name.toLowerCase() === genre.toLowerCase()) : null;
        return score + (matchingGenre ? (matchingGenre.weight || matchingGenre.value / 100) * 50 : 0);
      }, 0) / Math.max(1, eventGenres.length);
      
      // Calculate artist match
      const artistMatch = eventArtists.reduce((score, artist) => {
        const matchingArtist = userTaste.topArtists ? 
          userTaste.topArtists.find(a => a.name.toLowerCase() === artist.toLowerCase()) : null;
        return score + (matchingArtist ? (matchingArtist.weight || 0.5) * 50 : 0);
      }, 0) / Math.max(1, eventArtists.length);
      
      // Calculate distance if location is available
      let distance = null;
      if (userLocation && event.location) {
        // Haversine formula to calculate distance
        const R = 3958.8; // Earth radius in miles
        const dLat = (event.location.latitude - userLocation.latitude) * Math.PI / 180;
        const dLon = (event.location.longitude - userLocation.longitude) * Math.PI / 180;
        const a = 
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(userLocation.latitude * Math.PI / 180) * Math.cos(event.location.latitude * Math.PI / 180) * 
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        distance = R * c;
      }
      
      // Calculate overall correlation score (0-100)
      const correlationScore = Math.min(100, Math.round(genreMatch + artistMatch));
      
      return {
        ...event,
        correlationScore,
        distance,
        matchFactors: {
          genreMatch: Math.round(genreMatch),
          artistMatch: Math.round(artistMatch),
          locationMatch: distance ? Math.max(0, 100 - Math.round(distance * 2)) : 0
        }
      };
    });
    
    // Sort by correlation score (highest first)
    correlatedEvents.sort((a, b) => b.correlationScore - a.correlationScore);
    
    // Prepare response data
    const responseData = { 
      success: true, 
      events: correlatedEvents,
      userLocation,
      usingRealEvents: realEvents.length > 0
    };
    
    // Cache the response for 1 hour (3600 seconds)
    await cacheData(cacheKey, cacheParams, responseData, 3600);
    
    return res.status(200).json(responseData);
  } catch (error) {
    console.error('Error fetching correlated events:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
}
EOL

echo -e "${GREEN}Updated correlated-events API to use MongoDB caching${NC}\n"

# Update user preferences API to use MongoDB
echo -e "${YELLOW}Updating user preferences API to use MongoDB...${NC}"

cat > ./pages/api/user/update-taste-preferences.js << 'EOL'
import { getSession } from 'next-auth/react';
import { saveUserPreferences, invalidateCache } from '../../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { preferences } = req.body;
    
    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({ error: 'Invalid preferences data' });
    }
    
    // Get user ID
    const userId = session.user.id || session.user.email || 'anonymous';
    
    // Save preferences to MongoDB
    const success = await saveUserPreferences(userId, preferences);
    
    if (!success) {
      return res.status(500).json({ error: 'Failed to save preferences' });
    }
    
    // Invalidate user taste cache to force refresh
    await invalidateCache('spotify/user-taste', { userId });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Preferences updated successfully'
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    return res.status(500).json({ error: 'Failed to update preferences' });
  }
}
EOL

echo -e "${GREEN}Updated user preferences API to use MongoDB${NC}\n"

# Create a script to clean up expired cache entries
echo -e "${YELLOW}Creating cache cleanup script...${NC}"

mkdir -p ./scripts

cat > ./scripts/cleanup-cache.js << 'EOL'
import { cleanupExpiredCache } from '../lib/cache';

async function main() {
  console.log('Starting cache cleanup...');
  
  try {
    const deletedCount = await cleanupExpiredCache();
    console.log(`Cleaned up ${deletedCount} expired cache entries`);
  } catch (error) {
    console.error('Error cleaning up cache:', error);
  }
  
  console.log('Cache cleanup complete');
  process.exit(0);
}

main();
EOL

echo -e "${GREEN}Created cache cleanup script${NC}\n"

# Create package.json updates for MongoDB dependencies
echo -e "${YELLOW}Updating package.json for MongoDB dependencies...${NC}"

# Check if package.json exists
if [ -f "./package.json" ]; then
  # Backup package.json
  cp ./package.json "$BACKUP_DIR/"
  
  # Add MongoDB dependencies
  # This is a simple approach that might not work for all package.json files
  # A more robust approach would use jq or a similar tool
  sed -i 's/"dependencies": {/"dependencies": {\n    "mongodb": "^4.8.1",/g' ./package.json
  
  echo -e "${GREEN}Updated package.json with MongoDB dependencies${NC}\n"
else
  echo -e "${YELLOW}package.json not found, skipping dependency update${NC}\n"
fi

# Create a deploy-to-heroku.sh script
echo -e "${YELLOW}Creating deploy-to-heroku.sh script...${NC}"

cat > ./deploy-to-heroku.sh << 'EOL'
#!/bin/bash

# Sonar EDM Platform - Heroku Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform - Heroku Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your Sonar EDM Platform to Heroku.${NC}\n"

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: git is not installed.${NC}"
  echo -e "${YELLOW}Please install git and try again.${NC}"
  exit 1
fi

# Check if heroku CLI is installed
if ! command -v heroku &> /dev/null; then
  echo -e "${RED}Error: Heroku CLI is not installed.${NC}"
  echo -e "${YELLOW}Please install the Heroku CLI and try again.${NC}"
  exit 1
fi

# Check if we're in the project directory
if [ ! -d "./pages" ] || [ ! -d "./components" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory.${NC}"
  echo -e "${YELLOW}Please navigate to your project directory and run this script again.${NC}"
  exit 1
fi

# Check if user is logged in to Heroku
heroku_status=$(heroku auth:whoami 2>&1)
if [[ $heroku_status == *"Error"* ]]; then
  echo -e "${YELLOW}You are not logged in to Heroku. Please log in:${NC}"
  heroku login
fi

# Check if the app exists
app_name="sonar-edm-user"
app_exists=$(heroku apps:info --app $app_name 2>&1)
if [[ $app_exists == *"Couldn't find that app"* ]]; then
  echo -e "${YELLOW}Creating Heroku app: $app_name${NC}"
  heroku create $app_name
else
  echo -e "${GREEN}Using existing Heroku app: $app_name${NC}"
fi

# Check if git remote exists
remote_exists=$(git remote -v | grep heroku)
if [ -z "$remote_exists" ]; then
  echo -e "${YELLOW}Adding Heroku remote...${NC}"
  heroku git:remote -a $app_name
fi

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
heroku config:set TICKETMASTER_API_KEY=gjGKNoTGeWl8HF2FAgYQVCf25D5ap7yw --app $app_name
heroku config:set SPOTIFY_CLIENT_ID=20d98eaf33fa464291b4c13a1e70a2ad --app $app_name
heroku config:set SPOTIFY_CLIENT_SECRET=8cb4a223b7434a52b4c21e5f6aef6b19 --app $app_name
heroku config:set NEXTAUTH_URL=https://sonar-edm-user-50e4fb038f6e.herokuapp.com --app $app_name
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32) --app $app_name
heroku config:set EDMTRAIN_API_KEY=b5143e2e-21f2-4b45-b537-0b5b9ec9bdad --app $app_name
heroku config:set MONGODB_URI=mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/?retryWrites=true&w=majority&appName=SonarEDM --app $app_name

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Implement MongoDB caching system to reduce API calls"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku master

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your app is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
EOL

chmod +x ./deploy-to-heroku.sh

echo -e "${GREEN}Created deploy-to-heroku.sh script${NC}\n"

# Make this script executable
chmod +x ./sonar-edm-mongodb.sh

echo -e "${BLUE}=== MongoDB Caching System Implementation Complete ===${NC}"
echo -e "${GREEN}All MongoDB caching features have been implemented successfully!${NC}"
echo -e "${YELLOW}To deploy to Heroku, run:${NC} ./deploy-to-heroku.sh"
echo -e "${YELLOW}Next steps:${NC}"
echo -e "1. Install MongoDB dependencies: npm install mongodb"
echo -e "2. Enhance theme with artist card design"
echo -e "${BLUE}=======================================${NC}\n"
