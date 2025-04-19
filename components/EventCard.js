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
      overflow="hidden" 
      bg="rgba(0, 0, 0, 0.3)"
      transition="transform 0.3s"
      _hover={{ transform: 'translateY(-5px)' }}
    >
      <Image 
        src={imageUrl} 
        alt={`${name} event image`}
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
        
        <Text fontSize="sm" mb={2}>
          <strong>Date:</strong> {formattedDate}
        </Text>
        
        <Text fontSize="sm" mb={2}>
          <strong>Venue:</strong> {venueName}
        </Text>
        
        <Text fontSize="sm" mb={3}>
          <strong>Location:</strong> {venueLocation}
        </Text>
        
        {artists && artists.length > 0 && (
          <Flex flexWrap="wrap" mb={3}>
            {artists.slice(0, 3).map((artist, index) => (
              <Badge key={index} colorScheme="purple" mr={1} mb={1}>
                {typeof artist === 'string' ? artist : (artist.name || 'Unknown Artist')}
              </Badge>
            ))}
          </Flex>
        )}
        
        <Link 
          href={ticketUrl}
          isExternal
          color="cyan.400"
          fontWeight="bold"
          fontSize="sm"
        >
          Get Tickets
        </Link>
      </Box>
    </Box>
  );
};

export default EventCard;
