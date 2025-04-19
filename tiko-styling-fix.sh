#!/bin/bash
# TIKO Styling Fix Script
# This script fixes the styling issues with the simplified components

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Styling Fix Script ===${NC}"
echo -e "${BLUE}This script fixes the styling issues with the simplified components${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/styling_fix_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./components/music-taste/LoadingSkeleton.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/ArtistSection.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/EventSection.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/ArtistCard.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/EventCard.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages/users/music-taste.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles/globals.css $BACKUP_DIR/ 2>/dev/null || :
cp -r ./tailwind.config.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./postcss.config.js $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Ensure Tailwind CSS is properly installed
echo -e "${YELLOW}Ensuring Tailwind CSS is properly installed...${NC}"
npm install -D tailwindcss postcss autoprefixer

# Create proper Tailwind configuration
echo -e "${YELLOW}Creating proper Tailwind configuration...${NC}"

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
        'neon-pink': '#ff00ff',
        'neon-blue': '#00ffff',
        'neon-purple': '#9900ff',
        'dark-bg': '#0a0014',
      },
      boxShadow: {
        'neon-pink': '0 0 5px #ff00ff, 0 0 10px #ff00ff',
        'neon-blue': '0 0 5px #00ffff, 0 0 10px #00ffff',
        'neon-purple': '0 0 5px #9900ff, 0 0 10px #9900ff',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}
EOL

# Create proper PostCSS configuration
echo -e "${YELLOW}Creating proper PostCSS configuration...${NC}"

cat > ./postcss.config.js << 'EOL'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOL

# Update globals.css with proper Tailwind directives and custom styles
echo -e "${YELLOW}Updating globals.css with proper Tailwind directives and custom styles...${NC}"

cat > ./styles/globals.css << 'EOL'
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --foreground-rgb: 255, 255, 255;
  --background-start-rgb: 10, 0, 20;
  --background-end-rgb: 0, 0, 0;
}

