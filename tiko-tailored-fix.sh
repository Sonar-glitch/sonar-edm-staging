#!/bin/bash

# TIKO Platform Tailored Fix Script
# This script addresses specific dependency and export issues identified in the project analysis
# Created: April 25, 2025

echo "Starting TIKO tailored fix at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Create a backup of the current state
echo "Creating backup of current state..."
BACKUP_DIR="./backups/tailored-fix-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Backup directory created: $BACKUP_DIR"

# Backup key files
echo "Backing up key files..."
cp -f package.json "$BACKUP_DIR/package.json.bak" 2>/dev/null || echo "Warning: Could not backup package.json"
cp -f next.config.js "$BACKUP_DIR/next.config.js.bak" 2>/dev/null || echo "Warning: Could not backup next.config.js"
cp -f pages/api/auth/[...nextauth].js "$BACKUP_DIR/nextauth.js.bak" 2>/dev/null || echo "Warning: Could not backup [...nextauth].js"
cp -f lib/mongodb.js "$BACKUP_DIR/mongodb.js.bak" 2>/dev/null || echo "Warning: Could not backup mongodb.js"
cp -f lib/spotify.js "$BACKUP_DIR/spotify.js.bak" 2>/dev/null || echo "Warning: Could not backup spotify.js"
cp -f lib/cache.js "$BACKUP_DIR/cache.js.bak" 2>/dev/null || echo "Warning: Could not backup cache.js"

# 1. Install missing dependencies
echo "Installing missing dependencies..."
npm install --save d3@7.8.5 chart.js@4.3.0 react-chartjs-2@5.2.0 critters@0.0.20 --legacy-peer-deps

# 2. Fix NextAuth configuration to export authOptions
echo "Fixing NextAuth configuration..."
if [ -f "pages/api/auth/[...nextauth].js" ]; then
  # Check if authOptions is defined but not exported
  if grep -q "const authOptions" "pages/api/auth/[...nextauth].js" && ! grep -q "export.*authOptions" "pages/api/auth/[...nextauth].js"; then
    echo "Adding export for authOptions in [...nextauth].js..."
    
    # Create a temporary file with the export added
    sed 's/const authOptions/export const authOptions/g' "pages/api/auth/[...nextauth].js" > "pages/api/auth/[...nextauth].js.new"
    
    # Replace the original file
    mv "pages/api/auth/[...nextauth].js.new" "pages/api/auth/[...nextauth].js"
    echo "Added export for authOptions in [...nextauth].js"
  elif ! grep -q "authOptions" "pages/api/auth/[...nextauth].js"; then
    echo "Creating authOptions in [...nextauth].js..."
    
    # Create a backup of the original file
    cp "pages/api/auth/[...nextauth].js" "$BACKUP_DIR/nextauth.js.original"
    
    # Create a new file with authOptions
    cat > "pages/api/auth/[...nextauth].js" << 'EOL'
import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

export const authOptions = {
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
};

export default NextAuth(authOptions);
EOL
    echo "Created authOptions in [...nextauth].js"
  else
    echo "authOptions already exported in [...nextauth].js"
  fi
else
  echo "Creating [...nextauth].js with exported authOptions..."
  
  # Create the directory if it doesn't exist
  mkdir -p "pages/api/auth"
  
  # Create the file
  cat > "pages/api/auth/[...nextauth].js" << 'EOL'
import NextAuth from "next-auth";
import SpotifyProvider from "next-auth/providers/spotify";

export const authOptions = {
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
};

export default NextAuth(authOptions);
EOL
  echo "Created [...nextauth].js with exported authOptions"
fi

# 3. Fix MongoDB client export
echo "Fixing MongoDB client export..."
if [ -f "lib/mongodb.js" ]; then
  # Check if clientPromise is defined but not exported as default
  if grep -q "clientPromise" "lib/mongodb.js" && ! grep -q "export default clientPromise" "lib/mongodb.js"; then
    echo "Adding default export for clientPromise in mongodb.js..."
    
    # Add the default export at the end of the file
    echo -e "\nexport default clientPromise;" >> "lib/mongodb.js"
    echo "Added default export for clientPromise in mongodb.js"
  else
    echo "No clientPromise export issue found in mongodb.js"
  fi
else
  echo "Creating mongodb.js with proper exports..."
  
  # Create the directory if it doesn't exist
  mkdir -p "lib"
  
  # Create the file
  cat > "lib/mongodb.js" << 'EOL'
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
};

let client;
let clientPromise;

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env.local');
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

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
EOL
  echo "Created mongodb.js with proper exports"
fi

# 4. Fix Spotify API export issues
echo "Fixing Spotify API export issues..."
if [ -f "lib/spotify.js" ]; then
  # Check if getRecentlyPlayed is used but not exported
  if grep -q "async function getRecentlyPlayed" "lib/spotify.js" && ! grep -q "export.*getRecentlyPlayed" "lib/spotify.js"; then
    echo "Adding export for getRecentlyPlayed in spotify.js..."
    
    # Add the export for the function
    sed -i 's/async function getRecentlyPlayed/export async function getRecentlyPlayed/g' "lib/spotify.js"
    echo "Added export for getRecentlyPlayed in spotify.js"
  else
    echo "No getRecentlyPlayed export issue found in spotify.js"
  fi
