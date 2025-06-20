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
      // FIX 1: Send eventId in query params instead of body
      const response = await fetch(`/api/user/interested-events?eventId=${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
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

  // FIX 2: Get data source label - show "Live Data" for mongodb events
  const getDataIndicator = () => {
    const status = dataStatus.events;
    switch (status) {
      case 'real': return 'Live Data';
      case 'demo': return 'Demo Data';
      case 'loading': return 'Loading...';
      case 'error': return 'Error';
      default: return 'Live Data';  // Changed from 'Demo Data' to 'Live Data'
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
                      event.source === 'ticketmaster' || event.source === 'mongodb' ? styles.liveTag : 
                      event.source === 'emergency' ? styles.emergencyTag : styles.sampleTag
                    }`}>
                      {/* FIX 3: Show "Live Data" for both ticketmaster and mongodb events */}
                      {event.source === 'ticketmaster' || event.source === 'mongodb' ? 'Live Data' : 
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
