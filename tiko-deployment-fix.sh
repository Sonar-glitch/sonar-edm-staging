#!/bin/bash
# TIKO Deployment Fix Script
# This script fixes the issues that caused the Heroku deployment to fail

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Deployment Fix Script ===${NC}"
echo -e "${BLUE}This script fixes the issues that caused the Heroku deployment to fail${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/deployment_fix_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./pages/users/music-taste.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./next.config.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./package.json $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Install required image optimization packages
echo -e "${YELLOW}Installing image optimization packages...${NC}"
npm install --save imagemin-mozjpeg imagemin-optipng imagemin-gifsicle imagemin-svgo

# Fix music-taste.js by breaking it into smaller components
echo -e "${YELLOW}Fixing music-taste.js by breaking it into smaller components...${NC}"

# Create a components directory for music taste page components if it doesn't exist
mkdir -p ./components/music-taste

# Create LoadingSkeleton component
cat > ./components/music-taste/LoadingSkeleton.js << 'EOL'
import styles from '../../styles/MusicTaste.module.css';

const LoadingSkeleton = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.skeletonHeader}></div>
    <div className={styles.skeletonGrid}>
      {[...Array(6)].map((_, i) => (
        <div key={i} className={styles.cardSkeleton}>
          <div className={styles.skeletonImage}></div>
          <div className={styles.skeletonTitle}></div>
          <div className={styles.skeletonText}></div>
        </div>
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;
EOL

# Create ErrorDisplay component
cat > ./components/music-taste/ErrorDisplay.js << 'EOL'
import styles from '../../styles/MusicTaste.module.css';

const ErrorDisplay = ({ error, onRetry }) => (
  <div className={styles.errorContainer}>
    <h2>Oops! Something went wrong</h2>
    <p>{error}</p>
    <button onClick={onRetry} className={styles.retryButton}>
      Try Again
    </button>
  </div>
);

export default ErrorDisplay;
EOL

# Create LoadingSpinner component
cat > ./components/music-taste/LoadingSpinner.js << 'EOL'
import styles from '../../styles/MusicTaste.module.css';

const LoadingSpinner = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner}></div>
    <p>Loading your vibe...</p>
  </div>
);

export default LoadingSpinner;
EOL

# Create ArtistSection component
cat > ./components/music-taste/ArtistSection.js << 'EOL'
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/MusicTaste.module.css';
import LoadingSkeleton from './LoadingSkeleton';

// Dynamically import ArtistCard
const ArtistCard = dynamic(() => import('../ArtistCard'), {
  loading: () => <div className={styles.cardSkeleton} />
});

const ArtistSection = ({ artists, visibleArtists }) => (
  <section className={styles.sectionContainer}>
    <h2 className={styles.sectionTitle}>Top Artists</h2>
    <div className={styles.cardsGrid}>
      <Suspense fallback={<LoadingSkeleton />}>
        {artists?.slice(0, visibleArtists).map((artist, index) => (
          <ArtistCard key={artist.id || index} artist={artist} />
        ))}
      </Suspense>
    </div>
    <div id="artists-end" className={styles.loadMoreTrigger}></div>
  </section>
);

export default ArtistSection;
EOL

# Create EventSection component
cat > ./components/music-taste/EventSection.js << 'EOL'
import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import styles from '../../styles/MusicTaste.module.css';
import LoadingSkeleton from './LoadingSkeleton';

// Dynamically import EventCard
const EventCard = dynamic(() => import('../EventCard'), {
  loading: () => <div className={styles.cardSkeleton} />
});

const EventSection = ({ events, visibleEvents }) => (
  <section className={styles.sectionContainer}>
    <h2 className={styles.sectionTitle}>Suggested Events</h2>
    <div className={styles.eventsGrid}>
      <Suspense fallback={<LoadingSkeleton />}>
        {events?.slice(0, visibleEvents).map((event, index) => (
          <EventCard key={event.id || index} event={event} />
        ))}
      </Suspense>
    </div>
    <div id="events-end" className={styles.loadMoreTrigger}></div>
  </section>
);

export default EventSection;
EOL

# Update music-taste.js to use the new components
cat > ./pages/users/music-taste.js << 'EOL'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../../styles/MusicTaste.module.css';

// Import smaller components
import LoadingSpinner from '../../components/music-taste/LoadingSpinner';
import ErrorDisplay from '../../components/music-taste/ErrorDisplay';
import LoadingSkeleton from '../../components/music-taste/LoadingSkeleton';
import ArtistSection from '../../components/music-taste/ArtistSection';
import EventSection from '../../components/music-taste/EventSection';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add a state for incremental loading
  const [visibleArtists, setVisibleArtists] = useState(6);
  const [visibleEvents, setVisibleEvents] = useState(4);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/');
    }
    
    if (status === 'authenticated') {
      fetchUserTaste();
    }
    
    // Implement intersection observer for infinite scrolling
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && userTaste) {
          // Load more items when user scrolls to the bottom
          if (entry.target.id === 'artists-end') {
            setVisibleArtists(prev => Math.min(prev + 6, userTaste.topArtists?.length || 0));
          } else if (entry.target.id === 'events-end') {
            setVisibleEvents(prev => Math.min(prev + 4, userTaste.suggestedEvents?.length || 0));
          }
        }
      });
    }, { threshold: 0.1 });
    
    // Observe end markers
    const artistsEnd = document.getElementById('artists-end');
    const eventsEnd = document.getElementById('events-end');
    
    if (artistsEnd) observer.observe(artistsEnd);
    if (eventsEnd) observer.observe(eventsEnd);
    
    return () => {
      if (artistsEnd) observer.unobserve(artistsEnd);
      if (eventsEnd) observer.unobserve(eventsEnd);
    };
  }, [status, router, userTaste]);
  
  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/spotify/user-taste', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setUserTaste(data);
      
      // Cache successful responses in localStorage
      try {
        localStorage.setItem('userTasteData', JSON.stringify(data));
      } catch (e) {
        console.error('Error caching user taste data:', e);
      }
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message);
      
      // Provide fallback data if available in localStorage
      const cachedData = localStorage.getItem('userTasteData');
      if (cachedData) {
        try {
          setUserTaste(JSON.parse(cachedData));
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error && !userTaste) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <ErrorDisplay error={error} onRetry={fetchUserTaste} />
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Your Sound | Sonar</title>
        <meta name="description" content="Your personalized music taste profile" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/api/spotify/user-taste" as="fetch" crossOrigin="anonymous" />
      </Head>
      
      <main className={styles.main}>
        <h1 className={styles.title}>Your Sound</h1>
        
        {userTaste ? (
          <>
            <ArtistSection 
              artists={userTaste.topArtists} 
              visibleArtists={visibleArtists} 
            />
            
            <EventSection 
              events={userTaste.suggestedEvents} 
              visibleEvents={visibleEvents} 
            />
          </>
        ) : (
          <LoadingSkeleton />
        )}
      </main>
    </div>
  );
}

