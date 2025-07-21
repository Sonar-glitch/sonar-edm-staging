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

  // SURGICAL FIX 4: Improved fallback data mechanism
  const fetchRealSoundCharacteristics = async () => {
    try {
      setLoading(true);
      setDataSource('loading');
      
      // Try to fetch real sound characteristics from enhanced user profile
      const response = await fetch('/api/user/enhanced-taste-profile');
      
      if (response.ok) {
        const enhancedProfile = await response.json();
        
        if (enhancedProfile.soundCharacteristics && enhancedProfile.soundCharacteristics.trackCount > 0) {
          // SUCCESS: Real data available
          setSoundData({
            energy: enhancedProfile.soundCharacteristics.energy || 0,
            danceability: enhancedProfile.soundCharacteristics.danceability || 0,
            valence: enhancedProfile.soundCharacteristics.valence || 0,
            acousticness: enhancedProfile.soundCharacteristics.acousticness || 0,
            trackCount: enhancedProfile.soundCharacteristics.trackCount,
            confidence: enhancedProfile.soundCharacteristics.confidenceScore || 0.8,
            source: enhancedProfile.soundCharacteristics.source || 'Enhanced Profile',
            lastFetched: enhancedProfile.soundCharacteristics.lastUpdated || enhancedProfile.lastUpdated,
            timestamp: enhancedProfile.soundCharacteristics.timestamp || enhancedProfile.timestamp
          });
          setDataSource('live');
          setErrorDetails(null);
          console.log('✅ Real sound characteristics loaded');
        } else {
          throw new Error('SOUND_CHARACTERISTICS_EMPTY: No sound characteristics in enhanced profile');
        }
      } else {
        throw new Error(`ENHANCED_PROFILE_API_FAILED: ${response.status}`);
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
              energy: spotifyData.audioFeatures.energy || 0,
              danceability: spotifyData.audioFeatures.danceability || 0,
              valence: spotifyData.audioFeatures.valence || 0,
              acousticness: spotifyData.audioFeatures.acousticness || 0,
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
            throw new Error('NO_AUDIO_FEATURES: No audio features in Spotify data');
          }
        } else {
          throw new Error(`SPOTIFY_API_FAILED: ${spotifyResponse.status}`);
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        
        // FALLBACK 2: Minimal fallback data with proper null safety
        setSoundData({
          energy: 0.75,
          danceability: 0.82,
          valence: 0.68,
          acousticness: 0.15,
          trackCount: 0,
          confidence: 0.0,
          source: 'Fallback Data'
        });
        setDataSource('error');
        setErrorDetails({
          code: 'ALL_SOURCES_FAILED',
          message: 'Both enhanced profile and Spotify API unavailable',
          fallbackUsed: 'Minimal fallback data',
          attemptedSources: ['Enhanced Profile API', 'Spotify API']
        });
        console.log('❌ Using minimal fallback sound characteristics');
      }
    } finally {
      setLoading(false);
    }
  };

  // SURGICAL FIX 3: Proper null safety to prevent NaN%
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
        return { text: 'Real Data', color: '#00CFFF', icon: '🔴' };
      case 'fallback':
        return { text: 'Fallback Data', color: '#f9ca24', icon: '⚠️' };
      case 'error':
        return { text: 'Fallback Data', color: '#ff6b6b', icon: '❌' };
      case 'loading':
        return { text: 'Loading...', color: '#95a5a6', icon: '⏳' };
      default:
        return { text: 'Unknown', color: '#666', icon: '❓' };
    }
  };

  // SURGICAL FIX: Enhanced tooltip with error codes and last fetched dates
  const getEnhancedTooltip = () => {
    if (dataSource === 'live') {
      const lastFetched = features.lastFetched || features.timestamp || new Date().toISOString();
      const fetchedDate = new Date(lastFetched).toLocaleString();
      return `Real Data\nLast fetched: ${fetchedDate}\nSource: ${features.source}\nConfidence: ${Math.round((features.confidence || 0.8) * 100)}%`;
    } else if (errorDetails) {
      return `${errorDetails.code}\nDetails: ${errorDetails.message}\nFallback: ${errorDetails.fallbackUsed}\nAttempted: ${errorDetails.attemptedSources?.join(', ')}`;
    } else {
      return `Fallback Data\nReason: Primary source unavailable\nSource: Default characteristics`;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ color: '#DADADA' }}>Loading your sound characteristics...</p>
        </div>
      </div>
    );
  }

  const sourceLabel = getDataSourceLabel();

  return (
    <div className={styles.container} style={{ position: 'relative' }}>
      {/* SURGICAL FIX 1: REMOVED duplicate data source label - main dashboard handles this */}

      {/* SURGICAL FIX 2: REMOVED duplicate heading - main dashboard has OG <h2> title */}

      {/* PRESERVED: Track count and confidence display */}
      {features.trackCount > 0 && (
        <div className={styles.dataDetails}>
          <span className={styles.trackCount} style={{ color: '#999999' }}>
            Based on {features.trackCount} tracks
          </span>
          {features.confidence && (
            <span className={styles.confidence} style={{ color: '#888888' }}>
              Confidence: {Math.round((features.confidence || 0) * 100)}%
            </span>
          )}
        </div>
      )}

      <div className={styles.characteristicsGrid}>
        <div className={styles.characteristic}>
          <div className={styles.characteristicHeader}>
            <span className={styles.characteristicName} style={{ color: '#DADADA' }}>Energy</span>
            {/* SURGICAL FIX 3: Added null checks to prevent NaN% */}
            <span className={styles.characteristicValue} style={{ color: '#DADADA' }}>
              {Math.round((features.energy || 0) * 100)}%
            </span>
          </div>
          <div className={styles.characteristicBar}>
            <div 
              className={styles.characteristicFill}
              style={{ 
                width: `${(features.energy || 0) * 100}%`,
                background: 'linear-gradient(90deg, #00CFFF, #FF00CC)'
              }}
            ></div>
          </div>
          <p className={styles.characteristicDescription} style={{ color: '#999999' }}>
            How energetic and intense your music feels
          </p>
        </div>

        <div className={styles.characteristic}>
          <div className={styles.characteristicHeader}>
            <span className={styles.characteristicName} style={{ color: '#DADADA' }}>Danceability</span>
            {/* SURGICAL FIX 3: Added null checks to prevent NaN% */}
            <span className={styles.characteristicValue} style={{ color: '#DADADA' }}>
              {Math.round((features.danceability || 0) * 100)}%
            </span>
          </div>
          <div className={styles.characteristicBar}>
            <div 
              className={styles.characteristicFill}
              style={{ 
                width: `${(features.danceability || 0) * 100}%`,
                background: 'linear-gradient(90deg, #00CFFF, #FF00CC)'
              }}
            ></div>
          </div>
          <p className={styles.characteristicDescription} style={{ color: '#999999' }}>
            How suitable your music is for dancing
          </p>
        </div>

        <div className={styles.characteristic}>
          <div className={styles.characteristicHeader}>
            <span className={styles.characteristicName} style={{ color: '#DADADA' }}>Positivity</span>
            {/* SURGICAL FIX 3: Added null checks to prevent NaN% */}
            <span className={styles.characteristicValue} style={{ color: '#DADADA' }}>
              {Math.round((features.valence || 0) * 100)}%
            </span>
          </div>
          <div className={styles.characteristicBar}>
            <div 
              className={styles.characteristicFill}
              style={{ 
                width: `${(features.valence || 0) * 100}%`,
                background: 'linear-gradient(90deg, #00CFFF, #FF00CC)'
              }}
            ></div>
          </div>
          <p className={styles.characteristicDescription} style={{ color: '#999999' }}>
            The mood of positivity conveyed by your tracks
          </p>
        </div>

        <div className={styles.characteristic}>
          <div className={styles.characteristicHeader}>
            <span className={styles.characteristicName} style={{ color: '#DADADA' }}>Acoustic</span>
            {/* SURGICAL FIX 3: Added null checks to prevent NaN% */}
            <span className={styles.characteristicValue} style={{ color: '#DADADA' }}>
              {Math.round((features.acousticness || 0) * 100)}%
            </span>
          </div>
          <div className={styles.characteristicBar}>
            <div 
              className={styles.characteristicFill}
              style={{ 
                width: `${(features.acousticness || 0) * 100}%`,
                background: 'linear-gradient(90deg, #FFD700, #FFA500)'
              }}
            ></div>
          </div>
          <p className={styles.characteristicDescription} style={{ color: '#999999' }}>
            How acoustic vs electronic your music is
          </p>
        </div>
      </div>

      {/* PRESERVED: Data source footer for additional context */}
      {(dataSource === 'fallback' || dataSource === 'error') && (
        <div className={styles.dataSourceFooter}>
          <span className={styles.sourceText} style={{ color: '#888888' }}>
            Data source: {features.source}
          </span>
          {errorDetails && (
            <span 
              className={styles.errorIndicator}
              title={getEnhancedTooltip()}
              style={{ color: '#f9ca24' }}
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

