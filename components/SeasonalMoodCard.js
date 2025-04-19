import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  if (!seasonalMood) return null;
  
  // Add defensive error handling
  const currentSeason = seasonalMood.currentSeason || {};
  const previousSeason = seasonalMood.previousSeason || {};
  const seasonalShift = seasonalMood.seasonalShift || {};
  
  return (
    <div className={styles.seasonalMoodCard}>
      <div className={styles.currentSeason}>
        <div className={styles.seasonHeader}>
          <h3>{currentSeason.name || 'Current Season'} Mood</h3>
        </div>
        
        <div className={styles.genreList}>
          <p>Top Genres:</p>
          <ul>
            {Array.isArray(currentSeason.topGenres) ? 
              currentSeason.topGenres.map((genre, index) => (
                <li key={index}>{genre}</li>
              )) : null}
          </ul>
        </div>
        
        <div className={styles.moodIndicator}>
          <p>Mood: {currentSeason.mood || 'Unknown'}</p>
          <p>Energy: {currentSeason.energy || 0}%</p>
          <div className={styles.moodBar}>
            <div 
              className={styles.moodFill} 
              style={{ width: `${currentSeason.energy || 0}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      <div className={styles.seasonalShift}>
        <h3>Seasonal Shift from {previousSeason.name || 'Previous Season'}</h3>
        
        <div className={styles.moodIndicator}>
          <p>Intensity: {seasonalShift.intensity || 0}%</p>
          <div className={styles.shiftBar}>
            <div 
              className={styles.shiftFill} 
              style={{ width: `${seasonalShift.intensity || 0}%` }}
            ></div>
          </div>
        </div>
        
        {Array.isArray(seasonalShift.changes) && seasonalShift.changes.length > 0 ? (
          <div className={styles.shiftDetails}>
            <p>Notable Changes:</p>
            <ul>
              {seasonalShift.changes.map((change, index) => (
                <li key={index}>{change}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
