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
