import { useState, useEffect } from 'react';
import styles from '@/styles/SoundCharacteristics.module.css';

const EnhancedSoundCharacteristics = ({ userAudioFeatures, dataStatus = 'loading' }) => {
  const [soundData, setSoundData] = useState(null);
  const [dataSource, setDataSource] = useState('loading');
  const [errorDetails, setErrorDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRealSoundCharacteristics();
  }, []);

  const fetchRealSoundCharacteristics = async () => {
    try {
      setLoading(true);
      setDataSource('loading');
      
      // PHASE 2: Fetch real sound characteristics from enhanced user profile
      const response = await fetch('/api/user/enhanced-taste-profile');
      
      if (response.ok) {
        const enhancedProfile = await response.json();
        
        if (enhancedProfile.soundCharacteristics && enhancedProfile.soundCharacteristics.trackCount > 0) {
          // SUCCESS: Real Phase 2 data available
          setSoundData({
            energy: enhancedProfile.soundCharacteristics.energy,
            danceability: enhancedProfile.soundCharacteristics.danceability,
            valence: enhancedProfile.soundCharacteristics.valence,
            acousticness: enhancedProfile.soundCharacteristics.acousticness,
            trackCount: enhancedProfile.soundCharacteristics.trackCount,
            confidence: enhancedProfile.soundCharacteristics.confidenceScore,
            source: enhancedProfile.soundCharacteristics.source,
            lastFetched: enhancedProfile.soundCharacteristics.lastUpdated || enhancedProfile.lastUpdated,
            timestamp: enhancedProfile.soundCharacteristics.timestamp || enhancedProfile.timestamp
          });
          setDataSource('live');
          setErrorDetails(null);
          console.log('✅ Real sound characteristics loaded from Phase 2');
        } else {
          throw new Error('No sound characteristics in enhanced profile');
        }
      } else {
        throw new Error(`Enhanced profile API failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to fetch real sound characteristics:', error);
      
      // FALLBACK 1: Try basic Spotify profile
      try {
        const spotifyResponse = await fetch('/api/spotify/user-profile');
        
        if (spotifyResponse.ok) {
          const spotifyData = await spotifyResponse.json();
          
          if (spotifyData.audioFeatures) {
            // FALLBACK SUCCESS: Basic Spotify data available
            setSoundData({
              energy: spotifyData.audioFeatures.energy,
              danceability: spotifyData.audioFeatures.danceability,
              valence: spotifyData.audioFeatures.valence,
              acousticness: spotifyData.audioFeatures.acousticness,
              trackCount: spotifyData.audioFeatures.trackCount || 50,
              confidence: 0.7,
              source: 'Spotify API'
            });
            setDataSource('fallback');
            setErrorDetails({
              code: 'ENHANCED_PROFILE_UNAVAILABLE',
              message: 'Enhanced profile not available, using basic Spotify data',
              fallbackUsed: 'Spotify API',
              attemptedSources: ['Enhanced Profile API']
            });
            console.log('⚠️ Using fallback Spotify sound characteristics');
          } else {
            throw new Error('No audio features in Spotify data');
          }
        } else {
          throw new Error(`Spotify API failed: ${spotifyResponse.status}`);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        
        // FALLBACK 2: Demo data with error details
        setSoundData({
          energy: 0.75,
          danceability: 0.82,
          valence: 0.68,
          acousticness: 0.15,
          trackCount: 0,
          confidence: 0.0,
          source: 'Demo Data'
        });
        setDataSource('error');
        setErrorDetails({
          code: 'ALL_SOURCES_FAILED',
          message: 'Both enhanced profile and Spotify API unavailable',
          fallbackUsed: 'Demo data',
          attemptedSources: ['Enhanced Profile API', 'Spotify API']
        });
        console.log('❌ Using demo sound characteristics due to API failures');
      }
    } finally {
      setLoading(false);
    }
  };

  const features = soundData || {
    energy: 0.75,
    danceability: 0.82,
    valence: 0.68,
    acousticness: 0.15,
    trackCount: 0,
    confidence: 0.0,
    source: 'Loading...'
  };

  const getDataSourceLabel = () => {
    switch (dataSource) {
      case 'live':
        return { text: 'Live Data', color: '#4ecdc4', icon: '🔴' };
      case 'fallback':
        return { text: 'Fallback Data', color: '#f9ca24', icon: '⚠️' };
      case 'error':
        return { text: 'Default Data', color: '#ff6b6b', icon: '❌' };
      case 'loading':
        return { text: 'Loading...', color: '#95a5a6', icon: '⏳' };
      default:
        return { text: 'Unknown', color: '#666', icon: '❓' };
    }
  };

  // SURGICAL ADDITION: Enhanced tooltip with error codes and last fetched dates
  const getEnhancedTooltip = () => {
    if (dataSource === 'live') {
      // For live data, show last fetched date
      const lastFetched = features.lastFetched || features.timestamp || new Date().toISOString();
      const fetchedDate = new Date(lastFetched).toLocaleString();
      return `Live Data\nLast fetched: ${fetchedDate}\nSource: ${features.source || 'Enhanced Profile'}\nConfidence: ${Math.round((features.confidence || 0.8) * 100)}%`;
    } else if (errorDetails) {
      // For non-live data, show error codes and details
      return `${errorDetails.code || 'UNKNOWN_ERROR'}\nDetails: ${errorDetails.message || 'No details available'}\nFallback: ${errorDetails.fallbackUsed || 'Default data'}\nAttempted: ${errorDetails.attemptedSources?.join(', ') || 'Multiple sources'}`;
    } else {
      // For fallback/demo data without specific errors
      return `${dataSource === 'fallback' ? 'Fallback Data' : 'Demo Data'}\nReason: ${dataSource === 'fallback' ? 'Primary source unavailable' : 'No user data available'}\nSource: Default characteristics`;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your sound characteristics...</p>
        </div>
      </div>
    );
  }

  const sourceLabel = getDataSourceLabel();

  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      {/* FIXED: Data Source Label - Top-Right Positioning */}
      <div className={styles.dataSourceLabel}
           title={getEnhancedTooltip()}
           style={{
             position: 'absolute',
             top: '10px',
             right: '10px',
             color: sourceLabel.color,
             fontSize: '12px',
             opacity: 0.8,
             zIndex: 10,
             cursor: 'help'
           }}>
        {sourceLabel.icon} {sourceLabel.text}
      </div>

      {/* PRESERVED: Section Header */}
      <div className={styles.headerSection}>
        <h3 className={styles.sectionTitle}>Your Sound Characteristics</h3>
        
        {features.trackCount > 0 && (
          <div className={styles.dataDetails}>
            <span className={styles.trackCount}>
              Based on {features.trackCount} tracks
            </span>
            {features.confidence && (
              <span className={styles.confidence}>
                Confidence: {Math.round(features.confidence * 100)}%
              </span>
            )}
          </div>
        )}
      </div>

      <div className={styles.characteristicsGrid}>
        <div className={styles.characteristic}>
          <div className={styles.characteristicHeader}>
            <span className={styles.characteristicName}>Energy</span>
            <span className={styles.characteristicValue}>{Math.round(features.energy * 100)}%</span>
          </div>
          <div className={styles.characteristicBar}>
            <div 
              className={styles.characteristicFill}
              style={{ 
                width: `${features.energy * 100}%`,
                background: 'linear-gradient(90deg, #FF00CC, #FF6B9D)'
              }}
            ></div>
          </div>
          <p className={styles.characteristicDescription}>
            How energetic and intense your music feels
          </p>
        </div>

        <div className={styles.characteristic}>
          <div className={styles.characteristicHeader}>
            <span className={styles.characteristicName}>Danceability</span>
            <span className={styles.characteristicValue}>{Math.round(features.danceability * 100)}%</span>
          </div>
          <div className={styles.characteristicBar}>
            <div 
              className={styles.characteristicFill}
              style={{ 
                width: `${features.danceability * 100}%`,
                background: 'linear-gradient(90deg, #00CFFF, #4ECDC4)'
              }}
            ></div>
          </div>
          <p className={styles.characteristicDescription}>
            How suitable your music is for dancing
          </p>
        </div>

        <div className={styles.characteristic}>
          <div className={styles.characteristicHeader}>
            <span className={styles.characteristicName}>Positivity</span>
            <span className={styles.characteristicValue}>{Math.round(features.valence * 100)}%</span>
          </div>
          <div className={styles.characteristicBar}>
            <div 
              className={styles.characteristicFill}
              style={{ 
                width: `${features.valence * 100}%`,
                background: 'linear-gradient(90deg, #00CFFF, #4ECDC4)'
              }}
            ></div>
          </div>
          <p className={styles.characteristicDescription}>
            The mood of positivity conveyed by your tracks
          </p>
        </div>

        <div className={styles.characteristic}>
          <div className={styles.characteristicHeader}>
            <span className={styles.characteristicName}>Acoustic</span>
            <span className={styles.characteristicValue}>{Math.round(features.acousticness * 100)}%</span>
          </div>
          <div className={styles.characteristicBar}>
            <div 
              className={styles.characteristicFill}
              style={{ 
                width: `${features.acousticness * 100}%`,
                background: 'linear-gradient(90deg, #FFD700, #FFA500)'
              }}
            ></div>
          </div>
          <p className={styles.characteristicDescription}>
            How acoustic vs electronic your music is
          </p>
        </div>
      </div>

      {/* PRESERVED: Data source footer for additional context */}
      {(dataSource === 'fallback' || dataSource === 'error') && (
        <div className={styles.dataSourceFooter}>
          <span className={styles.sourceText}>
            Data source: {features.source}
          </span>
          {errorDetails && (
            <span 
              className={styles.errorIndicator}
              title={getEnhancedTooltip()}
            >
              ⚠️ Fallback used
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSoundCharacteristics;

