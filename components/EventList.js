import React from 'react';
import Link from 'next/link';
import styles from '@/styles/EventList.module.css';

export default function EventList({ events, loading, error }) {
  // Format date for display
  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    
    return `${day},${dayOfMonth}`;
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
  
  // If no events
  if (!events || events.length === 0) {
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
        <div key={event.id} className={styles.eventCard}>
          {/* Match Score */}
          <div className={styles.matchScore}>
            <div className={styles.scoreValue}>{event.matchScore}%</div>
            <div className={styles.scoreLabel}>Vibe Match</div>
          </div>
          
          {/* Event Details */}
          <div className={styles.eventInfo}>
            <div className={styles.eventHeader}>
              <h3 className={styles.eventName}>{event.venue} - {event.name}</h3>
            </div>
            
            <div className={styles.eventDetails}>
              <span className={styles.eventLocation}>{event.location}</span>
              <span className={styles.divider}>•</span>
              <span className={styles.eventDate}>{formatEventDate(event.date)}</span>
              <span className={styles.divider}>•</span>
              <span className={styles.eventGenre}>{event.primaryGenre}</span>
            </div>
          </div>
          
          {/* Price */}
          <div className={styles.eventPrice}>
            ${event.price}
          </div>
        </div>
      ))}
      
      {events.length > 5 && (
        <div className={styles.viewAllContainer}>
          <Link href="/events" className={styles.viewAllLink}>
            View All Events
          </Link>
        </div>
      )}
    </div>
  );
}