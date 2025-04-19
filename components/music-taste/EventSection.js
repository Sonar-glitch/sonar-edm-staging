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
