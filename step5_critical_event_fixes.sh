#!/bin/bash

# STEP 2 CRITICAL FIXES - Match Scores, Event Links, Data Labels
# =============================================================

echo "🔧 STEP 2 CRITICAL FIXES - Urgent Event Issues"
echo "=============================================="

echo "✅ Step 1: Fixing Events API - Match Scores and Data Labels..."

# Fix the events API with proper match score calculation and data labeling
cat > pages/api/events/index.js << 'EOF'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';

const TICKETMASTER_API_KEY = process.env.TICKETMASTER_API_KEY;
const TICKETMASTER_BASE_URL = 'https://app.ticketmaster.com/discovery/v2';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { lat = '43.65', lon = '-79.38', city = 'Toronto', radius = '50' } = req.query;

    console.log(`🎯 Events API called for ${city} (${lat}, ${lon})`);

    let realEvents = [];
    let apiError = null;

    // Try to fetch real events from Ticketmaster with retry logic
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`🔄 Attempt ${attempt}: Fetching Ticketmaster events...`);
        
        const ticketmasterUrl = `${TICKETMASTER_BASE_URL}/events.json?apikey=${TICKETMASTER_API_KEY}&latlong=${lat},${lon}&radius=${radius}&unit=km&classificationName=music&size=50&sort=date,asc`;
        
        const response = await fetch(ticketmasterUrl, {
          timeout: 10000,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'SonarEDM/1.0'
          }
        });

        if (!response.ok) {
          throw new Error(`Ticketmaster API error: ${response.status}`);
        }

        const data = await response.json();
        
        if (data._embedded && data._embedded.events) {
          realEvents = data._embedded.events.map(event => {
            const venue = event._embedded?.venues?.[0];
            const artists = event._embedded?.attractions?.map(a => a.name) || [];
            
            // FIXED: Enhanced relevance scoring with proper cap at 99%
            const edmKeywords = ['house', 'techno', 'electronic', 'edm', 'dance', 'trance', 'dubstep', 'drum', 'bass'];
            const eventText = `${event.name} ${artists.join(' ')} ${event.classifications?.[0]?.genre?.name || ''}`.toLowerCase();
            const edmMatches = edmKeywords.filter(keyword => eventText.includes(keyword)).length;
            
            // Calculate base score (70-85) + EDM bonus (0-15) + random (0-9) = max 99%
            const baseScore = Math.min(70 + (edmMatches * 3), 85);
            const randomBonus = Math.floor(Math.random() * 10);
            const finalScore = Math.min(baseScore + randomBonus, 99);
            
            return {
              id: event.id,
              name: event.name,
              date: event.dates?.start?.localDate,
              time: event.dates?.start?.localTime,
              venue: venue?.name || 'Venue TBA',
              address: venue?.address?.line1 || venue?.city?.name || 'Address TBA',
              city: venue?.city?.name || city,
              ticketUrl: event.url, // FIXED: Use actual Ticketmaster URL
              priceRange: event.priceRanges?.[0] ? `$${event.priceRanges[0].min}-${event.priceRanges[0].max}` : 'Price TBA',
              headliners: artists.slice(0, 3),
              matchScore: finalScore, // FIXED: Properly capped at 99%
              source: 'ticketmaster', // FIXED: Correct source labeling
              venueType: venue?.name?.toLowerCase().includes('club') ? 'Club' : 
                        venue?.name?.toLowerCase().includes('festival') ? 'Festival' : 'Venue'
            };
          });

          console.log(`✅ Successfully fetched ${realEvents.length} real events from Ticketmaster`);
          break; // Success, exit retry loop
        }
      } catch (error) {
        console.error(`❌ Attempt ${attempt} failed:`, error.message);
        apiError = error;
        if (attempt === 3) {
          console.error('🚨 All Ticketmaster API attempts failed');
        }
      }
    }

    // Enhanced fallback logic - only use emergency samples if NO real events
    let finalEvents = realEvents;
    
    if (realEvents.length === 0) {
      console.log('⚠️ No real events found, using emergency fallback samples');
      
      const emergencyEvents = [
        {
          id: 'emergency-1',
          name: 'Emergency EDM Night',
          date: '2025-07-15',
          venue: 'Local Club',
          address: 'Downtown Area',
          city: city,
          ticketUrl: '#',
          matchScore: 75,
          source: 'emergency', // FIXED: Proper source for emergency events
          headliners: ['Local DJ'],
          venueType: 'Club'
        }
      ];
      
      finalEvents = emergencyEvents;
    }

    // Sort by relevance score and date
    finalEvents.sort((a, b) => {
      if (a.source === 'ticketmaster' && b.source !== 'ticketmaster') return -1;
      if (b.source === 'ticketmaster' && a.source !== 'ticketmaster') return 1;
      return b.matchScore - a.matchScore;
    });

    console.log(`🎯 Returning ${finalEvents.length} events (${realEvents.length} real, ${finalEvents.length - realEvents.length} emergency)`);

    res.status(200).json({
      events: finalEvents,
      total: finalEvents.length,
      realCount: realEvents.length,
      source: realEvents.length > 0 ? 'ticketmaster' : 'emergency',
      location: { city, lat, lon }
    });

  } catch (error) {
    console.error('🚨 Events API critical error:', error);
    res.status(500).json({ 
      message: 'Failed to fetch events',
      error: error.message,
      events: [],
      total: 0
    });
  }
}
EOF

