import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/EnhancedEventList.module.css';

// Helper function to safely extract venue name
const getVenueName = (venue) => {
  if (!venue) return 'Venue TBA';
  if (typeof venue === 'string') return venue;
  if (typeof venue === 'object' && venue.name) return venue.name;
  return 'Venue TBA';
};

// Helper function to safely extract venue address
const getVenueAddress = (event) => {
  if (event.address && typeof event.address === 'string') {
    return event.address;
  }
  if (event.venue && typeof event.venue === 'object' && event.venue.address) {
    return event.venue.address;
  }
  if (event.venues && Array.isArray(event.venues) && event.venues[0]?.address) {
    return event.venues[0].address;
  }
  return null;
};

export default function EnhancedEventList({ events, loading, error, onEventClick, onSaveEvent }) {
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
    e.stopPropagation();
    
    if (!session?.user) {
      alert('Please sign in to like events');
      return;
    }
    
    const eventId = event.id;
    const isCurrentlyLiked = likedEvents.has(eventId);
    
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
              matchScore: event.personalizedScore || event.matchScore || 50,
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
    if (onEventClick) {
      onEventClick(event);
    } else {
      setSelectedEvent(event);
    }
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
      'ticketmaster': 'Real Data',
      'edmtrain': 'Real Data',
      'emergency': 'Fallback Data',
      'sample': 'Fallback Data'
    };
    
    return sourceLabels[event.source.toLowerCase()] || 'Real Data';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ color: '#DADADA' }}>Finding events that match your vibe...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p style={{ color: '#ff6b6b' }}>Unable to load events. Please try again.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#FF00CC',
              color: '#000000',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // SURGICAL FIX 5: Improved no events found message with better guidance
  if (!events || events.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.emptyState}>
          <h3 style={{ color: '#DADADA' }}>No events found</h3>
          <p style={{ color: '#999999' }}>
            Try adjusting your location or filters to discover more events.
          </p>
          <div style={{ marginTop: '16px', color: '#888888', fontSize: '14px' }}>
            <p>Suggestions:</p>
            <ul style={{ textAlign: 'left', paddingLeft: '20px' }}>
              <li>Expand your search radius</li>
              <li>Check nearby cities</li>
              <li>Adjust your music preferences</li>
              <li>Try different date ranges</li>
            </ul>
          </div>
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
                style={{
                  backgroundColor: '#15151F',
                  border: '1px solid rgba(0, 255, 255, 0.1)',
                  borderRadius: '8px',
                  padding: '16px',
                  margin: '8px 0',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 12px rgba(255, 0, 204, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className={styles.eventHeader}>
                  <div className={styles.dateBox}>
                    <span className={styles.date} style={{ color: '#DADADA' }}>
                      {formatDate(event.date)}
                    </span>
                  </div>
                  
                  <div className={styles.eventActions}>
                    <div className={styles.matchScore}>
                      <div 
                        className={styles.matchCircle}
                        style={{
                          background: `conic-gradient(
                            #FF00CC ${event.personalizedScore || event.matchScore || 50}%,
                            rgba(255, 0, 204, 0.2) ${event.personalizedScore || event.matchScore || 50}%
                          )`,
                          borderRadius: '50%',
                          width: '40px',
                          height: '40px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <span style={{ color: '#000000', fontWeight: 'bold', fontSize: '12px' }}>
                          {event.personalizedScore || event.matchScore || 50}%
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={(e) => handleLikeEvent(event, e)}
                      disabled={isLiking}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '20px',
                        cursor: 'pointer',
                        opacity: isLiking ? 0.5 : 1
                      }}
                    >
                      {isLiked ? '❤️' : '🤍'}
                    </button>
                  </div>
                </div>

                <div className={styles.eventContent}>
                  <h3 style={{ color: '#DADADA', margin: '8px 0' }}>{event.name}</h3>
                  
                  <div className={styles.eventDetails}>
                    <p style={{ color: '#999999', margin: '4px 0' }}>
                      📍 {getVenueName(event.venue)}
                    </p>
                    
                    {event.headliners && event.headliners.length > 0 && (
                      <p style={{ color: '#888888', margin: '4px 0' }}>
                        🎵 {event.headliners.slice(0, 2).join(', ')}
                      </p>
                    )}
                    
                    {event.priceRange && (
                      <p style={{ color: '#00CFFF', margin: '4px 0' }}>
                        💰 {event.priceRange}
                      </p>
                    )}
                  </div>

                  {event.genres && event.genres.length > 0 && (
                    <div className={styles.genreTags} style={{ marginTop: '8px' }}>
                      {event.genres.slice(0, 3).map((genre, idx) => (
                        <span 
                          key={idx}
                          style={{
                            backgroundColor: '#111827',
                            color: '#00FFFF',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            marginRight: '4px',
                            border: '1px solid rgba(0, 255, 255, 0.3)'
                          }}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {visibleEvents < events.length && (
          <div className={styles.showMoreContainer}>
            <button 
              onClick={handleShowMore}
              className={styles.showMoreButton}
              style={{
                backgroundColor: '#FF00CC',
                color: '#000000',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Show More Events ({events.length - visibleEvents} remaining)
            </button>
          </div>
        )}
      </div>
    </>
  );
}

