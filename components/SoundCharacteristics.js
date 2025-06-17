import React from 'react';
import styles from '@/styles/SoundCharacteristics.module.css';

const SoundCharacteristics = ({ userAudioFeatures, dataStatus = 'demo' }) => {
  // Default audio features
  const getAudioFeatures = () => {
    try {
      const defaultFeatures = {
        energy: 0.75,
        danceability: 0.82,
        valence: 0.65, // Positivity
        acousticness: 0.15
      };

      return userAudioFeatures || defaultFeatures;
    } catch (error) {
      console.error('Error processing audio features:', error);
      return {
        energy: 0.75,
        danceability: 0.82,
        valence: 0.65,
        acousticness: 0.15
      };
    }
  };

  const features = getAudioFeatures();

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
      {/* NO REDUNDANT SUBTITLE - REMOVED AS DISCUSSED */}
      
      <div className={styles.characteristicsGrid}>
        {characteristicsData.map((characteristic, index) => (
          <div key={index} className={styles.characteristicItem}>
            <div className={styles.characteristicHeader}>
              <div className={styles.iconAndName}>
                <span className={styles.icon}>{characteristic.icon}</span>
                <span className={styles.name}>{characteristic.name}</span>
              </div>
              {/* SINGLE PERCENTAGE DISPLAY - NO DUPLICATES */}
              <span className={styles.percentage}>{characteristic.percentage}%</span>
            </div>
            
            {/* Shiny Progress Bar WITHOUT duplicate percentage */}
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
              {/* NO DUPLICATE PERCENTAGE HERE */}
            </div>
            
            <p className={styles.description}>{characteristic.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundCharacteristics;
