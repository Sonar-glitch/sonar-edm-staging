import { useState, useEffect, memo } from 'react';
import styles from '../styles/SoundCharacteristics.module.css';

const DeltaIndicator = memo(({ type, characteristicKey, getDeltaIndicator }) => {
  if (!getDeltaIndicator || typeof getDeltaIndicator !== 'function') return null;
  const delta = getDeltaIndicator(type, characteristicKey);
  if (!delta) return null;

  const { arrow, change, color } = delta;
  return (
    <span className={styles.deltaIndicator} style={{ color }}>
      {arrow} {change}
    </span>
  );
});
DeltaIndicator.displayName = 'DeltaIndicator';

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

      // Handle both data structures
      let features = null;

      if (data && data.audioFeatures) {
        // OLD FORMAT: data.audioFeatures (for backward compatibility)
        features = data.audioFeatures;
      } else if (data && typeof data === 'object' && (data.energy !== undefined || data.danceability !== undefined)) {
        // NEW FORMAT: direct soundCharacteristics object from SoundStat integration
        features = data;
      }

      if (features) {
        // Use real data if available
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
                (typeof features.acousticness === 'number' ? features.acousticness : Math.round((features.acousticness || 0) * 100)) : 25),
            description: "How acoustic vs electronic your music is"
          }
        });
      } else {
        // Fallback values if no data available
        setCharacteristics({
          energy: { value: 75, description: "How energetic and intense your music feels" },
          danceability: { value: 82, description: "How suitable your music is for dancing" },
          positivity: { value: 65, description: "The mood of positivity conveyed by your tracks" },
          acoustic: { value: 25, description: "How acoustic vs electronic your music is" }
        });
      }

    } catch (err) {
      console.error('Sound characteristics loading error:', err);
      setError(err.message);

      // Set safe fallback values on error
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


  // No need for a renderDeltaIndicator function here since we're using the DeltaIndicator component

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
      {/* DEBUG MARKER - REMOVE AFTER VERIFICATION */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        background: '#FF00CC',
        color: '#FFFFFF',
        padding: '4px 8px',
        borderRadius: '4px',
        zIndex: 1000,
        fontSize: '12px',
        fontWeight: 'bold'
      }}>
        DEBUG 2025-08-07
      </div>
      <div className={styles.characteristicsGrid}>
        {Object.entries(characteristics).map(([key, char]) => (
          <div 
            key={key} 
            className={styles.characteristicItem}
            // Tooltip now handled by delta indicator
          >
            <div className={styles.characteristicHeader}>
              <span className={styles.characteristicName}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              <div className={styles.characteristicValueContainer}>
                <span className={styles.characteristicValue}>
                  {char.value}%
                </span>
                <DeltaIndicator
                  type="soundCharacteristics"
                  characteristicKey={key}
                  getDeltaIndicator={getDeltaIndicator}
                />
              </div>
            </div>

            <div className={styles.characteristicBar}>
              <div
                className={styles.characteristicProgress}
                style={{
                  width: `${char.value}%`,
                  background: key === 'acoustic'
                    ? 'linear-gradient(90deg, #FFD700, #E0A100)'
                    : 'linear-gradient(90deg, #00CFFF, #FF00CC)'
                }}
              />
            </div>

            <p className={styles.characteristicDescription}>
              {char.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

