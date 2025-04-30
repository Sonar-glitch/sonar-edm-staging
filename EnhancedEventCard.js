import React from 'react';
import MatchPercentage from './MatchPercentage';
import styles from '../styles/EnhancedEventCard.module.css'; // Import new CSS module

export default function EnhancedEventCard({ event }) {
  const handleImageError = (e) => {
    e.target.onerror = null;
    // Consider using a placeholder image path consistent with the project structure
    e.target.src = '/images/placeholders/event_placeholder_medium.jpg'; 
  };

  return (
    <div className={styles.eventCard}> {/* Use styles from EnhancedEventCard.module.css */}
      <div className={styles.imageContainer}>
        <img 
          src={event.image || '/images/placeholders/event_placeholder_medium.jpg'} 
          alt={event.name}
          onError={handleImageError}
          className={styles.eventImage}
        />
        <div className={styles.matchPercentageWrapper}> {/* Use CSS module for positioning */}
          <MatchPercentage percentage={event.matchScore || 0} size="small" />
        </div>
      </div>
      <div className={styles.eventDetails}>
        <h3 className={styles.eventName}>{event.name}</h3>
        {/* Consider adding artist info if available in event data */}
        {/* {event.artist && <p className={styles.eventArtist}>{event.artist}</p>} */}
        <div className={styles.eventDate}>
          <span className={styles.icon}>📅</span>
          <span>{event.date} • {event.time}</span>
        </div>
        <div className={styles.eventVenue}>
          <span className={styles.icon}>📍</span>
          <span>{event.venue}, {event.city}</span>
        </div>
        <a 
          href={event.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.ticketButton}
        >
          Get Tickets
        </a>
      </div>
    </div>
  );
}

