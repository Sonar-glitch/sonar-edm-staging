#!/bin/bash
# TIKO Client-Side Error Fix Script
# This script fixes the textContent null reference error

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Client-Side Error Fix Script ===${NC}"
echo -e "${BLUE}This script fixes the textContent null reference error${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/client_fix_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./pages/users/music-taste.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/ArtistSection.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/EventSection.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/LoadingSkeleton.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/ErrorDisplay.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/music-taste/LoadingSpinner.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/ArtistCard.js $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components/EventCard.js $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Create ErrorBoundary component
echo -e "${YELLOW}Creating ErrorBoundary component...${NC}"

mkdir -p ./components/common

cat > ./components/common/ErrorBoundary.js << 'EOL'
import React from 'react';
import { Box, Text, Button } from '@chakra-ui/react';

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
        <Box 
          p={4} 
          borderRadius="md" 
          bg="rgba(255, 0, 0, 0.1)" 
          borderLeft="4px solid red"
          my={4}
        >
          <Text fontWeight="bold" mb={2}>Something went wrong</Text>
          <Text fontSize="sm" mb={3}>
            {this.state.error && this.state.error.toString()}
          </Text>
          <Button 
            size="sm" 
            colorScheme="red" 
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
EOL

# Create SafeContent component for handling null textContent
echo -e "${YELLOW}Creating SafeContent component...${NC}"

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

# Update music-taste.js to add error boundaries and null checks
echo -e "${YELLOW}Updating music-taste.js with error boundaries and null checks...${NC}"

cat > ./pages/users/music-taste.js << 'EOL'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import { Box, Container, Heading, Text, useToast } from '@chakra-ui/react';
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
  const toast = useToast();
  
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
          toast({
            title: 'Using cached data',
            description: 'We encountered an error but loaded your previous data.',
            status: 'warning',
            duration: 5000,
            isClosable: true,
          });
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
        <Container maxW="container.xl" py={8}>
          <Heading as="h1" mb={6}>Your Sound | Sonar</Heading>
          {isTimedOut ? (
            <ErrorDisplay 
              message="Taking longer than expected. Please wait or refresh the page." 
              retry={fetchUserTaste} 
            />
          ) : (
            <LoadingSpinner message="Loading your vibe..." />
          )}
        </Container>
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
        <Container maxW="container.xl" py={8}>
          <Heading as="h1" mb={6}>Your Sound | Sonar</Heading>
          <ErrorDisplay message={error} retry={fetchUserTaste} />
        </Container>
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
        <Container maxW="container.xl" py={8}>
          <Heading as="h1" mb={6}>Your Sound | Sonar</Heading>
          <Text>No music taste data available. Please connect your Spotify account.</Text>
        </Container>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>Your Sound | Sonar</title>
      </Head>
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" mb={6}>Your Sound | Sonar</Heading>
        
        <Box mb={8}>
          <Heading as="h2" size="lg" mb={4}>
            Your Location
          </Heading>
          <Text fontSize="xl">
            {userTaste.location && (
              <>
                {userTaste.location.city || 'Unknown City'}, {userTaste.location.country || 'Unknown Country'}
              </>
            )}
          </Text>
        </Box>
        
        <ErrorBoundary>
          <ArtistSection artists={userTaste.topArtists || []} />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <EventSection events={userTaste.events || []} />
        </ErrorBoundary>
      </Container>
    </>
  );
};

export default MusicTaste;
EOL

# Update ArtistSection.js to add null checks
echo -e "${YELLOW}Updating ArtistSection.js with null checks...${NC}"

