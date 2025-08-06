// SURGICAL FIX: components/SoundCharacteristics.js
// SURGICAL ADDS: Enhanced hover tooltips for delta indicators explaining what numbers mean
// PRESERVES: All existing styling, functionality, and component behavior including red section

import { useState, useEffect } from 'react';
import styles from '../styles/SoundCharacteristics.module.css';

export default function SoundCharacteristics({ data, dataSource, getDeltaIndicator }) {
  const [characteristics, setCharacteristics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCharacteristics();
  }, [data]);

  const loadCharacteristics = async () => {
    try {
      setLoading(true);
      
      // PRESERVED: Handle both data structures (unchanged)
      let features = null;
      
      if (data && data.audioFeatures) {
        // OLD FORMAT: data.audioFeatures (for backward compatibility)
        features = data.audioFeatures;
      } else if (data && typeof data === 'object' && (data.energy !== undefined || data.danceability !== undefined)) {
        // NEW FORMAT: direct soundCharacteristics object from SoundStat integration
        features = data;
      }
      
      if (features) {
        // PRESERVED: Use real data if available (unchanged)
        setCharacteristics({
          energy: {
            value: features.energy !== undefined ? 
              (typeof features.energy === 'number' ? features.energy : Math.round((features.energy || 0) * 100)) : 75,
            description: "How energetic and intense your music feels"
          },
          danceability: {
            value: features.danceability !== undefined ? 
              (typeof features.danceability === 'number' ? features.danceability : Math.round((features.danceability || 0) * 100)) : 82,
            description: "How suitable your music is for dancing"
          },
          positivity: {
            value: features.positivity !== undefined ? 
              features.positivity : 
              (features.valence !== undefined ? 
                (typeof features.valence === 'number' ? features.valence : Math.round((features.valence || 0) * 100)) : 65),
            description: "The mood of positivity conveyed by your tracks"
          },
          acoustic: {
            value: features.acoustic !== undefined ? 
              features.acoustic : 
              (features.acousticness !== undefined ? 
                (typeof features.acousticness === 'number' ? features.acousticness : Math.round((features.acousticness || 0) * 100)) : 
                (features.instrumentalness !== undefined ? 
                  (typeof features.instrumentalness === 'number' ? features.instrumentalness : Math.round((features.instrumentalness || 0) * 100)) : 15)),
            description: "How acoustic vs electronic your music is"
          }
        });
      } else {
        // PRESERVED: Fallback characteristics with proper null safety (unchanged)
        setCharacteristics({
          energy: {
            value: 75,
            description: "How energetic and intense your music feels"
          },
          danceability: {
            value: 82,
            description: "How suitable your music is for dancing"
          },
          positivity: {
            value: 65,
            description: "The mood of positivity conveyed by your tracks"
          },
          acoustic: {
            value: 15,
            description: "How acoustic vs electronic your music is"
          }
        });
      }
      
    } catch (err) {
      console.error('Sound characteristics loading error:', err);
      setError(err.message);
      
      // PRESERVED: Set safe fallback values on error (unchanged)
      setCharacteristics({
        energy: { value: 0, description: "How energetic and intense your music feels" },
        danceability: { value: 0, description: "How suitable your music is for dancing" },
        positivity: { value: 0, description: "The mood of positivity conveyed by your tracks" },
        acoustic: { value: 0, description: "How acoustic vs electronic your music is" }
      });
      
    } finally {
      setLoading(false);
    }
  };

  // PRESERVED: Helper function to get dynamic metadata from dataSource (unchanged)
  const getMetadata = () => {
    // Try to get real metadata from dataSource prop
    if (dataSource && dataSource.lastFetch) {
      // Extract metadata from API response if available
      const tracksAnalyzed = dataSource.tracksAnalyzed || 
                           (dataSource.soundStatAnalysis && dataSource.soundStatAnalysis.tracksAnalyzed) || 
                           10; // Default fallback
      
      const confidence = dataSource.confidence || 
                        (dataSource.soundStatAnalysis && dataSource.soundStatAnalysis.confidence) || 
                        0.8; // Default fallback
      
      return {
        tracks: tracksAnalyzed,
        confidence: Math.round(confidence * 100)
      };
    }
    
    // Final fallback to hardcoded values if no metadata available
    return {
      tracks: 20,
      confidence: 80
    };
  };

  // SURGICAL ADD: Enhanced delta indicator rendering with meaningful hover tooltips
  const renderEnhancedDeltaIndicator = (key) => {
    try {
      if (!getDeltaIndicator || !key || typeof key !== 'string') {
        return null;
      }
      
      const deltaIndicator = getDeltaIndicator('soundCharacteristics', key);
      
      if (!deltaIndicator) {
        return null;
      }

      // Extract delta information for enhanced tooltip
      const deltaText = deltaIndicator?.props?.children || '';
      const deltaValue = deltaText.split(' ')[1] || '';
      const isIncrease = deltaText.includes('↗️');
      const direction = isIncrease ? 'increased' : 'decreased';
      
      // Get characteristic name for tooltip
      const characteristicName = key.charAt(0).toUpperCase() + key.slice(1);

      // SURGICAL ADD: Enhanced tooltip explaining what the number means
      return (
        <span 
          style={{ 
            ...deltaIndicator.props.style,
            cursor: 'pointer',
            position: 'relative',
            marginLeft: '0.5rem'
          }}
          title={`${characteristicName} ${direction} by ${deltaValue} points since last week. This shows how your music taste has evolved over time.`}
        >
          {deltaText}
        </span>
      );
    } catch (err) {
      console.error('Enhanced delta indicator rendering error:', err);
      return null;
    }
  };

  // PRESERVED: All loading, error, and null state handling (unchanged)
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing your sound characteristics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Unable to load sound characteristics</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!characteristics) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>No sound characteristics available</p>
        </div>
      </div>
    );
  }

  const metadata = getMetadata();

  return (
    <div className={styles.container}>
      {/* PRESERVED: Red section with dynamic metadata (unchanged) */}
      <div className={styles.characteristicsInfo}>
        <p className={styles.baseInfo}>Based on {metadata.tracks} tracks</p>
        <p className={styles.confidenceInfo}>Confidence: {metadata.confidence}%</p>
      </div>

      {/* PRESERVED: All existing grid layout and styling (unchanged) */}
      <div className={styles.characteristicsGrid}>
        {Object.entries(characteristics).map(([key, char]) => (
          <div key={key} className={styles.characteristicItem}>
            <div className={styles.characteristicHeader}>
              <span className={styles.characteristicName}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <span className={styles.characteristicValue}>
                  {char.value}%
                </span>
                {/* SURGICAL ADD: Enhanced delta indicator with meaningful hover tooltip */}
                {renderEnhancedDeltaIndicator(key)}
              </div>
            </div>
            
            {/* PRESERVED: All existing TIKO styling and gradients (unchanged) */}
            <div className={styles.characteristicBar}>
              <div 
                className={styles.characteristicProgress}
                style={{ 
                  width: `${char.value}%`,
                  background: key === 'acoustic' 
                    ? 'linear-gradient(90deg, #FFD700, #E0A100)' // PRESERVED: Mustard for acoustic
                    : 'linear-gradient(90deg, #00CFFF, #FF00CC)' // PRESERVED: TIKO gradient for others
                }}
              />
            </div>
            
            <p className={styles.characteristicDescription}>
              {char.description}
            </p>
          </div>
        ))}
      </div>
      
      {/* PRESERVED: Enhanced Profile button removal maintained */}
    </div>
  );
}

