import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

// Dynamic imports for components
const Top5GenresSpiderChart = dynamic(() => import('./Top5GenresSpiderChart'), { ssr: false });
const CompactSeasonalVibes = dynamic(() => import('./CompactSeasonalVibes'), { ssr: false });
const SoundCharacteristics = dynamic(() => import('./SoundCharacteristics'), { ssr: false });
const EnhancedEventList = dynamic(() => import('./EnhancedEventList'), { ssr: false });

export default function EnhancedPersonalizedDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data source tracking for proper labeling
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
      
      // Load enhanced taste profile
      const profileResponse = await fetch('/api/spotify/detailed-taste');

      const profileData = await profileResponse.json();
      
      // Track data sources
      const newDataSources = { ...dataSources };
      
      if (profileData.success) {
        // Check if data is real or fallback
        if (profileData.data?.isRealData) {
          newDataSources.spotify.isReal = true;
          newDataSources.spotify.lastFetch = new Date().toISOString();
          delete newDataSources.spotify.error;
        } else {
          newDataSources.spotify.error = profileData.data?.errorCode || 'MOCK_DATA_ACTIVE';
        }
      }
      
      setDataSources(newDataSources);
      setDashboardData(profileData.data);
      
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError(err.message);
      
      // Set all sources to error state
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

  // Enhanced data indicator with hover tooltips
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

  return (
    <div className={styles.container}>
      {/* SINGLE HEADER - REMOVED DUPLICATE */}
      <div className={styles.profileHeader}>
        <div className={styles.profileInfo}>
          {/* SIMPLIFIED PROFILE INFO - REMOVED FALSE DATA */}
          <div className={styles.profileTitle}>
            🎧 You're all about <span className={styles.highlight}>house</span> + <span className={styles.highlight}>techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
          </div>
          {/* REMOVED: 99% Taste Confidence, Midnight Vibes, Data refreshed recently */}
        </div>
      </div>

      {/* CORRECTED LAYOUT STRUCTURE */}
      <div className={styles.dashboardGrid}>
        
        {/* ROW 1: TOP 5 GENRES (50%) + SEASONAL VIBES (50%) */}
        <div className={styles.row1}>
          <div className={styles.leftHalf}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Top 5 Genres</h2>
                {getDataIndicator('spotify')}
              </div>
              <Top5GenresSpiderChart 
                data={dashboardData?.topGenres} 
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
                data={dashboardData?.seasonalPreferences}
                dataSource={dataSources.seasonal}
              />
            </div>
          </div>
        </div>

        {/* ROW 2: SOUND CHARACTERISTICS (100% - LOWER HEIGHT) */}
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

        {/* ROW 3: EVENTS MATCHING YOUR VIBE (100%) */}
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