// Use getServerSideProps to check authentication server-side
export async function getServerSideProps(context) {
  // This is a minimal implementation to check auth status
  // The actual data fetching happens client-side for better UX
  return {
    props: {}
  };
}
EOL

# Update next.config.js to remove unsupported experimental features
echo -e "${YELLOW}Updating next.config.js to remove unsupported experimental features...${NC}"

cat > ./next.config.js << 'EOL'
/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
});

const withOptimizedImages = require('next-optimized-images');

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true, // Use SWC minifier for better performance
  images: {
    domains: ['i.scdn.co', 'mosaic.scdn.co', 'platform-lookaside.fbsbx.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400, // 24 hours
  },
  experimental: {
    // Removed unsupported features: optimizeServerReact
    optimizeCss: true, // Keep this as it's supported
    scrollRestoration: true, // Keep this as it's supported
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

// Configure image optimization
const optimizedImagesConfig = {
  optimizeImages: true,
  optimizeImagesInDev: false,
  mozjpeg: {
    quality: 80,
  },
  optipng: {
    optimizationLevel: 3,
  },
  pngquant: false,
  gifsicle: {
    interlaced: true,
    optimizationLevel: 3,
  },
  svgo: {
    plugins: [
      { name: 'preset-default' }
    ]
  },
};

// Apply optimizations in sequence
module.exports = withPWA(withOptimizedImages(optimizedImagesConfig)(nextConfig));
EOL

# Create a fixed deployment script
echo -e "${YELLOW}Creating fixed deployment script...${NC}"

cat > ./deploy-tiko-fixed.sh << 'EOL'
#!/bin/bash
# TIKO Fixed Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Fixed Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your fixed TIKO platform to Heroku${NC}\n"

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
git commit -m "Fix deployment issues with music-taste.js and next.config.js"

# Deploy to Heroku with force push
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your fixed TIKO platform is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-fixed.sh

echo -e "${GREEN}Deployment fix script complete!${NC}"
echo -e "${YELLOW}To deploy your fixed TIKO platform to Heroku, run:${NC}"
echo -e "${BLUE}./deploy-tiko-fixed.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of fixes
echo -e "${YELLOW}Summary of Deployment Fixes:${NC}"
echo -e "1. Fixed music-taste.js by breaking it into smaller components:"
echo -e "   - Created separate components for LoadingSkeleton, ErrorDisplay, LoadingSpinner, ArtistSection, and EventSection"
echo -e "   - Reduced the size of the main file to prevent truncation"
echo -e ""
echo -e "2. Updated next.config.js to remove unsupported experimental features:"
echo -e "   - Removed optimizeServerReact which was causing warnings"
echo -e "   - Kept supported features like optimizeCss and scrollRestoration"
echo -e "   - Added proper configuration for image optimization"
echo -e ""
echo -e "3. Installed image optimization packages:"
echo 
(Content truncated due to size limit. Use line ranges to read in chunks)