html {
  scroll-behavior: smooth;
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

/* Custom component styles */
.artist-card {
  @apply bg-gray-800 bg-opacity-30 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1 border border-gray-700;
}

.event-card {
  @apply bg-gray-800 bg-opacity-30 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-1 border border-gray-700;
}

.card-image {
  @apply w-full h-48 object-cover;
}

.card-body {
  @apply p-4;
}

.card-title {
  @apply font-bold text-lg mb-2 truncate;
}

.badge-primary {
  @apply bg-neon-blue text-white text-xs px-2 py-1 rounded-full mr-1 mb-1 shadow-neon-blue;
}

.badge-secondary {
  @apply bg-neon-pink text-white text-xs px-2 py-1 rounded-full mr-1 mb-1 shadow-neon-pink;
}

.btn-primary {
  @apply text-neon-blue hover:text-white hover:bg-neon-blue px-3 py-1 rounded-md transition-colors duration-200 inline-block mt-2 text-sm font-bold;
}

.btn-secondary {
  @apply text-neon-pink hover:text-white hover:bg-neon-pink px-3 py-1 rounded-md transition-colors duration-200 inline-block mt-2 text-sm font-bold;
}

.loading-spinner {
  @apply flex flex-col items-center justify-center py-12;
}

.spinner {
  @apply w-12 h-12 border-4 border-neon-blue border-t-transparent rounded-full animate-spin;
}

.error-container {
  @apply p-4 rounded-md bg-red-900 bg-opacity-20 border-l-4 border-red-600 my-4;
}

.page-container {
  @apply container mx-auto px-4 py-8 max-w-6xl;
}

.page-title {
  @apply text-3xl font-bold mb-6 text-white;
}

.section-title {
  @apply text-2xl font-bold mb-4 text-neon-blue;
}

.grid-layout {
  @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6;
}
EOL

# Update ArtistCard.js with improved styling
echo -e "${YELLOW}Updating ArtistCard.js with improved styling...${NC}"

cat > ./components/ArtistCard.js << 'EOL'
import React from 'react';

const ArtistCard = ({ artist }) => {
  if (!artist) return null;
  
  const name = artist.name || 'Unknown Artist';
  const imageUrl = artist.images && artist.images[0] ? artist.images[0].url : 'https://via.placeholder.com/300?text=No+Image';
  const genres = artist.genres || [];
  const popularity = artist.popularity || 0;
  const spotifyUrl = artist.external_urls && artist.external_urls.spotify ? artist.external_urls.spotify : '#';
  
  return (
    <div className="artist-card">
      <div className="relative overflow-hidden h-48">
        <img 
          src={imageUrl} 
          alt={name} 
          className="card-image"
          loading="lazy"
          onError={(e) => {e.target.src = 'https://via.placeholder.com/300?text=No+Image'}}
        />
      </div>
      <div className="card-body">
        <h3 className="card-title">{name}</h3>
        {genres.length > 0 && (
          <div className="flex flex-wrap mb-2">
            {genres.slice(0, 2).map((genre, i) => (
              <span key={i} className="badge-primary">
                {genre}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm mb-3">Popularity: {popularity}/100</p>
        <a 
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          View on Spotify
        </a>
      </div>
    </div>
  );
};

export default ArtistCard;
EOL

# Update EventCard.js with improved styling
echo -e "${YELLOW}Updating EventCard.js with improved styling...${NC}"

cat > ./components/EventCard.js << 'EOL'
import React from 'react';

const EventCard = ({ event }) => {
  if (!event) return null;
  
  const name = event.name || 'Unknown Event';
  const imageUrl = event.images && event.images[0] ? event.images[0].url : 'https://via.placeholder.com/300?text=No+Image';
  const date = event.date ? new Date(event.date).toLocaleDateString() : 'Date TBA';
  const venueName = event.venue && event.venue.name ? event.venue.name : 'Venue TBA';
  const location = event.venue && event.venue.location ? event.venue.location : 'Location TBA';
  const artists = event.artists || [];
  const ticketUrl = event.ticketUrl || '#';
  
  return (
    <div className="event-card">
      <div className="relative overflow-hidden h-48">
        <img 
          src={imageUrl} 
          alt={name} 
          className="card-image"
          loading="lazy"
          onError={(e) => {e.target.src = 'https://via.placeholder.com/300?text=No+Image'}}
        />
      </div>
      <div className="card-body">
        <h3 className="card-title">{name}</h3>
        <p className="text-sm mb-2"><strong>Date:</strong> {date}</p>
        <p className="text-sm mb-2"><strong>Venue:</strong> {venueName}</p>
        <p className="text-sm mb-3"><strong>Location:</strong> {location}</p>
        {artists.length > 0 && (
          <div className="flex flex-wrap mb-3">
            {artists.slice(0, 2).map((artist, i) => (
              <span key={i} className="badge-secondary">
                {typeof artist === 'string' ? artist : (artist.name || 'Unknown')}
              </span>
            ))}
          </div>
        )}
        <a 
          href={ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
        >
          Get Tickets
        </a>
      </div>
    </div>
  );
};

export default EventCard;
EOL

# Update ArtistSection.js with improved styling
echo -e "${YELLOW}Updating ArtistSection.js with improved styling...${NC}"

cat > ./components/music-taste/ArtistSection.js << 'EOL'
import React from 'react';
import ArtistCard from '../ArtistCard';

const ArtistSection = ({ artists = [] }) => {
  if (!artists || artists.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="section-title">Your Top Artists</h2>
        <p>No artist data available.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="section-title">Your Top Artists</h2>
      <div className="grid-layout">
        {artists.map((artist, index) => (
          <ArtistCard key={artist.id || index} artist={artist} />
        ))}
      </div>
    </div>
  );
};

export default ArtistSection;
EOL

# Update EventSection.js with improved styling
echo -e "${YELLOW}Updating EventSection.js with improved styling...${NC}"

cat > ./components/music-taste/EventSection.js << 'EOL'
import React from 'react';
import EventCard from '../EventCard';

const EventSection = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="section-title">Recommended Events</h2>
        <p>No event recommendations available for your area.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="section-title">Recommended Events</h2>
      <div className="grid-layout">
        {events.map((event, index) => (
          <EventCard key={event.id || index} event={event} />
        ))}
      </div>
    </div>
  );
};

export default EventSection;
EOL

# Update LoadingSkeleton.js with improved styling
echo -e "${YELLOW}Updating LoadingSkeleton.js with improved styling...${NC}"

cat > ./components/music-taste/LoadingSkeleton.js << 'EOL'
import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
      <div className="grid-layout mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="artist-card">
            <div className="h-48 bg-gray-700 rounded-t-lg"></div>
            <div className="card-body">
              <div className="h-5 bg-gray-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-2/3 mb-2"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
EOL

# Update music-taste.js with improved styling
echo -e "${YELLOW}Updating music-taste.js with improved styling...${NC}"

cat > ./pages/users/music-taste.js << 'EOL'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import LoadingSkeleton from '../../components/music-taste/LoadingSkeleton';
import ArtistSection from '../../components/music-taste/ArtistSection';
import EventSection from '../../components/music-taste/EventSection';

// Safe localStorage access
const safeStorage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)); } 
    catch (e) { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } 
    catch (e) { console.error('Storage error:', e); }
  }
};

