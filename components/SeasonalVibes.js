import React from 'react';
import styles from '@/styles/SeasonalVibes.module.css';

export default function SeasonalVibes({ seasonalData, isLoading }) {
  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };
  
  const currentSeason = getCurrentSeason();
  
  // If loading or no data
  if (isLoading || !seasonalData) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Seasonal Vibes</h2>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Analyzing your seasonal taste...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Seasonal Mood Shifts</h2>
      
      <div className={styles.seasonGrid}>
        {Object.entries(seasonalData).map(([season, data]) => (
          <div 
            key={season}
            className={`${styles.seasonCard} ${season === currentSeason ? styles.currentSeason : ''}`}
          >
            <div className={styles.seasonHeader}>
              <span className={styles.seasonEmoji}>{data.emoji}</span>
              <span className={styles.seasonName}>{data.title}</span>
              {season === currentSeason && (
                <span className={styles.currentBadge}>Now</span>
              )}
            </div>
            
            <div className={styles.seasonGenres}>
              <span className={styles.genreLabel}>Vibe:</span>
              <span className={styles.genreList}>{data.genres}</span>
            </div>
            
            <div className={styles.seasonMessage}>
              {data.message}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.yearRoundContainer}>
        <div className={styles.yearRoundTitle}>
          <span className={styles.yearRoundEmoji}>✨</span>
          <span>Year-Round Signature</span>
        </div>
        <p className={styles.yearRoundText}>
          Your taste evolves from <span className={styles.highlight}>deep house vibes</span> in winter 
          to <span className={styles.highlight}>high-energy techno</span> in summer, with a consistent 
          appreciation for <span className={styles.highlight}>melodic elements</span> year-round.
        </p>
      </div>
    </div>
  );
}