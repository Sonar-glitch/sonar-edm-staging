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
