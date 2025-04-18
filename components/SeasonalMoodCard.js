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

  // Get current season
  const currentSeason = seasonalMood.currentSeason || {};
  const currentSeasonName = currentSeason.name || seasonalMood.current || 'Current Season';
  
  // Get all seasons
  const seasons = Array.isArray(seasonalMood.seasons) ? seasonalMood.seasons : [];
  
  // Generate insights based on seasonal data
  const generateInsights = () => {
    if (seasons.length < 2) {
      return "Your taste evolves throughout the year. Keep listening to see your seasonal patterns.";
    }
    
    // Find previous season
    const seasonOrder = ['winter', 'spring', 'summer', 'fall'];
    const currentIndex = seasonOrder.findIndex(s => 
      s.toLowerCase() === currentSeasonName.toLowerCase()
    );
    
    if (currentIndex === -1) return "Your taste evolves throughout the year.";
    
    const prevIndex = (currentIndex - 1 + 4) % 4;
    const prevSeasonName = seasonOrder[prevIndex];
    const prevSeason = seasons.find(s => 
      s.name.toLowerCase() === prevSeasonName.toLowerCase()
    );
    
    if (!prevSeason) return "Your taste evolves throughout the year.";
    
    // Compare current and previous season
    const currentGenres = currentSeason.topGenres || [];
    const prevGenres = prevSeason.topGenres || [];
    
    if (currentGenres.length === 0 || prevGenres.length === 0) {
      return "Your taste evolves throughout the year.";
    }
    
    // Find unique genres in current season
    const uniqueCurrentGenres = currentGenres.filter(g => 
      !prevGenres.includes(g)
    );
    
    if (uniqueCurrentGenres.length > 0) {
      return `Your taste has shifted from ${prevGenres[0]} in ${prevSeason.name} to include ${uniqueCurrentGenres[0]} in ${currentSeason.name}.`;
    }
    
    return `In ${currentSeason.name}, you're gravitating toward ${currentSeason.primaryMood.toLowerCase()} sounds like ${currentGenres[0]}.`;
  };
  
  const insight = generateInsights();
  
  return (
    <div className={styles.seasonalMoodCard}>
      <div className={styles.seasonalVisual}>
        <div className={styles.seasonCircle}>
          {seasons.map((season, index) => {
            const isCurrentSeason = season.name.toLowerCase() === currentSeasonName.toLowerCase();
            const angle = (index * 90) - 90; // -90, 0, 90, 180 degrees
            
            return (
              <div 
                key={season.name}
                className={`${styles.seasonSegment} ${isCurrentSeason ? styles.currentSeason : ''}`}
                style={{ 
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div className={styles.seasonContent}>
                  <span className={styles.seasonName}>{season.name}</span>
                  {season.topGenres && season.topGenres.length > 0 && (
                    <span className={styles.seasonGenre}>{season.topGenres[0]}</span>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className={styles.centerCircle}>
            <span className={styles.yearText}>Year-Round</span>
          </div>
        </div>
      </div>
      
      <div className={styles.seasonalInsights}>
        <h3 className={styles.insightsTitle}>Your Seasonal Patterns</h3>
        <p className={styles.insightsText}>{insight}</p>
        
        <div className={styles.currentSeasonHighlight}>
          <h4 className={styles.currentSeasonTitle}>
            {currentSeasonName} Vibe
          </h4>
          
          {currentSeason.primaryMood && (
            <div className={styles.moodTag}>
              <span className={styles.moodLabel}>Mood:</span>
              <span className={styles.moodValue}>{currentSeason.primaryMood}</span>
            </div>
          )}
          
          {currentSeason.topGenres && currentSeason.topGenres.length > 0 && (
            <div className={styles.genreTags}>
              {currentSeason.topGenres.map((genre, index) => (
                <span key={index} className={styles.genreTag}>{genre}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
