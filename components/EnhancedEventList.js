// ENHANCED: components/EnhancedEventList.js
// SURGICAL ADDITION: Accept location and vibeMatch props, pass to Events API
// PRESERVES: All existing functionality, styling, error handling, and component behavior

import { useState, useEffect } from 'react';
import styles from '../styles/EnhancedEventList.module.css';

export default function EnhancedEventList({ 
  userProfile, 
  dataSource, 
  location, 
  vibeMatch = 50, 
  onDataSourceUpdate 
}) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  // SURGICAL ADDITION: Location state for debugging
  const [userLocation, setUserLocation] = useState(null);

  // SURGICAL ADDITION: Trigger reload when filters change
  useEffect(() => {
    loadEvents();
  }, [userProfile, location, vibeMatch]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setDebugInfo({ query: 'Loading events...', timestamp: new Date().toISOString() });

      // SURGICAL ADDITION: Use provided location or get user location
      let locationData = location;
      
      if (!locationData) {
        try {
          const locationResponse = await fetch('/api/user/get-location');
          if (locationResponse.ok) {
            locationData = await locationResponse.json();
            setUserLocation(locationData);
            console.log('User location obtained:', locationData);
          } else {
            console.warn('Location API failed, using fallback');
          }
        } catch (locationError) {
          console.error('Location detection error:', locationError);
        }
      } else {
        setUserLocation(locationData);
      }

      // SURGICAL CHANGE: Use GET request with query parameters including vibeMatch
      let apiUrl = '/api/events';

      if (locationData && locationData.latitude && locationData.longitude) {
        // Use real coordinates when available
        const params = new URLSearchParams({
          lat: locationData.latitude.toString(),
          lon: locationData.longitude.toString(),
          city: locationData.city || 'Toronto',
          radius: '50',
          vibeMatch: vibeMatch.toString() // SURGICAL ADDITION: Pass vibe match filter
        });
        apiUrl = `/api/events?${params.toString()}`;

        setDebugInfo({
          query: `Searching events near ${locationData.city} (${locationData.latitude}, ${locationData.longitude}) with ${vibeMatch}% vibe match`,
          timestamp: new Date().toISOString()
        });
      } else {
        // PRESERVED: Fallback to Toronto coordinates when location detection fails
        const params = new URLSearchParams({
          lat: '43.6532',
          lon: '-79.3832',
          city: 'Toronto',
          radius: '50',
          vibeMatch: vibeMatch.toString() // SURGICAL ADDITION: Pass vibe match filter
        });
        apiUrl = `/api/events?${params.toString()}`;

        setDebugInfo({
          query: `Using Toronto fallback location with ${vibeMatch}% vibe match`,
          timestamp: new Date().toISOString()
        });
      }

      // SURGICAL CHANGE: GET request instead of POST
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      // PRESERVED: All existing response handling logic (unchanged)
      if (data.success && data.events && data.events.length > 0) {
        setEvents(data.events);
        
        const newDebugInfo = {
          query: `Found ${data.events.length} events`,
          timestamp: new Date().toISOString(),
          source: data.source || 'API',
          vibeMatchFilter: vibeMatch,
          eventsFiltered: data.totalEvents ? `${data.events.length}/${data.totalEvents}` : null
        };
        setDebugInfo(newDebugInfo);

        // SURGICAL ADDITION: Update parent with successful data source
        if (onDataSourceUpdate) {
          onDataSourceUpdate({
            isReal: true,
            lastFetch: new Date().toISOString(),
            eventsFound: data.events.length,
            vibeMatchFilter: vibeMatch,
            location: locationData?.city || 'Toronto'
          });
        }

      } else {
        setEvents([]);
        
        const newDebugInfo = {
          query: 'No events found',
          timestamp: new Date().toISOString(),
          error: data.error || 'Empty result set',
          source: data.source || 'API',
          vibeMatchFilter: vibeMatch
        };
        setDebugInfo(newDebugInfo);

        // SURGICAL ADDITION: Update parent with fallback data source
        if (onDataSourceUpdate) {
          onDataSourceUpdate({
            isReal: false,
            error: data.error || 'NO_EVENTS_FOUND',
            lastFetch: new Date().toISOString(),
            vibeMatchFilter: vibeMatch,
            location: locationData?.city || 'Toronto'
          });
        }
      }

    } catch (err) {
      console.error('Events loading error:', err);
      setError(err.message);
      setEvents([]);
      
      const newDebugInfo = {
        query: 'Error loading events',
        timestamp: new Date().toISOString(),
        error: err.message,
        vibeMatchFilter: vibeMatch
      };
      setDebugInfo(newDebugInfo);

      // SURGICAL ADDITION: Update parent with error data source
      if (onDataSourceUpdate) {
        onDataSourceUpdate({
          isReal: false,
          error: 'LOAD_ERROR',
          lastFetch: new Date().toISOString(),
          vibeMatchFilter: vibeMatch
        });
      }

    } finally {
      setLoading(false);
    }
  };

  // PRESERVED: All existing loading state handling (unchanged)
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Discovering events that match your vibe...</p>
          <p className={styles.loadingSubtext}>Analyzing location, preferences, and availability</p>
          {/* SURGICAL ADDITION: Show filter info during loading */}
          {vibeMatch !== 50 && (
            <p className={styles.loadingSubtext}>Filtering by {vibeMatch}% vibe match</p>
          )}
        </div>
      </div>
    );
  }

  // PRESERVED: All existing error state handling (unchanged)
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

  // PRESERVED: All existing no events state handling (unchanged)
  if (!events || events.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.noEventsState}>
          <h3>No events found</h3>
          <p>Try adjusting your location or filters to discover more events.</p>

          <div className={styles.suggestions}>
            <h4>Suggestions:</h4>
            <ul>
              <li>Lower your vibe match threshold (currently {vibeMatch}%)</li>
              <li>Expand your search radius</li>
              <li>Check nearby cities</li>
              <li>Try different date ranges</li>
            </ul>
          </div>

          {/* PRESERVED: Debug information display (unchanged) */}
          {debugInfo && (
            <div className={styles.debugInfo}>
              <h4>Debug Information</h4>
              <p><strong>Query:</strong> {debugInfo.query}</p>
              <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
              {debugInfo.error && <p><strong>Error:</strong> {debugInfo.error}</p>}
              {debugInfo.source && <p><strong>Source:</strong> {debugInfo.source}</p>}
              {/* SURGICAL ADDITION: Show filter info in debug */}
              <p><strong>Vibe Match Filter:</strong> {debugInfo.vibeMatchFilter}%</p>
              {userLocation && (
                <p><strong>Location:</strong> {userLocation.city}, {userLocation.region} ({userLocation.latitude}, {userLocation.longitude})</p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // PRESERVED: All existing events display logic (unchanged)
  return (
    <div className={styles.container}>
      <div className={styles.eventsList}>
        {events.map((event, index) => (
          <div key={event.id || index} className={styles.eventCard}>
            <div className={styles.eventHeader}>
              <h3 className={styles.eventTitle}>{event.name}</h3>
              <div className={styles.eventDate}>
                {new Date(event.date).toLocaleDateString()}
              </div>
            </div>

            <div className={styles.eventDetails}>
              <p className={styles.eventVenue}>{event.venue}</p>
              <p className={styles.eventLocation}>{event.location}</p>

              {event.artists && event.artists.length > 0 && (
                <div className={styles.eventArtists}>
                  <strong>Artists:</strong> {event.artists.join(', ')}
                </div>
              )}

              {event.genres && event.genres.length > 0 && (
                <div className={styles.eventGenres}>
                  <strong>Genres:</strong> {event.genres.join(', ')}
                </div>
              )}

              {/* ENHANCED: Show vibe match score when available */}
              {event.vibeMatchScore !== undefined && (
                <div className={styles.eventScore}>
                  <strong>Vibe Match:</strong> {Math.round(event.vibeMatchScore)}%
                </div>
              )}
              
              {/* PRESERVED: Fallback to personalizedScore */}
              {event.vibeMatchScore === undefined && event.personalizedScore && (
                <div className={styles.eventScore}>
                  <strong>Match Score:</strong> {Math.round(event.personalizedScore)}%
                </div>
              )}
            </div>

            {event.ticketUrl && (
              <div className={styles.eventActions}>
                <a
                  href={event.ticketUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.ticketButton}
                >
                  Get Tickets
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PRESERVED: Debug information for successful loads (unchanged) */}
      {debugInfo && (
        <div className={styles.debugInfo}>
          <h4>Debug Information</h4>
          <p><strong>Query:</strong> {debugInfo.query}</p>
          <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
          {debugInfo.source && <p><strong>Source:</strong> {debugInfo.source}</p>}
          {/* SURGICAL ADDITION: Show filter info in debug */}
          <p><strong>Vibe Match Filter:</strong> {debugInfo.vibeMatchFilter}%</p>
          {debugInfo.eventsFiltered && (
            <p><strong>Events Filtered:</strong> {debugInfo.eventsFiltered}</p>
          )}
          {userLocation && (
            <p><strong>Location:</strong> {userLocation.city}, {userLocation.region} ({userLocation.latitude}, {userLocation.longitude})</p>
          )}
        </div>
      )}
    </div>
  );
}

