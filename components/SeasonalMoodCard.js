import React from 'react';
import styles from '@/styles/SeasonalMoodCard.module.css';

export default function SeasonalMoodCard({ mood, audioFeatures }) {
  // Define mood themes with colors and icons
  const moodThemes = {
    'Summer Festival Rush': {
      gradient: 'linear-gradient(135deg, #FF9A8B 0%, #FF6A88 50%, #FF99AC 100%)',
      icon: '☀️',
      description: 'Your playlist radiates with high energy and positivity, perfect for open-air festivals and summer vibes.'
    },
    'Chillwave Flow': {
      gradient: 'linear-gradient(135deg, #8EC5FC 0%, #E0C3FC 100%)',
      icon: '🌊',
      description: 'Your music taste reveals a laid-back, positive flow with smooth transitions between tracks.'
    },
    'Late-Night Raver': {
      gradient: 'linear-gradient(135deg, #7F7FD5 0%, #91EAE4 100%)',
      icon: '✨',
      description: 'High-energy, intense beats define your listening habits, ideal for night-time dance floors.'
    },
    'Melodic Afterglow': {
      gradient: 'linear-gradient(135deg, #3A1C71 0%, #D76D77 50%, #FFAF7B 100%)',
      icon: '🌙',
      description: 'Your playlist features emotional depth with melodic progressions and atmospheric elements.'
    },
    'Unknown Mood': {
      gradient: 'linear-gradient(135deg, #434343 0%, #000000 100%)',
      icon: '❓',
      description: 'We need more listening data to analyze your mood profile.'
    }
  };

  // Get the theme for current mood or default to Unknown
  const theme = moodThemes[mood] || moodThemes['Unknown Mood'];
  
  // Calculate audio feature averages if available
  let featureStats = null;
  if (audioFeatures && audioFeatures.length > 0) {
    const calcAvg = (feature) => {
      const avg = audioFeatures.reduce((sum, item) => sum + (item[feature] || 0), 0) / audioFeatures.length;
      return Math.round(avg * 100);
    };
    
    featureStats = {
      energy: calcAvg('energy'),
      valence: calcAvg('valence'),
      danceability: calcAvg('danceability'),
      tempo: Math.round(audioFeatures.reduce((sum, item) => sum + (item.tempo || 0), 0) / audioFeatures.length)
    };
  }

  return (
    <div 
      className={styles.moodCard}
      style={{ background: theme.gradient }}
    >
      <div className={styles.moodIcon}>{theme.icon}</div>
      <h2 className={styles.moodTitle}>Your Current Vibe: {mood}</h2>
      <p className={styles.moodDescription}>{theme.description}</p>
      
      {featureStats && (
        <div className={styles.statsContainer}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Energy</span>
            <div className={styles.statBar}>
              <div 
                className={styles.statFill} 
                style={{ width: `${featureStats.energy}%` }}
              />
            </div>
            <span className={styles.statValue}>{featureStats.energy}%</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Positivity</span>
            <div className={styles.statBar}>
              <div 
                className={styles.statFill} 
                style={{ width: `${featureStats.valence}%` }}
              />
            </div>
            <span className={styles.statValue}>{featureStats.valence}%</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Danceability</span>
            <div className={styles.statBar}>
              <div 
                className={styles.statFill} 
                style={{ width: `${featureStats.danceability}%` }}
              />
            </div>
            <span className={styles.statValue}>{featureStats.danceability}%</span>
          </div>
          
          <div className={styles.statItem}>
            <span className={styles.statLabel}>Avg. Tempo</span>
            <span className={styles.statValue}>{featureStats.tempo} BPM</span>
          </div>
        </div>
      )}
    </div>
  );
}