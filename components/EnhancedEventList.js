import React, { useState } from 'react';
import styles from '@/styles/EnhancedEventList.module.css';

export default function EnhancedEventList({ events, loading, error }) {
  const [visibleEvents, setVisibleEvents] = useState(4);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Enhanced event click handler with validation
  const handleEventClick = (event) => {
    console.log('🎯 Event clicked:', event.name, 'Source:', event.source);
    
    if (event.ticketUrl && event.ticketUrl !== '#') {
      console.log('✅ Opening ticket URL:', event.ticketUrl);
      window.open(event.ticketUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.log('ℹ️ No ticket URL available, showing event details');
      setSelectedEvent(event);
    }
  };
  
  // Close event modal
  const closeModal = () => {
    setSelectedEvent(null);
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
    <>
      <div className={styles.container}>
        <div className={styles.eventList}>
          {events.slice(0, visibleEvents).map((event) => (
            <div 
              key={event.id} 
              className={`${styles.eventCard} ${styles.clickable}`}
              onClick={() => handleEventClick(event)}
              style={{ cursor: 'pointer' }}
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
                <span className={`${styles.sourceTag} ${
                  event.source === 'ticketmaster' ? styles.liveTag : 
                  event.source === 'emergency' ? styles.emergencyTag : styles.sampleTag
                }`}>
                  {event.source === 'ticketmaster' ? 'Live Data' : 
                   event.source === 'emergency' ? 'Emergency' : 'Sample'}
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

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{selectedEvent.name}</h2>
              <button className={styles.closeButton} onClick={closeModal}>×</button>
            </div>
            <div className={styles.modalBody}>
              <p><strong>Date:</strong> {formatDate(selectedEvent.date)}</p>
              <p><strong>Venue:</strong> {selectedEvent.venue}</p>
              <p><strong>Address:</strong> {selectedEvent.address}</p>
              {selectedEvent.headliners && (
                <p><strong>Artists:</strong> {selectedEvent.headliners.join(', ')}</p>
              )}
              <p><strong>Match Score:</strong> {selectedEvent.matchScore}%</p>
              <p><strong>Source:</strong> {selectedEvent.source}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
