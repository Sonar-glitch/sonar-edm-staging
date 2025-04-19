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
