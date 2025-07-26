// SURGICAL FIX: components/EnhancedEventList.js
// ONLY CHANGES: Add location detection and change POST to GET with query params
// PRESERVES: All existing functionality, styling, error handling, and component behavior

import { useState, useEffect } from 'react';
import styles from '../styles/EnhancedEventList.module.css';

export default function EnhancedEventList({ userProfile, dataSource }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  // SURGICAL ADDITION: Location state for debugging
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadEvents();
  }, [userProfile]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setDebugInfo({ query: 'Loading events...', timestamp: new Date().toISOString() });
      
      // SURGICAL ADDITION: Get user location first
      let locationData = null;
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
      
      // SURGICAL CHANGE: Use GET request with query parameters instead of POST with body
      let apiUrl = '/api/events';
      
      if (locationData && locationData.latitude && locationData.longitude) {
        // Use real coordinates when available
        const params = new URLSearchParams({
          lat: locationData.latitude.toString(),
          lon: locationData.longitude.toString(),
          city: locationData.city || 'Toronto',
          radius: '50'
        });
        apiUrl = `/api/events?${params.toString()}`;
        
        setDebugInfo({ 
          query: `Searching events near ${locationData.city} (${locationData.latitude}, ${locationData.longitude})`, 
          timestamp: new Date().toISOString() 
        });
      } else {
        // PRESERVED: Fallback to Toronto coordinates when location detection fails
        const params = new URLSearchParams({
          lat: '43.6532',
          lon: '-79.3832',
          city: 'Toronto',
          radius: '50'
        });
        apiUrl = `/api/events?${params.toString()}`;
        
        setDebugInfo({ 
          query: 'Using Toronto fallback location', 
          timestamp: new Date().toISOString() 
        });
      }

      // SURGICAL CHANGE: GET request instead of POST
      const response = await fetch(apiUrl, {
        method: 'GET',  // CHANGED: From POST to GET
        headers: {
          'Content-Type': 'application/json',
        }
        // REMOVED: body parameter (not needed for GET requests)
      });

      const data = await response.json();
      
      // PRESERVED: All existing response handling logic (unchanged)
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

  // PRESERVED: All existing loading state handling (unchanged)
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
              <li>Expand your search radius</li>
              <li>Check nearby cities</li>
              <li>Adjust your music preferences</li>
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
              {/* SURGICAL ADDITION: Show location info in debug */}
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
              
              {event.personalizedScore && (
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
          {/* SURGICAL ADDITION: Show location info in debug */}
          {userLocation && (
            <p><strong>Location:</strong> {userLocation.city}, {userLocation.region} ({userLocation.latitude}, {userLocation.longitude})</p>
          )}
        </div>
      )}
    </div>
  );
}

