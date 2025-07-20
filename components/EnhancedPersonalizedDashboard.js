import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLocation } from './LocationProvider';
import dynamic from 'next/dynamic';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';

// Dynamic imports to prevent SSR issues
const EnhancedEventList = dynamic(() => import('./EnhancedEventList'), { ssr: false });
const EnhancedLocationSearch = dynamic(() => import('./EnhancedLocationSearch'), { ssr: false });
const Top5GenresSpiderChart = dynamic(() => import('./Top5GenresSpiderChart'), { ssr: false });
const SoundCharacteristics = dynamic(() => import('./SoundCharacteristics'), { ssr: false });
const EventDetailModal = dynamic(() => import('./EventDetailModal'), { ssr: false });
// SURGICAL ADDITION: Import CompactSeasonalVibes component
const CompactSeasonalVibes = dynamic(() => import('./CompactSeasonalVibes'), { ssr: false });

const EnhancedPersonalizedDashboard = ({ hideHeader = false }) => {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { location, loading: locationLoading } = useLocation();
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

  // Sync with LocationProvider
  useEffect(() => {
    if (location && !selectedLocation) {
      setSelectedLocation(location);
    }
  }, [location, selectedLocation]);

  const loadSpotifyData = async () => {
    try {
      const response = await fetch('/api/spotify/user-profile');
      if (response.ok) {
        const data = await response.json();
        setSpotifyData(data);
        setDataStatus(prev => ({ ...prev, spotify: 'real' }));
        console.log('✅ Spotify data loaded');
      } else {
        throw new Error('Failed to load Spotify data');
      }
    } catch (error) {
      console.error('❌ Error loading Spotify data:', error);
      setDataStatus(prev => ({ ...prev, spotify: 'demo' }));
    }
  };

  const loadUserTasteProfile = async () => {
    try {
      const response = await fetch('/api/user/enhanced-taste-profile');
      if (response.ok) {
        const data = await response.json();
        setUserTasteProfile(data);
        setDataStatus(prev => ({ ...prev, taste: 'real' }));
        console.log('✅ Enhanced taste profile loaded');
      } else {
        throw new Error('Failed to load taste profile');
      }
    } catch (error) {
      console.error('❌ Error loading taste profile:', error);
      setDataStatus(prev => ({ ...prev, taste: 'demo' }));
    }
  };

  const loadEvents = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { lat, lon, city } = selectedLocation;
      const response = await fetch(
        `/api/events?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}&radius=50`
      );
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
        setDataStatus(prev => ({ ...prev, events: 'real' }));
        console.log(`✅ Loaded ${data.events?.length || 0} events for ${city}`);
      } else {
        throw new Error(`Failed to load events: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      setError(error.message);
      setDataStatus(prev => ({ ...prev, events: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    console.log('📍 Location selected:', location);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleCloseEventModal = () => {
    setSelectedEvent(null);
    setIsEventModalOpen(false);
  };

  const handleSaveEvent = async (event) => {
    try {
      const response = await fetch('/api/user/interested-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          eventId: event.id,
          eventData: event
        })
      });
      
      if (response.ok) {
        console.log('✅ Event saved:', event.name);
        // Update local state to reflect the saved event
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
  if (type === 'events' && events.length > 0) {
    // Count events by source
    const sourceCount = events.reduce((acc, event) => {
      const source = event.source || 'unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    
    // Create source breakdown display
    const sourceLabels = Object.entries(sourceCount)
      .filter(([source, count]) => source !== 'unknown' && count > 0)
      .map(([source, count]) => `${source}: ${count}`)
      .join(', ');
    
    return sourceLabels || 'Real Data';
  }
  
  return dataStatus[type] === 'real' ? 'Real Data' : 'Demo Data';
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
      {/* PRESERVED: TIGHT HEADER WITH VIBE SUMMARY */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.logo}>TIKO</span>
        </h1>
        <p className={styles.subtitle}>
          You're all about <span className={styles.highlight}>house + techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
        </p>
      </div>

      <div className={styles.mainContent}>
        {/* PRESERVED: ALL DISCUSSED CHANGES IMPLEMENTED */}
        
        {/* PRESERVED: 1. INFORMATIONAL ROW - BALANCED HEIGHTS */}
        <div className={styles.informationalRow}>
          {/* PRESERVED: Left: Spider Chart - REDUCED HEIGHT */}
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

          {/* SURGICAL MODIFICATION: Replace hardcoded seasonal vibes with CompactSeasonalVibes component */}
          <div className={styles.rightColumn}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Seasonal Vibes</h2>
                <span className={styles.dataIndicator}>{getDataIndicator('taste')}</span>
              </div>
              
              {/* REPLACED: Hardcoded seasonal grid with dynamic component */}
              <CompactSeasonalVibes 
                userTasteProfile={userTasteProfile}
                spotifyData={spotifyData}
              />
            </div>
          </div>
        </div>

        {/* PRESERVED: 2. DATA INSIGHTS ROW - ONE UNIFIED SOUND CHARACTERISTICS */}
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

        {/* PRESERVED: 3. FUNCTIONAL ROW */}
        <div className={styles.functionalRow}>
          {/* PRESERVED: Left: Location Filter */}
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <EnhancedLocationSearch 
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
              />
            </div>
          </div>

          {/* PRESERVED: Right: Vibe Match Slider */}
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

        {/* PRESERVED: Events Section */}
        <div className={styles.eventsSection}>
          <div className={styles.eventsHeader}>
            <h2 className={styles.eventsTitle}>Events Matching Your Vibe</h2>
            <span className={styles.dataIndicator}>{getDataIndicator('events')}</span>
          </div>
          
          <EnhancedEventList 
            events={events}
            loading={loading}
            error={error}
            onEventClick={handleEventClick}
            onSaveEvent={handleSaveEvent}
          />
        </div>
      </div>

      {/* PRESERVED: Event Detail Modal */}
      {isEventModalOpen && selectedEvent && (
        <EventDetailModal 
          event={selectedEvent}
          onClose={handleCloseEventModal}
          onSave={handleSaveEvent}
        />
      )}
    </div>
  );
};

export default EnhancedPersonalizedDashboard;

