import React from 'react';
import styles from '@/styles/SoundCharacteristics.module.css';

const SoundCharacteristics = ({ userAudioFeatures, dataStatus = 'demo' }) => {
  // Default audio features matching reference
  const defaultFeatures = {
    energy: 0.75,
    danceability: 0.82,
    valence: 0.65, // Positivity
    acousticness: 0.15
  };

  const features = userAudioFeatures || defaultFeatures;

  const characteristicsData = [
    {
      name: 'Energy',
      value: features.energy,
      percentage: Math.round(features.energy * 100),
      icon: '⚡',
      color: '#ff6b6b', // Coral/pink like reference
      description: 'How energetic and intense your music feels'
    },
    {
      name: 'Danceability',
      value: features.danceability,
      percentage: Math.round(features.danceability * 100),
      icon: '💃',
      color: '#4ecdc4', // Cyan/teal like reference
      description: 'How suitable your music is for dancing'
    },
    {
      name: 'Positivity',
      value: features.valence,
      percentage: Math.round(features.valence * 100),
      icon: '😊',
      color: '#45b7d1', // Blue
      description: 'The musical positivity conveyed by your tracks'
    },
    {
      name: 'Acoustic',
      value: features.acousticness,
      percentage: Math.round(features.acousticness * 100),
      icon: '🎸',
      color: '#f9ca24', // Yellow/orange
      description: 'How acoustic vs electronic your music is'
    }
  ];

  return (
    <div className={styles.container}>
      <p className={styles.subtitle}>Normalized by universal music taste</p>
      
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
            
            {/* Shiny Progress Bar with Glow Effects */}
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
                  {/* Shine effect overlay */}
                  <div className={styles.shine}></div>
                </div>
              </div>
              <span className={styles.percentageRight}>{characteristic.percentage}%</span>
            </div>
            
            <p className={styles.description}>{characteristic.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundCharacteristics;
