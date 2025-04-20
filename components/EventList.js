import React from 'react';
import Link from 'next/link';
import styles from '@/styles/EventList.module.css';

export default function EventList({ events, loading, error }) {
  // Format date for display
  const formatEventDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    const month = months[date.getMonth()];
    
    return `${day}, ${month} ${dayOfMonth}`;
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
        <div className={styles.emptyIcon}>🔍</div>
        <h3 className={styles.emptyTitle}>No events found</h3>
        <p className={styles.emptyMessage}>
          Try adjusting your filters or expanding your search radius.
        </p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {events.map(event => (
        <div key={event.id} className={styles.eventCard}>
          {/* Left section with date */}
          <div className={styles.dateSection}>
            <div className={styles.dateBox}>
              <span className={styles.month}>{formatEventDate(event.date).split(' ')[1]}</span>
              <span className={styles.day}>{formatEventDate(event.date).split(' ')[2]}</span>
            </div>
            <span className={styles.weekday}>{formatEventDate(event.date).split(',')[0]}</span>
          </div>
          
          {/* Middle section with event details */}
          <div className={styles.eventInfo}>
            <h3 className={styles.eventName}>{event.name}</h3>
            <div className={styles.eventDetails}>
              <span className={styles.venueName}>{event.venue}</span>
              <span className={styles.divider}>•</span>
              <span className={styles.location}>{event.location}</span>
            </div>
            
            <div className={styles.tagSection}>
              <span className={styles.genreTag}>{event.primaryGenre}</span>
              {event.trending && (
                <span className={styles.trendingTag}>Trending</span>
              )}
            </div>
          </div>
          
          {/* Right section with match score and price */}
          <div className={styles.priceSection}>
            <div className={styles.matchScoreContainer}>
              <div 
                className={styles.matchScoreCircle}
                style={{
                  '--match-color': event.matchScore >= 90 
                    ? '#ff00ff' 
                    : event.matchScore >= 70 
                      ? '#00ffff' 
                      : '#9e9e9e'
                }}
              >
                <span className={styles.matchScore}>{event.matchScore}</span>
                <span className={styles.matchLabel}>match</span>
              </div>
            </div>
            
            <div className={styles.price}>
              ${event.price}
            </div>
            
            <Link href={`/events/${event.id}`} className={styles.viewButton}>
              View
            </Link>
          </div>
        </div>
      ))}
      
      {events.length > 3 && (
        <div className={styles.viewAllContainer}>
          <Link href="/events" className={styles.viewAllLink}>
            View All Events
          </Link>
        </div>
      )}
    </div>
  );
}