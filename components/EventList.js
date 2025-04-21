import React from 'react';
import Link from 'next/link';
import styles from '@/styles/EventList.module.css';

export default function EventList({ events, loading, error }) {
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
      </div>
    );
  }
  
  // If no events, provide fallback events
  if (!events || events.length === 0) {
    const fallbackEvents = [
      {
        id: 'fb-1',
        name: 'Techno Dreamscape',
        venue: 'Warehouse 23',
        location: 'New York',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        price: 45,
        primaryGenre: 'Techno',
        matchScore: 92
      },
      {
        id: 'fb-2',
        name: 'Deep House Journey',
        venue: 'Club Echo',
        location: 'Brooklyn',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        price: 35,
        primaryGenre: 'Deep House',
        matchScore: 85
      },
      {
        id: 'fb-3',
        name: 'Melodic Techno Night',
        venue: 'The Sound Bar',
        location: 'Manhattan',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        price: 55,
        primaryGenre: 'Melodic Techno',
        matchScore: 88
      }
    ];
    
    return (
      <div className={styles.container}>
        <div className={styles.emptyContainer}>
          <p>No events match your current filters.</p>
          <p>Try adjusting your filters or check out our featured events below:</p>
        </div>
        
        {/* Display fallback events */}
        {fallbackEvents.map(event => renderEventCard(event))}
      </div>
    );
  }
  
  // Render each event card
  const renderEventCard = (event) => (
    <div key={event.id} className={styles.eventCard}>
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
  );
  
  return (
    <div className={styles.container}>
      {events.map(event => renderEventCard(event))}
      
      {events.length > 0 && (
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