import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  // Error handling: Check if seasonalMood is valid
  if (!seasonalMood || typeof seasonalMood !== 'object') {
    return (
      <div className={styles.seasonalMoodCard}>
        <div className={styles.errorMessage}>
          <p>Can't show your seasonal vibes right now. Try again later!</p>
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
    if (!mood) return 'rgba(0, 255, 255, 0.7)';
    
    try {
      const moodName = typeof mood === 'string' ? mood.toLowerCase() : '';
      
      switch(moodName) {
        case 'energetic':
          return 'rgba(255, 51, 102, 0.7)';
        case 'chill':
          return 'rgba(51, 204, 255, 0.7)';
        case 'melancholic':
          return 'rgba(153, 102, 255, 0.7)';
        case 'happy':
          return 'rgba(255, 204, 51, 0.7)';
        case 'dark':
          return 'rgba(102, 51, 204, 0.7)';
        case 'uplifting':
          return 'rgba(51, 255, 153, 0.7)';
        default:
          return 'rgba(0, 255, 255, 0.7)';
      }
    } catch (error) {
      console.error('Error getting mood color:', error);
      return 'rgba(0, 255, 255, 0.7)';
    }
  };
  
  // Create a complete seasons array with all four seasons
  const getAllSeasons = () => {
    const allSeasonNames = ['Spring', 'Summer', 'Fall', 'Winter'];
    const existingSeasons = seasons.reduce((acc, season) => {
      if (season && season.name) {
        acc[season.name.toLowerCase()] = season;
      }
      return acc;
    }, {});
    
    return allSeasonNames.map(name => {
      const lowerName = name.toLowerCase();
      if (existingSeasons[lowerName]) {
        return existingSeasons[lowerName];
      } else {
        return {
          name: name,
          primaryMood: 'Coming soon',
          topGenres: []
        };
      }
    });
  };
  
  const allSeasons = getAllSeasons();
  
  // Check if currentSeason has required properties
  const hasValidCurrentSeason = currentSeason && 
                               currentSeason.name && 
                               currentSeason.primaryMood && 
                               Array.isArray(currentSeason.topGenres);
  
  return (
    <div className={styles.seasonalMoodCard}>
      <div className={styles.seasonsGrid}>
        {allSeasons.map((season, index) => (
          <div key={index} className={`${styles.seasonCard} ${season.name === currentSeason.name ? styles.currentSeason : ''}`}>
            <div className={styles.seasonHeader}>
              <span className={styles.seasonIcon}>{getSeasonIcon(season.name)}</span>
              <h3 className={styles.seasonName}>{season.name}</h3>
            </div>
            
            <div className={styles.seasonContent}>
              <div 
                className={styles.moodBadge}
                style={{ backgroundColor: getMoodColor(season.primaryMood) }}
              >
                {season.primaryMood}
              </div>
              
              {Array.isArray(season.topGenres) && season.topGenres.length > 0 ? (
                <div className={styles.genreTags}>
                  {season.topGenres.slice(0, 2).map((genre, idx) => (
                    <span key={idx} className={styles.genreTag}>{genre}</span>
                  ))}
                </div>
              ) : (
                <div className={styles.noGenres}>
                  {season.primaryMood === 'Coming soon' ? 'Keep listening!' : 'No genres yet'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.yearRoundSection}>
        <h4 className={styles.yearRoundTitle}>Your Year-Round Vibes</h4>
        {hasValidCurrentSeason ? (
          <p className={styles.yearRoundDescription}>
            Your sound evolves with the seasons. We track how your taste changes throughout the year.
          </p>
        ) : (
          <p className={styles.yearRoundDescription}>
            Keep streaming! We'll track how your taste changes with the seasons.
          </p>
        )}
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
