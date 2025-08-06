// ENHANCED: components/EnhancedPersonalizedDashboard.js
// SURGICAL ADDITION: Integrate MinimalEventFilters in Events section
// PRESERVES: All existing functionality, only adds filter integration

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

// Dynamic imports for components (PRESERVED)
const Top5GenresSpiderChart = dynamic(() => import('./Top5GenresSpiderChart'), { ssr: false });
const CompactSeasonalVibes = dynamic(() => import('./CompactSeasonalVibes'), { ssr: false });
const SoundCharacteristics = dynamic(() => import('./SoundCharacteristics'), { ssr: false });
const EnhancedEventList = dynamic(() => import('./EnhancedEventList'), { ssr: false });
// SURGICAL ADDITION: Import MinimalEventFilters
const MinimalEventFilters = dynamic(() => import('./MinimalEventFilters'), { ssr: false });

export default function EnhancedPersonalizedDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ENHANCED: Data source tracking with separate seasonal tracking (PRESERVED)
  const [dataSources, setDataSources] = useState({
    spotify: { isReal: false, error: 'MOCK_DATA_ACTIVE', lastFetch: null },
    soundstat: { isReal: false, error: 'ZERO_QUERIES', lastFetch: null },
    events: { isReal: false, error: 'API_ERROR', lastFetch: null },
    seasonal: { isReal: false, error: 'STATIC_DATA', lastFetch: null }
  });

  // SURGICAL ADDITION: Event filter state management
  const [userLocation, setUserLocation] = useState(null);
  const [eventFilters, setEventFilters] = useState({
    vibeMatch: 50, // Default 50% vibe match threshold
    location: null
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadDashboardData();
    }
  }, [status]);

  // PRESERVED: All existing loadDashboardData logic (unchanged)
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load enhanced taste profile (PRESERVED - using working endpoint)
      const profileResponse = await fetch('/api/spotify/detailed-taste');
      const profileData = await profileResponse.json();

      // ENHANCED: Track separate data sources using new dataSources structure
      const newDataSources = { ...dataSources };

      // Handle separate data source metadata if available
      if (profileData.dataSources) {
        // NEW: Separate data source tracking

        // Genre Profile (Top 5 Genres)
        if (profileData.dataSources.genreProfile) {
          newDataSources.spotify.isReal = profileData.dataSources.genreProfile.isRealData;
          newDataSources.spotify.lastFetch = profileData.dataSources.genreProfile.lastFetch;
          if (profileData.dataSources.genreProfile.isRealData) {
            delete newDataSources.spotify.error;
          } else {
            newDataSources.spotify.error = profileData.dataSources.genreProfile.error || 'SPOTIFY_API_ERROR';
          }
        }

        // Sound Characteristics
        if (profileData.dataSources.soundCharacteristics) {
          newDataSources.soundstat.isReal = profileData.dataSources.soundCharacteristics.isRealData;
          newDataSources.soundstat.lastFetch = profileData.dataSources.soundCharacteristics.lastFetch;
          // ENHANCED: Pass through additional metadata for Sound Characteristics display
          newDataSources.soundstat.tracksAnalyzed = profileData.dataSources.soundCharacteristics.tracksAnalyzed;
          newDataSources.soundstat.confidence = profileData.dataSources.soundCharacteristics.confidence;
          if (profileData.dataSources.soundCharacteristics.isRealData) {
            delete newDataSources.soundstat.error;
          } else {
            newDataSources.soundstat.error = profileData.dataSources.soundCharacteristics.fallbackReason || 'SOUNDSTAT_ERROR';
          }
        }

        // SURGICAL ADDITION: Seasonal Profile tracking
        if (profileData.dataSources.seasonalProfile) {
          newDataSources.seasonal.isReal = profileData.dataSources.seasonalProfile.isRealData;
          newDataSources.seasonal.lastFetch = profileData.dataSources.seasonalProfile.lastFetch;
          newDataSources.seasonal.tracksAnalyzed = profileData.dataSources.seasonalProfile.tracksAnalyzed;
          newDataSources.seasonal.seasonsWithData = profileData.dataSources.seasonalProfile.seasonsWithData;
          newDataSources.seasonal.confidence = profileData.dataSources.seasonalProfile.confidence;
          if (profileData.dataSources.seasonalProfile.isRealData) {
            delete newDataSources.seasonal.error;
          } else {
            newDataSources.seasonal.error = profileData.dataSources.seasonalProfile.error || 'STATIC_DATA';
          }
        }

      } else {
        // PRESERVED: Fallback to legacy data source handling
        if (profileData.isRealData) {
          newDataSources.spotify.isReal = true;
          newDataSources.spotify.lastFetch = profileData.lastFetch || new Date().toISOString();
          delete newDataSources.spotify.error;

          newDataSources.soundstat.isReal = true;
          newDataSources.soundstat.lastFetch = profileData.lastFetch || new Date().toISOString();
          delete newDataSources.soundstat.error;
        } else {
          newDataSources.spotify.error = profileData.errorCode || 'SPOTIFY_API_ERROR';
          newDataSources.soundstat.error = profileData.errorCode || 'SPOTIFY_API_ERROR';
        }
      }

      setDataSources(newDataSources);
      setDashboardData(profileData);

    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(err.message);

      // PRESERVED: Set all sources to error state
      const errorSources = { ...dataSources };
      Object.keys(errorSources).forEach(key => {
        errorSources[key].error = 'LOAD_ERROR';
        errorSources[key].isReal = false;
      });
      setDataSources(errorSources);

    } finally {
      setLoading(false);
    }
  };

  // SURGICAL ADDITION: Event filter handlers
  const handleLocationChange = (location) => {
    setUserLocation(location);
    setEventFilters(prev => ({ ...prev, location }));
    
    // Update events data source to show loading state
    setDataSources(prev => ({
      ...prev,
      events: { ...prev.events, isReal: false, error: 'LOADING_WITH_FILTERS' }
    }));
  };

  const handleVibeMatchChange = (vibeMatch) => {
    setEventFilters(prev => ({ ...prev, vibeMatch }));
    
    // Update events data source to show loading state
    setDataSources(prev => ({
      ...prev,
      events: { ...prev.events, isReal: false, error: 'LOADING_WITH_FILTERS' }
    }));
  };

  // SURGICAL ADDITION: Handle events data source updates from EnhancedEventList
  const handleEventsDataSourceUpdate = (newDataSource) => {
    setDataSources(prev => ({
      ...prev,
      events: newDataSource
    }));
  };

  // ENHANCED: Data indicator with enhanced tooltip information (PRESERVED)
  const getDataIndicator = (sourceKey) => {
    const source = dataSources[sourceKey];
    const isReal = source?.isReal;
    const error = source?.error;
    const lastFetch = source?.lastFetch;

    // ENHANCED: Build detailed tooltip text
    let tooltipText = '';
    if (isReal) {
      tooltipText = `Real Data - Last fetched: ${new Date(lastFetch).toLocaleString()}`;

      // Add additional metadata for specific sources
      if (sourceKey === 'soundstat' && source.tracksAnalyzed) {
        tooltipText += `\nTracks analyzed: ${source.tracksAnalyzed}`;
        if (source.confidence) {
          tooltipText += `\nConfidence: ${Math.round(source.confidence * 100)}%`;
        }
      }

      if (sourceKey === 'seasonal' && source.tracksAnalyzed) {
        tooltipText += `\nTracks analyzed: ${source.tracksAnalyzed}`;
        if (source.seasonsWithData && source.seasonsWithData.length > 0) {
          tooltipText += `\nSeasons with data: ${source.seasonsWithData.join(', ')}`;
        }
        if (source.confidence) {
          tooltipText += `\nConfidence: ${Math.round(source.confidence * 100)}%`;
        }
      }

      // SURGICAL ADDITION: Add filter information for events
      if (sourceKey === 'events') {
        if (eventFilters.vibeMatch !== 50) {
          tooltipText += `\nVibe match filter: ${eventFilters.vibeMatch}%`;
        }
        if (userLocation) {
          tooltipText += `\nLocation: ${userLocation.city || 'Custom location'}`;
        }
      }

    } else {
      tooltipText = `Fallback Data - Error: ${error}`;
    }

    return (
      <div
        className={isReal ? styles.realDataIndicator : styles.fallbackDataIndicator}
        title={tooltipText}
      >
        {isReal ? 'Real Data' : 'Fallback Data'}
      </div>
    );
  };

  // PRESERVED: All existing loading, authentication, and error states (unchanged)
  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <div className={styles.authPrompt}>
          <h2>Welcome to TIKO</h2>
          <p>Please sign in to access your personalized EDM event discovery dashboard.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h3>Dashboard Error</h3>
          <p>Unable to load your dashboard: {error}</p>
          <button onClick={loadDashboardData} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // PRESERVED: All existing layout and component structure (unchanged)
  return (
    <div className={styles.container}>
      {/* PRESERVED: Profile header */}
      <div className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          <div className={styles.profileTitle}>
            🎧 You're all about <span className={styles.highlight}>house</span> + <span className={styles.highlight}>techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
          </div>
        </div>
      </div>

      {/* PRESERVED: Dashboard grid layout */}
      <div className={styles.dashboardGrid}>

        {/* PRESERVED: ROW 1 - TOP 5 GENRES + SEASONAL VIBES */}
        <div className={styles.row1}>
          <div className={styles.leftHalf}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Top 5 Genres</h2>
                {getDataIndicator('spotify')}
              </div>
              <Top5GenresSpiderChart
                data={dashboardData?.genreProfile}
                dataSource={dataSources.spotify}
              />
            </div>
          </div>

          <div className={styles.rightHalf}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Seasonal Vibes</h2>
                {getDataIndicator('seasonal')}
              </div>
              <CompactSeasonalVibes
                data={dashboardData?.seasonalProfile}
                dataSource={dataSources.seasonal}
              />
            </div>
          </div>
        </div>

        {/* PRESERVED: ROW 2 - SOUND CHARACTERISTICS */}
        <div className={styles.row2}>
          <div className={styles.fullWidth}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Sound Characteristics</h2>
                {getDataIndicator('soundstat')}
              </div>
              <SoundCharacteristics
                data={dashboardData?.soundCharacteristics}
                dataSource={dataSources.soundstat}
              />
            </div>
          </div>
        </div>

        {/* ENHANCED: ROW 3 - EVENTS WITH MINIMAL FILTERS */}
        <div className={styles.row3}>
          <div className={styles.fullWidth}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Events Matching Your Vibe</h2>
                {getDataIndicator('events')}
              </div>
              
              {/* SURGICAL ADDITION: Minimal Event Filters */}
              <MinimalEventFilters 
                onLocationChange={handleLocationChange}
                onVibeMatchChange={handleVibeMatchChange}
                initialLocation={userLocation}
                initialVibeMatch={eventFilters.vibeMatch}
              />
              
              {/* ENHANCED: EnhancedEventList with filter props */}
              <EnhancedEventList
                userProfile={dashboardData}
                dataSource={dataSources.events}
                location={userLocation}
                vibeMatch={eventFilters.vibeMatch}
                onDataSourceUpdate={handleEventsDataSourceUpdate}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// Force rebuild Tue, Aug  5, 2025 11:58:02 PM