cat > ./components/music-taste/ArtistSection.js << 'EOL'
import React from 'react';
import { Box, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import ArtistCard from '../ArtistCard';
import ErrorBoundary from '../common/ErrorBoundary';

const ArtistSection = ({ artists = [] }) => {
  // Ensure artists is always an array
  const safeArtists = Array.isArray(artists) ? artists : [];
  
  if (safeArtists.length === 0) {
    return (
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          Your Top Artists
        </Heading>
        <Text>No artist data available.</Text>
      </Box>
    );
  }
  
  return (
    <Box mb={8}>
      <Heading as="h2" size="lg" mb={4}>
        Your Top Artists
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={6}>
        {safeArtists.map((artist, index) => (
          <ErrorBoundary key={artist.id || index}>
            <ArtistCard artist={artist} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default ArtistSection;
EOL

# Update EventSection.js to add null checks
echo -e "${YELLOW}Updating EventSection.js with null checks...${NC}"

cat > ./components/music-taste/EventSection.js << 'EOL'
import React from 'react';
import { Box, Heading, SimpleGrid, Text } from '@chakra-ui/react';
import EventCard from '../EventCard';
import ErrorBoundary from '../common/ErrorBoundary';

const EventSection = ({ events = [] }) => {
  // Ensure events is always an array
  const safeEvents = Array.isArray(events) ? events : [];
  
  if (safeEvents.length === 0) {
    return (
      <Box mb={8}>
        <Heading as="h2" size="lg" mb={4}>
          Recommended Events
        </Heading>
        <Text>No event recommendations available for your area.</Text>
      </Box>
    );
  }
  
  return (
    <Box mb={8}>
      <Heading as="h2" size="lg" mb={4}>
        Recommended Events
      </Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={6}>
        {safeEvents.map((event, index) => (
          <ErrorBoundary key={event.id || index}>
            <EventCard event={event} />
          </ErrorBoundary>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default EventSection;
EOL

# Update ArtistCard.js to add null checks
echo -e "${YELLOW}Updating ArtistCard.js with null checks...${NC}"

cat > ./components/ArtistCard.js << 'EOL'
import React from 'react';
import { Box, Image, Heading, Text, Link, Badge, Flex } from '@chakra-ui/react';
import NextLink from 'next/link';
import SafeContent from './common/SafeContent';

const ArtistCard = ({ artist }) => {
  // Ensure artist is an object
  if (!artist || typeof artist !== 'object') {
    return null;
  }
  
  // Extract properties with fallbacks
  const {
    name = 'Unknown Artist',
    images = [],
    genres = [],
    popularity = 0,
    external_urls = {},
    id = ''
  } = artist;
  
  // Safely get image URL
  const imageUrl = images && images.length > 0 && images[0].url 
    ? images[0].url 
    : 'https://via.placeholder.com/300?text=No+Image';
  
  // Safely get Spotify URL
  const spotifyUrl = external_urls && external_urls.spotify 
    ? external_urls.spotify 
    : '#';
  
  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden" 
      bg="rgba(0, 0, 0, 0.3)"
      transition="transform 0.3s"
      _hover={{ transform: 'translateY(-5px)' }}
    >
      <Image 
        src={imageUrl} 
        alt={`${name} image`}
        fallbackSrc="https://via.placeholder.com/300?text=Loading..."
        width="100%"
        height="200px"
        objectFit="cover"
        loading="lazy"
      />
      
      <Box p={4}>
        <Heading as="h3" size="md" mb={2} isTruncated>
          {name}
        </Heading>
        
        {genres && genres.length > 0 && (
          <Flex flexWrap="wrap" mb={2}>
            {genres.slice(0, 3).map((genre, index) => (
              <Badge key={index} colorScheme="purple" mr={1} mb={1}>
                {genre}
              </Badge>
            ))}
          </Flex>
        )}
        
        <Text fontSize="sm" mb={3}>
          Popularity: {popularity}/100
        </Text>
        
        <Link 
          as={NextLink}
          href={spotifyUrl}
          isExternal
          color="green.400"
          fontWeight="bold"
          fontSize="sm"
        >
          View on Spotify
        </Link>
      </Box>
    </Box>
  );
};

export default ArtistCard;
EOL

# Update EventCard.js to add null checks
echo -e "${YELLOW}Updating EventCard.js with null checks...${NC}"

cat > ./components/EventCard.js << 'EOL'
import React from 'react';
import { Box, Image, Heading, Text, Link, Badge, Flex } from '@chakra-ui/react';
import SafeContent from './common/SafeContent';

const EventCard = ({ event }) => {
  // Ensure event is an object
  if (!event || typeof event !== 'object') {
    return null;
  }
  
  // Extract properties with fallbacks
  const {
    name = 'Unknown Event',
    images = [],
    date = '',
    venue = {},
    ticketUrl = '#',
    artists = []
  } = event;
  
  // Safely get image URL
  const imageUrl = images && images.length > 0 && images[0].url 
    ? images[0].url 
    : 'https://via.placeholder.com/300?text=No+Image';
  
  // Format date safely
  const formattedDate = date ? new Date(date).toLocaleDateString() : 'Date TBA';
  
  // Safely get venue info
  const venueName = venue && venue.name ? venue.name : 'Venue TBA';
  const venueLocation = venue && venue.location ? venue.location : 'Location TBA';
  
  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden
(Content truncated due to size limit. Use line ranges to read in chunks)