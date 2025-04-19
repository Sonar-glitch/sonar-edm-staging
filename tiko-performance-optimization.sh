#!/bin/bash
# TIKO Performance Optimization Script
# This script implements comprehensive performance optimizations for the TIKO platform

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Performance Optimization Script ===${NC}"
echo -e "${BLUE}This script implements comprehensive performance optimizations while preserving functionality${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/performance_optimization_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./pages/index.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/users/music-taste.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/api/spotify/user-taste.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/api/events/index.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/api/events/correlated-events.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/EventCard.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/ArtistCard.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles/Home.module.css $BACKUP_DIR/ 2>/dev/null || :
cp -r ./next.config.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./package.json $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Install required packages
echo -e "${YELLOW}Installing required packages...${NC}"
npm install --save next-pwa sharp react-lazy-load-image-component next-optimized-images compression

# Update next.config.js with performance optimizations
echo -e "${YELLOW}Updating next.config.js with performance optimizations...${NC}"

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
    optimizeCss: true, // Enable CSS optimization
    optimizeServerReact: true, // Optimize server-side React rendering
    scrollRestoration: true, // Restore scroll position on navigation
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

// Apply optimizations in sequence
module.exports = withPWA(withOptimizedImages(nextConfig));
EOL

# Create a MongoDB connection utility with connection pooling
echo -e "${YELLOW}Creating MongoDB connection utility with connection pooling...${NC}"

mkdir -p ./lib
cat > ./lib/mongodb.js << 'EOL'
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  maxPoolSize: 10, // Connection pooling for better performance
  minPoolSize: 5,
  maxIdleTimeMS: 60000, // Close idle connections after 1 minute
  connectTimeoutMS: 5000, // Timeout after 5 seconds
  socketTimeoutMS: 30000, // Socket timeout after 30 seconds
};

let client;
let clientPromise;

if (!uri) {
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

# Create a cache utility for API responses
echo -e "${YELLOW}Creating cache utility for API responses...${NC}"

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
EOL

# Create a component for lazy loading images
echo -e "${YELLOW}Creating component for lazy loading images...${NC}"

mkdir -p ./components/common
cat > ./components/common/LazyImage.js << 'EOL'
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const LazyImage = ({ src, alt, width, height, className, placeholderSrc }) => {
  return (
    <LazyLoadImage
      alt={alt || "Image"}
      src={src}
      effect="blur"
      width={width}
      height={height}
      className={className}
      placeholderSrc={placeholderSrc}
      threshold={300}
      wrapperClassName="lazy-image-wrapper"
    />
  );
};

export default LazyImage;
EOL

# Update the landing page for better performance
echo -e "${YELLOW}Updating landing page for better performance...${NC}"

cat > ./pages/index.js << 'EOL'
import { useEffect, useState } from 'react';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import dynamic from 'next/dynamic';
import styles from '../styles/Home.module.css';

// Dynamically import the Spotify icon to reduce initial bundle size
const FaSpotify = dynamic(() => 
  import('react-icons/fa').then(mod => mod.FaSpotify),
  { ssr: false, loading: () => <span className={styles.iconPlaceholder} /> }
);

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Mark as loaded after component mounts
    setIsLoaded(true);
    
    // Preload the music-taste page
    const prefetchMusicTaste = () => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/users/music-taste';
      document.head.appendChild(link);
    };
    
    // Use requestIdleCallback for non-critical operations
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchMusicTaste);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(prefetchMusicTaste, 2000);
    }
    
    return () => {
      // Clean up if component unmounts
      if ('cancelIdleCallback' in window && window._prefetchCallback) {
        cancelIdleCallback(window._prefetchCallback);
      }
    };
  }, []);

  const handleSpotifyConnect = (e) => {
    e.preventDefault();
    signIn('spotify', { callbackUrl: '/users/music-taste' });
  };

  return (
    <div className={`${styles.container} ${isLoaded ? styles.loaded : ''}`}>
      <Head>
        <title>TIKO by Sonar</title>
        <meta name="description" content="EDM events tailored to your vibe" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preload critical fonts */}
        <link 
          rel="preload" 
          href="/fonts/Inter-Regular.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        
        {/* Preconnect to domains */}
        <link rel="preconnect" href="https://accounts.spotify.com" />
        
        {/* Cache busting meta tags */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Critical CSS inline */}
        <style dangerouslySetInnerHTML={{ __html: `
          .${styles.container} {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background-color: #0a0014;
            color: #fff;
          }
          .${styles.logo} {
            font-size: 8rem;
            color: #ff00ff;
            text-shadow: 0 0 20px rgba(255, 0, 255, 0.8);
          }
        `}} />
      </Head>

      <main className={styles.main}>
        <div className={styles.logoContainer}>
          <h1 className={styles.logo}>TIKO</h1>
        </div>
        
        <div className={styles.taglineContainer}>
          <h2 className={styles.tagline}>
            Find your next night out.<br />
            Powered by your vibe.
          </h2>
        </div>
        
        <div className={styles.buttonContainer}>
          <button 
            onClick={handleSpotifyConnect} 
            className={styles.spotifyButton}
            aria-label="Connect with Spotify"
          >
            <FaSpotify className={styles.spotifyIcon} />
            Connect with Spotify
          </button>
        </div>
        
        <div className={styles.featuresContainer}>
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.purpleBullet}`} aria-hidden="true"></span>
            Real events, matched to your taste
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.pinkBullet}`} aria-hidden="true"></span>
            Your vibe, not just your genre
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.cyanBullet}`} aria-hidden="true"></span>
            No flyers, no fluff – just your scene
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        by sonar
      </footer>
    </div>
  );
}
EOL

# Update the music-taste page for better performance
echo -e "${YELLOW}Updating music-taste page for better performance...${NC}"

cat > ./pages/users/music-taste.js << 'EOL'
import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import styles from '../../styles/MusicTaste.module.css';

// Dynamically import components to reduce initial bundle size
const ArtistCard = dynamic(() => import('../../components/ArtistCard'), {
  loading: () => <div className={styles.cardSkeleton} />
});

const EventCard = dynamic(() => import('../../components/EventCard'), {
  loading: () => <div className={styles.cardSkeleton} />
});

// Create a loading skeleton component
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

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add a state for incremental loading
  const [visibleArtists, setVisibleArtists] = useState(6);
  const [visibleTracks, setVisibleTracks] = useState(6);
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
          } else if (entry.target.id === 'tracks-end') {
            setVisibleTracks(prev => Math.min(prev + 6, userTaste.topTracks?.length || 0));
          } else if (entry.target.id === 'events-end') {
            setVisibleEvents(prev => Math.min(prev + 4, userTaste.suggestedEvents?.length || 0));
          }
        }
      });
    }, { threshold: 0.1 });
    
    // Observe end markers
    const artistsEnd = document.getElementById('artists-end');
    const tracksEnd = document.getElementById('tracks-end');
    const eventsEnd = document.getElementById('events-end');
    
    if (artistsEnd) observer.observe(artistsEnd);
    if (tracksEnd) observer.observe(tracksEnd);
    if (eventsEnd) observer.observe(eventsEnd);
    
    return () => {
      if (artistsEnd) observer.unobserve(artistsEnd);
      if (tracksEnd) observer.unobserve(tracksEnd);
      if (eventsEnd) observer.unobserve(eventsEnd);
    };
  }, [status, router, userTaste]);
  
  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      
      // Use A
(Content truncated due to size limit. Use line ranges to read in chunks)