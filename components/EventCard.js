import React from 'react';
import Link from 'next/link';
import styles from '../styles/EventCard.module.css';
import EventCorrelationIndicator from './EventCorrelationIndicator';

const EventCard = ({ event, correlation }) => {
  // Error handling: Check if event is valid
  if (!event || typeof event !== 'object') {
    return (
      <div className={styles.eventCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display event information. Invalid event data.</p>
        </div>
      </div>
    );
  }

  // Ensure correlation is a valid number
  const validCorrelation = typeof correlation === 'number' && !isNaN(correlation) ? correlation : 0;
  
  // Format date
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Date TBA';
      const options = { weekday: 'short', month: 'short', day: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-US', options);
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date TBA';
    }
  };
  
  // Format time
  const formatTime = (timeString) => {
    try {
      if (!timeString) return 'Time TBA';
      const options = { hour: 'numeric', minute: '2-digit', hour12: true };
      return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', options);
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Time TBA';
    }
  };
  
  // Handle venue data which might be a string or an object
  const getVenueName = () => {
    if (!event.venue) return 'Venue TBA';
    if (typeof event.venue === 'string') return event.venue;
    if (typeof event.venue === 'object' && event.venue.name) return event.venue.name;
    return 'Venue TBA';
  };
  
  // Handle location data which might be in different formats
  const getLocationString = () => {
    // If venue is an object with location
    if (typeof event.venue === 'object') {
      if (event.venue.location) return event.venue.location;
      if (event.venue.city) {
        return `${event.venue.city}${event.venue.state ? `, ${event.venue.state}` : ''}`;
      }
    }
    
    // If there's a separate location object
    if (event.location) {
      if (typeof event.location === 'string') return event.location;
      if (typeof event.location === 'object') {
        const city = event.location.city || '';
        const region = event.location.region || '';
        if (city || region) return `${city}${city && region ? ', ' : ''}${region}`;
      }
    }
    
    return 'Location TBA';
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
            <span>{event.name ? event.name.charAt(0) : '?'}</span>
          </div>
        )}
        
        <div className={styles.eventDate}>
          <span className={styles.dateValue}>{formatDate(event.date)}</span>
        </div>
      </div>
      
      <div className={styles.eventInfo}>
        <h3 className={styles.eventName}>{event.name || 'Unnamed Event'}</h3>
        
        <div className={styles.eventDetails}>
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>📍</span>
            <span className={styles.detailText}>{getVenueName()}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailIcon}>📌</span>
            <span className={styles.detailText}>{getLocationString()}</span>
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
            {Array.isArray(event.artists) && event.artists.length > 0 
              ? event.artists.join(', ')
              : 'Artists TBA'}
          </span>
        </div>
        
        <div className={styles.correlationSection}>
          <EventCorrelationIndicator 
            correlation={validCorrelation} 
            matchFactors={event.matchFactors}
          />
        </div>
        
        <div className={styles.eventActions}>
          {event.id && (
            <Link href={`/events/${event.id}`}>
              <a className={styles.detailsButton}>View Details</a>
            </Link>
          )}
          
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
