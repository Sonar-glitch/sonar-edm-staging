import React from 'react';
import styles from '../styles/EventCard.module.css';

const EventCard = ({ event, correlation = 0 }) => {
  // Handle missing or malformed data
  if (!event) {
    return (
      <div className={styles.eventCard}>
        <div className={styles.errorState}>
          <p>Event data unavailable</p>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date TBA';
      }
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date TBA';
    }
  };

  // Format time
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Time TBA';
      }
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return 'Time TBA';
    }
  };

  // Calculate match percentage
  const matchPercentage = typeof correlation === 'number' 
    ? Math.round(correlation * 100) 
    : (event.match || event.correlationScore || 0);

  // Extract venue information
  const venueName = event.venue?.name || event.venue || 'Venue TBA';
  const venueLocation = event.venue?.location || event.location || 'Location TBA';

  // Extract ticket link
  const ticketLink = event.ticketLink || event.url || '#';

  // Extract event image
  const eventImage = event.image || 
                    (event.images && event.images.length > 0 ? event.images[0].url : null) ||
                    '/images/event-placeholder.jpg';

  // Extract artists
  const artists = Array.isArray(event.artists) ? event.artists : 
                 (event.lineup ? event.lineup : []);

  // Extract genres
  const genres = Array.isArray(event.genres) ? event.genres : [];

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventImageContainer}>
        {eventImage && (
          <img 
            src={eventImage} 
            alt={event.name || 'Event'} 
            className={styles.eventImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/event-placeholder.jpg';
            }}
          />
        )}
        <div className={styles.matchBadge}>
          <span>{matchPercentage}% Match</span>
        </div>
      </div>
      
      <div className={styles.eventContent}>
        <h3 className={styles.eventName}>{event.name || 'Unnamed Event'}</h3>
        
        <div className={styles.eventDetails}>
          <div className={styles.eventDate}>
            <span className={styles.dateLabel}>{formatDate(event.date)}</span>
            <span className={styles.timeLabel}>{formatTime(event.date)}</span>
          </div>
          
          <div className={styles.eventVenue}>
            <span className={styles.venueName}>{venueName}</span>
            <span className={styles.venueLocation}>{venueLocation}</span>
          </div>
        </div>
        
        {artists.length > 0 && (
          <div className={styles.eventArtists}>
            <span className={styles.artistsLabel}>Lineup:</span>
            <span className={styles.artistsList}>
              {artists.slice(0, 3).join(', ')}
              {artists.length > 3 && ' + more'}
            </span>
          </div>
        )}
        
        {genres.length > 0 && (
          <div className={styles.eventGenres}>
            {genres.slice(0, 3).map((genre, index) => (
              <span key={index} className={styles.genreTag}>
                {genre}
              </span>
            ))}
          </div>
        )}
        
        <div className={styles.eventActions}>
          <a 
            href={ticketLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={styles.ticketButton}
          >
            Get Tickets
          </a>
        </div>
      </div>
    </div>
  );
};

export default EventCard;
