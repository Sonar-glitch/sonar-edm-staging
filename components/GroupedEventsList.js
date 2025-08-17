// components/GroupedEventsList.js
// TIKO-compliant grouped events display with time-based organization

import { useState, useEffect } from 'react';
import CompactEventInsights from './CompactEventInsights';
import styles from '../styles/GroupedEventsList.module.css';

export default function GroupedEventsList({ 
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
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    loadEvents();
  }, [userProfile, location, vibeMatch]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setDebugInfo({ query: 'Loading events...', timestamp: new Date().toISOString() });

      // Use provided location or get user location
      let locationData = location;
      console.log('🌍 [GroupedEventsList] Location prop received:', JSON.stringify(location));

      if (!locationData) {
        try {
          const locationResponse = await fetch('/api/user/get-location');
          if (locationResponse.ok) {
            locationData = await locationResponse.json();
            setUserLocation(locationData);
            console.log('🌍 [GroupedEventsList] Location from API:', JSON.stringify(locationData));
          }
        } catch (locationError) {
          console.log('🌍 [GroupedEventsList] Location detection failed, using fallback');
        }
      } else {
        setUserLocation(locationData);
        console.log('🌍 [GroupedEventsList] Using provided location:', JSON.stringify(locationData));
      }

      // Build API URL
      let apiUrl = '/api/events';

      if (locationData && locationData.latitude && locationData.longitude) {
        const params = new URLSearchParams({
          lat: locationData.latitude.toString(),
          lon: locationData.longitude.toString(),
          city: locationData.city || 'Toronto',
          radius: '50',
          vibeMatch: vibeMatch.toString()
        });
        apiUrl = `/api/events?${params.toString()}`;
        
        console.log('🎯 [GroupedEventsList] API URL with location:', apiUrl);

        setDebugInfo({
          query: `Searching events near ${locationData.city} (${locationData.latitude}, ${locationData.longitude}) with ${vibeMatch}% vibe match`,
          timestamp: new Date().toISOString()
        });
      } else {
        // Default to Toronto coordinates (preserving location strategy)
        const params = new URLSearchParams({
          lat: '43.6532',
          lon: '-79.3832',
          city: 'Toronto',
          radius: '50',
          vibeMatch: vibeMatch.toString()
        });
        apiUrl = `/api/events?${params.toString()}`;

        setDebugInfo({
          query: `Using Toronto fallback location with ${vibeMatch}% vibe match`,
          timestamp: new Date().toISOString()
        });
      }

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

      if (data.events && data.events.length > 0) {
        setEvents(data.events);
        
        const newDebugInfo = {
          query: `Found ${data.events.length} events`,
          timestamp: new Date().toISOString(),
          source: data.source || 'API',
          vibeMatchFilter: vibeMatch,
          eventsFiltered: data.totalEvents ? `${data.events.length}/${data.totalEvents}` : null,
          location: locationData?.city || 'Toronto'
        };
        setDebugInfo(newDebugInfo);

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
          vibeMatchFilter: vibeMatch,
          location: locationData?.city || 'Toronto'
        };
        setDebugInfo(newDebugInfo);

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
      console.error('Events loading error:', err.message || err);
      setError(err.message);
      setEvents([]);
      
      const newDebugInfo = {
        query: 'Error loading events',
        timestamp: new Date().toISOString(),
        error: err.message,
        vibeMatchFilter: vibeMatch
      };
      setDebugInfo(newDebugInfo);

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

  // Group events by time periods
  const groupEventsByTime = (events) => {
    const now = new Date();
    const groups = {
      tonight: [],
      tomorrow: [],
      this_weekend: [],
      next_weekend: [],
      must_see: [],
      international: [],
      upcoming: []
    };

    events.forEach(event => {
      const eventDate = event.date ? new Date(event.date) : null;
      const score = event.personalizedScore || 0;
      const isHighMatch = score >= 75;
      const isInternational = event.artists?.some(artist => 
        typeof artist === 'object' ? artist.international : false
      ) || score >= 85;

      // Must see category (high match events)
      if (isHighMatch) {
        groups.must_see.push(event);
      }

      // International category
      if (isInternational) {
        groups.international.push(event);
      }

      if (eventDate) {
        const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
        
        if (daysUntil === 0) {
          groups.tonight.push(event);
        } else if (daysUntil === 1) {
          groups.tomorrow.push(event);
        } else if (daysUntil <= 3) {
          groups.this_weekend.push(event);
        } else if (daysUntil <= 14) {
          groups.next_weekend.push(event);
        } else {
          groups.upcoming.push(event);
        }
      } else {
        groups.upcoming.push(event);
      }
    });

    // Sort each group by match score
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
    });

    return groups;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Discovering events that match your vibe...</p>
          <p className={styles.loadingSubtext}>Analyzing location, preferences, and availability</p>
          {vibeMatch !== 50 && (
            <p className={styles.loadingSubtext}>Filtering by {vibeMatch}% vibe match</p>
          )}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h3>Unable to Load Events</h3>
          <p>Error: {error?.message || error?.toString() || 'An unknown error occurred'}</p>
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
              <li>Lower your vibe match threshold (currently {vibeMatch}%)</li>
              <li>Expand your search radius</li>
              <li>Check nearby cities</li>
              <li>Try different date ranges</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  const groupedEvents = groupEventsByTime(events);
  const hasEvents = Object.values(groupedEvents).some(group => group.length > 0);

  if (!hasEvents) {
    return (
      <div className={styles.container}>
        <div className={styles.noEventsState}>
          <h3>No events match your criteria</h3>
          <p>Try lowering your vibe match threshold or expanding your search.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Priority groups first */}
      {groupedEvents.tonight.length > 0 && (
        <div className={styles.eventGroup}>
          <h2 className={`${styles.groupTitle} ${styles.urgent}`}>
            🔥 Tonight ({groupedEvents.tonight.length})
          </h2>
          <div className={styles.groupEvents}>
            {groupedEvents.tonight.map((event, index) => (
              <CompactEventInsights 
                key={event.id || index} 
                event={event} 
                userProfile={userProfile} 
              />
            ))}
          </div>
        </div>
      )}

      {groupedEvents.tomorrow.length > 0 && (
        <div className={styles.eventGroup}>
          <h2 className={`${styles.groupTitle} ${styles.urgent}`}>
            ⚡ Tomorrow ({groupedEvents.tomorrow.length})
          </h2>
          <div className={styles.groupEvents}>
            {groupedEvents.tomorrow.map((event, index) => (
              <CompactEventInsights 
                key={event.id || index} 
                event={event} 
                userProfile={userProfile} 
              />
            ))}
          </div>
        </div>
      )}

      {groupedEvents.must_see.length > 0 && (
        <div className={styles.eventGroup}>
          <h2 className={`${styles.groupTitle} ${styles.mustSee}`}>
            ⭐ Must See - High Match ({groupedEvents.must_see.length})
          </h2>
          <div className={styles.groupEvents}>
            {groupedEvents.must_see.slice(0, 5).map((event, index) => (
              <CompactEventInsights 
                key={event.id || index} 
                event={event} 
                userProfile={userProfile} 
              />
            ))}
          </div>
        </div>
      )}

      {groupedEvents.international.length > 0 && (
        <div className={styles.eventGroup}>
          <h2 className={`${styles.groupTitle} ${styles.international}`}>
            🌍 International Artists ({groupedEvents.international.length})
          </h2>
          <div className={styles.groupEvents}>
            {groupedEvents.international.slice(0, 3).map((event, index) => (
              <CompactEventInsights 
                key={event.id || index} 
                event={event} 
                userProfile={userProfile} 
              />
            ))}
          </div>
        </div>
      )}

      {groupedEvents.this_weekend.length > 0 && (
        <div className={styles.eventGroup}>
          <h2 className={`${styles.groupTitle} ${styles.weekend}`}>
            🎉 This Weekend ({groupedEvents.this_weekend.length})
          </h2>
          <div className={styles.groupEvents}>
            {groupedEvents.this_weekend.map((event, index) => (
              <CompactEventInsights 
                key={event.id || index} 
                event={event} 
                userProfile={userProfile} 
              />
            ))}
          </div>
        </div>
      )}

      {groupedEvents.next_weekend.length > 0 && (
        <div className={styles.eventGroup}>
          <h2 className={`${styles.groupTitle} ${styles.nextWeekend}`}>
            📅 Next Weekend ({groupedEvents.next_weekend.length})
          </h2>
          <div className={styles.groupEvents}>
            {groupedEvents.next_weekend.slice(0, 4).map((event, index) => (
              <CompactEventInsights 
                key={event.id || index} 
                event={event} 
                userProfile={userProfile} 
              />
            ))}
          </div>
        </div>
      )}

      {groupedEvents.upcoming.length > 0 && (
        <div className={styles.eventGroup}>
          <h2 className={`${styles.groupTitle} ${styles.upcoming}`}>
            🗓️ Coming Up ({groupedEvents.upcoming.length})
          </h2>
          <div className={styles.groupEvents}>
            {groupedEvents.upcoming.slice(0, 6).map((event, index) => (
              <CompactEventInsights 
                key={event.id || index} 
                event={event} 
                userProfile={userProfile} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Debug information */}
      {debugInfo && (
        <div className={styles.debugInfo}>
          <h4>Search Information</h4>
          <p><strong>Query:</strong> {debugInfo.query}</p>
          <p><strong>Location:</strong> {debugInfo.location}</p>
          <p><strong>Vibe Match Filter:</strong> {debugInfo.vibeMatchFilter}%</p>
          {debugInfo.eventsFiltered && (
            <p><strong>Events Filtered:</strong> {debugInfo.eventsFiltered}</p>
          )}
          <p><strong>Timestamp:</strong> {debugInfo.timestamp}</p>
        </div>
      )}
    </div>
  );
}
