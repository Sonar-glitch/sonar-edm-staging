import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/EnhancedEventList.module.css';

export default function EnhancedEventList({ events, loading, error }) {
  const { data: session } = useSession();
  const [visibleEvents, setVisibleEvents] = useState(4);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [likedEvents, setLikedEvents] = useState(new Set());
  const [likingInProgress, setLikingInProgress] = useState(new Set());
  
  // Load user's liked events on component mount
  useEffect(() => {
    if (session?.user) {
      loadLikedEvents();
    }
  }, [session]);
  
  // Load liked events from API
  const loadLikedEvents = async () => {
    try {
      const response = await fetch('/api/user/interested-events');
      if (response.ok) {
        const data = await response.json();
        const likedEventIds = new Set(data.events.map(event => event.id || event.eventId));
        setLikedEvents(likedEventIds);
      }
    } catch (error) {
      console.error('Error loading liked events:', error);
    }
  };
  
  // Handle like/unlike event
  const handleLikeEvent = async (event, e) => {
    e.stopPropagation(); // Prevent event card click
    
    if (!session?.user) {
      alert('Please sign in to like events');
      return;
    }
    
    const eventId = event.id;
    const isCurrentlyLiked = likedEvents.has(eventId);
    
    // Prevent multiple simultaneous requests
    if (likingInProgress.has(eventId)) return;
    
    setLikingInProgress(prev => new Set([...prev, eventId]));
    
    try {
      if (isCurrentlyLiked) {
        // Unlike event
        const response = await fetch('/api/user/interested-events', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId })
        });
        
        if (response.ok) {
          setLikedEvents(prev => {
            const newSet = new Set(prev);
            newSet.delete(eventId);
            return newSet;
          });
          console.log('✅ Event unliked:', event.name);
        }
      } else {
        // Like event
        const response = await fetch('/api/user/interested-events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            eventId,
            eventData: {
              id: event.id,
              name: event.name,
              date: event.date,
              time: event.time,
              venue: event.venue,
              address: event.address,
              city: event.city,
              ticketUrl: event.ticketUrl,
              priceRange: event.priceRange,
              headliners: event.headliners,
              genres: event.genres,
              matchScore: event.matchScore,
              source: event.source,
              venueType: event.venueType
            }
          })
        });
        
        if (response.ok) {
          setLikedEvents(prev => new Set([...prev, eventId]));
          console.log('✅ Event liked:', event.name);
        }
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      alert('Failed to update event. Please try again.');
    } finally {
      setLikingInProgress(prev => {
        const newSet = new Set(prev);
        newSet.delete(eventId);
        return newSet;
      });
    }
  };
  
  // Enhanced event click handler with proper URL handling
  const handleEventClick = (event) => {
    console.log('🎯 Event clicked:', event.name, 'Source:', event.source, 'URL:', event.ticketUrl);
    
    // Proper URL validation and handling
    if (event.ticketUrl && event.ticketUrl !== '#' && event.ticketUrl.startsWith('http')) {
      console.log('✅ Opening ticket URL:', event.ticketUrl);
      window.open(event.ticketUrl, '_blank', 'noopener,noreferrer');
    } else {
      console.log('ℹ️ No valid ticket URL, showing event details modal');
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
  
  // Proper data source label determination
  const getDataSourceLabel = (event) => {
  if (event.source === 'ticketmaster') {
    return 'Live Data';
  } else if (event.source === 'mongodb') {
    return 'Live Data';  // ✅ MongoDB events are real data
  } else if (event.source === 'emergency') {
    return 'Emergency';
  } else {
    return 'Demo Data';
  }
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
          {events.slice(0, visibleEvents).map((event) => {
            const isLiked = likedEvents.has(event.id);
            const isLiking = likingInProgress.has(event.id);
            
            return (
              <div 
                key={event.id} 
                className={`${styles.eventCard} ${styles.clickable}`}
                onClick={() => handleEventClick(event)}
              >
                <div className={styles.eventHeader}>
                  <div className={styles.dateBox}>
                    <span className={styles.date}>{formatDate(event.date)}</span>
                  </div>
                  
                  <div className={styles.eventActions}>
                    <div className={styles.matchScore}>
                      <div 
                        className={styles.matchCircle}
                        style={{
                          background: `conic-gradient(
                            rgba(255, 0, 110, 0.8) ${event.matchScore}%,
                            rgba(255, 0, 110, 0.2) ${event.matchScore}%
                          )`
                        }}
                      >
                        <span>{event.matchScore}%</span>
                      </div>
                    </div>
                    
                    {/* NEW: Heart/Like Button */}
                    <button
                      className={`${styles.likeButton} ${isLiked ? styles.liked : ''} ${isLiking ? styles.liking : ''}`}
                      onClick={(e) => handleLikeEvent(event, e)}
                      disabled={isLiking}
                      title={isLiked ? 'Remove from My Events' : 'Add to My Events'}
                    >
                      {isLiking ? (
                        <div className={styles.likeSpinner}></div>
                      ) : (
                        <span className={styles.heartIcon}>
                          {isLiked ? '❤️' : '🤍'}
                        </span>
                      )}
                    </button>
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
                    {getDataSourceLabel(event)}
                  </span>
                </div>
              </div>
            );
          })}
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
              <p><strong>Source:</strong> {getDataSourceLabel(selectedEvent)}</p>
              {selectedEvent.ticketUrl && selectedEvent.ticketUrl !== '#' && (
                <p><strong>Tickets:</strong> <a href={selectedEvent.ticketUrl} target="_blank" rel="noopener noreferrer">Buy Tickets</a></p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
