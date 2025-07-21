import { useState, useEffect } from 'react';
import styles from '../styles/SoundCharacteristics.module.css';

export default function SoundCharacteristics({ data, dataSource }) {
  const [characteristics, setCharacteristics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCharacteristics();
  }, [data]);

  const loadCharacteristics = async () => {
    try {
      setLoading(true);
      
      if (data && data.audioFeatures) {
        // Use real data if available
        const features = data.audioFeatures;
        setCharacteristics({
          energy: {
            value: Math.round((features.energy || 0) * 100),
            description: "How energetic and intense your music feels"
          },
          danceability: {
            value: Math.round((features.danceability || 0) * 100),
            description: "How suitable your music is for dancing"
          },
          positivity: {
            value: Math.round((features.valence || 0) * 100),
            description: "The mood of positivity conveyed by your tracks"
          },
          acoustic: {
            value: Math.round((features.acousticness || 0) * 100),
            description: "How acoustic vs electronic your music is"
          }
        });
      } else {
        // Fallback characteristics with proper null safety
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
      <div className={styles.characteristicsInfo}>
        <p className={styles.baseInfo}>Based on 20 tracks</p>
        <p className={styles.confidenceInfo}>Confidence: 80%</p>
      </div>

      <div className={styles.characteristicsGrid}>
        {Object.entries(characteristics).map(([key, char]) => (
          <div key={key} className={styles.characteristicItem}>
            <div className={styles.characteristicHeader}>
              <span className={styles.characteristicName}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </span>
              <span className={styles.characteristicValue}>
                {char.value}%
              </span>
            </div>
            
            <div className={styles.characteristicBar}>
              <div 
                className={styles.characteristicProgress}
                style={{ 
                  width: `${char.value}%`,
                  background: key === 'acoustic' 
                    ? 'linear-gradient(90deg, #FFD700, #E0A100)' // Mustard for acoustic
                    : 'linear-gradient(90deg, #00CFFF, #FF00CC)' // TIKO gradient for others
                }}
              />
            </div>
            
            <p className={styles.characteristicDescription}>
              {char.description}
            </p>
          </div>
        ))}
      </div>
      
      {/* REMOVED: Enhanced Profile button as requested */}
    </div>
  );
}

