import React from 'react';
import styles from '@/styles/SoundFeatureCapsules.module.css';

const SoundFeatureCapsules = ({ userAudioFeatures, universalAverages, dataStatus = 'loading' }) => {
  // Default audio features with clear indicators
  const defaultFeatures = {
    energy: 0.75,
    danceability: 0.82,
    valence: 0.65, // Positivity
    acousticness: 0.15
  };

  const features = userAudioFeatures || defaultFeatures;
  const isUsingMockData = !userAudioFeatures || dataStatus === 'mock';

  const capsuleData = [
    {
      name: 'Energy',
      value: features.energy,
      icon: '⚡',
      color: '#ff006e'
    },
    {
      name: 'Danceability',
      value: features.danceability,
      icon: '💃',
      color: '#00d4ff'
    },
    {
      name: 'Positivity',
      value: features.valence,
      icon: '😊',
      color: '#22c55e'
    },
    {
      name: 'Acoustic',
      value: features.acousticness,
      icon: '🎸',
      color: '#f97316'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Sound Characteristics</h3>
        <span className={styles.dataIndicator}>
          {isUsingMockData ? '🎭 Sample Data' : '✅ Spotify Data'}
        </span>
      </div>
      
      <div className={styles.capsulesGrid}>
        {capsuleData.map((capsule, index) => (
          <div key={index} className={styles.capsule}>
            <div className={styles.capsuleHeader}>
              <span className={styles.icon}>{capsule.icon}</span>
              <span className={styles.name}>{capsule.name}</span>
            </div>
            
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar}
                style={{ 
                  background: `linear-gradient(90deg, ${capsule.color}, ${capsule.color}80)`,
                  width: `${capsule.value * 100}%`
                }}
              />
            </div>
            
            <div className={styles.percentage}>
              {Math.round(capsule.value * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundFeatureCapsules;
