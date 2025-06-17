import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedEventList from './EnhancedEventList';
import EnhancedLocationSearch from './EnhancedLocationSearch';
import Top5GenresSpiderChart from './Top5GenresSpiderChart';
import SoundFeatureCapsules from './SoundFeatureCapsules';
import EventDetailModal from './EventDetailModal';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';

const EnhancedPersonalizedDashboard = () => {
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
      console.log('[Dashboard] Loading Spotify data...');
      setDataStatus(prev => ({ ...prev, spotify: 'loading' }));
      const response = await fetch('/api/spotify/user-profile');
      if (response.ok) {
        const data = await response.json();
        console.log('[Dashboard] Spotify data loaded:', data);
        setSpotifyData(data);
        setDataStatus(prev => ({ ...prev, spotify: 'real' }));
      } else {
        console.log('[Dashboard] Spotify API failed, using mock data');
        setDataStatus(prev => ({ ...prev, spotify: 'mock' }));
      }
    } catch (error) {
      console.error('[Dashboard] Error loading Spotify data:', error);
      setDataStatus(prev => ({ ...prev, spotify: 'mock' }));
    }
  };

  const loadUserTasteProfile = async () => {
    try {
      console.log('[Dashboard] Loading taste profile...');
      setDataStatus(prev => ({ ...prev, taste: 'loading' }));
      const response = await fetch('/api/user/taste-profile');
      if (response.ok) {
        const data = await response.json();
        console.log('[Dashboard] Taste profile loaded:', data);
        setUserTasteProfile(data);
        setDataStatus(prev => ({ ...prev, taste: 'real' }));
      } else {
        console.log('[Dashboard] Taste profile API failed, using mock data');
        setDataStatus(prev => ({ ...prev, taste: 'mock' }));
      }
    } catch (error) {
      console.error('[Dashboard] Error loading taste profile:', error);
      setDataStatus(prev => ({ ...prev, taste: 'mock' }));
    }
  };

  const loadEvents = async () => {
    if (!selectedLocation) return;
    
    console.log('[Dashboard] Loading events for location:', selectedLocation);
    setLoading(true);
    setError(null);
    setDataStatus(prev => ({ ...prev, events: 'loading' }));
    
    try {
      const { latitude, longitude } = selectedLocation;
      const eventsUrl = `/api/events?lat=${latitude}&lon=${longitude}&city=${encodeURIComponent(selectedLocation.city)}&radius=50`;
      console.log('[Dashboard] Events API URL:', eventsUrl);
      
      const response = await fetch(eventsUrl);
      console.log('[Dashboard] Events API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Dashboard] Events API error:', errorText);
        throw new Error(`Failed to load events: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Dashboard] Events data received:', data);
      
      setEvents(data.events || []);
      setDataStatus(prev => ({ ...prev, events: data.isRealData ? 'real' : 'mock' }));
      
      if (!data.events || data.events.length === 0) {
        console.warn('[Dashboard] No events returned from API');
      }
    } catch (error) {
      console.error('[Dashboard] Error loading events:', error);
      setError(`Failed to load events: ${error.message}`);
      setDataStatus(prev => ({ ...prev, events: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    console.log('[Dashboard] Location selected:', location);
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
      case 'loading': return '⏳ Loading...';
      case 'real': return '✅ Live Data';
      case 'mock': return '🎭 Sample Data';
      case 'error': return '❌ Error Loading';
      default: return '';
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
      {/* Top: Overall Vibe Summary (Full Width) */}
      <div className={styles.header}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.title}>
            <span className={styles.logo}>TIKO</span>
          </h1>
          <p className={styles.subtitle}>
            You're all about <span className={styles.highlight}>house + techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
          </p>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* OPTIMAL LAYOUT: Functional Hierarchy + Space Utilization */}
        <div className={styles.optimalLayout}>
          
          {/* LEFT COLUMN */}
          <div className={styles.leftColumn}>
            {/* 1. INFORMATIONAL: Spider Chart */}
            <div className={styles.vibeCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Vibe</h2>
                <span className={styles.dataIndicator}>{getDataIndicator('spotify')}</span>
              </div>
              <p className={styles.cardSubtitle}>We've curated events based on your unique music taste.</p>
              
              <div className={styles.spiderChartContainer}>
                <Top5GenresSpiderChart 
                  userTasteProfile={userTasteProfile}
                  spotifyData={spotifyData}
                  showGenreList={false}
                />
              </div>
            </div>

            {/* 2. DATA INSIGHTS: Sound Characteristics (Left Half) */}
            <div className={styles.soundCharacteristicsCard}>
              <SoundFeatureCapsules 
                userAudioFeatures={spotifyData?.audioFeatures}
                universalAverages={null}
                dataStatus={dataStatus.spotify}
                showHalf="left"
              />
            </div>

            {/* 3. FUNCTIONAL: Location Filter */}
            <div className={styles.locationCard}>
              <EnhancedLocationSearch 
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.rightColumn}>
            {/* 1. INFORMATIONAL: Seasonal Vibes */}
            <div className={styles.seasonalCard}>
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

            {/* 2. DATA INSIGHTS: Sound Characteristics (Right Half) */}
            <div className={styles.soundCharacteristicsCard}>
              <SoundFeatureCapsules 
                userAudioFeatures={spotifyData?.audioFeatures}
                universalAverages={null}
                dataStatus={dataStatus.spotify}
                showHalf="right"
              />
            </div>

            {/* 3. FUNCTIONAL: Vibe Match Slider */}
            <div className={styles.vibeMatchCard}>
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

        {/* Events Section - Full Width Below */}
        <div className={styles.eventsSection}>
          <div className={styles.eventsHeader}>
            <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
            <span className={styles.dataIndicator}>{getDataIndicator('events')}</span>
          </div>
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Finding events that match your taste...</p>
              <p className={styles.debugInfo}>
                Location: {selectedLocation.city}, {selectedLocation.region}, {selectedLocation.country}
              </p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <p className={styles.debugInfo}>
                Check browser console for detailed error logs
              </p>
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
              <p>No events found for {selectedLocation.city}. This might indicate an API issue.</p>
              <p className={styles.debugInfo}>
                API Status: {dataStatus.events} | Location: {selectedLocation.latitude}, {selectedLocation.longitude}
              </p>
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
