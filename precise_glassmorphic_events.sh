#!/bin/bash

# 🎨 PRECISE GLASSMORPHIC EVENTS TRANSFORMATION
# ============================================

echo "🎨 PRECISE GLASSMORPHIC EVENTS TRANSFORMATION"
echo "============================================"

echo "📋 ANALYZING CURRENT UI AND APPLYING EXACT GLASSMORPHIC CHANGES..."

# Step 1: Update EnhancedEventList component with heart/like functionality
echo "✅ Step 1: Adding heart/like functionality to event cards..."

cat > components/EnhancedEventList.js << 'EOF'
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
EOF

echo "✅ Step 2: Creating glassmorphic CSS with exact spacing and neon effects..."

# Step 2: Create glassmorphic CSS that preserves exact layout but adds glassmorphic effects
cat > styles/EnhancedEventList.module.css << 'EOF'
/* GLASSMORPHIC EVENT CARDS - PRESERVING EXACT LAYOUT */

.container {
  margin-top: 2rem; /* PRESERVED: Exact same spacing */
}

.eventList {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); /* PRESERVED: Exact same grid */
  gap: 1.5rem; /* PRESERVED: Exact same gap */
}

/* GLASSMORPHIC EVENT CARD - ENHANCED FROM ORIGINAL */
.eventCard {
  /* GLASSMORPHIC BACKGROUND */
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  
  /* NEON BORDER - ENHANCED FROM CYAN TO PINK/CYAN GRADIENT */
  border: 1px solid rgba(255, 0, 110, 0.2);
  border-radius: 0.75rem; /* PRESERVED: Same border radius */
  
  /* GLASSMORPHIC SHADOW */
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  
  overflow: hidden; /* PRESERVED */
  transition: all 0.3s ease; /* PRESERVED */
  cursor: pointer; /* PRESERVED */
  position: relative; /* PRESERVED */
}

