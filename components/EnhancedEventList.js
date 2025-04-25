import React, { useState } from 'react';
import styles from '@/styles/EnhancedEventList.module.css';

export default function EnhancedEventList({ events, loading, error }) {
  const [visibleEvents, setVisibleEvents] = useState(4);
  
  // Handle click on event card
  const handleEventClick = (event) => {
    if (event.ticketUrl) {
      window.open(event.ticketUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert('No ticket link available for this event');
    }
  };
  
  // Show more events
  const handleShowMore = () => {
    setVisibleEvents(prev => prev + 8);
  };
  
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };
  
  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Finding events that match your vibe...</p>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  // No events state
  if (!events || events.length === 0) {
    return (
      <div className={styles.noEventsContainer}>
        <p>No events found matching your criteria.</p>
        <p>Try adjusting your filters or check back later.</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <div className={styles.eventList}>
        {events.slice(0, visibleEvents).map((event) => (
          <div 
            key={event.id} 
            className={styles.eventCard}
            onClick={() => handleEventClick(event)}
          >
            <div className={styles.eventHeader}>
              <div className={styles.dateBox}>
                <span className={styles.date}>{formatDate(event.date)}</span>
              </div>
              <div className={styles.matchScore}>
                <div 
                  className={styles.matchCircle}
                  style={{
                    background: `conic-gradient(
                      rgba(0, 255, 255, 0.8) ${event.matchScore}%,
                      rgba(0, 255, 255, 0.2) ${event.matchScore}%
                    )`
                  }}
                >
                  <span>{event.matchScore}%</span>
                </div>
              </div>
            </div>
            
            <div className={styles.eventContent}>
              <h3 className={styles.eventName}>{event.name}</h3>
              
              <div className={styles.venueInfo}>
                <span className={styles.venueName}>{event.venue}</span>
                {event.address && (
                  <span className={styles.venueAddress}>{event.address}</span>
                )}
              </div>
              
              <div className={styles.artistList}>
                {event.headliners && event.headliners.map((artist, index) => (
                  <span key={index} className={styles.artist}>
                    {artist}{index < event.headliners.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            </div>
            
            <div className={styles.eventFooter}>
              <span className={styles.venueType}>{event.venueType}</span>
              <span className={`${styles.sourceTag} ${event.source === 'sample' ? styles.sampleTag : styles.liveTag}`}>
                {event.source === 'sample' ? 'Sample' : 'Live Data'}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      {events.length > visibleEvents && (
        <div className={styles.showMoreContainer}>
          <button 
            className={styles.showMoreButton}
            onClick={handleShowMore}
          >
            View All Events
          </button>
        </div>
      )}
    </div>
  );
}