else
  echo "Creating spotify.js with proper exports..."
  
  # Create the directory if it doesn't exist
  mkdir -p "lib"
  
  # Create the file
  cat > "lib/spotify.js" << 'EOL'
import axios from 'axios';

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

/**
 * Get user's top artists from Spotify API
 * @param {string} token - Spotify access token
 * @param {string} timeRange - Time range for top artists (short_term, medium_term, long_term)
 * @param {number} limit - Number of artists to return
 * @returns {Promise<Object>} - Top artists data
 */
export async function getTopArtists(token, timeRange = 'medium_term', limit = 10) {
  try {
    const response = await axios.get(`${SPOTIFY_API_BASE}/me/top/artists`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        time_range: timeRange,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top artists:', error);
    throw error;
  }
}

/**
 * Get user's top tracks from Spotify API
 * @param {string} token - Spotify access token
 * @param {string} timeRange - Time range for top tracks (short_term, medium_term, long_term)
 * @param {number} limit - Number of tracks to return
 * @returns {Promise<Object>} - Top tracks data
 */
export async function getTopTracks(token, timeRange = 'medium_term', limit = 10) {
  try {
    const response = await axios.get(`${SPOTIFY_API_BASE}/me/top/tracks`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        time_range: timeRange,
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    throw error;
  }
}

/**
 * Get audio features for tracks from Spotify API
 * @param {string} token - Spotify access token
 * @param {Array<string>} trackIds - Array of track IDs
 * @returns {Promise<Object>} - Audio features data
 */
export async function getAudioFeaturesForTracks(token, trackIds) {
  try {
    const response = await axios.get(`${SPOTIFY_API_BASE}/audio-features`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        ids: trackIds.join(','),
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching audio features:', error);
    throw error;
  }
}

/**
 * Get user's recently played tracks from Spotify API
 * @param {string} token - Spotify access token
 * @param {number} limit - Number of tracks to return
 * @returns {Promise<Object>} - Recently played tracks data
 */
export async function getRecentlyPlayed(token, limit = 20) {
  try {
    const response = await axios.get(`${SPOTIFY_API_BASE}/me/player/recently-played`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        limit,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recently played tracks:', error);
    throw error;
  }
}

/**
 * Refresh access token using refresh token
 * @param {Object} token - Token object with refresh token
 * @returns {Promise<Object>} - Updated token object
 */
export async function refreshAccessToken(token) {
  try {
    const url = 'https://accounts.spotify.com/api/token';
    const params = new URLSearchParams();
    params.append('grant_type', 'refresh_token');
    params.append('refresh_token', token.refreshToken);

    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
      },
    });

    const refreshedToken = {
      ...token,
      accessToken: response.data.access_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
    };

    if (response.data.refresh_token) {
      refreshedToken.refreshToken = response.data.refresh_token;
    }

    return refreshedToken;
  } catch (error) {
    console.error('Error refreshing access token:', error);
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
EOL
  echo "Created spotify.js with proper exports"
fi

# 5. Fix cache.js import issues
echo "Fixing cache.js import issues..."
if [ -f "lib/cache.js" ]; then
  # Check if it imports mongodb but not as default
  if grep -q "import.*clientPromise.*from.*'./mongodb'" "lib/cache.js" && ! grep -q "import clientPromise from './mongodb'" "lib/cache.js"; then
    echo "Fixing clientPromise import in cache.js..."
    
    # Create a backup of the original file
    cp "lib/cache.js" "$BACKUP_DIR/cache.js.original"
    
    # Fix the import
    sed -i "s/import.*clientPromise.*from.*'\.\/mongodb'/import clientPromise from '.\/mongodb'/g" "lib/cache.js"
    echo "Fixed clientPromise import in cache.js"
  else
    echo "No clientPromise import issue found in cache.js"
  fi
else
  echo "Creating cache.js with proper imports..."
  
  # Create the directory if it doesn't exist
  mkdir -p "lib"
  
  # Create the file
  cat > "lib/cache.js" << 'EOL'
import clientPromise from './mongodb';

const CACHE_COLLECTION = 'cache';
const DEFAULT_TTL = 3600; // 1 hour in seconds

/**
 * Get cached data
 * @param {string} key - Cache key
 * @param {Object} params - Additional parameters to include in the cache key
 * @returns {Promise<any>} - Cached data or null if not found or expired
 */
export async function getCachedData(key, params = {}) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Create a composite key with params
    const compositeKey = createCompositeKey(key, params);
    
    // Find the cache entry
    const cacheEntry = await collection.findOne({ key: compositeKey });
    
    // If no cache entry or expired, return null
    if (!cacheEntry || isExpired(cacheEntry)) {
      return null;
    }
    
    return cacheEntry.data;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
}

/**
 * Cache data
 * @param {string} key - Cache key
 * @param {Object} params - Additional parameters to include in the cache key
 * @param {any} data - Data to cache
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function cacheData(key, params = {}, data, ttl = DEFAULT_TTL) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    // Create a composite key with params
    const compositeKey = createCompositeKey(key, params);
    
    // Calculate expiration time
    const expiresAt = new Date(Date.now() + ttl * 1000);
    
    // Upsert the cache entry
    await collection.updateOne(
      { key: compositeKey },
      {
        $set: {
          key: compositeKey,
          data,
          expiresAt,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Error caching data:', error);
    return false;
  }
}

/**
 * Clear cache
 * @param {string} key - Cache key (optional, if not provided, clears all cache)
 * @param {Object} params - Additional parameters to include in the cache key
 * @returns {Promise<boolean>} - True if successful, false otherwise
 */
export async function clearCache(key = null, params = {}) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const collection = db.collection(CACHE_COLLECTION);
    
    if (key) {
      // Create a composite key with params
      const compositeKey = createCompositeKey(key, params);
      
      // Delete specific cache entry
      await collection.deleteOne({ key: compositeKey });
    } else {
      // Delete all cache entries
      await collection.deleteMany({});
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing cache:', error);
    return false;
  }
}

/**
 * Create a composite key with params
 * @param {string} key - Base key
 * @param {Object} params - Additional parameters
 * @returns {string} - Composite key
 */
function createCompositeKey(key, params) {
  if (!params || Object.keys(params).length === 0) {
    return key;
  }
  
  // Sort params by key to ensure consistent key generation
  const sortedParams = Object.keys(params).sort().reduce((obj, paramKey) => {
    obj[paramKey] = params[paramKey];
    return obj;
  }, {});
  
  return `${key}:${JSON.stringify(sortedParams)}`;
}

/**
 * Check if cache entry is expired
 * @param {Object} cacheEntry - Cache entry
 * @returns {boolean} - True if expired, false otherwise
 */
function isExpired(cacheEntry) {
  return new Date() > new Date(cacheEntry.expiresAt);
}
EOL
  echo "Created cache.js with proper imports"
fi

# 6. Fix next.config.js to disable CSS optimization
echo "Fixing next.config.js configuration..."
if [ -f "next.config.js" ]; then
  # Backup the existing file
  cp "next.config.js" "$BACKUP_DIR/next.config.js.original"
  
  # Check if optimizeCss is enabled
  if grep -q "optimizeCss: true" "next.config.js"; then
    echo "Disabling optimizeCss in next.config.js..."
    sed -i 's/optimizeCss: true/optimizeCss: false/g' "next.config.js"
    echo "Disabled optimizeCss in next.config.js"
  else
    echo "Creating new next.config.js with safe defaults..."
    cat > "next.config.js" << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Disable experimental features that might cause issues
    appDir: false,
    optimizeCss: false,
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
EOL
    echo "Created new next.config.js with safe defaults"
  fi
else
  echo "Creating next.config.js with safe defaults..."
  cat > "next.config.js" << 'EOL'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  experimental: {
    // Disable experimental features that might cause issues
    appDir: false,
    optimizeCss: false,
    serverComponentsExternalPackages: [],
  },
}

