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
