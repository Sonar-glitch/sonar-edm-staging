import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/EnhancedEventList.module.css';

export default function EnhancedEventList({ events = [], loading = false, error = null, onEventSelect }) {
  const { data: session } = useSession();
  const [displayEvents, setDisplayEvents] = useState([]);
  const [eventError, setEventError] = useState(null);

  // PHASE 1: Enhanced event processing with fallback handling
  useEffect(() => {
    if (events && events.length > 0) {
      setDisplayEvents(events);
      setEventError(null);
    } else if (!loading && !error) {
      // PHASE 1: No events but no error - this indicates API returned empty results
      setEventError('NO_EVENTS_FOUND');
    }
  }, [events, loading, error]);

  // PHASE 1: Enhanced loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ color: '#999999' }}>Discovering events that match your vibe...</p>
          <div className={styles.loadingDetails}>
            <span style={{ color: '#888888', fontSize: '12px' }}>
              Analyzing location, preferences, and availability
            </span>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 1: Enhanced error state
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h3 style={{ color: '#FF00CC' }}>⚠️ Events Loading Error</h3>
          <p style={{ color: '#999999' }}>Unable to load events at this time</p>
          <div className={styles.errorDetails}>
            <span style={{ color: '#888888', fontSize: '12px' }}>
              Error: {error}
            </span>
          </div>
          <button 
            className={styles.retryButton}
            style={{
              background: 'linear-gradient(90deg, #00CFFF, #FF00CC)', // PHASE 1: TIKO gradient
              color: '#000000',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              marginTop: '10px',
              cursor: 'pointer'
            }}
            onClick={() => window.location.reload()}
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  // PHASE 1: Enhanced no events state with actionable suggestions
  if (!displayEvents || displayEvents.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noEventsState}>
          <h3 style={{ color: '#FF00CC' }}>No events found</h3>
          <p style={{ color: '#999999' }}>
            Try adjusting your location or filters to discover more events.
          </p>
          
          {/* PHASE 1: Enhanced suggestions with TIKO styling */}
          <div className={styles.suggestions}>
            <h4 style={{ color: '#DADADA', marginBottom: '10px' }}>Suggestions:</h4>
            <ul style={{ color: '#888888', fontSize: '14px', lineHeight: '1.6' }}>
              <li>• Expand your search radius</li>
              <li>• Check nearby cities</li>
              <li>• Adjust your music preferences</li>
              <li>• Try different date ranges</li>
            </ul>
          </div>

          {/* PHASE 1: Debug information for troubleshooting */}
          <div className={styles.debugInfo}>
            <details style={{ marginTop: '20px' }}>
              <summary style={{ color: '#00CFFF', cursor: 'pointer', fontSize: '12px' }}>
                Debug Information
              </summary>
              <div style={{ color: '#888888', fontSize: '11px', marginTop: '10px' }}>
                <p>Events array length: {events?.length || 0}</p>
                <p>Loading state: {loading ? 'true' : 'false'}</p>
                <p>Error state: {error || 'none'}</p>
                <p>Event error: {eventError || 'none'}</p>
                <p>Session: {session ? 'authenticated' : 'not authenticated'}</p>
              </div>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // PHASE 1: Enhanced events display
  return (
    <div className={styles.container}>
      <div className={styles.eventsHeader}>
        <span style={{ color: '#DADADA' }}>
          {displayEvents.length} event{displayEvents.length !== 1 ? 's' : ''} found
        </span>
      </div>

      <div className={styles.eventsList}>
        {displayEvents.map((event, index) => (
          <div 
            key={event.id || index} 
            className={styles.eventCard}
            style={{
              background: '#15151F', // PHASE 1: TIKO accent section background
              border: '1px solid rgba(0, 255, 255, 0.1)', // PHASE 1: TIKO card border
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onClick={() => onEventSelect && onEventSelect(event)}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 0 12px #FF00CC88'; // PHASE 1: TIKO hover effect
              e.currentTarget.style.borderColor = '#00CFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'rgba(0, 255, 255, 0.1)';
            }}
          >
            <div className={styles.eventHeader}>
              <h4 style={{ color: '#DADADA', margin: '0 0 8px 0' }}>
                {event.name || 'Untitled Event'}
              </h4>
              {event.personalizedScore && (
                <span 
                  className={styles.scoreBadge}
                  style={{
                    background: '#FF00CC', // PHASE 1: TIKO action button color
                    color: '#000000',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {event.personalizedScore}% match
                </span>
              )}
            </div>

            <div className={styles.eventDetails}>
              <p style={{ color: '#999999', margin: '4px 0' }}>
                📅 {event.date ? new Date(event.date).toLocaleDateString() : 'Date TBD'}
              </p>
              <p style={{ color: '#999999', margin: '4px 0' }}>
                📍 {event.venue?.name || 'Venue TBD'} - {event.venue?.city || 'Location TBD'}
              </p>
              {event.artists && event.artists.length > 0 && (
                <p style={{ color: '#888888', margin: '4px 0', fontSize: '14px' }}>
                  🎵 {event.artists.slice(0, 3).map(artist => artist.name || artist).join(', ')}
                  {event.artists.length > 3 && ` +${event.artists.length - 3} more`}
                </p>
              )}
            </div>

            {event.genres && event.genres.length > 0 && (
              <div className={styles.genreTags}>
                {event.genres.slice(0, 3).map((genre, genreIndex) => (
                  <span 
                    key={genreIndex}
                    className={styles.genreTag}
                    style={{
                      background: '#111827', // PHASE 1: TIKO genre tag background
                      color: '#00FFFF', // PHASE 1: TIKO genre tag text
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      marginRight: '6px',
                      border: '1px solid rgba(0, 255, 255, 0.2)'
                    }}
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PHASE 1: Events data source indicator */}
      <div className={styles.eventsFooter}>
        <span style={{ color: '#888888', fontSize: '12px' }}>
          Events loaded from API • Last updated: {new Date().toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

