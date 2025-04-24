import React, { useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/EnhancedEventList.module.css';

const EnhancedEventList = ({ events, loading, error }) => {
  // State for expanded event details
  const [expandedEvents, setExpandedEvents] = useState({});
  
  // Toggle expanded state for an event
  const toggleExpand = (eventId) => {
    setExpandedEvents(prev => ({
      ...prev,
      [eventId]: !prev[eventId]
    }));
  };
  
  // Format date for display
  const formatEventDate = (dateString) => {
    if (!dateString) return 'Upcoming';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date)) return 'Upcoming';
      
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = days[date.getDay()];
      const dayOfMonth = date.getDate();
      const month = date.toLocaleString('default', { month: 'short' });
      
      return `${day}, ${month} ${dayOfMonth}`;
    } catch (e) {
      console.error('Date formatting error:', e);
      return 'Upcoming';
    }
  };
  
  // If loading
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.pulseLoader}></div>
        <p>Finding your perfect events...</p>
      </div>
    );
  }
  
  // If error
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Sorry, we couldn't load events for you. Please try again later.</p>
        <p>Error: {error}</p>
      </div>
    );
  }
  
  // If no events
  if (!events || !Array.isArray(events) || events.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <p>No events match your current filters.</p>
        <p>Try adjusting your filters or expanding your search radius.</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      {events.map(event => {
        // Generate a unique ID if none exists
        const eventId = event.id || `event-${Math.random()}`;
        const isExpanded = expandedEvents[eventId];
        
        // Determine if this is real data or a mockup
        const isRealData = event.source === 'ticketmaster' || event.source === 'edmtrain';
        
        // Format the list of DJs/artists
        const artists = event.headliners || event.artists || event.lineup || [];
        const artistList = Array.isArray(artists) ? artists : artists.split(',').map(a => a.trim());
        
        // Show only first 3 artists in collapsed view
        const displayArtists = isExpanded ? artistList : artistList.slice(0, 3);
        const hasMoreArtists = artistList.length > 3;
        
        return (
          <div key={eventId} className={styles.eventCard}>
            {/* Data Source Badge */}
            <div className={`${styles.dataSourceBadge} ${isRealData ? styles.liveDataBadge : styles.sampleDataBadge}`}>
              {isRealData ? (
                <>
                  <span className={styles.liveDot}></span>
                  Live Data
                </>
              ) : (
                'Sample'
              )}
            </div>
            
            {/* Match Score Circle */}
            <div className={styles.matchScoreCircle}>
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle 
                  cx="30" 
                  cy="30" 
                  r="25" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.2)" 
                  strokeWidth="5"
                />
                <circle 
                  cx="30" 
                  cy="30" 
                  r="25" 
                  fill="none" 
                  stroke="url(#circleGradient)" 
                  strokeWidth="5"
                  strokeDasharray={`${(event.matchScore || 75) * 1.57} 157`}
                  strokeDashoffset="39.25"
                  transform="rotate(-90 30 30)"
                />
                <defs>
                  <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00e5ff" />
                    <stop offset="100%" stopColor="#ff00ff" />
                  </linearGradient>
                </defs>
                <text 
                  x="30" 
                  y="30" 
                  textAnchor="middle" 
                  dominantBaseline="middle" 
                  fill="#ffffff" 
                  fontSize="14" 
                  fontWeight="bold"
                >
                  {event.matchScore || 75}%
                </text>
              </svg>
            </div>
            
            {/* Event Details */}
            <div className={styles.eventInfo}>
              <div className={styles.eventHeader}>
                <h3 className={styles.eventName}>{event.name}</h3>
                
                <div className={styles.venueInfo}>
                  <p className={styles.eventVenue}>{event.venue}</p>
                  <span className={styles.venueType}>{event.venueType || 'Club'}</span>
                </div>
              </div>
              
              {/* Headliners/DJs */}
              <div className={styles.headliners}>
                <span className={styles.headlinersLabel}>Featuring:</span>
                <div className={styles.headlinersList}>
                  {displayArtists.length > 0 ? (
                    displayArtists.map((artist, index) => (
                      <span key={index} className={styles.artist}>
                        {artist}{index < displayArtists.length - 1 ? ', ' : ''}
                      </span>
                    ))
                  ) : (
                    <span className={styles.artist}>TBA</span>
                  )}
                  
                  {!isExpanded && hasMoreArtists && (
                    <button 
                      className={styles.expandButton}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleExpand(eventId);
                      }}
                    >
                      +{artistList.length - 3} more
                    </button>
                  )}
                </div>
              </div>
              
              {/* Expanded artist list */}
              {isExpanded && hasMoreArtists && (
                <div className={styles.expandedArtists}>
                  <div className={styles.expandedArtistsHeader}>
                    <span>All Artists:</span>
                    <button 
                      className={styles.collapseButton}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleExpand(eventId);
                      }}
                    >
                      Show less
                    </button>
                  </div>
                  <div className={styles.artistGrid}>
                    {artistList.map((artist, index) => (
                      <span key={index} className={styles.artistTag}>
                        {artist}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={styles.eventDetails}>
                <span className={styles.eventLocation}>
                  {event.address || event.location || 'Location TBA'}
                </span>
                <span className={styles.divider}>•</span>
                <span className={styles.eventDate}>
                  {formatEventDate(event.date)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      
      {events.length > 3 && (
        <div className={styles.viewAllContainer}>
          <Link href="/events" legacyBehavior>
            <a className={styles.viewAllLink}>
              View All Events
            </a>
          </Link>
        </div>
      )}
    </div>
  );
};

export default EnhancedEventList;
