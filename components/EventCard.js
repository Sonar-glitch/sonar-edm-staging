import React from 'react';
import Link from 'next/link';
import styles from '../styles/EventCard.module.css';
import EventCorrelationIndicator from './EventCorrelationIndicator';

export default function EventCard({ event }) {
  // Format date
  const formatDate = (dateString) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', options);
  };

  // Format time
  const formatTime = (dateString) => {
    const options = { hour: 'numeric', minute: '2-digit' };
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', options);
  };

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventImageContainer}>
        {event.image ? (
          <img 
            src={event.image} 
            alt={event.name} 
            className={styles.eventImage} 
          />
        ) : (
          <div className={styles.placeholderImage}>
            <span>EDM</span>
          </div>
        )}
        <div className={styles.eventDate}>
          <span className={styles.dateText}>{formatDate(event.date)}</span>
        </div>
      </div>
      
      <div className={styles.eventContent}>
        {/* Correlation indicator */}
        {event.correlationScore && (
          <EventCorrelationIndicator correlationScore={event.correlationScore} />
        )}
        
        <h3 className={styles.eventName}>{event.name}</h3>
        
        <div className={styles.eventDetails}>
          <div className={styles.eventDetail}>
            <span className={styles.detailIcon}>🕒</span>
            <span className={styles.detailText}>{formatTime(event.date)}</span>
          </div>
          
          <div className={styles.eventDetail}>
            <span className={styles.detailIcon}>📍</span>
            <span className={styles.detailText}>{event.venue}</span>
          </div>
          
          {event.distance && (
            <div className={styles.eventDetail}>
              <span className={styles.detailIcon}>📏</span>
              <span className={styles.detailText}>{Math.round(event.distance)} miles away</span>
            </div>
          )}
        </div>
        
        <div className={styles.eventGenres}>
          {event.genres && event.genres.map((genre, index) => (
            <span key={index} className={styles.genreTag}>{genre}</span>
          ))}
        </div>
        
        <div className={styles.eventActions}>
          {event.ticketUrl && (
            <a 
              href={event.ticketUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.ticketButton}
            >
              Get Tickets
            </a>
          )}
          
          <Link href={`/events/${event.id}`}>
            <a className={styles.detailsButton}>More Info</a>
          </Link>
        </div>
      </div>
    </div>
  );
}
