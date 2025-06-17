import React from 'react';
import styles from '../styles/SoundFeatureCapsules.module.css';

export default function SoundFeatureCapsules({ 
  userAudioFeatures, 
  universalAverages,
  layout = 'grid' // 'grid' or 'horizontal'
}) {
  // Fallback data if no user features available
  const fallbackFeatures = {
    energy: 0.75,
    danceability: 0.82,
    valence: 0.65, // positivity
    acousticness: 0.15,
    instrumentalness: 0.35,
    tempo: 128
  };

  const features = userAudioFeatures || fallbackFeatures;

  const capsules = [
    {
      name: 'Energy',
      value: Math.round(features.energy * 100),
      icon: '⚡',
      color: '#ff6b6b',
      description: 'How energetic and intense your music feels'
    },
    {
      name: 'Danceability',
      value: Math.round(features.danceability * 100),
      icon: '💃',
      color: '#4ecdc4',
      description: 'How suitable your music is for dancing'
    },
    {
      name: 'Positivity',
      value: Math.round(features.valence * 100),
      icon: '😊',
      color: '#45b7d1',
      description: 'How positive and uplifting your music is'
    },
    {
      name: 'Acoustic',
      value: Math.round(features.acousticness * 100),
      icon: '🎸',
      color: '#f9ca24',
      description: 'How acoustic vs electronic your music is'
    }
  ];

  // Add additional capsules for grid layout
  if (layout === 'grid') {
    capsules.push(
      {
        name: 'Instrumental',
        value: Math.round(features.instrumentalness * 100),
        icon: '🎵',
        color: '#a55eea',
        description: 'How much instrumental vs vocal music you prefer'
      },
      {
        name: 'Tempo',
        value: Math.round(features.tempo || 128),
        icon: '🥁',
        color: '#fd79a8',
        description: 'The speed/BPM of your preferred music',
        unit: 'BPM'
      }
    );
  }

  const containerClass = layout === 'horizontal' 
    ? styles.horizontalContainer 
    : styles.gridContainer;

  return (
    <div className={containerClass}>
      {capsules.map((capsule, index) => (
        <div key={index} className={styles.capsule}>
          <div className={styles.capsuleHeader}>
            <span className={styles.icon}>{capsule.icon}</span>
            <span className={styles.name}>{capsule.name}</span>
          </div>
          
          <div className={styles.valueContainer}>
            <span className={styles.value}>
              {capsule.value}{capsule.unit || '%'}
            </span>
          </div>
          
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${capsule.unit ? Math.min(capsule.value / 2, 100) : capsule.value}%`,
                backgroundColor: capsule.color 
              }}
            />
          </div>
          
          {layout === 'grid' && (
            <p className={styles.description}>{capsule.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
