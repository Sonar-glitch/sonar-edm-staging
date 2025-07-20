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
            source: enhancedProfile.soundCharacteristics.source
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
            setSoundData({
              energy: spotifyData.audioFeatures.energy || 0.6,
              danceability: spotifyData.audioFeatures.danceability || 0.7,
              valence: spotifyData.audioFeatures.valence || 0.5,
              acousticness: spotifyData.audioFeatures.acousticness || 0.3,
              trackCount: spotifyData.trackCount || 0,
              confidence: 0.5,
              source: 'spotify_basic'
            });
            setDataSource('fallback');
            setErrorDetails({
              code: 'ENHANCED_PROFILE_FAILED',
              message: error.message,
              fallbackUsed: 'spotify_basic'
            });
            console.log('⚠️ Using Spotify basic profile as fallback');
            return;
          }
        }
        throw new Error('Spotify fallback also failed');
      } catch (fallbackError) {
        // FALLBACK 2: Use genre-based estimation
        try {
          const tasteResponse = await fetch('/api/user/taste-profile');
          if (tasteResponse.ok) {
            const tasteData = await tasteResponse.json();
            const estimatedFeatures = estimateSoundFromGenres(tasteData.genrePreferences || []);
            setSoundData(estimatedFeatures);
            setDataSource('fallback');
            setErrorDetails({
              code: 'ALL_APIS_FAILED',
              message: `${error.message}; ${fallbackError.message}`,
              fallbackUsed: 'genre_estimation'
            });
            console.log('⚠️ Using genre-based estimation as final fallback');
          } else {
            throw new Error('All data sources failed');
          }
        } catch (finalError) {
          // FINAL FALLBACK: Default values with error indication
          setSoundData(getDefaultSoundCharacteristics());
          setDataSource('error');
          setErrorDetails({
            code: 'COMPLETE_FAILURE',
            message: `All data sources failed: ${finalError.message}`,
            fallbackUsed: 'default_values'
          });
          console.error('🚨 All sound characteristics sources failed, using defaults');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const estimateSoundFromGenres = (genrePreferences) => {
    const genreCharacteristics = {
      'melodic techno': { energy: 0.8, danceability: 0.9, valence: 0.3, acousticness: 0.05 },
      'progressive house': { energy: 0.7, danceability: 0.8, valence: 0.6, acousticness: 0.1 },
      'deep house': { energy: 0.6, danceability: 0.8, valence: 0.4, acousticness: 0.15 },
      'techno': { energy: 0.9, danceability: 0.9, valence: 0.2, acousticness: 0.05 },
      'house': { energy: 0.7, danceability: 0.9, valence: 0.7, acousticness: 0.1 },
      'electronic': { energy: 0.7, danceability: 0.7, valence: 0.5, acousticness: 0.1 }
    };

    let weightedFeatures = { energy: 0, danceability: 0, valence: 0, acousticness: 0 };
    let totalWeight = 0;

    genrePreferences.forEach(genre => {
      const genreName = genre.name.toLowerCase();
      const weight = genre.weight || 0.5;
      
      for (const [knownGenre, characteristics] of Object.entries(genreCharacteristics)) {
        if (genreName.includes(knownGenre)) {
          Object.keys(characteristics).forEach(feature => {
            weightedFeatures[feature] += characteristics[feature] * weight;
          });
          totalWeight += weight;
          break;
        }
      }
    });

    if (totalWeight > 0) {
      Object.keys(weightedFeatures).forEach(feature => {
        weightedFeatures[feature] /= totalWeight;
      });
    } else {
      weightedFeatures = { energy: 0.6, danceability: 0.7, valence: 0.5, acousticness: 0.3 };
    }

    return {
      ...weightedFeatures,
      trackCount: 0,
      confidence: 0.3,
      source: 'genre_estimation'
    };
  };

  const getDefaultSoundCharacteristics = () => ({
    energy: 0.6,
    danceability: 0.7,
    valence: 0.5,
    acousticness: 0.3,
    trackCount: 0,
    confidence: 0,
    source: 'default_fallback'
  });

  const getDataSourceLabel = () => {
    switch (dataSource) {
      case 'live':
        return { text: 'Live Data', color: '#4ecdc4', icon: '🔴' };
      case 'fallback':
        return { text: 'Fallback Data', color: '#f9ca24', icon: '⚠️' };
      case 'error':
        return { text: 'Default Data', color: '#ff6b6b', icon: '❌' };
      case 'loading':
        return { text: 'Loading...', color: '#45b7d1', icon: '⏳' };
      default:
        return { text: 'Unknown', color: '#666', icon: '❓' };
    }
  };

  const getErrorTooltip = () => {
    if (!errorDetails) return null;
    
    return `Error Code: ${errorDetails.code}\nDetails: ${errorDetails.message}\nFallback: ${errorDetails.fallbackUsed}`;
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

  const features = soundData || getDefaultSoundCharacteristics();
  const sourceLabel = getDataSourceLabel();

  const characteristicsData = [
    {
      name: 'Energy',
      value: features.energy,
      percentage: Math.round(features.energy * 100),
      icon: '⚡',
      color: '#ff6b6b',
      description: 'How energetic and intense your music feels'
    },
    {
      name: 'Danceability',
      value: features.danceability,
      percentage: Math.round(features.danceability * 100),
      icon: '💃',
      color: '#4ecdc4',
      description: 'How suitable your music is for dancing'
    },
    {
      name: 'Positivity',
      value: features.valence,
      percentage: Math.round(features.valence * 100),
      icon: '😊',
      color: '#45b7d1',
      description: 'The musical positivity conveyed by your tracks'
    },
    {
      name: 'Acoustic',
      value: features.acousticness,
      percentage: Math.round(features.acousticness * 100),
      icon: '🎸',
      color: '#f9ca24',
      description: 'How acoustic vs electronic your music is'
    }
  ];

  return (
    <div className={styles.container}>
      {/* Data Source Indicator */}
      <div className={styles.dataSourceHeader}>
        <div 
          className={styles.dataSourceBadge}
          style={{ backgroundColor: sourceLabel.color }}
          title={getErrorTooltip()}
        >
          <span className={styles.dataSourceIcon}>{sourceLabel.icon}</span>
          <span className={styles.dataSourceText}>{sourceLabel.text}</span>
        </div>
        
        {features.trackCount > 0 && (
          <div className={styles.dataDetails}>
            <span className={styles.trackCount}>
              Based on {features.trackCount} tracks
            </span>
            <span className={styles.confidence}>
              {Math.round(features.confidence * 100)}% confidence
            </span>
          </div>
        )}
      </div>
      
      <div className={styles.characteristicsGrid}>
        {characteristicsData.map((characteristic, index) => (
          <div key={index} className={styles.characteristicItem}>
            <div className={styles.characteristicHeader}>
              <div className={styles.iconAndName}>
                <span className={styles.icon}>{characteristic.icon}</span>
                <span className={styles.name}>{characteristic.name}</span>
              </div>
              <span className={styles.percentage}>{characteristic.percentage}%</span>
            </div>
            
            <div className={styles.progressContainer}>
              <div className={styles.progressTrack}>
                <div 
                  className={styles.progressBar}
                  style={{ 
                    width: `${characteristic.percentage}%`,
                    background: `linear-gradient(90deg, ${characteristic.color}, ${characteristic.color}dd)`,
                    boxShadow: `0 0 20px ${characteristic.color}40, inset 0 1px 0 rgba(255,255,255,0.3)`
                  }}
                >
                  <div className={styles.shine}></div>
                </div>
              </div>
            </div>
            
            <p className={styles.description}>{characteristic.description}</p>
          </div>
        ))}
      </div>

      {/* Data Source Footer */}
      {features.source && (
        <div className={styles.dataSourceFooter}>
          <span className={styles.sourceText}>
            Data source: {features.source}
          </span>
          {errorDetails && (
            <span 
              className={styles.errorIndicator}
              title={getErrorTooltip()}
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

