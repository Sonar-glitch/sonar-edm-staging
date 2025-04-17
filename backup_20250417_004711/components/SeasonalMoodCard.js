import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  const { currentSeason, seasons } = seasonalMood;
  
  // Get season icon based on season name
  const getSeasonIcon = (season) => {
    switch(season.toLowerCase()) {
      case 'spring':
        return '🌸';
      case 'summer':
        return '☀️';
      case 'fall':
      case 'autumn':
        return '🍂';
      case 'winter':
        return '❄️';
      default:
        return '🎵';
    }
  };
  
  // Get mood color based on mood name
  const getMoodColor = (mood) => {
    switch(mood.toLowerCase()) {
      case 'energetic':
        return '#ff3366';
      case 'chill':
        return '#33ccff';
      case 'melancholic':
        return '#9966ff';
      case 'happy':
        return '#ffcc33';
      case 'dark':
        return '#6633cc';
      default:
        return '#00ffff';
    }
  };
  
  return (
    <div className={styles.seasonalMoodCard}>
      <div className={styles.currentSeason}>
        <div className={styles.seasonHeader}>
          <span className={styles.seasonIcon}>{getSeasonIcon(currentSeason.name)}</span>
          <h3 className={styles.seasonName}>{currentSeason.name}</h3>
        </div>
        
        <div className={styles.moodInfo}>
          <div className={styles.moodItem}>
            <span className={styles.moodLabel}>Primary Mood</span>
            <span 
              className={styles.moodValue}
              style={{ color: getMoodColor(currentSeason.primaryMood) }}
            >
              {currentSeason.primaryMood}
            </span>
          </div>
          
          <div className={styles.genresList}>
            <span className={styles.genresLabel}>Top Genres</span>
            <div className={styles.genreTags}>
              {currentSeason.topGenres.map((genre, index) => (
                <span 
                  key={index} 
                  className={styles.genreTag}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.seasonalHistory}>
        <h4 className={styles.historyTitle}>Your Year in Music</h4>
        
        <div className={styles.seasonsGrid}>
          {seasons.map((season, index) => (
            <div key={index} className={styles.seasonItem}>
              <div className={styles.seasonItemHeader}>
                <span className={styles.seasonItemIcon}>{getSeasonIcon(season.name)}</span>
                <span className={styles.seasonItemName}>{season.name}</span>
              </div>
              
              <div 
                className={styles.seasonItemMood}
                style={{ color: getMoodColor(season.primaryMood) }}
              >
                {season.primaryMood}
              </div>
              
              <div className={styles.seasonItemGenre}>
                {season.topGenres[0]}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
