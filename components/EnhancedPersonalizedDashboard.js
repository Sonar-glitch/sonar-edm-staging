// SURGICAL FIX: Data Structure Mismatch in EnhancedPersonalizedDashboard.js
// ONLY CHANGES: Lines 44-56 - Data processing logic to handle actual API response format
// PRESERVES: All existing functionality, components, styling, and behavior

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

// Dynamic imports for components (PRESERVED)
const Top5GenresSpiderChart = dynamic(() => import('./Top5GenresSpiderChart'), { ssr: false });
const CompactSeasonalVibes = dynamic(() => import('./CompactSeasonalVibes'), { ssr: false });
const SoundCharacteristics = dynamic(() => import('./SoundCharacteristics'), { ssr: false });
const EnhancedEventList = dynamic(() => import('./EnhancedEventList'), { ssr: false });

export default function EnhancedPersonalizedDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data source tracking for proper labeling (PRESERVED)
  const [dataSources, setDataSources] = useState({
    spotify: { isReal: false, error: 'MOCK_DATA_ACTIVE', lastFetch: null },
    soundstat: { isReal: false, error: 'ZERO_QUERIES', lastFetch: null },
    events: { isReal: false, error: 'API_ERROR', lastFetch: null },
    seasonal: { isReal: false, error: 'STATIC_DATA', lastFetch: null }
  });

  useEffect(() => {
    if (status === 'authenticated') {
      loadDashboardData();
    }
  }, [status]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load enhanced taste profile (PRESERVED - using working endpoint)
      const profileResponse = await fetch('/api/spotify/detailed-taste');
      const profileData = await profileResponse.json();
      
      // Track data sources (SURGICAL FIX: Handle actual API response format)
      const newDataSources = { ...dataSources };
      
      // SURGICAL FIX: API returns isRealData directly, not wrapped in success/data
      if (profileData.isRealData) {
        // Real Spotify data received
        newDataSources.spotify.isReal = true;
        newDataSources.spotify.lastFetch = profileData.lastFetch || new Date().toISOString();
        delete newDataSources.spotify.error;
        
        // Also update soundstat since it comes from the same API
        newDataSources.soundstat.isReal = true;
        newDataSources.soundstat.lastFetch = profileData.lastFetch || new Date().toISOString();
        delete newDataSources.soundstat.error;
      } else {
        // Fallback data
        newDataSources.spotify.error = profileData.errorCode || 'SPOTIFY_API_ERROR';
        newDataSources.soundstat.error = profileData.errorCode || 'SPOTIFY_API_ERROR';
      }
      
      setDataSources(newDataSources);
      // SURGICAL FIX: Use profileData directly, not profileData.data
      setDashboardData(profileData);
      
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(err.message);
      
      // Set all sources to error state (PRESERVED)
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

  // Enhanced data indicator with hover tooltips (PRESERVED)
  const getDataIndicator = (sourceKey) => {
    const source = dataSources[sourceKey];
    const isReal = source?.isReal;
    const error = source?.error;
    const lastFetch = source?.lastFetch;

    return (
      <div 
        className={isReal ? styles.realDataIndicator : styles.fallbackDataIndicator}
        title={isReal 
          ? `Real Data - Last fetched: ${new Date(lastFetch).toLocaleString()}`
          : `Fallback Data - Error: ${error}`
        }
      >
        {isReal ? 'Real Data' : 'Fallback Data'}
      </div>
    );
  };

  // PRESERVED: All existing loading, authentication, and error states
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

  // PRESERVED: All existing layout and component structure
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

        {/* PRESERVED: ROW 3 - EVENTS */}
        <div className={styles.row3}>
          <div className={styles.fullWidth}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Events Matching Your Vibe</h2>
                {getDataIndicator('events')}
              </div>
              <EnhancedEventList 
                userProfile={dashboardData}
                dataSource={dataSources.events}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

