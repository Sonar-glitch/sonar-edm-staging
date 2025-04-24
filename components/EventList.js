import React from 'react';
import Link from 'next/link';
import styles from '@/styles/EventList.module.css';

export default function EventList({ events, loading, error }) {
  // Debug logging to track events data
  console.log("EventList received:", { 
    hasEvents: !!events, 
    eventsCount: events?.length || 0,
    isArray: Array.isArray(events),
    loading, 
    error
  });
  
  if (events && events.length > 0) {
    console.log("First event sample:", events[0]);
  }
  
  // Format date for display
  const formatEventDate = (dateString) => {
    if (!dateString) return 'Upcoming';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return 'Upcoming';
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = days[date.getDay()];
      const dayOfMonth = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      
      return `${day}, ${month} ${dayOfMonth}`;
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Upcoming';
    }
  };
  
  // If loading
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.pulseLoader}></div>
        <p>Finding your perfect events...</p>
      </div>
    );
  }
  
  // If error
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Sorry, we couldn't load events for you. Please try again later.</p>
        <p>Error: {error}</p>
      </div>
    );
  }
  
  // If no events
  if (!events || !Array.isArray(events) || events.length === 0) {
    console.log("No events to display, showing empty state");
    return (
      <div className={styles.emptyContainer}>
        <p>No events match your current filters.</p>
        <p>Try adjusting your filters or expanding your search radius.</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {events.map(event => (
        <div key={event.id || `event-${Math.random()}`} className={styles.eventCard}>
          {/* Match Score */}
          <div className={styles.matchScore}>
            <div className={styles.scoreValue}>
              {event.matchScore || event.correlationScore || 75}%
            </div>
            <div className={styles.scoreLabel}>Vibe Match</div>
          </div>
          
          {/* Event Details */}
          <div className={styles.eventInfo}>
            <div className={styles.eventHeader}>
              <h3 className={styles.eventName}>{event.name}</h3>
              <p className={styles.eventVenue}>{event.venue}</p>
            </div>
            
            <div className={styles.eventDetails}>
              <span className={styles.eventLocation}>
                {event.location || 'Location TBA'}
              </span>
              <span className={styles.divider}>•</span>
              <span className={styles.eventDate}>
                {formatEventDate(event.date)}
              </span>
              <span className={styles.divider}>•</span>
              <span className={styles.eventGenre}>
                {event.primaryGenre || event.genres?.[0] || 'Electronic'}
              </span>
            </div>
          </div>
          
          {/* Price */}
          <div className={styles.eventPrice}>
            ${event.price || '??'}
          </div>
        </div>
      ))}
      
      {events.length > 3 && (
        <div className={styles.viewAllContainer}>
          <Link href="/events" legacyBehavior>
            <a className={styles.viewAllLink}>
              View All Events
            </a>
          </Link>
        </div>
      )}
    </div>
  );
}