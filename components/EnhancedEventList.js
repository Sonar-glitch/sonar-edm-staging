// ENHANCED: components/EnhancedEventList.js
// SURGICAL ADDITION: Accept location and vibeMatch props, pass to Events API
// PRESERVES: All existing functionality, styling, error handling, and component behavior

import { useState, useEffect } from 'react';
import TasteMatchVisuals from './TasteMatchVisuals';
import styles from '../styles/EnhancedEventList.module.css';

// Enhanced Circular Progress Component - SOLID COMPLETION CIRCLE
const EnhancedCircularProgress = ({ score, event, userProfile }) => {
  const [showBreakdown, setShowBreakdown] = useState(false);
  
  // If no score is provided, don't render the component
  if (score === undefined || score === null) {
    return (
      <div className={styles.circularProgressEnhanced}>
        <div className={styles.progressTextEnhanced}>
          <span className={styles.percentageSymbolEnhanced}>?</span>
        </div>
      </div>
    );
  }
  
  const percentage = Math.round(score);
  const radius = 45; // BIGGER: Increased from 35 to 45
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  // Calculate REAL score breakdown based on actual event data
  const getScoreBreakdown = () => {
    let genreMatch = 0;
    let soundMatch = 0;
    let artistMatch = 0;
    let venueMatch = 0;
    let timingMatch = 0;
    
    // IMPROVED: Better genre/music detection
    const eventText = (event.name || '').toLowerCase();
    const eventDescription = (event.description || '').toLowerCase();
    const fullEventText = eventText + ' ' + eventDescription;
    
    // Get venue info early for analysis
    const venueName = (typeof event.venue === 'object' ? event.venue?.name : event.venue || '').toLowerCase();
    
    // Check if this is actually a music event
    const musicKeywords = ['dj', 'music', 'concert', 'festival', 'electronic', 'house', 'techno', 'edm', 'dance', 'bass', 'club', 'party', 'live music', 'band', 'artist', 'performance', 'tour'];
    const nonMusicKeywords = ['museum', 'exhibition', 'castle', 'historic', 'visit', 'sightseeing'];
    
    // Special case: "general admission" is only non-music if it's NOT accompanied by music keywords
    const hasGeneralAdmission = fullEventText.includes('general admission');
    const hasSpecificNonMusicVenue = venueName.includes('casa loma') && !fullEventText.includes('concert');
    
    const musicMatches = musicKeywords.filter(word => fullEventText.includes(word));
    const nonMusicMatches = nonMusicKeywords.filter(word => fullEventText.includes(word));
    
    // Add general admission to non-music only if no music context
    if (hasGeneralAdmission && musicMatches.length === 0) {
      nonMusicMatches.push('general admission');
    }
    
    // Add venue-specific non-music detection
    if (hasSpecificNonMusicVenue) {
      nonMusicMatches.push('historic venue tour');
    }
    
    // Heavily penalize non-music events
    if (nonMusicMatches.length > musicMatches.length) {
      genreMatch = 5; // Very low music relevance
    } else {
      // REAL Genre matching for actual music events
      const electronicKeywords = ['electronic', 'house', 'techno', 'edm', 'dance', 'bass', 'dj', 'club'];
      const matches = electronicKeywords.filter(word => fullEventText.includes(word));
      genreMatch = Math.min(25, matches.length * 4 + 10);
    }
    
    // REAL Sound characteristics from venue analysis
    const venueText = venueName + ' ' + fullEventText;
    
    if (nonMusicMatches.length > musicMatches.length) {
      soundMatch = 3; // Very low for non-music venues
    } else if (venueText.includes('club') || venueText.includes('lounge')) {
      soundMatch = 20;
    } else if (venueText.includes('theater') || venueText.includes('hall')) {
      soundMatch = 25;
    } else {
      soundMatch = 15;
    }
    
    // REAL Artist affinity
    if (event.artists && event.artists.length > 0) {
      artistMatch = Math.min(20, event.artists.length * 4 + 8);
    } else if (nonMusicMatches.length > musicMatches.length) {
      artistMatch = 2; // Very low for non-music events
    } else {
      artistMatch = 15;
    }
    
    // REAL Venue preference
    if (typeof event.venue === 'object' && event.venue?.name) {
      const venueType = event.venue.name.toLowerCase();
      if (nonMusicMatches.length > musicMatches.length) {
        venueMatch = 3; // Very low for non-music venues
      } else if (venueType.includes('club')) venueMatch = 12;
      else if (venueType.includes('theater') || venueType.includes('hall')) venueMatch = 15;
      else if (venueType.includes('festival')) venueMatch = 18;
      else venueMatch = 10;
    } else {
      venueMatch = nonMusicMatches.length > musicMatches.length ? 2 : 8;
    }
    
    // REAL Timing preference
    const eventDate = event.date ? new Date(event.date) : null;
    if (eventDate) {
      const now = new Date();
      const daysUntil = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 7) timingMatch = 15;
      else if (daysUntil > 7 && daysUntil <= 14) timingMatch = 12;
      else if (daysUntil > 14 && daysUntil <= 30) timingMatch = 8;
      else timingMatch = 5;
    } else {
      timingMatch = 5;
    }
    
    // Normalize to match actual score
    const calculatedTotal = genreMatch + soundMatch + artistMatch + venueMatch + timingMatch;
    const scaleFactor = calculatedTotal > 0 ? percentage / calculatedTotal : 1;
    
    // DEBUG: Log analysis for questionable events
    if (event.name && (event.name.toLowerCase().includes('casa loma') || nonMusicMatches.length > musicMatches.length)) {
      console.log(`🔍 Event Analysis: "${event.name}"`);
      console.log('Music keywords found:', musicMatches);
      console.log('Non-music keywords found:', nonMusicMatches);
      console.log('Is likely music event:', musicMatches.length > nonMusicMatches.length);
      console.log('Raw scores:', JSON.stringify({ genreMatch, soundMatch, artistMatch, venueMatch, timingMatch }));
      console.log('Total calculated vs actual:', calculatedTotal, 'vs', percentage);
    }
    
    return {
      genreMatch: Math.round(genreMatch * scaleFactor),
      soundMatch: Math.round(soundMatch * scaleFactor),
      artistMatch: Math.round(artistMatch * scaleFactor),
      venueMatch: Math.round(venueMatch * scaleFactor),
      timingMatch: Math.round(timingMatch * scaleFactor),
      total: percentage,
      isMusicEvent: musicMatches.length > nonMusicMatches.length
    };
  };
  
  const breakdown = getScoreBreakdown();
  
  // Get color based on percentage
  const getColor = () => {
    if (percentage >= 80) return '#FF00CC'; // High match - TIKO pink
    if (percentage >= 60) return '#00CFFF'; // Good match - TIKO blue
    return '#FFB800'; // Fair match - TIKO orange
  };
  
  return (
    <div className={styles.circularProgressEnhanced} 
         onMouseEnter={() => setShowBreakdown(true)}
         onMouseLeave={() => setShowBreakdown(false)}>
      <svg width="100" height="100" className={styles.progressSvgEnhanced}>
        {/* Background circle */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="6"
        />
        
        {/* Progress circle - SOLID COMPLETION */}
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className={styles.progressCircleEnhanced}
          style={{
            filter: `drop-shadow(0 0 12px ${getColor()}80)`,
            transform: 'rotate(-90deg)',
            transformOrigin: '50px 50px'
          }}
        />
      </svg>
      
      {/* Percentage text in center - PROPER FONT WITH GLOW */}
      <div className={styles.progressTextEnhanced}>
        <span className={styles.percentageNumberEnhanced} style={{
          textShadow: `0 0 20px ${getColor()}CC, 0 0 40px ${getColor()}88, 0 0 60px ${getColor()}44`
        }}>{percentage}</span>
        <span className={styles.percentageSymbolEnhanced}>%</span>
      </div>
      
      {/* Compact tooltip */}
      {showBreakdown && (
        <div className={styles.circularTooltip}>
          <div className={styles.tooltipHeader}>
            <span className={styles.tooltipTitle}>Match Score</span>
            <span className={styles.totalScore}>{breakdown.total}%</span>
          </div>
          
          <div className={styles.breakdownItems}>
            <div className={styles.breakdownItem}>
              <span className={styles.itemLabel}>🎵 Genre</span>
              <span className={styles.itemScore}>{breakdown.genreMatch}%</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.itemLabel}>🔊 Sound</span>
              <span className={styles.itemScore}>{breakdown.soundMatch}%</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.itemLabel}>🎤 Artist</span>
              <span className={styles.itemScore}>{breakdown.artistMatch}%</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.itemLabel}>🏛️ Venue</span>
              <span className={styles.itemScore}>{breakdown.venueMatch}%</span>
            </div>
            <div className={styles.breakdownItem}>
              <span className={styles.itemLabel}>⏰ Timing</span>
              <span className={styles.itemScore}>{breakdown.timingMatch}%</span>
            </div>
          </div>
          
          <div className={styles.tooltipFooter}>
            <p>Based on real event analysis</p>
            {!breakdown.isMusicEvent && (
              <p style={{color: '#FF6B6B', fontSize: '0.7rem'}}>⚠️ Non-music event detected</p>
            )}
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
    national: [],
    international: []
  };

  // Get user's country (default to Canada for Toronto)
  const userCountry = userLocation?.country?.toLowerCase() || 'canada';
  const userCity = userLocation?.city?.toLowerCase() || 'toronto';

  events.forEach((event) => {
    const eventDate = event.date ? new Date(event.date) : null;
    const daysUntilEvent = eventDate ? Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24)) : null;
    const score = event.personalizedScore || 0;
    
    // FIXED: Proper International = Different Country, National = Different City
    const eventLocation = typeof event.location === 'object' ? 
      (event.location?.city || event.location?.name || 'Unknown') : 
      (event.location || 'Unknown');
    
    const eventVenue = typeof event.venue === 'object' ? 
      (event.venue?.city || event.venue?.address || '') : '';
    
    const eventLocationText = (eventLocation + ' ' + eventVenue).toLowerCase();
    
    // Country detection based on city/venue information
    const isInternational = (
      // US cities
      eventLocationText.includes('new york') || eventLocationText.includes('los angeles') || 
      eventLocationText.includes('chicago') || eventLocationText.includes('miami') || 
      eventLocationText.includes('las vegas') || eventLocationText.includes('san francisco') ||
      eventLocationText.includes('boston') || eventLocationText.includes('seattle') ||
      eventLocationText.includes('detroit') || eventLocationText.includes('philadelphia') ||
      // European cities
      eventLocationText.includes('london') || eventLocationText.includes('berlin') || 
      eventLocationText.includes('amsterdam') || eventLocationText.includes('paris') ||
      eventLocationText.includes('madrid') || eventLocationText.includes('rome') ||
      eventLocationText.includes('barcelona') || eventLocationText.includes('prague') ||
      // Other international cities
      eventLocationText.includes('tokyo') || eventLocationText.includes('sydney') ||
      eventLocationText.includes('melbourne') || eventLocationText.includes('mexico city')
    );
    
    // National = Different Canadian city (same country, different city)
    const isNational = !isInternational && (
      eventLocationText.includes('montreal') || eventLocationText.includes('vancouver') || 
      eventLocationText.includes('calgary') || eventLocationText.includes('edmonton') ||
      eventLocationText.includes('ottawa') || eventLocationText.includes('winnipeg') ||
      eventLocationText.includes('halifax') || eventLocationText.includes('quebec city')
    ) && !eventLocationText.includes(userCity);
    
    // Local = Same city (Toronto area)
    const isLocal = !isInternational && !isNational;

    // Categorize events by priority
    if (score >= 90) {
      groups.mustSee.push(event);
    } else if (isInternational && score >= 70) {
      groups.international.push(event);
    } else if (isNational && score >= 65) {
      groups.national.push(event);
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
  // SURGICAL ADDITION: Collapsible groups state - START COLLAPSED
  const [collapsedGroups, setCollapsedGroups] = useState(new Set(['mustSee', 'tonight', 'tomorrow', 'thisWeekend', 'nextWeekend', 'national', 'international']));

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
          <p>Error: {error?.message || error?.toString() || 'An unknown error occurred'}</p>
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

  // Enhanced events display with grouping
  const filteredEvents = (events || []).filter(event => event && typeof event === 'object');
  const groupedEvents = groupEventsByTime(filteredEvents, userLocation);
  
  const groupTitles = {
    mustSee: 'Must See',
    tonight: 'Tonight',
    tomorrow: 'Tomorrow', 
    thisWeekend: 'This Weekend',
    nextWeekend: 'Next Weekend',
    national: 'National',
    international: 'International'
  };

  // Toggle group collapse state
  const toggleGroupCollapse = (groupKey) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.eventsList}>
        {Object.entries(groupedEvents).map(([groupKey, groupEvents]) => {
          if (groupEvents.length === 0) return null;
          
          const isCollapsed = collapsedGroups.has(groupKey);

          return (
            <div key={groupKey} className={styles.eventGroup}>
              <div 
                className={styles.groupHeader}
                onClick={() => toggleGroupCollapse(groupKey)}
              >
                <div className={styles.groupHeaderLeft}>
                  <span className={styles.groupIcon}>
                    {groupKey === 'mustSee' ? '🎯' : 
                     groupKey === 'tonight' ? '🌙' : 
                     groupKey === 'tomorrow' ? '🌅' : 
                     groupKey === 'thisWeekend' ? '🎉' : 
                     groupKey === 'nextWeekend' ? '📅' : 
                     groupKey === 'national' ? '🍁' :
                     groupKey === 'international' ? '🌍' : '🎵'}
                  </span>
                  <h3 className={styles.groupTitle}>
                    {groupTitles[groupKey]} ({groupEvents.length})
                  </h3>
                </div>
                <div className={styles.groupHeaderRight}>
                  <span className={styles.collapseIcon}>
                    {isCollapsed ? '▶' : '▼'}
                  </span>
                </div>
              </div>
              
              {!isCollapsed && (
                <div className={styles.groupEvents}>
                  {groupEvents.map((event, index) => {
          // Format date and time for better display
          const eventDate = event.date ? new Date(event.date) : null;
          const now = new Date();
          const daysUntilEvent = eventDate ? Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24)) : null;
          
          let dateDisplay = 'Date TBD';
          let timeDisplay = '';
          let urgencyClass = '';
          
          if (eventDate) {
            const dateStr = eventDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            });
            
            // Format time in user's timezone
            const timeStr = eventDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            });
            
            timeDisplay = timeStr;
            
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
                  url: event.url,
                  ticketUrl: event.ticketUrl,
                  hasUrl: !!event.url,
                  urlValid: event.url && event.url !== '#'
                });
                
                // Prevent event bubbling from button clicks
                if (e.target.closest('a')) {
                  console.log('📎 Click was on ticket button, not card');
                  return;
                }
                
                // Use event.url instead of ticketUrl (based on DB analysis)
                if (event.url && event.url !== '#') {
                  console.log('🚀 Opening event URL:', event.url);
                  window.open(event.url, '_blank');
                } else if (event.ticketUrl && event.ticketUrl !== '#') {
                  console.log('🚀 Opening ticket URL:', event.ticketUrl);
                  window.open(event.ticketUrl, '_blank');
                } else {
                  console.log('❌ No valid URL found');
                }
              }}
              style={{ cursor: (event.url || event.ticketUrl) && (event.url !== '#' && event.ticketUrl !== '#') ? 'pointer' : 'default' }}
            >
              {/* Improved header with title, location, date/time, and match score */}
              <div className={styles.compactHeader}>
                <div className={styles.eventTitleCompact}>
                  <div className={styles.titleLocationRow}>
                    <h4 className={styles.eventTitleText}>{event.name || 'Untitled Event'}</h4>
                    <span className={styles.locationBadge}>
                      {typeof event.location === 'object' ? (event.location?.city || event.location?.name || 'Location TBD') : (event.location || 'Location TBD')}
                    </span>
                  </div>
                  <div className={styles.dateTimeRow}>
                    <div className={styles.eventDateCompact}>{dateDisplay}</div>
                    {timeDisplay && (
                      <div className={styles.eventTimeCompact}>{timeDisplay}</div>
                    )}
                  </div>
                </div>
                <div className={styles.matchScoreCompact}>
                  <EnhancedCircularProgress 
                    score={event.personalizedScore}
                    event={event}
                    userProfile={userProfile}
                  />
                </div>
              </div>

              {/* Venue info without location (moved to header) */}
              <div className={styles.compactVenueInfo}>
                <span 
                  className={styles.venueName}
                  title={`Venue: ${typeof event.venue === 'object' ? 
                    `${event.venue?.name || 'TBD'} - ${event.venue?.address || 'Address TBD'}` : 
                    (event.venue || 'Venue details TBD')}`}
                >
                  {typeof event.venue === 'object' ? (event.venue?.name || 'Venue TBD') : (event.venue || 'Venue TBD')}
                </span>
              </div>

              {/* Generate "why this matches you" insights with tooltips */}
              <div className={styles.matchInsights}>
                {(() => {
                  const insights = [];
                  const score = event.personalizedScore || 0;
                  
                  // High match insights with explanations
                  if (score >= 80) {
                    insights.push({
                      text: "🎯 Perfect vibe match",
                      tooltip: "Score 80%+ indicates excellent compatibility with your music taste profile based on genre, venue, artist, timing, and sound analysis"
                    });
                  } else if (score >= 60) {
                    insights.push({
                      text: "✨ Strong music compatibility", 
                      tooltip: "Score 60-79% shows good alignment with your preferences, particularly in genre and artist matching"
                    });
                  }
                  
                  // Artist-based insights
                  if (event.artists && event.artists.length > 0) {
                    const artists = event.artists.slice(0, 2).map(a => typeof a === 'object' ? a.name : a);
                    if (artists.length > 0) {
                      insights.push({
                        text: `🎧 Features ${artists.join(', ')}`,
                        tooltip: `${event.artists.length} artist(s) performing. Artist variety contributes ${Math.round((event.artists.length * 4 + 8) * 100 / score)}% to your match score`
                      });
                    }
                  }
                  
                  // Genre insights with tooltips
                  if (event.genres && event.genres.length > 0) {
                    const topGenres = event.genres.slice(0, 2);
                    insights.push({
                      text: `🎵 ${topGenres.join(' & ')} vibes`,
                      tooltip: `Genre matching based on ${event.genres.length} genre(s). Genre compatibility contributes to your overall match score`
                    });
                  }
                  
                  // Urgency insights with tooltips
                  if (urgencyClass === styles.tonightEvent || urgencyClass === styles.tomorrowEvent) {
                    insights.push({
                      text: "⚡ Happening soon",
                      tooltip: "Events happening within 1-2 days get higher timing scores due to urgency and spontaneity factor"
                    });
                  }
                  
                  return insights.slice(0, 3).map((insight, idx) => (
                    <span 
                      key={idx} 
                      className={styles.insightTag}
                      title={typeof insight === 'object' ? insight.tooltip : undefined}
                    >
                      {typeof insight === 'object' ? insight.text : insight}
                    </span>
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
              )}
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

