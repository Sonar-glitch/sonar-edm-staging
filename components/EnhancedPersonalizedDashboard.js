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

const CompactSeasonalVibes = dynamic(() => import('./CompactSeasonalVibes'), { ssr: false });

export default function EnhancedPersonalizedDashboard() {
  const { data: session } = useSession();
  const { selectedLocation } = useLocation();
  
  // PHASE 1: Enhanced state management for data source tracking
  const [dataStatus, setDataStatus] = useState({
    spotify: 'loading',
    soundstat: 'loading',
    events: 'loading',
    seasonal: 'loading'
  });
  
  // PHASE 1: Error tracking for hover tooltips
  const [errorCodes, setErrorCodes] = useState({});
  const [errorReasons, setErrorReasons] = useState({});
  const [lastFetchTimes, setLastFetchTimes] = useState({});
  const [dataSources, setDataSources] = useState({});
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // PHASE 1: Enhanced data indicator with hover tooltips
  const getDataIndicator = (type) => {
    const status = dataStatus[type];
    const isReal = status === 'real';
    
    const tooltipInfo = isReal 
      ? `Real Data\nLast fetched: ${lastFetchTimes[type] || 'Just now'}\nSource: ${dataSources[type] || 'API'}\nStatus: Active`
      : `Fallback Data\nError: ${errorCodes[type] || 'API_UNAVAILABLE'}\nReason: ${errorReasons[type] || 'Service temporarily unavailable'}\nUsing: Mock/cached data`;
    
    return {
      text: isReal ? 'Real Data' : 'Fallback Data',
      tooltip: tooltipInfo,
      className: isReal ? styles.realDataIndicator : styles.fallbackDataIndicator
    };
  };

  // PHASE 1: Enhanced data loading with proper error tracking
  const loadEvents = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { lat, lon, city } = selectedLocation;
      console.log(`🔍 Loading events for: ${city} (${lat}, ${lon})`);
      
      const response = await fetch(
        `/api/events?lat=${lat}&lon=${lon}&city=${encodeURIComponent(city)}&radius=50`
      );
      
      if (response.ok) {
        const data = await response.json();
        const eventsData = data.events || [];
        
        setEvents(eventsData);
        
        // PHASE 1: Track data source status
        if (eventsData.length > 0) {
          setDataStatus(prev => ({ ...prev, events: data.isRealData ? 'real' : 'fallback' }));
          setDataSources(prev => ({ ...prev, events: data.source || 'Unknown' }));
          setLastFetchTimes(prev => ({ ...prev, events: new Date().toLocaleString() }));
          
          if (!data.isRealData) {
            setErrorCodes(prev => ({ ...prev, events: 'NO_EVENTS_FOUND' }));
            setErrorReasons(prev => ({ ...prev, events: 'No events match current location and filters' }));
          }
        } else {
          setDataStatus(prev => ({ ...prev, events: 'fallback' }));
          setErrorCodes(prev => ({ ...prev, events: 'EMPTY_RESULT_SET' }));
          setErrorReasons(prev => ({ ...prev, events: 'API returned empty results' }));
        }
        
        console.log(`📊 Loaded ${eventsData.length} events`);
      } else {
        throw new Error(`Failed to load events: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Error loading events:', error);
      setError(error.message);
      setDataStatus(prev => ({ ...prev, events: 'error' }));
      setErrorCodes(prev => ({ ...prev, events: 'API_ERROR' }));
      setErrorReasons(prev => ({ ...prev, events: error.message }));
    } finally {
      setLoading(false);
    }
  };

  // PHASE 1: Enhanced profile loading with error tracking
  const loadUserProfile = async () => {
    try {
      console.log('🧠 Loading user taste profile...');
      
      // Try enhanced profile first
      const enhancedResponse = await fetch('/api/user/enhanced-taste-profile');
      if (enhancedResponse.ok) {
        const enhancedData = await enhancedResponse.json();
        
        if (enhancedData.phase2Enabled) {
          setDataStatus(prev => ({ ...prev, spotify: 'real', soundstat: 'real' }));
          setDataSources(prev => ({ ...prev, spotify: 'Enhanced API', soundstat: 'SoundStat API' }));
          setLastFetchTimes(prev => ({ 
            ...prev, 
            spotify: new Date().toLocaleString(),
            soundstat: new Date().toLocaleString()
          }));
          return;
        }
      }
      
      // Fallback to basic Spotify
      const spotifyResponse = await fetch('/api/spotify/user-profile');
      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json();
        
        // PHASE 1: Check if it's mock data
        if (spotifyData.dataSource === 'mock' || !spotifyData.isRealData) {
          setDataStatus(prev => ({ ...prev, spotify: 'fallback' }));
          setErrorCodes(prev => ({ ...prev, spotify: 'MOCK_DATA_ACTIVE' }));
          setErrorReasons(prev => ({ ...prev, spotify: 'Using mock data - Spotify API integration pending' }));
          setDataSources(prev => ({ ...prev, spotify: 'Mock Data' }));
        } else {
          setDataStatus(prev => ({ ...prev, spotify: 'real' }));
          setDataSources(prev => ({ ...prev, spotify: 'Spotify API' }));
          setLastFetchTimes(prev => ({ ...prev, spotify: new Date().toLocaleString() }));
        }
        
        // PHASE 1: Check SoundStat status
        setDataStatus(prev => ({ ...prev, soundstat: 'fallback' }));
        setErrorCodes(prev => ({ ...prev, soundstat: 'ZERO_QUERIES' }));
        setErrorReasons(prev => ({ ...prev, soundstat: 'SoundStat API not being called - 0 queries detected' }));
        setDataSources(prev => ({ ...prev, soundstat: 'Not Connected' }));
      } else {
        throw new Error('Spotify API failed');
      }
    } catch (error) {
      console.error('❌ Error loading user profile:', error);
      setDataStatus(prev => ({ 
        ...prev, 
        spotify: 'error',
        soundstat: 'error'
      }));
      setErrorCodes(prev => ({ 
        ...prev, 
        spotify: 'API_ERROR',
        soundstat: 'API_ERROR'
      }));
      setErrorReasons(prev => ({ 
        ...prev, 
        spotify: error.message,
        soundstat: 'Failed to connect to SoundStat API'
      }));
    }
  };

  useEffect(() => {
    if (session && selectedLocation) {
      loadEvents();
      loadUserProfile();
    }
  }, [session, selectedLocation]);

  // PHASE 1: Enhanced seasonal data tracking
  useEffect(() => {
    // Simulate seasonal data loading
    setTimeout(() => {
      setDataStatus(prev => ({ ...prev, seasonal: 'fallback' }));
      setErrorCodes(prev => ({ ...prev, seasonal: 'STATIC_DATA' }));
      setErrorReasons(prev => ({ ...prev, seasonal: 'Using static seasonal preferences - dynamic data not available' }));
      setDataSources(prev => ({ ...prev, seasonal: 'Static Config' }));
    }, 1000);
  }, []);

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.authPrompt}>
          <h2>Please sign in to view your personalized dashboard</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>TIKO</h1>
        <p className={styles.subtitle}>Your personalized EDM event discovery platform</p>
        
        <div className={styles.profileHeader}>
          <div className={styles.profileInfo}>
            <h2 className={styles.profileTitle}>
              🎧 You're all about <span style={{ color: '#FF00CC' }}>house</span> + <span style={{ color: '#00CFFF' }}>techno</span> with a vibe shift toward <span style={{ color: '#FF00CC' }}>fresh sounds</span>.
            </h2>
            <div className={styles.profileMeta}>
              <span className={styles.confidence}>99% Taste Confidence</span>
              <span className={styles.vibeType}>Midnight Vibes</span>
              <span className={styles.lastUpdated}>Data refreshed recently</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.dashboardGrid}>
        {/* Top 5 Genres Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Your Top 5 Genres</h2>
            <span 
              className={getDataIndicator('spotify').className}
              title={getDataIndicator('spotify').tooltip}
            >
              {getDataIndicator('spotify').text}
            </span>
          </div>
          <Top5GenresSpiderChart />
        </div>

        {/* Seasonal Vibes Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Seasonal Vibes</h2>
            <span 
              className={getDataIndicator('seasonal').className}
              title={getDataIndicator('seasonal').tooltip}
            >
              {getDataIndicator('seasonal').text}
            </span>
          </div>
          <CompactSeasonalVibes />
        </div>

        {/* Sound Characteristics Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Your Sound Characteristics</h2>
            <span 
              className={getDataIndicator('soundstat').className}
              title={getDataIndicator('soundstat').tooltip}
            >
              {getDataIndicator('soundstat').text}
            </span>
          </div>
          <SoundCharacteristics />
        </div>

        {/* Events Section */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Events Matching Your Vibe</h2>
            <span 
              className={getDataIndicator('events').className}
              title={getDataIndicator('events').tooltip}
            >
              {getDataIndicator('events').text}
            </span>
          </div>
          <EnhancedEventList 
            events={events} 
            loading={loading} 
            error={error}
            onEventSelect={setSelectedEvent}
          />
        </div>
      </div>

      {selectedEvent && (
        <EventDetailModal 
          event={selectedEvent} 
          onClose={() => setSelectedEvent(null)} 
        />
      )}
    </div>
  );
}

