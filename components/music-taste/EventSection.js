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