const MusicTaste = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserTaste();
    } else if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status]);
  
  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/user-taste');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate data
      const validData = {
        topArtists: Array.isArray(data.topArtists) ? data.topArtists : [],
        topTracks: Array.isArray(data.topTracks) ? data.topTracks : [],
        events: Array.isArray(data.events) ? data.events : [],
        location: data.location || { city: 'Unknown', country: 'Unknown' },
        genres: Array.isArray(data.genres) ? data.genres : []
      };
      
      setUserTaste(validData);
      safeStorage.set('userTasteData', validData);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      
      // Try cached data
      const cached = safeStorage.get('userTasteData');
      if (cached) {
        setUserTaste(cached);
        alert('Using cached data due to error.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <>
        <Head><title>Your Sound | Sonar</title></Head>
        <div className="page-container">
          <h1 className="page-title">Your Sound | Sonar</h1>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p className="mt-4 text-xl">Loading your vibe...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (error && !userTaste) {
    return (
      <>
        <Head><title>Your Sound | Sonar</title></Head>
        <div className="page-container">
          <h1 className="page-title">Your Sound | Sonar</h1>
          <div className="error-container">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
            <button 
              onClick={fetchUserTaste}
              className="btn-primary mt-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }
  
  if (!userTaste) {
    return (
      <>
        <Head><title>Your Sound | Sonar</title></Head>
        <div className="page-container">
          <h1 className="page-title">Your Sound | Sonar</h1>
          <p>No data available. Please connect your Spotify account.</p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Head><title>Your Sound | Sonar</title></Head>
      <div className="page-container">
        <h1 className="page-title">Your Sound | Sonar</h1>
        
        <div className="mb-8">
          <h2 className="section-title">Your Location</h2>
          <p className="text-xl">
            {userTaste.location.city || 'Unknown'}, {userTaste.location.country || 'Unknown'}
          </p>
        </div>
        
        <ArtistSection artists={userTaste.topArtists} />
        <EventSection events={userTaste.events} />
      </div>
    </>
  );
};

export default MusicTaste;
EOL

# Create a deployment script
echo -e "${YELLOW}Creating styling fix deployment script...${NC}"

cat > ./deploy-tiko-styled.sh << 'EOL'
#!/bin/bash
# TIKO Styled Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Styled Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your TIKO platform with fixed styling to Heroku${NC}\n"

# Check if heroku CLI is installed
if ! command -v heroku &> /dev/null; then
  echo -e "${RED}Error: Heroku CLI is not installed.${NC}"
  echo -e "${YELLOW}Please install the Heroku CLI and try again.${NC}"
  exit 1
f
(Content truncated due to size limit. Use line ranges to read in chunks)