import React from 'react';
import Link from 'next/link';
import styles from '../styles/EventCard.module.css';
import EventCorrelationIndicator from './EventCorrelationIndicator';

const EventCard = ({ event, correlation }) => {
  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };
  
  // Format time
  const formatTime = (timeString) => {
    const options = { hour: 'numeric', minute: '2-digit', hour12: true };
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', options);
  };
  
  return (
    <div className={styles.eventCard}>
      <div className={styles.eventImageContainer}>
        {event.image ? (
          <div 
            className={styles.eventImage}
            style={{ backgroundImage: `url(${event.image})` }}
          />
        ) : (
          <div className={styles.eventImagePlaceholder}>
            <span>{event.name.charAt(0)}</span>
          </div>
        )}
        
        <div className={styles.eventDate}>
          <span className={styles.dateValue}>{formatDate(event.date)}</span>
        </div>
      </div>
      
      <div className={styles.eventInfo}>
        <h3 className={styles.eventName}>{event.name}</h3>
        
        <div className={styles.eventDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>📍</span>
            <span className={styles.detailText}>{event.venue}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>🕒</span>
            <span className={styles.detailText}>{formatTime(event.time)}</span>
          </div>
          
          {event.price && (
            <div className={styles.detailItem}>
              <span className={styles.detailIcon}>💲</span>
              <span className={styles.detailText}>{event.price}</span>
            </div>
          )}
        </div>
        
        <div className={styles.eventArtists}>
          <span className={styles.artistsLabel}>Artists:</span>
          <span className={styles.artistsList}>
            {event.artists.join(', ')}
          </span>
        </div>
        
        <div className={styles.correlationSection}>
          <EventCorrelationIndicator 
            correlation={correlation} 
            matchFactors={event.matchFactors}
          />
        </div>
        
        <div className={styles.eventActions}>
          <Link href={`/events/${event.id}`} className={styles.detailsButton}>
            View Details
          </Link>
          
          {event.ticketLink && (
            <a 
              href={event.ticketLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.ticketsButton}
            >
              Get Tickets
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
