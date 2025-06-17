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
  const [selectedLocation, setSelectedLocation] = useState(null);
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

  // Load events when location changes
  useEffect(() => {
    if (selectedLocation) {
      loadEvents();
    }
  }, [selectedLocation]);

  const loadSpotifyData = async () => {
    try {
      setDataStatus(prev => ({ ...prev, spotify: 'loading' }));
      const response = await fetch('/api/spotify/user-profile');
      if (response.ok) {
        const data = await response.json();
        setSpotifyData(data);
        setDataStatus(prev => ({ ...prev, spotify: 'real' }));
      } else {
        setDataStatus(prev => ({ ...prev, spotify: 'mock' }));
      }
    } catch (error) {
      console.error('Error loading Spotify data:', error);
      setDataStatus(prev => ({ ...prev, spotify: 'mock' }));
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
        setDataStatus(prev => ({ ...prev, taste: 'mock' }));
      }
    } catch (error) {
      console.error('Error loading taste profile:', error);
      setDataStatus(prev => ({ ...prev, taste: 'mock' }));
    }
  };

  const loadEvents = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setError(null);
    setDataStatus(prev => ({ ...prev, events: 'loading' }));
    
    try {
      const { latitude, longitude } = selectedLocation;
      const response = await fetch(
        `/api/events/near?latitude=${latitude}&longitude=${longitude}&radius=50&userId=${session?.user?.id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load events');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
      setDataStatus(prev => ({ ...prev, events: data.isRealData ? 'real' : 'mock' }));
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events. Please try again.');
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
        {/* Middle: Two Column Layout */}
        <div className={styles.middleSection}>
          {/* Left Column: Spider Chart */}
          <div className={styles.leftColumn}>
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
                />
              </div>
            </div>
          </div>

          {/* Right Column: Seasonal Vibes */}
          <div className={styles.rightColumn}>
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
          </div>
        </div>

        {/* Below: Sound Characteristics (2 under each column) */}
        <div className={styles.characteristicsSection}>
          <div className={styles.characteristicsGrid}>
            <SoundFeatureCapsules 
              userAudioFeatures={spotifyData?.audioFeatures}
              universalAverages={null}
              dataStatus={dataStatus.spotify}
            />
          </div>
        </div>

        {/* Bottom: City Filter + Vibe Filter (Full Width) */}
        <div className={styles.filtersSection}>
          <div className={styles.locationFilter}>
            <EnhancedLocationSearch 
              onLocationSelect={handleLocationSelect}
              selectedLocation={selectedLocation}
            />
          </div>
          
          <div className={styles.vibeFilter}>
            <div className={styles.vibeMatch}>
              <span className={styles.vibeLabel}>Vibe Match</span>
              <div className={styles.vibeSlider}>
                <div className={styles.vibeProgress} style={{ width: '74%' }}></div>
              </div>
              <span className={styles.vibePercentage}>74%</span>
            </div>
            
            <button className={styles.gearIcon} title="Additional Filters">
              ⚙️
            </button>
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
          
          {!loading && !error && events.length === 0 && selectedLocation && (
            <div className={styles.noEvents}>
              <p>No events found in this area. Try a different location or check back later.</p>
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
