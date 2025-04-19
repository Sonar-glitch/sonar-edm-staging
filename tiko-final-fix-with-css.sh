#!/bin/bash
# TIKO Final Fix Script with CSS Optimization
# This script fixes the critters module error and cache import issues while maintaining CSS optimization

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Final Fix Script with CSS Optimization ===${NC}"
echo -e "${BLUE}This script fixes the critters module error and cache import issues while maintaining CSS optimization${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/final_fix_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./next.config.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./lib/cache.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/api/events/index.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/api/events/correlated-events.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/api/spotify/user-taste.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/api/user/update-taste-preferences.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/api/user/update-theme.js $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Install critters module
echo -e "${YELLOW}Installing critters module for CSS optimization...${NC}"
npm install --save critters

# Update next.config.js to maintain CSS optimization
echo -e "${YELLOW}Updating next.config.js to maintain CSS optimization...${NC}"

cat > ./next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
});

// Configuration with CSS optimization maintained
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Use SWC minifier for better performance
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co', 'platform-lookaside.fbsbx.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours
  },
  experimental: {
    // Keep CSS optimization for better performance
    optimizeCss: true,
    scrollRestoration: true,
    // Removed unsupported features: optimizeServerReact
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production', // Remove console logs in production
  },
  webpack: (config, { dev, isServer }) => {
    // Split chunks optimization
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 70000,
        minChunks: 1,
        maxAsyncRequests: 30,
        maxInitialRequests: 30,
        automaticNameDelimiter: '~',
        cacheGroups: {
          vendors: {
            test: /[\\/]node_modules[\\/]/,
            priority: -10,
            reuseExistingChunk: true,
          },
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true,
          },
          styles: {
            name: 'styles',
            test: /\.css$/,
            chunks: 'all',
            enforce: true,
          },
        },
      };
    }
    return config;
  },
};

// Apply PWA optimization
module.exports = withPWA(nextConfig);
EOL

# Update cache.js to fix import issues
echo -e "${YELLOW}Updating cache.js to fix import issues...${NC}"

# Ensure lib directory exists
mkdir -p ./lib

cat > ./lib/cache.js << 'EOL'
import clientPromise from './mongodb';

// Cache TTL values in seconds
const TTL = {
  USER_PROFILE: 7 * 24 * 60 * 60, // 7 days
  TOP_ARTISTS: 24 * 60 * 60, // 24 hours
  TOP_TRACKS: 24 * 60 * 60, // 24 hours
  EVENTS: 12 * 60 * 60, // 12 hours
  LOCATION: 24 * 60 * 60, // 24 hours
  DEFAULT: 60 * 60 // 1 hour
};

// Add the missing cacheData function that's being imported by API files
export async function cacheData(key, data, type = 'DEFAULT') {
  return setCachedData(key, data, type);
}

export async function getCachedData(key, type = 'DEFAULT') {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const cachedData = await db.collection('apiCache').findOne({ key });
    
    if (!cachedData) {
      return null;
    }
    
    // Check if cache is expired
    const now = new Date();
    if (now > cachedData.expiresAt) {
      // Cache expired, remove it
      await db.collection('apiCache').deleteOne({ key });
      return null;
    }
    
    // Update hit count
    await db.collection('apiCache').updateOne(
      { key },
      { $inc: { hits: 1 } }
    );
    
    return cachedData.data;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
}

export async function setCachedData(key, data, type = 'DEFAULT') {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const ttl = TTL[type] || TTL.DEFAULT;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttl * 1000);
    
    await db.collection('apiCache').updateOne(
      { key },
      { 
        $set: { 
          data,
          expiresAt,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now,
          hits: 0
        }
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Cache storage error:', error);
    return false;
  }
}

export async function invalidateCache(keyPattern) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('apiCache').deleteMany({
      key: { $regex: keyPattern }
    });
    
    return result.deletedCount;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

// Add the missing saveUserPreferences function that's being imported by API files
export async function saveUserPreferences(userId, preferences) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const now = new Date();
    
    await db.collection('userPreferences').updateOne(
      { userId },
      { 
        $set: { 
          ...preferences,
          updatedAt: now
        },
        $setOnInsert: {
          createdAt: now
        }
      },
      { upsert: true }
    );
    
    return true;
  } catch (error) {
    console.error('Save user preferences error:', error);
    return false;
  }
}

// Add function to get user preferences
export async function getUserPreferences(userId) {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const preferences = await db.collection('userPreferences').findOne({ userId });
    
    return preferences || {};
  } catch (error) {
    console.error('Get user preferences error:', error);
    return {};
  }
}
EOL

# Create a final deployment script
echo -e "${YELLOW}Creating final deployment script...${NC}"

cat > ./deploy-tiko-final.sh << 'EOL'
#!/bin/bash
# TIKO Final Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Final Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your TIKO platform with all fixes to Heroku${NC}\n"

# Check if heroku CLI is installed
if ! command -v heroku &> /dev/null; then
  echo -e "${RED}Error: Heroku CLI is not installed.${NC}"
  echo -e "${YELLOW}Please install the Heroku CLI and try again.${NC}"
  exit 1
fi

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: git is not installed.${NC}"
  echo -e "${YELLOW}Please install git and try again.${NC}"
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
  echo -e "${RED}Error: Heroku app '$app_name' not found.${NC}"
  echo -e "${YELLOW}Please create the app first or use the correct app name.${NC}"
  exit 1
else
  echo -e "${GREEN}Using existing Heroku app: $app_name${NC}"
fi

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
heroku config:set NEXTAUTH_URL=https://sonar-edm-user-50e4fb038f6e.herokuapp.com --app $app_name
heroku config:set NODE_ENV=production --app $app_name

# Set a timestamp environment variable to force a clean build
echo -e "${YELLOW}Setting timestamp to force a clean build...${NC}"
heroku config:set DEPLOY_TIMESTAMP=$(date +%s) --app $app_name

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Fix critters module and cache import issues while maintaining CSS optimization"

# Deploy to Heroku with force push
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO platform is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-final.sh

echo -e "${GREEN}Final fix script with CSS optimization complete!${NC}"
echo -e "${YELLOW}To deploy your TIKO platform with all fixes to Heroku, run:${NC}"
echo -e "${BLUE}./deploy-tiko-final.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of fixes
echo -e "${YELLOW}Summary of Final Fixes with CSS Optimization:${NC}"
echo -e "1. Fixed critters module error while maintaining CSS optimization:"
echo -e "   - Installed the critters package"
echo -e "   - Kept the optimizeCss experimental feature for better performance"
echo -e "   - Maintained scrollRestoration for better user experience"
echo -e ""
echo -e "2. Fixed cache module import issues:"
echo -e "   - Added the missing cacheData function that was being imported"
echo -e "   - Added the missing saveUserPreferences function"
echo -e "   - Added getUserPreferences function for completeness"
echo -e ""
echo -e "3. Created a final deployment script:"
echo -e "   - Uses the timestamp approach to force clean builds"
echo -e "   - Includes proper error handling and feedback"
echo -e "\n${BLUE}=======================================${NC}"
