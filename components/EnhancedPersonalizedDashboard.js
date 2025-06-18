import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';

// Dynamic imports to prevent SSR issues
const EnhancedEventList = dynamic(() => import('./EnhancedEventList'), { ssr: false });
const EnhancedLocationSearch = dynamic(() => import('./EnhancedLocationSearch'), { ssr: false });
const Top5GenresSpiderChart = dynamic(() => import('./Top5GenresSpiderChart'), { ssr: false });
const SoundCharacteristics = dynamic(() => import('./SoundCharacteristics'), { ssr: false });
const EventDetailModal = dynamic(() => import('./EventDetailModal'), { ssr: false });

const EnhancedPersonalizedDashboard = ({ hideHeader = false }) => {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    city: 'Toronto',
    region: 'ON',
    country: 'Canada',
    latitude: 43.65,
    longitude: -79.38
  });
  const [spotifyData, setSpotifyData] = useState(null);
  const [userTasteProfile, setUserTasteProfile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [dataStatus, setDataStatus] = useState({
    spotify: 'loading',
    taste: 'loading',
    events: 'loading'
  });

  // Load user's Spotify data and taste profile
  useEffect(() => {
    if (session?.user) {
      loadSpotifyData();
      loadUserTasteProfile();
    }
  }, [session]);

  // Load events when component mounts and when location changes
  useEffect(() => {
    if (session?.user && selectedLocation) {
      loadEvents();
    }
  }, [session, selectedLocation]);

  const loadSpotifyData = async () => {
    try {
      setDataStatus(prev => ({ ...prev, spotify: 'loading' }));
      const response = await fetch('/api/spotify/user-profile');
      if (response.ok) {
        const data = await response.json();
        setSpotifyData(data);
        setDataStatus(prev => ({ ...prev, spotify: 'real' }));
      } else {
        setDataStatus(prev => ({ ...prev, spotify: 'demo' }));
      }
    } catch (error) {
      console.error('Error loading Spotify data:', error);
      setDataStatus(prev => ({ ...prev, spotify: 'demo' }));
    }
  };

  const loadUserTasteProfile = async () => {
    try {
      setDataStatus(prev => ({ ...prev, taste: 'loading' }));
      const response = await fetch('/api/user/taste-profile');
      if (response.ok) {
        const data = await response.json();
        setUserTasteProfile(data);
        setDataStatus(prev => ({ ...prev, taste: 'real' }));
      } else {
        setDataStatus(prev => ({ ...prev, taste: 'demo' }));
      }
    } catch (error) {
      console.error('Error loading taste profile:', error);
      setDataStatus(prev => ({ ...prev, taste: 'demo' }));
    }
  };

  const loadEvents = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setError(null);
    setDataStatus(prev => ({ ...prev, events: 'loading' }));
    
    try {
      const { latitude, longitude } = selectedLocation;
      const eventsUrl = `/api/events?lat=${latitude}&lon=${longitude}&city=${encodeURIComponent(selectedLocation.city)}&radius=50`;
      
      const response = await fetch(eventsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load events: ${response.status}`);
      }
      
      const data = await response.json();
      setEvents(data.events || []);
      setDataStatus(prev => ({ ...prev, events: data.isRealData ? 'real' : 'demo' }));
    } catch (error) {
      console.error('Error loading events:', error);
      setError(`Failed to load events: ${error.message}`);
      setDataStatus(prev => ({ ...prev, events: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (event) => {
    try {
      const response = await fetch('/api/user/interested-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id || event.id })
      });
      
      if (response.ok) {
        setEvents(prevEvents => 
          prevEvents.map(e => 
            (e._id || e.id) === (event._id || event.id) 
              ? { ...e, isInterested: true }
              : e
          )
        );
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const getDataIndicator = (type) => {
    const status = dataStatus[type];
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
        <div className={styles.authPrompt}>
          <h2>Welcome to TIKO</h2>
          <p>Please sign in with Spotify to discover events tailored to your music taste.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* TIGHT HEADER WITH VIBE SUMMARY */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.logo}>TIKO</span>
        </h1>
        <p className={styles.subtitle}>
          You're all about <span className={styles.highlight}>house + techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
        </p>
      </div>

      <div className={styles.mainContent}>
        {/* ALL DISCUSSED CHANGES IMPLEMENTED */}
        
        {/* 1. INFORMATIONAL ROW - BALANCED HEIGHTS */}
        <div className={styles.informationalRow}>
          {/* Left: Spider Chart - REDUCED HEIGHT */}
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Top 5 Genres</h2>
                <span className={styles.dataIndicator}>{getDataIndicator('spotify')}</span>
              </div>
              <Top5GenresSpiderChart 
                userTasteProfile={userTasteProfile}
                spotifyData={spotifyData}
              />
            </div>
          </div>

          {/* Right: Seasonal Vibes */}
          <div className={styles.rightColumn}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Seasonal Vibes</h2>
                <span className={styles.dataIndicator}>{getDataIndicator('taste')}</span>
              </div>
              
              <div className={styles.seasonalGrid}>
                <div className={`${styles.seasonCard} ${styles.spring}`}>
                  <h3>Spring</h3>
                  <p>Fresh beats & uplifting vibes</p>
                </div>
                <div className={`${styles.seasonCard} ${styles.summer}`}>
                  <h3>Summer</h3>
                  <p>High energy, open air sounds</p>
                </div>
                <div className={`${styles.seasonCard} ${styles.fall}`}>
                  <h3>Fall</h3>
                  <p>Organic House, Downtempo</p>
                </div>
                <div className={`${styles.seasonCard} ${styles.winter}`}>
                  <h3>Winter</h3>
                  <p>Deep House, Ambient Techno</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. DATA INSIGHTS ROW - ONE UNIFIED SOUND CHARACTERISTICS */}
        <div className={styles.dataInsightsRow}>
          <div className={styles.fullWidth}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Sound Characteristics</h2>
                <span className={styles.dataIndicator}>{getDataIndicator('spotify')}</span>
              </div>
              <SoundCharacteristics 
                userAudioFeatures={spotifyData?.audioFeatures}
                dataStatus={dataStatus.spotify}
              />
            </div>
          </div>
        </div>

        {/* 3. FUNCTIONAL ROW */}
        <div className={styles.functionalRow}>
          {/* Left: Location Filter */}
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <EnhancedLocationSearch 
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
              />
            </div>
          </div>

          {/* Right: Vibe Match Slider */}
          <div className={styles.rightColumn}>
            <div className={styles.card}>
              <div className={styles.vibeMatch}>
                <span className={styles.vibeLabel}>Vibe Match</span>
                <div className={styles.vibeSlider}>
                  <div className={styles.vibeProgress} style={{ width: '74%' }}></div>
                </div>
                <span className={styles.vibePercentage}>74%</span>
                <button className={styles.gearIcon} title="Additional Filters">⚙️</button>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className={styles.eventsSection}>
          <div className={styles.eventsHeader}>
            <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
            <span className={styles.dataIndicator}>{getDataIndicator('events')}</span>
          </div>
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Finding events that match your taste...</p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={loadEvents} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          )}
          
          {!loading && !error && events.length > 0 && (
            <EnhancedEventList 
              events={events}
              onEventClick={handleEventClick}
              onSaveEvent={handleSaveEvent}
            />
          )}
          
          {!loading && !error && events.length === 0 && (
            <div className={styles.noEvents}>
              <p>No events found for {selectedLocation.city}.</p>
              <button onClick={loadEvents} className={styles.retryButton}>
                Retry Loading Events
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSaveEvent={handleSaveEvent}
          spotifyData={spotifyData}
        />
      )}
    </div>
  );
};

export default EnhancedPersonalizedDashboard;
