import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  // Error handling: Check if seasonalMood is valid
  if (!seasonalMood || typeof seasonalMood !== 'object') {
    return (
      <div className={styles.seasonalMoodCard}>
        <div className={styles.errorMessage}>
          <p>Can't show your vibe right now. Try again later!</p>
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
        case 'uplifting':
          return '#33ff99';
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
    <div className={styles.seasonalMoodCard} style={{ maxHeight: '200px', overflow: 'hidden' }}>
      {/* Current vibe section with Gen Z friendly language - more compact */}
      {hasValidCurrentSeason ? (
        <div className={styles.currentSeason} style={{ padding: '10px' }}>
          <div className={styles.seasonHeader} style={{ marginBottom: '5px' }}>
            <span className={styles.seasonIcon}>{getSeasonIcon(currentSeason.name)}</span>
            <h3 className={styles.seasonName} style={{ fontSize: '16px', margin: '0 5px' }}>
              Your {currentSeason.name} Vibe
            </h3>
            <span 
              className={styles.moodValue}
              style={{ 
                color: getMoodColor(currentSeason.primaryMood),
                fontSize: '14px'
              }}
            >
              {currentSeason.primaryMood}
            </span>
          </div>
          
          {/* Simplified genre tags in a more compact layout */}
          <div className={styles.genreTags} style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
            {currentSeason.topGenres.length > 0 ? (
              currentSeason.topGenres.slice(0, 2).map((genre, index) => (
                <span 
                  key={index} 
                  className={styles.genreTag}
                  style={{ 
                    fontSize: '12px', 
                    padding: '2px 8px',
                    borderRadius: '10px',
                    background: 'rgba(0,0,0,0.2)'
                  }}
                >
                  {genre}
                </span>
              ))
            ) : (
              <span className={styles.genreTag}>No genres yet</span>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.currentSeason} style={{ padding: '10px' }}>
          <div className={styles.seasonHeader}>
            <span className={styles.seasonIcon}>🎵</span>
            <h3 className={styles.seasonName} style={{ fontSize: '16px', margin: '0 5px' }}>
              Your Current Vibe
            </h3>
          </div>
          <p style={{ fontSize: '12px', margin: '5px 0' }}>Still figuring out your vibe...</p>
        </div>
      )}
      
      {/* Year-round vibes section with Gen Z friendly language - more compact */}
      <div className={styles.seasonalHistory} style={{ padding: '5px 10px' }}>
        <h4 className={styles.historyTitle} style={{ fontSize: '14px', margin: '5px 0' }}>
          Your Year-Round Vibes
        </h4>
        
        {seasons.length > 0 ? (
          <div className={styles.seasonsGrid} style={{ 
            display: 'flex', 
            flexWrap: 'wrap',
            gap: '5px'
          }}>
            {seasons.map((season, index) => {
              // Validate season object
              if (!season || typeof season !== 'object' || !season.name) {
                return null;
              }
              
              return (
                <div key={index} className={styles.seasonItem} style={{
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '12px',
                  padding: '2px 5px',
                  background: 'rgba(0,0,0,0.1)',
                  borderRadius: '8px',
                  margin: '0'
                }}>
                  <span className={styles.seasonItemIcon} style={{ marginRight: '3px' }}>
                    {getSeasonIcon(season.name)}
                  </span>
                  <span className={styles.seasonItemName} style={{ marginRight: '3px' }}>
                    {season.name}
                  </span>
                  
                  {season.primaryMood && (
                    <span 
                      className={styles.seasonItemMood}
                      style={{ 
                        color: getMoodColor(season.primaryMood),
                        fontSize: '11px'
                      }}
                    >
                      {season.primaryMood}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.noDataMessage} style={{ fontSize: '12px' }}>
            <p>No seasonal vibes yet - keep listening!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
