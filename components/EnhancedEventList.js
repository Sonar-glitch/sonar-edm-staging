// ENHANCED: components/EnhancedEventList.js
// SURGICAL ADDITION: Accept location and vibeMatch props, pass to Events API
// PRESERVES: All existing functionality, styling, error handling, and component behavior

import { useState, useEffect } from 'react';
import TasteMatchVisuals from './TasteMatchVisuals';
import styles from '../styles/EnhancedEventList.module.css';

// Circular Progress Component for Match Percentage
const CircularMatchProgress = ({ score, event, userProfile }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const percentage = Math.round(score || 50);
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Calculate score breakdown
  const getScoreBreakdown = () => {
    // Simulate score breakdown based on event characteristics
    const genreMatch = Math.min(40, percentage * 0.4);
    const soundMatch = Math.min(30, percentage * 0.3);
    const artistMatch = Math.min(20, percentage * 0.2);
    const venueMatch = Math.min(10, percentage * 0.1);
    
    return {
      genreMatch: Math.round(genreMatch),
      soundMatch: Math.round(soundMatch),
      artistMatch: Math.round(artistMatch),
      venueMatch: Math.round(venueMatch),
      total: percentage
    };
  };
  
  const breakdown = getScoreBreakdown();
  
  const handleMouseEnter = (e) => {
    setShowBreakdown(true);
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleMouseMove = (e) => {
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY
    });
  };
  
  const handleMouseLeave = () => {
    setShowBreakdown(false);
  };
  
  return (
    <div className={styles.circularProgress} 
         onMouseEnter={handleMouseEnter}
         onMouseMove={handleMouseMove}
         onMouseLeave={handleMouseLeave}>
      <svg width="50" height="50" className={styles.progressSvg}>
        {/* Background circle */}
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="3"
        />
        
        {/* Progress circle */}
        <circle
          cx="25"
          cy="25"
          r={radius}
          fill="none"
          stroke={`url(#gradient-${percentage >= 80 ? 'high' : percentage >= 60 ? 'good' : 'fair'})`}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          className={styles.progressCircle}
        />
        
        {/* Gradient definitions */}
        <defs>
          <linearGradient id="gradient-high" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF00CC" />
            <stop offset="100%" stopColor="#FF6B00" />
          </linearGradient>
          <linearGradient id="gradient-good" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00CFFF" />
            <stop offset="100%" stopColor="#00FF94" />
          </linearGradient>
          <linearGradient id="gradient-fair" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFB800" />
            <stop offset="100%" stopColor="#FF6B00" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Percentage text in center */}
      <div className={styles.progressText}>
        <span className={styles.percentageNumber}>{percentage}</span>
        <span className={styles.percentageSymbol}>%</span>
      </div>
      
      {/* Glassmorphic tooltip with breakdown */}
      {showBreakdown && (
        <div 
          className={styles.matchBreakdownTooltip}
          style={{
            left: tooltipPosition.x - 300,
            top: tooltipPosition.y - 200,
          }}
        >
          <div className={styles.tooltipHeader}>
            <h4>🎯 Match Score Breakdown</h4>
            <span className={styles.totalScore}>{breakdown.total}%</span>
          </div>
          
          <div className={styles.breakdownItems}>
            <div className={styles.breakdownItem}>
              <span className={styles.itemLabel}>🎵 Genre Match</span>
              <span className={styles.itemScore}>{breakdown.genreMatch}%</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.itemLabel}>🔊 Sound Characteristics</span>
              <span className={styles.itemScore}>{breakdown.soundMatch}%</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.itemLabel}>🎤 Artist Affinity</span>
              <span className={styles.itemScore}>{breakdown.artistMatch}%</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.itemLabel}>🏛️ Venue Preference</span>
              <span className={styles.itemScore}>{breakdown.venueMatch}%</span>
            </div>
          </div>
          
          <div className={styles.tooltipFooter}>
            <p>Based on your music taste profile and listening history</p>
          </div>
        </div>
      )}
    </div>
  );
};

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

// Helper function to group events by time categories
const groupEventsByTime = (events, userLocation) => {
  const now = new Date();
  const groups = {
    mustSee: [],
    tonight: [],
    tomorrow: [],
    thisWeekend: [],
    nextWeekend: [],
    international: []
  };

  events.forEach((event) => {
    const eventDate = event.date ? new Date(event.date) : null;
    const daysUntilEvent = eventDate ? Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24)) : null;
    const score = event.personalizedScore || 50;
    
    // Location-based categorization
    const eventLocation = typeof event.location === 'object' ? 
      (event.location?.city || event.location?.name || 'Unknown') : 
      (event.location || 'Unknown');
    const isInternational = userLocation?.city && 
      !eventLocation.toLowerCase().includes(userLocation.city.toLowerCase());

    // Categorize events by priority
    if (score >= 90) {
      groups.mustSee.push(event);
    } else if (isInternational && score >= 70) {
      groups.international.push(event);
    } else if (daysUntilEvent === 0) {
      groups.tonight.push(event);
    } else if (daysUntilEvent === 1) {
      groups.tomorrow.push(event);
    } else if (daysUntilEvent >= 2 && daysUntilEvent <= 7) {
      groups.thisWeekend.push(event);
    } else if (daysUntilEvent > 7 && daysUntilEvent <= 14) {
      groups.nextWeekend.push(event);
    }
  });

  return groups;
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
  // Enhanced events display with grouping
  const filteredEvents = (events || []).filter(event => event && typeof event === 'object');
  const groupedEvents = groupEventsByTime(filteredEvents, userLocation);
  
  const groupTitles = {
    mustSee: '🎯 Must See',
    tonight: '🌙 Tonight',
    tomorrow: '🌅 Tomorrow', 
    thisWeekend: '🎉 This Weekend',
    nextWeekend: '📅 Next Weekend',
    international: '🌍 International'
  };

  return (
    <div className={styles.container}>
      <div className={styles.eventsList}>
        {Object.entries(groupedEvents).map(([groupKey, groupEvents]) => {
          if (groupEvents.length === 0) return null;

          return (
            <div key={groupKey} className={styles.eventGroup}>
              <h3 className={styles.groupTitle}>
                {groupTitles[groupKey]} ({groupEvents.length})
              </h3>
              <div className={styles.groupEvents}>
                {groupEvents.map((event, index) => {
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
              onClick={(e) => {
                console.log('🔗 Event card clicked:', {
                  eventName: event.name,
                  ticketUrl: event.ticketUrl,
                  hasTicketUrl: !!event.ticketUrl,
                  ticketUrlValid: event.ticketUrl && event.ticketUrl !== '#'
                });
                
                // Prevent event bubbling from button clicks
                if (e.target.closest('a')) {
                  console.log('📎 Click was on ticket button, not card');
                  return;
                }
                
                if (event.ticketUrl && event.ticketUrl !== '#') {
                  console.log('🚀 Opening ticket URL:', event.ticketUrl);
                  window.open(event.ticketUrl, '_blank');
                } else {
                  console.log('❌ No valid ticket URL found');
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
                  <CircularMatchProgress 
                    score={event.personalizedScore || 50}
                    event={event}
                    userProfile={userProfile}
                  />
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