echo "✅ Step 2: Fixing Event List Component - Click Handlers and Data Labels..."

# Fix the event list component with proper clicking and data labels
cat > components/EnhancedEventList.js << 'EOF'
import React, { useState } from 'react';
import styles from '@/styles/EnhancedEventList.module.css';

export default function EnhancedEventList({ events, loading, error }) {
  const [visibleEvents, setVisibleEvents] = useState(4);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // FIXED: Enhanced event click handler with proper URL handling
  const handleEventClick = (event) => {
    console.log('🎯 Event clicked:', event.name, 'Source:', event.source, 'URL:', event.ticketUrl);
    
    // FIXED: Proper URL validation and handling
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
  
  // FIXED: Proper data source label determination
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
          {events.slice(0, visibleEvents).map((event) => (
            <div 
              key={event.id} 
              className={`${styles.eventCard} ${styles.clickable}`}
              onClick={() => handleEventClick(event)}
              style={{ cursor: 'pointer' }}
            >
              <div className={styles.eventHeader}>
                <div className={styles.dateBox}>
                  <span className={styles.date}>{formatDate(event.date)}</span>
                </div>
                <div className={styles.matchScore}>
                  <div 
                    className={styles.matchCircle}
                    style={{
                      background: `conic-gradient(
                        rgba(0, 255, 255, 0.8) ${event.matchScore}%,
                        rgba(0, 255, 255, 0.2) ${event.matchScore}%
                      )`
                    }}
                  >
                    <span>{event.matchScore}%</span>
                  </div>
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
          ))}
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

echo ""
echo "🎯 STEP 2 CRITICAL FIXES COMPLETE"
echo "================================="
echo ""
echo "✅ Issues Fixed:"
echo "   - Match scores properly capped at 99% maximum"
echo "   - Event URLs use actual Ticketmaster ticket links"
echo "   - Data source labels show 'Live Data' for real events"
echo "   - Event click handlers properly validate URLs"
echo "   - Console logging enhanced for debugging"
echo ""
echo "✅ What's Improved:"
echo "   - Match Score Calculation: Base (70-85) + EDM bonus (0-15) + random (0-9) = max 99%"
echo "   - Event URL Handling: Uses actual event.url from Ticketmaster API"
echo "   - Data Source Labels: 'Live Data' for ticketmaster, 'Emergency' for fallback"
echo "   - Click Validation: Checks for valid HTTP URLs before opening"
echo ""
echo "🚀 Ready for deployment and testing!"

# Create deployment script
cat > deploy_critical_fixes.sh << 'EOF'
#!/bin/bash

echo "🚀 DEPLOYING CRITICAL EVENT FIXES"
echo "================================="

echo "✅ Step 1: Adding changes to git..."
git add .

echo "✅ Step 2: Committing critical fixes..."
git commit -m "CRITICAL FIXES: Match scores capped at 99%, proper event URLs, correct data labels"

echo "✅ Step 3: Deploying to Heroku..."
git push heroku step2-frontend-backend-alignment:main --force

echo ""
echo "🎯 CRITICAL FIXES DEPLOYED"
echo "========================="
echo ""
echo "✅ Fixed Issues:"
echo "   - Match scores: Now properly capped at 99%"
echo "   - Event URLs: Use actual Ticketmaster ticket links"
echo "   - Data labels: Show 'Live Data' for real events"
echo "   - Event clicking: Proper URL validation and handling"
echo ""
echo "🚀 Your staging site is ready for testing:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
EOF

chmod +x deploy_critical_fixes.sh

echo ""
echo "🎯 CRITICAL FIXES READY FOR DEPLOYMENT"
echo "======================================"
echo ""
echo "✅ Created Scripts:"
echo "   - step5_critical_event_fixes.sh (Apply fixes)"
echo "   - deploy_critical_fixes.sh (Deploy to Heroku)"
echo ""
echo "✅ Issues That Will Be Fixed:"
echo "   - Match scores over 100% → Capped at 99%"
echo "   - Wrong event links → Actual Ticketmaster URLs"
echo "   - 'Demo Data' labels → 'Live Data' for real events"
echo "   - Non-working clicks → Proper URL validation"
echo ""
echo "🚀 Ready to deploy critical fixes!"

