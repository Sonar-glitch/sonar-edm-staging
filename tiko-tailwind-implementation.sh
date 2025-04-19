#!/bin/bash
# TIKO Tailwind CSS Implementation Script
# This script implements Tailwind CSS and fixes the EventCard.js syntax error

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Tailwind CSS Implementation Script ===${NC}"
echo -e "${BLUE}This script implements Tailwind CSS and fixes the EventCard.js syntax error${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/tailwind_fix_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./components/EventCard.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/ArtistCard.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/ArtistSection.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/EventSection.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/LoadingSkeleton.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/ErrorDisplay.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/LoadingSpinner.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/common/ErrorBoundary.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/common/SafeContent.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/users/music-taste.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./package.json $BACKUP_DIR/ 2>/dev/null || :
cp -r ./next.config.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles/globals.css $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Install Tailwind CSS and its dependencies
echo -e "${YELLOW}Installing Tailwind CSS and its dependencies...${NC}"
npm install -D tailwindcss postcss autoprefixer

# Initialize Tailwind CSS
echo -e "${YELLOW}Initializing Tailwind CSS...${NC}"
npx tailwindcss init -p

# Create Tailwind CSS configuration file
echo -e "${YELLOW}Creating Tailwind CSS configuration file...${NC}"

cat > ./tailwind.config.js << 'EOL'
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef',
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        dark: '#0a0014',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
    },
  },
  plugins: [],
}
EOL

# Update globals.css to include Tailwind directives
echo -e "${YELLOW}Updating globals.css with Tailwind directives...${NC}"

cat > ./styles/globals.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 255, 255, 255;
  --background-start-rgb: 10, 0, 20;
  --background-end-rgb: 0, 0, 0;
}

body {
  color: rgb(var(--foreground-rgb));
  background: linear-gradient(
      to bottom,
      transparent,
      rgb(var(--background-end-rgb))
    )
    rgb(var(--background-start-rgb));
  min-height: 100vh;
}

@layer components {
  .card {
    @apply bg-opacity-30 bg-black border border-gray-800 rounded-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1;
  }
  
  .card-body {
    @apply p-4;
  }
  
  .card-title {
    @apply text-lg font-bold mb-2 truncate;
  }
  
  .badge {
    @apply px-2 py-1 text-xs rounded-full mr-1 mb-1;
  }
  
  .badge-primary {
    @apply bg-primary-600 text-white;
  }
  
  .badge-secondary {
    @apply bg-secondary-600 text-white;
  }
  
  .btn {
    @apply px-4 py-2 rounded-md font-medium transition-colors duration-200;
  }
  
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white;
  }
  
  .btn-secondary {
    @apply bg-secondary-600 hover:bg-secondary-700 text-white;
  }
  
  .container-xl {
    @apply container mx-auto px-4 max-w-7xl;
  }
  
  .loading-spinner {
    @apply flex flex-col items-center justify-center py-12;
  }
  
  .error-container {
    @apply p-4 rounded-md bg-red-900 bg-opacity-20 border-l-4 border-red-600 my-4;
  }
}
EOL

# Update ErrorBoundary.js to use Tailwind CSS
echo -e "${YELLOW}Updating ErrorBoundary.js to use Tailwind CSS...${NC}"

mkdir -p ./components/common

cat > ./components/common/ErrorBoundary.js << 'EOL'
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when an error occurs
      return (
        <div className="error-container">
          <h3 className="font-bold mb-2">Something went wrong</h3>
          <p className="text-sm mb-3">
            {this.state.error && this.state.error.toString()}
          </p>
          <button 
            className="btn btn-primary text-sm"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
EOL

# Update SafeContent.js
echo -e "${YELLOW}Updating SafeContent.js...${NC}"

cat > ./components/common/SafeContent.js << 'EOL'
import React from 'react';

// This component safely handles textContent by checking for null values
const SafeContent = ({ element, fallback = '', className = '' }) => {
  const [content, setContent] = React.useState(fallback);
  
  React.useEffect(() => {
    // Only try to access textContent if element exists
    if (element && element.textContent) {
      setContent(element.textContent);
    }
  }, [element]);
  
  return <span className={className}>{content}</span>;
};

export default SafeContent;
EOL

# Update music-taste.js to use Tailwind CSS
echo -e "${YELLOW}Updating music-taste.js to use Tailwind CSS...${NC}"

cat > ./pages/users/music-taste.js << 'EOL'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import LoadingSkeleton from '../../components/music-taste/LoadingSkeleton';
import ErrorDisplay from '../../components/music-taste/ErrorDisplay';
import ArtistSection from '../../components/music-taste/ArtistSection';
import EventSection from '../../components/music-taste/EventSection';
import LoadingSpinner from '../../components/music-taste/LoadingSpinner';

// Safely access localStorage with try/catch
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error setting localStorage:', e);
    }
  }
};

