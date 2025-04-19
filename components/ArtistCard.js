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
