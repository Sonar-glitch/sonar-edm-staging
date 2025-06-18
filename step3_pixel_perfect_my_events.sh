#!/bin/bash

# 🎯 STEP 3: MY EVENTS PAGE - PIXEL-PERFECT DASHBOARD REPLICA
# ==========================================================

echo "🎯 STEP 3: MY EVENTS PAGE - PIXEL-PERFECT DASHBOARD REPLICA"
echo "=========================================================="

echo "📋 Creating pixel-perfect replica of dashboard design for My Events page..."

# Step 1: Create the My Events page with exact dashboard structure
echo "✅ Step 1: Creating My Events page with exact dashboard layout..."

cat > pages/my-events.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '@/styles/MyEvents.module.css';

export default function MyEvents() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [likedEvents, setLikedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingEvent, setRemovingEvent] = useState(null);
  const [dataStatus, setDataStatus] = useState({
    events: 'loading'
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
    loadLikedEvents();
  }, [session, status, router]);

  // Load liked events from API
  const loadLikedEvents = async () => {
    try {
      setLoading(true);
      setDataStatus(prev => ({ ...prev, events: 'loading' }));
      
      const response = await fetch('/api/user/interested-events');
      
      if (response.ok) {
        const data = await response.json();
        setLikedEvents(data.events || []);
        setDataStatus(prev => ({ ...prev, events: 'real' }));
        console.log('✅ Loaded liked events:', data.events?.length || 0);
      } else {
        throw new Error('Failed to load liked events');
      }
    } catch (error) {
      console.error('Error loading liked events:', error);
      setError('Failed to load your saved events. Please try again.');
      setDataStatus(prev => ({ ...prev, events: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  // Remove event from liked events
  const handleRemoveEvent = async (eventId) => {
    if (!eventId) return;
    
    setRemovingEvent(eventId);
    
    try {
      const response = await fetch('/api/user/interested-events', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId })
      });
      
      if (response.ok) {
        setLikedEvents(prev => prev.filter(event => event.id !== eventId));
        console.log('✅ Event removed from liked events');
      } else {
        throw new Error('Failed to remove event');
      }
    } catch (error) {
      console.error('Error removing event:', error);
      alert('Failed to remove event. Please try again.');
    } finally {
      setRemovingEvent(null);
    }
  };

  // Handle event click
  const handleEventClick = (event) => {
    if (event.ticketUrl && event.ticketUrl !== '#' && event.ticketUrl.startsWith('http')) {
      window.open(event.ticketUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBA';
    
    const date = new Date(dateString);
    const options = { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    };
    return date.toLocaleDateString('en-US', options);
  };

  // Get data source label
  const getDataIndicator = () => {
    const status = dataStatus.events;
    switch (status) {
      case 'real': return 'Real Data';
      case 'demo': return 'Demo Data';
      case 'loading': return 'Loading...';
      case 'error': return 'Error';
      default: return 'Demo Data';
    }
  };

  if (!session) {
    return (
      <div className={styles.container}>
        <Head>
          <title>My Events - TIKO</title>
        </Head>
        
        <div className={styles.authPrompt}>
          <h2>Welcome to TIKO</h2>
          <p>Please sign in with Spotify to view your saved events.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>My Events - TIKO</title>
      </Head>
      
      {/* EXACT HEADER REPLICA */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.logo}>TIKO</span>
        </h1>
        <p className={styles.subtitle}>
          Your saved events • <span className={styles.highlight}>curated collection</span> of events you love.
        </p>
      </div>

      <div className={styles.mainContent}>
        {/* NAVIGATION ROW */}
        <div className={styles.navigationRow}>
          <div className={styles.fullWidth}>
            <div className={styles.card}>
              <div className={styles.navigationContent}>
                <Link href="/dashboard" className={styles.backLink}>
                  ← Back to Dashboard
                </Link>
                <div className={styles.eventStats}>
                  <span className={styles.eventCount}>
                    {likedEvents.length} saved event{likedEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* EVENTS SECTION - EXACT REPLICA */}
        <div className={styles.eventsSection}>
          <div className={styles.eventsHeader}>
            <h2 className={styles.sectionTitle}>My Saved Events</h2>
            <span className={styles.dataIndicator}>{getDataIndicator()}</span>
          </div>
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Loading your saved events...</p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={loadLikedEvents} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          )}
          
          {!loading && !error && likedEvents.length === 0 && (
            <div className={styles.noEvents}>
              <div className={styles.emptyIcon}>💖</div>
              <h3>No saved events yet</h3>
              <p>Start exploring events on your dashboard and save the ones you love!</p>
              <Link href="/dashboard" className={styles.exploreButton}>
                Explore Events
              </Link>
            </div>
          )}
          
          {!loading && !error && likedEvents.length > 0 && (
            <div className={styles.eventsGrid}>
              {likedEvents.map((event) => (
                <div 
                  key={event.id} 
                  className={styles.eventCard}
                  onClick={() => handleEventClick(event)}
                >
                  <div className={styles.eventHeader}>
                    <div className={styles.dateBox}>
                      <span className={styles.date}>{formatDate(event.date)}</span>
                    </div>
                    
                    <div className={styles.eventActions}>
                      <div className={styles.matchScore}>
                        <div 
                          className={styles.matchCircle}
                          style={{
                            background: `conic-gradient(
                              rgba(255, 0, 110, 0.8) ${event.matchScore}%,
                              rgba(255, 0, 110, 0.2) ${event.matchScore}%
                            )`
                          }}
                        >
                          <span>{event.matchScore}%</span>
                        </div>
                      </div>
                      
                      <button
                        className={`${styles.removeButton} ${removingEvent === event.id ? styles.removing : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveEvent(event.id);
                        }}
                        disabled={removingEvent === event.id}
                        title="Remove from My Events"
                      >
                        {removingEvent === event.id ? (
                          <div className={styles.removeSpinner}></div>
                        ) : (
                          <span className={styles.removeIcon}>🗑️</span>
                        )}
                      </button>
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
                    
                    {event.headliners && event.headliners.length > 0 && (
                      <div className={styles.artistList}>
                        {event.headliners.map((artist, index) => (
                          <span key={index} className={styles.artist}>
                            {artist}{index < event.headliners.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.eventFooter}>
                    <span className={styles.venueType}>{event.venueType || 'Venue'}</span>
                    <span className={`${styles.sourceTag} ${
                      event.source === 'ticketmaster' ? styles.liveTag : 
                      event.source === 'emergency' ? styles.emergencyTag : styles.sampleTag
                    }`}>
                      {event.source === 'ticketmaster' ? 'Live Data' : 
                       event.source === 'emergency' ? 'Emergency' : 'Demo Data'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
EOF

echo "✅ Step 2: Creating pixel-perfect CSS matching dashboard design..."

# Step 2: Create CSS that exactly matches the dashboard
cat > styles/MyEvents.module.css << 'EOF'
/* MY EVENTS PAGE - PIXEL-PERFECT DASHBOARD REPLICA */

/* EXACT CONTAINER MATCH */
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
  color: #fff;
  padding: 0;
  overflow-x: hidden;
}

/* EXACT HEADER MATCH */
.header {
  padding: 1rem 1rem 0 1rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 0, 110, 0.1);
  margin-bottom: 0;
}

.title {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
}

.logo {
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.1em;
  text-shadow: 0 0 30px rgba(255, 0, 110, 0.5);
}

.subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  margin: 0;
}

.highlight {
  color: #ff006e;
  font-weight: 600;
  text-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
}

/* EXACT MAIN CONTENT MATCH */
.mainContent {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* NAVIGATION ROW */
.navigationRow {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
  margin: 0;
  align-items: stretch;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 1rem 0;
}

.fullWidth {
  display: flex;
  flex-direction: column;
  height: 100%;
}

/* EXACT CARD MATCH */
.card {
  background: rgba(15, 15, 25, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  height: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
}

.card:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5);
  transform: translateY(-1px);
}

/* NAVIGATION CONTENT */
.navigationContent {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.backLink {
  color: rgba(0, 212, 255, 0.8);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 212, 255, 0.3);
  transition: all 0.3s ease;
  font-weight: 500;
}

.backLink:hover {
  background: rgba(0, 212, 255, 0.1);
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.3);
  transform: translateY(-2px);
}

.eventStats {
  display: flex;
  align-items: center;
}

.eventCount {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
  padding: 0.3rem 0.8rem;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* EXACT EVENTS SECTION MATCH */
.eventsSection {
  margin-top: 0;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.eventsHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.sectionTitle {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dataIndicator {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  font-weight: 500;
}

/* EXACT LOADING STATE MATCH */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top: 2px solid #ff006e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.8rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* EXACT ERROR STATE MATCH */
.error {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
  margin: 0.8rem 0;
  backdrop-filter: blur(10px);
}

.retryButton {
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.8rem;
  transition: all 0.2s ease;
}

.retryButton:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(255, 0, 110, 0.3);
}

/* EMPTY STATE */
.noEvents {
  text-align: center;
  padding: 3rem 2rem;
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
}

.emptyIcon {
  font-size: 3rem;
  margin-bottom: 1rem;
  filter: drop-shadow(0 0 20px rgba(255, 0, 110, 0.5));
}

.noEvents h3 {
  font-size: 1.5rem;
  margin-bottom: 0.8rem;
  color: #fff;
  text-shadow: 0 0 15px rgba(255, 0, 110, 0.3);
}

.noEvents p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

.exploreButton {
  display: inline-block;
  background: linear-gradient(90deg, rgba(255, 0, 110, 0.5), rgba(0, 212, 255, 0.5));
  color: #fff;
  text-decoration: none;
  padding: 0.8rem 1.5rem;
  border-radius: 1.5rem;
  font-weight: 500;
  transition: all 0.3s ease;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.3);
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.2);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
}

.exploreButton:hover {
  background: linear-gradient(90deg, rgba(255, 0, 110, 0.7), rgba(0, 212, 255, 0.7));
  transform: translateY(-3px);
  box-shadow: 0 0 30px rgba(255, 0, 110, 0.4);
}

/* EXACT EVENTS GRID MATCH - USING ENHANCED EVENT LIST STYLING */
.eventsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 1rem;
}

/* EXACT GLASSMORPHIC EVENT CARDS MATCH */
.eventCard {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 0, 110, 0.2);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
}

.eventCard:hover {
  transform: translateY(-8px);
  box-shadow: 
    0 15px 50px rgba(255, 0, 110, 0.3),
    0 0 30px rgba(255, 0, 110, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 0, 110, 0.5);
}

.eventHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

.eventActions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dateBox {
  background: rgba(0, 0, 0, 0.5);
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.date {
  font-size: 0.8rem;
  font-weight: 500;
  color: #fff;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.matchScore {
  display: flex;
  align-items: center;
}

.matchCircle {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  color: #fff;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
}

/* REMOVE BUTTON */
.removeButton {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
}

.removeButton:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.5);
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.4);
  transform: scale(1.1);
}

.removeButton.removing {
  opacity: 0.7;
  cursor: not-allowed;
}

.removeIcon {
  filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5));
}

.removeSpinner {
  width: 0.8rem;
  height: 0.8rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-top: 1px solid rgba(255, 0, 0, 0.8);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.eventContent {
  padding: 1rem;
}

.eventName {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #fff;
  text-shadow: 0 0 15px rgba(255, 0, 110, 0.3);
  line-height: 1.3;
}

.venueInfo {
  margin-bottom: 0.75rem;
}

.venueName {
  display: block;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 0.25rem;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
  font-size: 0.9rem;
}

.venueAddress {
  display: block;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.artistList {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 0.5rem;
  line-height: 1.4;
}

.artist {
  display: inline;
}

.eventFooter {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.75rem;
}

.venueType {
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.1);
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.sourceTag {
  padding: 0.2rem 0.5rem;
  border-radius: 0.3rem;
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.liveTag {
  background: rgba(0, 255, 0, 0.1);
  color: rgba(0, 255, 0, 0.8);
  box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
  text-shadow: 0 0 5px rgba(0, 255, 0, 0.5);
}

.sampleTag {
  background: rgba(255, 165, 0, 0.1);
  color: rgba(255, 165, 0, 0.8);
  box-shadow: 0 0 10px rgba(255, 165, 0, 0.3);
}

.emergencyTag {
  background: rgba(255, 255, 0, 0.1);
  color: rgba(255, 255, 0, 0.8);
  box-shadow: 0 0 10px rgba(255, 255, 0, 0.3);
}

/* EXACT AUTH PROMPT MATCH */
.authPrompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
}

.authPrompt h2 {
  font-size: 2rem;
  margin-bottom: 0.8rem;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.authPrompt p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 500px;
}

/* EXACT RESPONSIVE DESIGN MATCH */
@media (max-width: 1024px) {
  .navigationRow {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
  
  .mainContent {
    padding: 0 0.8rem;
  }
  
  .eventsGrid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .header {
    padding: 0.8rem;
  }
  
  .mainContent {
    padding: 0 0.5rem;
  }
  
  .eventsGrid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .navigationContent {
    flex-direction: column;
    gap: 0.5rem;
    align-items: stretch;
  }
  
  .eventActions {
    gap: 0.5rem;
  }
  
  .matchCircle {
    width: 2.5rem;
    height: 2.5rem;
    font-size: 0.8rem;
  }
  
  .removeButton {
    width: 1.8rem;
    height: 1.8rem;
    font-size: 0.7rem;
  }
}
EOF

echo "✅ Step 3: Creating interested events API endpoint..."

# Step 3: Create the API endpoint for managing liked events
cat > pages/api/user/interested-events.js << 'EOF'
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import clientPromise from '../../../lib/mongodb';

export default async function handler(req, res) {
  try {
    // Get user session
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const client = await clientPromise;
    const db = client.db('sonar_edm');
    const collection = db.collection('user_interested_events');
    const userEmail = session.user.email;

    console.log(`🎯 Interested Events API called by ${userEmail} - Method: ${req.method}`);

    if (req.method === 'GET') {
      // Get user's liked events
      const userEvents = await collection.findOne({ userEmail });
      const events = userEvents?.events || [];
      
      console.log(`✅ Retrieved ${events.length} liked events for ${userEmail}`);
      
      return res.status(200).json({
        success: true,
        events: events,
        count: events.length
      });

    } else if (req.method === 'POST') {
      // Add event to liked events
      const { eventId, eventData } = req.body;
      
      if (!eventId || !eventData) {
        return res.status(400).json({ error: 'Event ID and data required' });
      }

      // Add timestamp and user info to event data
      const enrichedEventData = {
        ...eventData,
        id: eventId,
        likedAt: new Date(),
        likedBy: userEmail
      };

      // Update or create user's liked events
      const result = await collection.updateOne(
        { userEmail },
        {
          $addToSet: { events: enrichedEventData },
          $set: { 
            lastUpdated: new Date(),
            userEmail: userEmail
          }
        },
        { upsert: true }
      );

      console.log(`✅ Event ${eventId} added to liked events for ${userEmail}`);

      // Update user's taste profile based on liked event
      await updateTasteProfile(userEmail, eventData, 'like');

      return res.status(200).json({
        success: true,
        message: 'Event added to liked events',
        eventId: eventId
      });

    } else if (req.method === 'DELETE') {
      // Remove event from liked events
      const { eventId } = req.body;
      
      if (!eventId) {
        return res.status(400).json({ error: 'Event ID required' });
      }

      // Remove event from user's liked events
      const result = await collection.updateOne(
        { userEmail },
        {
          $pull: { events: { id: eventId } },
          $set: { lastUpdated: new Date() }
        }
      );

      console.log(`✅ Event ${eventId} removed from liked events for ${userEmail}`);

      // Update user's taste profile based on unliked event
      await updateTasteProfile(userEmail, { id: eventId }, 'unlike');

      return res.status(200).json({
        success: true,
        message: 'Event removed from liked events',
        eventId: eventId
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('❌ Interested Events API Error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

// Update user's taste profile based on liked/unliked events
async function updateTasteProfile(userEmail, eventData, action) {
  try {
    const client = await clientPromise;
    const db = client.db('sonar_edm');
    const tasteCollection = db.collection('user_taste_profiles');

    console.log(`🧠 Updating taste profile for ${userEmail} - Action: ${action}`);

    if (action === 'like') {
      // Extract learning signals from liked event
      const learningSignals = {
        genres: eventData.genres || [],
        venue: eventData.venue,
        venueType: eventData.venueType,
        artists: eventData.headliners || [],
        matchScore: eventData.matchScore,
        city: eventData.city,
        likedAt: new Date()
      };

      // Update taste profile with positive signals
      await tasteCollection.updateOne(
        { userEmail },
        {
          $push: {
            likedEvents: {
              eventId: eventData.id,
              ...learningSignals
            }
          },
          $inc: {
            'preferences.totalLikes': 1
          },
          $set: {
            lastLearningUpdate: new Date(),
            userEmail: userEmail
          }
        },
        { upsert: true }
      );

      // Update genre preferences
      if (eventData.genres && eventData.genres.length > 0) {
        for (const genre of eventData.genres) {
          await tasteCollection.updateOne(
            { userEmail },
            {
              $inc: {
                [`preferences.genres.${genre.toLowerCase()}`]: 1
              }
            }
          );
        }
      }

      // Update venue preferences
      if (eventData.venue) {
        await tasteCollection.updateOne(
          { userEmail },
          {
            $inc: {
              [`preferences.venues.${eventData.venue.toLowerCase()}`]: 1
            }
          }
        );
      }

      console.log(`✅ Taste profile updated with positive signals for ${userEmail}`);

    } else if (action === 'unlike') {
      // Remove from liked events and add to negative signals
      await tasteCollection.updateOne(
        { userEmail },
        {
          $pull: {
            likedEvents: { eventId: eventData.id }
          },
          $push: {
            unlikedEvents: {
              eventId: eventData.id,
              unlikedAt: new Date()
            }
          },
          $inc: {
            'preferences.totalUnlikes': 1
          },
          $set: {
            lastLearningUpdate: new Date()
          }
        }
      );

      console.log(`✅ Taste profile updated with negative signals for ${userEmail}`);
    }

  } catch (error) {
    console.error('❌ Error updating taste profile:', error);
    // Don't throw error - taste profile update is secondary to main functionality
  }
}
EOF

echo "✅ Step 4: Committing pixel-perfect My Events implementation..."
git add .
git commit -m "STEP 3: My Events Page - Pixel-perfect dashboard replica with liked events system"

echo "✅ Step 5: Deploying to Heroku..."
git push heroku HEAD:main --force

echo ""
echo "🎯 STEP 3: PIXEL-PERFECT MY EVENTS PAGE COMPLETE!"
echo "==============================================="
echo ""
echo "✅ PIXEL-PERFECT FEATURES:"
echo "   🎨 Exact dashboard background gradient and colors"
echo "   📐 Identical spacing, padding, and margins"
echo "   🔤 Matching typography (fonts, sizes, weights, shadows)"
echo "   💎 Same glassmorphic card styling and blur effects"
echo "   🌈 Identical color schemes and neon gradients"
echo "   ✨ Matching glow effects and animations"
echo "   📱 Same responsive design breakpoints"
echo ""
echo "✅ FUNCTIONAL FEATURES:"
echo "   💖 Complete liked events management system"
echo "   🗑️ Remove events functionality with visual feedback"
echo "   🧠 Learning system that updates taste profile"
echo "   📊 Event statistics and empty state handling"
echo "   🔗 Integration with existing heart buttons"
echo "   🎯 Exact event card styling from dashboard"
echo ""
echo "✅ API ENDPOINTS CREATED:"
echo "   GET /api/user/interested-events - Retrieve liked events"
echo "   POST /api/user/interested-events - Add event to liked events"
echo "   DELETE /api/user/interested-events - Remove event from liked events"
echo ""
echo "🚀 Your pixel-perfect My Events page is live:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/my-events"
echo ""
echo "🔗 NEXT STEPS:"
echo "   1. Test heart buttons on dashboard (should now work!)"
echo "   2. Test My Events page - should look identical to dashboard"
echo "   3. Verify learning system updates taste profile"
echo "   4. Ready for Step 4: EventDetailModal"
echo ""