module.exports = nextConfig
EOL
  echo "Created next.config.js with safe defaults"
fi

# Create a deployment script
echo "Creating deployment script..."

cat > deploy-tailored.sh << 'EOL'
#!/bin/bash

# TIKO Platform Tailored Deployment Script
# This script deploys the application with tailored fixes

echo "Starting tailored deployment at $(date +%Y%m%d%H%M%S)"

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || { echo "Error: Could not navigate to project directory"; exit 1; }

# Clear Heroku build cache
echo "Clearing Heroku build cache..."
heroku plugins:install heroku-builds 2>/dev/null || echo "Heroku builds plugin already installed"
heroku builds:cache:purge -a sonar-edm-user --confirm sonar-edm-user

# Commit changes
echo "Committing changes..."
git add package.json package-lock.json next.config.js lib/mongodb.js lib/spotify.js lib/cache.js pages/api/auth/[...nextauth].js
git commit -m "Fix dependencies and export issues with tailored approach"

# Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "Deployment completed at $(date +%Y%m%d%H%M%S)"
echo "Your TIKO platform is now available at your Heroku URL"
EOL

chmod +x deploy-tailored.sh

echo "Tailored fix script completed successfully!"
echo "To fix the dependencies and deploy your application:"
echo "1. Copy this script to /c/sonar/users/sonar-edm-user/"
echo "2. Make it executable: chmod +x tiko-tailored-fix.sh"
echo "3. Run it: ./tiko-tailored-fix.sh"
echo "4. Deploy with the tailored script: ./deploy-tailored.sh"