/* ENHANCED HOVER WITH NEON GLOW */
.eventCard:hover {
  transform: translateY(-5px); /* PRESERVED: Same transform */
  
  /* NEON GLOW EFFECT */
  box-shadow: 
    0 10px 40px rgba(255, 0, 110, 0.3),
    0 0 30px rgba(255, 0, 110, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  
  /* ENHANCED BORDER GLOW */
  border-color: rgba(255, 0, 110, 0.5);
}

/* EVENT HEADER - GLASSMORPHIC ENHANCEMENT */
.eventHeader {
  display: flex; /* PRESERVED */
  justify-content: space-between; /* PRESERVED */
  align-items: center; /* PRESERVED */
  padding: 1rem; /* PRESERVED: Exact same padding */
  
  /* GLASSMORPHIC HEADER BACKGROUND */
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

/* NEW: EVENT ACTIONS CONTAINER FOR MATCH SCORE + HEART */
.eventActions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

/* DATE BOX - GLASSMORPHIC ENHANCEMENT */
.dateBox {
  background: rgba(0, 0, 0, 0.5); /* PRESERVED: Same background */
  padding: 0.5rem 0.75rem; /* PRESERVED: Exact same padding */
  border-radius: 0.5rem; /* PRESERVED: Same border radius */
  
  /* GLASSMORPHIC ENHANCEMENT */
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.date {
  font-size: 0.9rem; /* PRESERVED */
  font-weight: 500; /* PRESERVED */
  color: #fff; /* PRESERVED */
  
  /* SUBTLE GLOW */
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.matchScore {
  display: flex; /* PRESERVED */
  align-items: center; /* PRESERVED */
}

/* NEON MATCH CIRCLE - ENHANCED WITH PINK/CYAN GRADIENT */
.matchCircle {
  width: 3rem; /* PRESERVED: Exact same size */
  height: 3rem; /* PRESERVED: Exact same size */
  border-radius: 50%; /* PRESERVED */
  display: flex; /* PRESERVED */
  align-items: center; /* PRESERVED */
  justify-content: center; /* PRESERVED */
  font-weight: 600; /* PRESERVED */
  font-size: 0.9rem; /* PRESERVED */
  color: #fff; /* PRESERVED */
  
  /* ENHANCED: Pink gradient instead of cyan */
  background: conic-gradient(
    rgba(255, 0, 110, 0.8) 75%,
    rgba(255, 0, 110, 0.2) 0%
  );
  
  /* GLASSMORPHIC ENHANCEMENT */
  backdrop-filter: blur(10px);
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
  
  /* NEON TEXT GLOW */
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

/* NEW: HEART/LIKE BUTTON */
.likeButton {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.2rem;
}

.likeButton:hover {
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(255, 0, 110, 0.4);
  border-color: rgba(255, 0, 110, 0.5);
  transform: scale(1.1);
}

.likeButton.liked {
  background: rgba(255, 0, 110, 0.2);
  border-color: rgba(255, 0, 110, 0.5);
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.5);
}

.likeButton.liking {
  opacity: 0.7;
  cursor: not-allowed;
}

.heartIcon {
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

.likeSpinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid rgba(255, 0, 110, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* EVENT CONTENT - GLASSMORPHIC ENHANCEMENT */
.eventContent {
  padding: 1rem; /* PRESERVED: Exact same padding */
}

.eventName {
  font-size: 1.2rem; /* PRESERVED */
  font-weight: 600; /* PRESERVED */
  margin-bottom: 0.75rem; /* PRESERVED */
  color: #fff; /* PRESERVED */
  
  /* NEON TEXT GLOW */
  text-shadow: 0 0 15px rgba(255, 0, 110, 0.3);
}

.venueInfo {
  margin-bottom: 0.75rem; /* PRESERVED */
}

.venueName {
  display: block; /* PRESERVED */
  font-weight: 500; /* PRESERVED */
  color: rgba(255, 255, 255, 0.9); /* PRESERVED */
  margin-bottom: 0.25rem; /* PRESERVED */
  
  /* SUBTLE GLOW */
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
}

.venueAddress {
  display: block; /* PRESERVED */
  font-size: 0.85rem; /* PRESERVED */
  color: rgba(255, 255, 255, 0.6); /* PRESERVED */
}

.artistList {
  font-size: 0.9rem; /* PRESERVED */
  color: rgba(255, 255, 255, 0.8); /* PRESERVED */
  margin-bottom: 0.5rem; /* PRESERVED */
}

.artist {
  display: inline; /* PRESERVED */
}

/* EVENT FOOTER - GLASSMORPHIC ENHANCEMENT */
.eventFooter {
  display: flex; /* PRESERVED */
  justify-content: space-between; /* PRESERVED */
  padding: 0.75rem 1rem; /* PRESERVED: Exact same padding */
  font-size: 0.8rem; /* PRESERVED */
  
  /* GLASSMORPHIC FOOTER */
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.venueType {
  color: rgba(255, 255, 255, 0.7); /* PRESERVED */
  background: rgba(255, 255, 255, 0.1); /* PRESERVED */
  padding: 0.25rem 0.5rem; /* PRESERVED */
  border-radius: 0.25rem; /* PRESERVED */
  
  /* GLASSMORPHIC ENHANCEMENT */
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sourceTag {
  padding: 0.25rem 0.5rem; /* PRESERVED */
  border-radius: 0.25rem; /* PRESERVED */
  
  /* GLASSMORPHIC ENHANCEMENT */
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* ENHANCED LIVE TAG WITH NEON GREEN */
.liveTag {
  background: rgba(0, 255, 0, 0.1); /* PRESERVED */
  color: rgba(0, 255, 0, 0.8); /* PRESERVED */
  
  /* NEON GLOW */
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
}

.sampleTag {
  background: rgba(255, 165, 0, 0.1); /* PRESERVED */
  color: rgba(255, 165, 0, 0.8); /* PRESERVED */
  
  /* NEON GLOW */
  box-shadow: 0 0 10px rgba(255, 165, 0, 0.3);
}

.emergencyTag {
  background: rgba(255, 255, 0, 0.1);
  color: rgba(255, 255, 0, 0.8);
  box-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
}

/* LOADING STATE - GLASSMORPHIC ENHANCEMENT */
.loadingContainer {
  display: flex; /* PRESERVED */
  flex-direction: column; /* PRESERVED */
  align-items: center; /* PRESERVED */
  justify-content: center; /* PRESERVED */
  padding: 3rem 0; /* PRESERVED */
}

.spinner {
  width: 3rem; /* PRESERVED */
  height: 3rem; /* PRESERVED */
  border: 3px solid rgba(255, 0, 110, 0.1); /* ENHANCED: Pink instead of cyan */
  border-top: 3px solid rgba(255, 0, 110, 0.8); /* ENHANCED: Pink instead of cyan */
  border-radius: 50%; /* PRESERVED */
  animation: spin 1s linear infinite; /* PRESERVED */
  margin-bottom: 1rem; /* PRESERVED */
  
  /* NEON GLOW */
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ERROR CONTAINER - GLASSMORPHIC ENHANCEMENT */
.errorContainer {
  text-align: center; /* PRESERVED */
  padding: 2rem; /* PRESERVED */
  background: rgba(255, 0, 0, 0.1); /* PRESERVED */
  border-radius: 0.5rem; /* PRESERVED */
  margin: 2rem 0; /* PRESERVED */
  
  /* GLASSMORPHIC ENHANCEMENT */
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 0, 0.3);
}

.errorMessage {
  color: rgba(255, 100, 100, 0.9); /* PRESERVED */
  margin-bottom: 1rem; /* PRESERVED */
}

.retryButton {
  background: rgba(255, 255, 255, 0.1); /* PRESERVED */
  color: #fff; /* PRESERVED */
  border: none; /* PRESERVED */
  padding: 0.5rem 1.5rem; /* PRESERVED */
  border-radius: 0.25rem; /* PRESERVED */
  cursor: pointer; /* PRESERVED */
  transition: all 0.2s ease; /* PRESERVED */
  
  /* GLASSMORPHIC ENHANCEMENT */
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.retryButton:hover {
  background: rgba(255, 255, 255, 0.2); /* PRESERVED */
  box-shadow: 0 0 15px rgba(255, 0, 110, 0.3);
}

.noEventsContainer {
  text-align: center; /* PRESERVED */
  padding: 3rem 0; /* PRESERVED */
  color: rgba(255, 255, 255, 0.7); /* PRESERVED */
}

.showMoreContainer {
  display: flex; /* PRESERVED */
  justify-content: center; /* PRESERVED */
  margin-top: 2rem; /* PRESERVED */
}

/* ENHANCED SHOW MORE BUTTON WITH NEON GRADIENT */
.showMoreButton {
  /* ENHANCED: Pink to cyan gradient instead of blue gradient */
  background: linear-gradient(90deg, rgba(255, 0, 110, 0.5), rgba(0, 212, 255, 0.5));
  color: #fff; /* PRESERVED */
  border: none; /* PRESERVED */
  padding: 0.75rem 2rem; /* PRESERVED */
  border-radius: 2rem; /* PRESERVED */
  font-weight: 500; /* PRESERVED */
  cursor: pointer; /* PRESERVED */
  transition: all 0.2s ease; /* PRESERVED */
  
  /* GLASSMORPHIC ENHANCEMENT */
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.3);
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.2);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.showMoreButton:hover {
  /* ENHANCED: Brighter gradient on hover */
  background: linear-gradient(90deg, rgba(255, 0, 110, 0.7), rgba(0, 212, 255, 0.7));
  transform: translateY(-2px); /* PRESERVED */
  
  /* ENHANCED GLOW */
  box-shadow: 0 0 30px rgba(255, 0, 110, 0.4);
}

/* MODAL STYLES - GLASSMORPHIC ENHANCEMENT */
.modalOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modalContent {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.3);
  border-radius: 1rem;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
}

.modalHeader {
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modalHeader h2 {
  color: #fff;
  margin: 0;
  text-shadow: 0 0 15px rgba(255, 0, 110, 0.3);
}

.closeButton {
  background: none;
  border: none;
  color: #fff;
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.closeButton:hover {
  background: rgba(255, 0, 110, 0.2);
  box-shadow: 0 0 15px rgba(255, 0, 110, 0.3);
}

.modalBody {
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
}

.modalBody p {
  margin-bottom: 0.75rem;
}

.modalBody strong {
  color: #fff;
  text-shadow: 0 0 5px rgba(255, 0, 110, 0.3);
}

.modalBody a {
  color: rgba(0, 212, 255, 0.9);
  text-decoration: none;
  text-shadow: 0 0 5px rgba(0, 212, 255, 0.3);
}

.modalBody a:hover {
  color: rgba(0, 212, 255, 1);
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

/* RESPONSIVE DESIGN - PRESERVED */
@media (max-width: 768px) {
  .eventList {
    grid-template-columns: 1fr; /* PRESERVED */
  }
  
  .eventActions {
    gap: 0.5rem;
  }
  
  .likeButton {
    width: 2rem;
    height: 2rem;
    font-size: 1rem;
  }
}
EOF

echo "✅ Step 3: Committing glassmorphic events transformation..."
git add .
git commit -m "GLASSMORPHIC EVENTS: Precise transformation with heart buttons and neon effects"

echo "✅ Step 4: Deploying to Heroku..."
git push heroku HEAD:main --force

echo ""
echo "🎨 GLASSMORPHIC EVENTS TRANSFORMATION COMPLETE!"
echo "=============================================="
echo ""
echo "✅ EXACT CHANGES APPLIED:"
echo "   📐 PRESERVED: All spacing, padding, margins, and layout"
echo "   🎨 ENHANCED: Glassmorphic backgrounds with backdrop-filter blur"
echo "   💖 ADDED: Heart/like buttons with full functionality"
echo "   ✨ ENHANCED: Neon pink/cyan gradients and glow effects"
echo "   🌟 ENHANCED: Match circles with pink gradient instead of cyan"
echo "   💎 ENHANCED: All cards with glassmorphic transparency"
echo "   🔥 ENHANCED: Hover effects with neon glow"
echo "   📱 PRESERVED: Responsive design for mobile"
echo ""
echo "🚀 Your glassmorphic events section is live:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo ""