const MusicTaste = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add timeout state to handle API timeouts
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  useEffect(() => {
    // Set a timeout for API calls
    const timeoutId = setTimeout(() => {
      if (loading) {
        setIsTimedOut(true);
        // Try to use cached data if available
        const cachedData = safeLocalStorage.getItem('userTasteData');
        if (cachedData) {
          try {
            setUserTaste(JSON.parse(cachedData));
            setLoading(false);
          } catch (e) {
            console.error('Error parsing cached data:', e);
          }
        }
      }
    }, 15000); // 15 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  useEffect(() => {
    // Only fetch if authenticated
    if (status === 'authenticated') {
      fetchUserTaste();
    } else if (status === 'unauthenticated') {
      // Redirect to home if not authenticated
      router.push('/');
    }
    
    // Cleanup function
    return () => {
      // Any cleanup needed
    };
  }, [status]);
  
  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/spotify/user-taste');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate data structure to prevent null reference errors
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received');
      }
      
      // Ensure required properties exist
      const validatedData = {
        topArtists: Array.isArray(data.topArtists) ? data.topArtists : [],
        topTracks: Array.isArray(data.topTracks) ? data.topTracks : [],
        events: Array.isArray(data.events) ? data.events : [],
        location: data.location || { city: 'Unknown', country: 'Unknown' },
        genres: Array.isArray(data.genres) ? data.genres : []
      };
      
      setUserTaste(validatedData);
      
      // Cache the validated data
      safeLocalStorage.setItem('userTasteData', JSON.stringify(validatedData));
      
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message || 'Failed to load your music taste data');
      
      // Try to use cached data if available
      const cachedData = safeLocalStorage.getItem('userTasteData');
      if (cachedData) {
        try {
          setUserTaste(JSON.parse(cachedData));
          // Show toast notification
          alert('Using cached data. We encountered an error but loaded your previous data.');
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <div className="container-xl py-8">
          <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
          {isTimedOut ? (
            <ErrorDisplay 
              message="Taking longer than expected. Please wait or refresh the page." 
              retry={fetchUserTaste} 
            />
          ) : (
            <LoadingSpinner message="Loading your vibe..." />
          )}
        </div>
      </>
    );
  }
  
  // Render error state
  if (error && !userTaste) {
    return (
      <>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <div className="container-xl py-8">
          <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
          <ErrorDisplay message={error} retry={fetchUserTaste} />
        </div>
      </>
    );
  }
  
  // Safely check if userTaste exists before rendering
  if (!userTaste) {
    return (
      <>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <div className="container-xl py-8">
          <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
          <p>No music taste data available. Please connect your Spotify account.</p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>Your Sound | Sonar</title>
      </Head>
      <div className="container-xl py-8">
        <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Your Location
          </h2>
          <p className="text-xl">
            {userTaste.location && (
              <>
                {userTaste.location.city || 'Unknown City'}, {userTaste.location.country || 'Unknown Country'}
              </>
            )}
          </p>
        </div>
        
        <ErrorBoundary>
          <ArtistSection artists={userTaste.topArtists || []} />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <EventSection events={userTaste.events || []} />
        </ErrorBoundary>
      </div>
    </>
  );
};

export default MusicTaste;
EOL

# Update ArtistSection.js to use Tailwind CSS
echo -e "${YELLOW}Updating ArtistSection.js to use Tailwind CSS...${NC}"

mkdir -p ./components/music-taste

cat > ./components/music-taste/ArtistSection.js << 'EOL'
import React from 'react';
import ArtistCard from '../ArtistCard';
import ErrorBoundary from '../common/ErrorBoundary';

const ArtistSection = ({ artists = [] }) => {
  // Ensure artists is always an array
  const safeArtists = Array.isArray(artists) ? artists : [];
  
  if (safeArtists.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Your Top Artists
        </h2>
        <p>No artist data available.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">
        Your Top Artists
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {safeArtists.map((artist, index) => (
          <ErrorBoundary key={artist.id || index}>
            <ArtistCard artist={artist} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
};

export default ArtistSection;
EOL

# Update EventSection.js to use Tailwind CSS
echo -e "${YELLOW}Updating EventSection.js to use Tailwind CSS...${NC}"

cat > ./components/music-taste/EventSection.js << 'EOL'
import React from 'react';
import EventCard from '../EventCard';
import ErrorBoundary from '../common/ErrorBoundary';

const EventSection = ({ events = [] }) => {
  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];
  
  if (safeEvents.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Recommended Events
        </h2>
        <p>No event recommendations available for your area.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">
        Recommended Events
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {safeEvents.map((event, index) => (
          <ErrorBoundary key={event.id || index}>
            <EventCard event={event} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
};

export default EventSection;
EOL

# Update LoadingSkeleton.js to use Tailwind CSS
echo -e "${YELLOW}Updating LoadingSkeleton.js to use Tailwind CSS...${NC}"

cat > ./components/music-taste/LoadingSkeleton.js << 'EOL'
import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="card">
            <div 
(Content truncated due to size limit. Use line ranges to read in chunks)