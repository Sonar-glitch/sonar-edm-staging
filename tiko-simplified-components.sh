#!/bin/bash
# TIKO Simplified Components Script
# This script creates simplified components to avoid truncation issues

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Simplified Components Script ===${NC}"
echo -e "${BLUE}This script creates simplified components to avoid truncation issues${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/simplified_${TIMESTAMP}"
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
echo -e "${GREEN}Backup complete${NC}"

# Create simplified LoadingSkeleton.js
echo -e "${YELLOW}Creating simplified LoadingSkeleton.js...${NC}"

cat > ./components/music-taste/LoadingSkeleton.js << 'EOL'
import React from 'react';

const LoadingSkeleton = () => {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-700 rounded w-1/4 mb-6"></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-gray-800 rounded-lg p-4">
            <div className="h-40 bg-gray-700 rounded mb-4"></div>
            <div className="h-5 bg-gray-700 rounded w-3/4 mb-3"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
EOL

# Create simplified ArtistSection.js
echo -e "${YELLOW}Creating simplified ArtistSection.js...${NC}"

cat > ./components/music-taste/ArtistSection.js << 'EOL'
import React from 'react';
import ArtistCard from '../ArtistCard';

const ArtistSection = ({ artists = [] }) => {
  if (!artists || artists.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Top Artists</h2>
        <p>No artist data available.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Your Top Artists</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {artists.map((artist, index) => (
          <ArtistCard key={artist.id || index} artist={artist} />
        ))}
      </div>
    </div>
  );
};

export default ArtistSection;
EOL

# Create simplified EventSection.js
echo -e "${YELLOW}Creating simplified EventSection.js...${NC}"

cat > ./components/music-taste/EventSection.js << 'EOL'
import React from 'react';
import EventCard from '../EventCard';

const EventSection = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Recommended Events</h2>
        <p>No event recommendations available for your area.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Recommended Events</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {events.map((event, index) => (
          <EventCard key={event.id || index} event={event} />
        ))}
      </div>
    </div>
  );
};

export default EventSection;
EOL

# Create simplified ArtistCard.js
echo -e "${YELLOW}Creating simplified ArtistCard.js...${NC}"

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
    <div className="bg-gray-800 bg-opacity-30 rounded-lg overflow-hidden">
      <div className="h-40 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {e.target.src = 'https://via.placeholder.com/300?text=No+Image'}}
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 truncate">{name}</h3>
        {genres.length > 0 && (
          <div className="flex flex-wrap mb-2">
            {genres.slice(0, 2).map((genre, i) => (
              <span key={i} className="bg-blue-600 text-xs px-2 py-1 rounded-full mr-1 mb-1">{genre}</span>
            ))}
          </div>
        )}
        <p className="text-sm mb-3">Popularity: {popularity}/100</p>
        <a 
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-sm font-bold"
        >
          View on Spotify
        </a>
      </div>
    </div>
  );
};

export default ArtistCard;
EOL

# Create simplified EventCard.js
echo -e "${YELLOW}Creating simplified EventCard.js...${NC}"

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
    <div className="bg-gray-800 bg-opacity-30 rounded-lg overflow-hidden">
      <div className="h-40 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {e.target.src = 'https://via.placeholder.com/300?text=No+Image'}}
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 truncate">{name}</h3>
        <p className="text-sm mb-2"><strong>Date:</strong> {date}</p>
        <p className="text-sm mb-2"><strong>Venue:</strong> {venueName}</p>
        <p className="text-sm mb-3"><strong>Location:</strong> {location}</p>
        {artists.length > 0 && (
          <div className="flex flex-wrap mb-3">
            {artists.slice(0, 2).map((artist, i) => (
              <span key={i} className="bg-purple-600 text-xs px-2 py-1 rounded-full mr-1 mb-1">
                {typeof artist === 'string' ? artist : (artist.name || 'Unknown')}
              </span>
            ))}
          </div>
        )}
        <a 
          href={ticketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 text-sm font-bold"
        >
          Get Tickets
        </a>
      </div>
    </div>
  );
};

export default EventCard;
EOL

# Simplify music-taste.js
echo -e "${YELLOW}Simplifying music-taste.js...${NC}"

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
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
          <div className="text-center py-10">
            <div className="inline-block animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
            <p className="text-xl">Loading your vibe...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (error && !userTaste) {
    return (
      <>
        <Head><title>Your Sound | Sonar</title></Head>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
          <div className="bg-red-900 bg-opacity-20 border-l-4 border-red-600 p-4 rounded">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
            <button 
              onClick={fetchUserTaste}
              className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
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
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
          <p>No data available. Please connect your Spotify account.</p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Head><title>Your Sound | Sonar</title></Head>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Your Location</h2>
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
echo -e "${YELLOW}Creating simplified deployment script...${NC}"

cat > ./deploy-tiko-simplified.sh << 'EOL'
#!/bin/bash
# TIKO Simplified Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO - Simplified Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your TIKO platform with simplified components to Heroku${NC}\n"

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
git commit -m "Implement simplified components to avoid truncation issues"

# Deploy to Heroku with force push
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku main:master --force

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your TIKO platform is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
echo -e "\n${BLUE}=======================================${NC}"
EOL

# Make the deployment script executable
chmod +x ./deploy-tiko-simplified.sh

echo -e "${GREEN}Simplified components script complete!${NC}"
echo -e "${YELLOW}To deploy your TIKO platform with simplified components to Heroku, run:${NC}"
echo -e "${BLUE}./deploy-tiko-simplified.sh${NC}"
echo -e "\n${BLUE}=======================================${NC}"

# Summary of changes
echo -e "${YELLOW}Summary of Simplified Components:${NC}"
echo -e "1. Created simplified LoadingSkeleton.js:"
echo -e "   - Reduced complexity and file size"
echo -e "   - Removed potential syntax issues"
echo -e "   - Maintained the same visual appearance"
echo -e ""
echo -e "2. Simplified all other components:"
echo -e "   - Reduced code complexity"
echo -e "   - Removed unnecessary features"
echo -e "   - Maintained core functionality"
echo -e ""
echo -e "3. Created a deployment script:"
echo -e "   - Uses the timestamp approach to force clean builds"
echo -e "   - Includes proper error handling and feedback"
echo -e "\n${BLUE}=======================================${NC}"
