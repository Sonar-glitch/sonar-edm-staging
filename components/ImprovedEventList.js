import React from 'react';
import styles from '@/styles/ImprovedEventList.module.css';

const ImprovedEventList = ({ events, onEventClick }) => {
  if (!events || events.length === 0) {
    return (
      <div className={styles.noEvents}>
        <p>No events match your current filters. Try adjusting your filters to see more events.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {events.map((event, index) => (
        <div key={event.id || index} className={styles.eventCard}>
          <div className={styles.eventInfo}>
            <h3 className={styles.eventTitle}>{event.name}</h3>
            <p className={styles.eventVenue}>
              {event.venue} • {event.venueType}
            </p>
            
            {/* Headliners/DJs section */}
            <div className={styles.eventArtists}>
              <span className={styles.artistsLabel}>Featuring:</span>
              <span className={styles.artistsList}>
                {event.artists && event.artists.length > 0 
                  ? event.artists.join(', ') 
                  : 'TBA'}
              </span>
            </div>
            
            {/* Tags section */}
            <div className={styles.eventTags}>
              <span className={styles.eventTag}>{event.genre}</span>
              <span className={styles.eventPrice}>${event.price}</span>
              <span className={styles.eventDate}>{event.date}</span>
            </div>
          </div>
          
          {/* Match percentage circle - only show the circle, not duplicate text */}
          <div className={styles.matchSection}>
            <div className={styles.matchCircle} style={{ 
              background: `conic-gradient(
                from 0deg,
                rgba(0, 255, 255, 0.8) 0%,
                rgba(255, 0, 255, 0.8) ${event.match / 2}%,
                rgba(0, 255, 255, 0.8) ${event.match}%,
                rgba(20, 20, 40, 0.3) ${event.match}% 100%
              )`
            }}>
              <div className={styles.matchInner}>
                <span className={styles.matchValue}>{event.match}</span>
              </div>
            </div>
            
            <button 
              className={styles.detailsButton}
              onClick={() => onEventClick && onEventClick(event)}
            >
              Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImprovedEventList;
