import React from 'react';
import styles from '@/styles/SoundFeatureCapsules.module.css';

const SoundFeatureCapsules = ({ userAudioFeatures, universalAverages }) => {
  const defaultUniversalAverages = {
    energy: 0.65,
    danceability: 0.70,
    valence: 0.55,
    acousticness: 0.25,
    instrumentalness: 0.15,
    tempo: 120
  };

  const universalNorms = universalAverages || defaultUniversalAverages;

  const normalizeFeature = (userValue, universalAverage, isTempoFeature = false) => {
    if (!userValue && userValue !== 0) return 0;
    
    if (isTempoFeature) {
      const minTempo = 60;
      const maxTempo = 180;
      const normalizedTempo = Math.max(0, Math.min(100, 
        ((userValue - minTempo) / (maxTempo - minTempo)) * 100
      ));
      return Math.round(normalizedTempo);
    }
    
    const percentage = Math.round(userValue * 100);
    return Math.max(0, Math.min(100, percentage));
  };

  const soundFeatures = [
    {
      key: 'energy',
      name: 'Energy',
      icon: '⚡',
      description: 'How energetic and intense your music feels',
      userValue: userAudioFeatures?.energy || 0.7,
      universalValue: universalNorms.energy,
      color: '#ff6b6b'
    },
    {
      key: 'danceability',
      name: 'Danceability',
      icon: '💃',
      description: 'How suitable your music is for dancing',
      userValue: userAudioFeatures?.danceability || 0.8,
      universalValue: universalNorms.danceability,
      color: '#4ecdc4'
    },
    {
      key: 'valence',
      name: 'Positivity',
      icon: '😊',
      description: 'How positive and uplifting your music is',
      userValue: userAudioFeatures?.valence || 0.6,
      universalValue: universalNorms.valence,
      color: '#45b7d1'
    },
    {
      key: 'acousticness',
      name: 'Acoustic',
      icon: '🎸',
      description: 'How acoustic vs electronic your music is',
      userValue: userAudioFeatures?.acousticness || 0.2,
      universalValue: universalNorms.acousticness,
      color: '#f9ca24'
    },
    {
      key: 'instrumentalness',
      name: 'Instrumental',
      icon: '🎵',
      description: 'How much instrumental vs vocal music you prefer',
      userValue: userAudioFeatures?.instrumentalness || 0.3,
      universalValue: universalNorms.instrumentalness,
      color: '#6c5ce7'
    },
    {
      key: 'tempo',
      name: 'Tempo',
      icon: '🥁',
      description: 'The speed/BPM of your preferred music',
      userValue: userAudioFeatures?.tempo || 128,
      universalValue: universalNorms.tempo,
      color: '#fd79a8',
      isTempo: true
    }
  ];

  const featuresWithNormalization = soundFeatures.map(feature => {
    const normalizedValue = normalizeFeature(
      feature.userValue, 
      feature.universalValue, 
      feature.isTempo
    );
    
    return {
      ...feature,
      normalizedValue,
      displayValue: feature.isTempo 
        ? `${Math.round(feature.userValue)} BPM`
        : `${normalizedValue}%`
    };
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Sound Characteristics</h3>
        <p className={styles.subtitle}>Normalized by universal music taste</p>
      </div>
      
      <div className={styles.featuresGrid}>
        {featuresWithNormalization.map((feature) => (
          <div key={feature.key} className={styles.featureItem}>
            <div className={styles.featureHeader}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <div className={styles.featureInfo}>
                <span className={styles.featureName}>{feature.name}</span>
                <span className={styles.featureValue}>{feature.displayValue}</span>
              </div>
            </div>
            
            <div className={styles.capsuleContainer}>
              <div className={styles.capsule}>
                <div 
                  className={styles.capsuleFill}
                  style={{ 
                    width: `${feature.normalizedValue}%`,
                    background: `linear-gradient(90deg, ${feature.color}, ${feature.color}dd)`
                  }}
                />
              </div>
              <span className={styles.percentageLabel}>{feature.normalizedValue}%</span>
            </div>
            
            <p className={styles.featureDescription}>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundFeatureCapsules;
