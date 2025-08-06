// CORRECTED: components/SoundCharacteristics.js
// CHANGES: Added delta indicator integration, removed red section, added proper error handling
// PRESERVES: All existing styling, functionality, and component behavior

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

  // SURGICAL FIX: Enhanced delta indicator rendering with meaningful hover tooltips
  const renderDeltaIndicator = (key) => {
    try {
      if (!getDeltaIndicator || !key || typeof key !== 'string') {
        return null;
      }
      
      const deltaIndicator = getDeltaIndicator('soundCharacteristics', key);
      
      // CRITICAL FIX: Safe access to delta indicator properties
      if (!deltaIndicator) {
        return null;
      }

      // SURGICAL FIX: Extract delta information for meaningful tooltips
      const deltaText = deltaIndicator?.props?.children || '';
      const deltaNumber = deltaText.replace(/[↗️↘️]/g, '').trim();
      const isIncrease = deltaText.includes('↗️');
      const isDecrease = deltaText.includes('↘️');
      
      // SURGICAL FIX: Create meaningful tooltip text
      const characteristicName = key.charAt(0).toUpperCase() + key.slice(1);
      let tooltipText = '';
      if (isIncrease) {
        tooltipText = `${characteristicName} increased by ${deltaNumber} points since last week`;
      } else if (isDecrease) {
        tooltipText = `${characteristicName} decreased by ${deltaNumber} points since last week`;
      } else {
        tooltipText = `${characteristicName} weekly change: ${deltaText}`;
      }

      // SURGICAL FIX: Wrap delta indicator with tooltip
      return (
        <span 
          style={{ cursor: 'help' }}
          title={tooltipText}
        >
          {deltaIndicator}
        </span>
      );
    } catch (err) {
      console.error('Delta indicator rendering error:', err);
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

  return (
    <div className={styles.container}>
      {/* REMOVED: Red section with "Based on X tracks, Confidence: Y%" as requested */}

      {/* PRESERVED: All existing grid layout and styling (unchanged) */}
      <div className={styles.characteristicsGrid}>
        {Object.entries(characteristics).map(([key, char]) => (
          <div key={key} className={styles.characteristicItem}>
            <div className={styles.characteristicHeader}>
              <span className={styles.characteristicName}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              <div className={styles.characteristicValueContainer}>
                <span className={styles.characteristicValue}>
                  {char.value}%
                </span>
                {/* SURGICAL FIX: Enhanced delta indicator with meaningful hover tooltips */}
                {renderDeltaIndicator(key)}
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

