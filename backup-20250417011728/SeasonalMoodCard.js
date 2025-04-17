import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  // Error handling: Check if seasonalMood is valid
  if (!seasonalMood || typeof seasonalMood !== 'object') {
    return (
      <div className={styles.seasonalMoodCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display seasonal mood information. Invalid data.</p>
        </div>
      </div>
    );
  }

  // Safely extract currentSeason and seasons with fallbacks
  const currentSeason = seasonalMood.currentSeason || {};
  const seasons = Array.isArray(seasonalMood.seasons) ? seasonalMood.seasons : [];
  
  // Get season icon based on season name
  const getSeasonIcon = (season) => {
    if (!season) return '🎵';
    
    try {
      const seasonName = typeof season === 'string' ? season.toLowerCase() : 
                         typeof season === 'object' && season.name ? season.name.toLowerCase() : '';
      
      switch(seasonName) {
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
    } catch (error) {
      console.error('Error getting season icon:', error);
      return '🎵';
    }
  };
  
  // Get mood color based on mood name
  const getMoodColor = (mood) => {
    if (!mood) return '#00ffff';
    
    try {
      const moodName = typeof mood === 'string' ? mood.toLowerCase() : '';
      
      switch(moodName) {
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
    } catch (error) {
      console.error('Error getting mood color:', error);
      return '#00ffff';
    }
  };
  
  // Check if currentSeason has required properties
  const hasValidCurrentSeason = currentSeason && 
                               currentSeason.name && 
                               currentSeason.primaryMood && 
                               Array.isArray(currentSeason.topGenres);
  
  return (
    <div className={styles.seasonalMoodCard}>
      {hasValidCurrentSeason ? (
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
                {currentSeason.topGenres.length > 0 ? (
                  currentSeason.topGenres.map((genre, index) => (
                    <span 
                      key={index} 
                      className={styles.genreTag}
                    >
                      {genre}
                    </span>
                  ))
                ) : (
                  <span className={styles.genreTag}>No genres available</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={styles.currentSeason}>
          <div className={styles.seasonHeader}>
            <span className={styles.seasonIcon}>🎵</span>
            <h3 className={styles.seasonName}>Current Season</h3>
          </div>
          <div className={styles.moodInfo}>
            <p>Seasonal mood data not available</p>
          </div>
        </div>
      )}
      
      <div className={styles.seasonalHistory}>
        <h4 className={styles.historyTitle}>Your Year in Music</h4>
        
        {seasons.length > 0 ? (
          <div className={styles.seasonsGrid}>
            {seasons.map((season, index) => {
              // Validate season object
              if (!season || typeof season !== 'object' || !season.name) {
                return null;
              }
              
              return (
                <div key={index} className={styles.seasonItem}>
                  <div className={styles.seasonItemHeader}>
                    <span className={styles.seasonItemIcon}>{getSeasonIcon(season.name)}</span>
                    <span className={styles.seasonItemName}>{season.name}</span>
                  </div>
                  
                  {season.primaryMood && (
                    <div 
                      className={styles.seasonItemMood}
                      style={{ color: getMoodColor(season.primaryMood) }}
                    >
                      {season.primaryMood}
                    </div>
                  )}
                  
                  {season.topGenres && Array.isArray(season.topGenres) && season.topGenres.length > 0 && (
                    <div className={styles.seasonItemGenre}>
                      {season.topGenres[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.noDataMessage}>
            <p>No seasonal history available yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
