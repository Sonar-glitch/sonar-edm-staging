import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/EnhancedEventList.module.css';

// Helper function to safely extract venue name - FIXES React error #31
const getVenueName = (venue) => {
  if (!venue) return 'Venue TBA';
  
  // If venue is already a string, return it
  if (typeof venue === 'string') return venue;
  
  // If venue is an object, extract the name
  if (typeof venue === 'object' && venue.name) return venue.name;
  
  // Fallback
  return 'Venue TBA';
};

// Helper function to safely extract venue address
const getVenueAddress = (event) => {
  // Check if event has direct address field
  if (event.address && typeof event.address === 'string') {
    return event.address;
  }
  
  // Check if venue object has address
  if (event.venue && typeof event.venue === 'object' && event.venue.address) {
    return event.venue.address;
  }
  
  // Check venues array
  if (event.venues && Array.isArray(event.venues) && event.venues[0]?.address) {
    return event.venues[0].address;
  }
  
  return null;
};

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
        const response = await fetch(`/api/user/interested-events?eventId=${eventId}`, {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' }
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
              matchScore: event.personalizedScore || event.matchScore || 50, // SURGICAL FIX: Use personalizedScore from API with fallback
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

  const handleShowMore = () => {
    setVisibleEvents(prev => Math.min(prev + 4, events.length));
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
  };

  const closeModal = () => {
    setSelectedEvent(null);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    
    try {
      const date = new Date(dateString);
      const options = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      };
      return date.toLocaleDateString('en-US', options);
    } catch (error) {
      return 'Date TBA';
    }
  };

  const getDataSourceLabel = (event) => {
    if (!event.source) return 'Unknown';
    
    const sourceLabels = {
      'ticketmaster': 'Live Data',
      'edmtrain': 'Live Data',
      'emergency': 'Emergency Data',
      'sample': 'Demo Data'
    };
    
    return sourceLabels[event.source.toLowerCase()] || 'Live Data';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Finding events that match your vibe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Unable to load events. Please try again.</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h3>No events found</h3>
          <p>Try adjusting your location or filters to discover more events.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.container}>
        <div className={styles.eventsList}>
          {events.slice(0, visibleEvents).map((event, index) => {
            const isLiked = likedEvents.has(event.id);
            const isLiking = likingInProgress.has(event.id);
            
            return (
              <div 
                key={event.id || index} 
                className={styles.eventCard}
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
                            rgba(255, 0, 110, 0.8) ${event.personalizedScore || event.matchScore || 50}%,
                            rgba(255, 0, 110, 0.2) ${event.personalizedScore || event.matchScore || 50}%
                          )`
                        }}
                      >
                        <span>{event.personalizedScore || event.matchScore || 50}%</span>
                      </div>
                    </div>
                    
                    {/* NEW: Heart/Like Button */}
                    <button
                      className={`${styles.likeButton} ${isLiked ? styles.liked : ''}`}
                      onClick={(e) => handleLikeEvent(event, e)}
                      disabled={isLiking}
                      title={isLiked ? 'Remove from My Events' : 'Add to My Events'}
                    >
                      {isLiking ? '⏳' : (isLiked ? '❤️' : '🤍')}
                    </button>
                  </div>
                </div>
                
                <div className={styles.eventContent}>
                  <h3 className={styles.eventName}>{event.name}</h3>
                  
                  <div className={styles.venueInfo}>
                    <span className={styles.venueName}>{getVenueName(event.venue)}</span>
                    {getVenueAddress(event) && (
                      <span className={styles.venueAddress}>{getVenueAddress(event)}</span>
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
              <p><strong>Venue:</strong> {getVenueName(selectedEvent.venue)}</p>
              <p><strong>Address:</strong> {getVenueAddress(selectedEvent) || 'Address TBA'}</p>
              {selectedEvent.headliners && (
                <p><strong>Artists:</strong> {selectedEvent.headliners.join(', ')}</p>
              )}
              <p><strong>Match Score:</strong> {selectedEvent.personalizedScore || selectedEvent.matchScore || 50}%</p>
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

