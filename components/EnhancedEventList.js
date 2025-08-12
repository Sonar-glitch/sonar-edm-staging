// ENHANCED: components/EnhancedEventList.js
// SURGICAL ADDITION: Accept location and vibeMatch props, pass to Events API
// PRESERVES: All existing functionality, styling, error handling, and component behavior

import { useState, useEffect } from 'react';
import TasteMatchVisuals from './TasteMatchVisuals';
import styles from '../styles/EnhancedEventList.module.css';

// Helper function to format price range
const formatPrice = (priceRange) => {
  if (!priceRange) return 'Price TBA';
  
  // If it's already a string, return it
  if (typeof priceRange === 'string') return priceRange;
  
  // If it's an object with min/max/currency
  if (typeof priceRange === 'object' && priceRange.min !== undefined) {
    const { min, max, currency = 'USD' } = priceRange;
    if (min === 0 && max === 0) return 'Free';
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  }
  
  return 'Price TBA';
};

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
          }
        } catch (locationError) {
          // Silent fail - use fallback
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

        // DEBUG: Log the location being passed
        console.log('🌍 [EventList] Location passed to API:', {
          city: locationData.city,
          lat: locationData.latitude,
          lon: locationData.longitude,
          url: apiUrl
        });

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

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // PRESERVED: All existing response handling logic (unchanged)
      if (data.events && data.events.length > 0) {

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
        {(events || []).filter(event => event && typeof event === 'object').map((event, index) => {
          // Format date for better display
          const eventDate = event.date ? new Date(event.date) : null;
          const now = new Date();
          const daysUntilEvent = eventDate ? Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24)) : null;
          
          let dateDisplay = 'Date TBD';
          let urgencyClass = '';
          
          if (eventDate) {
            const dateStr = eventDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });
            
            if (daysUntilEvent < 0) {
              dateDisplay = `${dateStr} (Past)`;
              urgencyClass = styles.pastEvent;
            } else if (daysUntilEvent === 0) {
              dateDisplay = `${dateStr} (Today!)`;
              urgencyClass = styles.todayEvent;
            } else if (daysUntilEvent <= 7) {
              dateDisplay = `${dateStr} (${daysUntilEvent} days)`;
              urgencyClass = styles.soonEvent;
            } else if (daysUntilEvent <= 30) {
              dateDisplay = `${dateStr} (${daysUntilEvent} days)`;
              urgencyClass = styles.thisMonthEvent;
            } else {
              dateDisplay = `${dateStr} (${daysUntilEvent} days)`;
              urgencyClass = styles.futureEvent;
            }
          }
          
          return (
            <div 
              key={event.id || index} 
              className={`${styles.compactEventCard} ${urgencyClass}`}
              onClick={() => {
                if (event.ticketUrl && event.ticketUrl !== '#') {
                  window.open(event.ticketUrl, '_blank');
                }
              }}
              style={{ cursor: event.ticketUrl && event.ticketUrl !== '#' ? 'pointer' : 'default' }}
            >
              {/* Compact header with title, date, and match score */}
              <div className={styles.compactHeader}>
                <div className={styles.eventTitleCompact}>
                  <h4 className={styles.eventTitleText}>{event.name || 'Untitled Event'}</h4>
                  <div className={styles.eventDateCompact}>{dateDisplay}</div>
                </div>
                <div className={styles.matchScoreCompact}>
                  <span className={`${styles.scorePercentage} ${
                    event.personalizedScore >= 80 ? styles.highMatch :
                    event.personalizedScore >= 60 ? styles.goodMatch : styles.fairMatch
                  }`}>
                    {Math.round(event.personalizedScore || 50)}%
                  </span>
                </div>
              </div>

              {/* Compact venue and location info */}
              <div className={styles.compactVenueInfo}>
                <span className={styles.venueName}>
                  {typeof event.venue === 'object' ? (event.venue?.name || 'Venue TBD') : (event.venue || 'Venue TBD')}
                </span>
                <span className={styles.locationSeparator}>•</span>
                <span className={styles.locationName}>
                  {typeof event.location === 'object' ? (event.location?.city || event.location?.name || 'Location TBD') : (event.location || 'Location TBD')}
                </span>
              </div>

              {/* Generate "why this matches you" insights */}
              <div className={styles.matchInsights}>
                {(() => {
                  const insights = [];
                  const score = event.personalizedScore || 50;
                  
                  // High match insights
                  if (score >= 80) {
                    insights.push("🎯 Perfect vibe match");
                  } else if (score >= 60) {
                    insights.push("✨ Strong music compatibility");
                  }
                  
                  // Artist-based insights
                  if (event.artists && event.artists.length > 0) {
                    const artists = event.artists.slice(0, 2).map(a => typeof a === 'object' ? a.name : a);
                    if (artists.length > 0) {
                      insights.push(`🎧 Features ${artists.join(', ')}`);
                    }
                  }
                  
                  // Genre insights  
                  if (event.genres && event.genres.length > 0) {
                    const topGenres = event.genres.slice(0, 2);
                    insights.push(`🎵 ${topGenres.join(' & ')} vibes`);
                  }
                  
                  // Urgency insights
                  if (urgencyClass === styles.tonightEvent || urgencyClass === styles.tomorrowEvent) {
                    insights.push("⚡ Happening soon");
                  }
                  
                  return insights.slice(0, 3).map((insight, idx) => (
                    <span key={idx} className={styles.insightTag}>{insight}</span>
                  ));
                })()}
              </div>

              {/* Compact action row */}
              <div className={styles.compactActions}>
                {event.ticketUrl && (
                  <a
                    href={event.ticketUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.compactTicketButton}
                  >
                    Get Tickets
                  </a>
                )}
                <div className={styles.compactPrice}>
                  {formatPrice(event.priceRange)}
                </div>
              </div>
            </div>
          );
        })}
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

