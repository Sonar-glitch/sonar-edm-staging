import { useState, useEffect } from 'react';
import styles from '../styles/EnhancedEventList.module.css';

export default function EnhancedEventList({ userProfile, dataSource }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    loadEvents();
  }, [userProfile]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setDebugInfo({ query: 'Loading events...', timestamp: new Date().toISOString() });
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userProfile: userProfile,
          location: 'Toronto, ON, Canada',
          radius: 50,
          limit: 12
        })
      });

      const data = await response.json();
      
      if (data.success && data.events && data.events.length > 0) {
        setEvents(data.events);
        setDebugInfo({
          query: `Found ${data.events.length} events`,
          timestamp: new Date().toISOString(),
          source: data.source || 'API'
        });
      } else {
        setEvents([]);
        setDebugInfo({
          query: 'No events found',
          timestamp: new Date().toISOString(),
          error: data.error || 'Empty result set',
          source: data.source || 'API'
        });
      }
      
    } catch (err) {
      console.error('Events loading error:', err);
      setError(err.message);
      setEvents([]);
      setDebugInfo({
        query: 'Error loading events',
        timestamp: new Date().toISOString(),
        error: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Discovering events that match your vibe...</p>
          <p className={styles.loadingSubtext}>Analyzing location, preferences, and availability</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h3>Unable to Load Events</h3>
          <p>Error: {error}</p>
          <button onClick={loadEvents} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noEventsState}>
          <h3>No events found</h3>
          <p>Try adjusting your location or filters to discover more events.</p>
          
          <div className={styles.suggestions}>
            <h4>Suggestions:</h4>
            <ul>
              <li>Expand your search radius</li>
              <li>Check nearby cities</li>
              <li>Adjust your music preferences</li>
              <li>Try different date ranges</li>
            </ul>
          </div>

          {debugInfo && (
            <details className={styles.debugPanel}>
              <summary>Debug Information</summary>
              <div className={styles.debugContent}>
                <p><strong>Query:</strong> {debugInfo.query}</p>
                <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
                {debugInfo.error && <p><strong>Error:</strong> {debugInfo.error}</p>}
                {debugInfo.source && <p><strong>Source:</strong> {debugInfo.source}</p>}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.eventsGrid}>
        {events.map((event, index) => (
          <div key={event.id || index} className={styles.eventCard}>
            <div className={styles.eventDate}>
              <span className={styles.eventDay}>{event.date}</span>
              <span className={styles.eventMatch}>{event.matchPercentage || '??'}%</span>
            </div>
            
            <div className={styles.eventContent}>
              <h3 className={styles.eventTitle}>{event.title}</h3>
              <p className={styles.eventArtist}>{event.artist}</p>
              <p className={styles.eventVenue}>{event.venue}</p>
              
              {event.genres && (
                <div className={styles.eventGenres}>
                  {event.genres.slice(0, 2).map((genre, idx) => (
                    <span key={idx} className={styles.genreTag}>{genre}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className={styles.eventActions}>
              <button className={styles.favoriteButton}>♡</button>
              <div className={styles.dataSourceLabel}>Live Data</div>
            </div>
          </div>
        ))}
      </div>

      {debugInfo && (
        <div className={styles.eventsFooter}>
          <p className={styles.resultsInfo}>
            Showing {events.length} events • Last updated: {new Date(debugInfo.timestamp).toLocaleTimeString()}
          </p>
        </div>
      )}
    </div>
  );
}

