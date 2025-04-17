import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  // Handle missing or malformed data
  if (!seasonalMood || typeof seasonalMood !== 'object') {
    return (
      <div className={styles.seasonalMoodCard}>
        <div className={styles.errorState}>
          <p>Seasonal mood data unavailable</p>
        </div>
      </div>
    );
  }

  // Determine current season
  const getCurrentSeason = () => {
    // First check if there's a current property
    if (seasonalMood.current) {
      return seasonalMood.current.toLowerCase();
    }
    
    // Otherwise determine based on current month
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };
  
  const currentSeason = getCurrentSeason();
  
  // Get season data with fallbacks
  const getSeasonData = (season) => {
    // If the season data exists directly
    if (seasonalMood[season] && typeof seasonalMood[season] === 'object') {
      return {
        genres: Array.isArray(seasonalMood[season].genres) ? seasonalMood[season].genres : [],
        mood: seasonalMood[season].mood || 'Unknown'
      };
    }
    
    // Default fallbacks
    const fallbacks = {
      spring: { genres: ['Progressive House', 'Melodic House'], mood: 'Uplifting' },
      summer: { genres: ['Tech House', 'House'], mood: 'Energetic' },
      fall: { genres: ['Organic House', 'Downtempo'], mood: 'Melancholic' },
      winter: { genres: ['Deep House', 'Ambient Techno'], mood: 'Introspective' }
    };
    
    return fallbacks[season] || { genres: [], mood: 'Unknown' };
  };
  
  // Get data for all seasons
  const seasons = {
    spring: getSeasonData('spring'),
    summer: getSeasonData('summer'),
    fall: getSeasonData('fall'),
    winter: getSeasonData('winter')
  };

  // Season icons and colors
  const seasonIcons = {
    spring: '🌸',
    summer: '☀️',
    fall: '🍂',
    winter: '❄️'
  };
  
  const seasonColors = {
    spring: '#ff9ff3',
    summer: '#feca57',
    fall: '#ff6b6b',
    winter: '#48dbfb'
  };

  return (
    <div className={styles.seasonalMoodCard}>
      <div className={styles.seasonsGrid}>
        {Object.entries(seasons).map(([season, data]) => (
          <div 
            key={season} 
            className={`${styles.seasonBox} ${currentSeason === season ? styles.currentSeason : ''}`}
            style={{ 
              '--season-color': seasonColors[season],
              '--season-opacity': currentSeason === season ? '1' : '0.6'
            }}
          >
            <div className={styles.seasonHeader}>
              <span className={styles.seasonIcon}>{seasonIcons[season]}</span>
              <span className={styles.seasonName}>{season.charAt(0).toUpperCase() + season.slice(1)}</span>
            </div>
            
            <div className={styles.seasonContent}>
              {data.genres.length > 0 ? (
                <>
                  <span className={styles.genreList}>
                    {data.genres.slice(0, 2).join(', ')}
                  </span>
                  <span className={styles.moodLabel}>Keep listening!</span>
                </>
              ) : (
                <span className={styles.comingSoon}>Keep listening!</span>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.yearRoundSection}>
        <h3 className={styles.yearRoundTitle}>Your Year-Round Vibes</h3>
        <p className={styles.yearRoundDescription}>
          Your sound evolves with the seasons. We track how your taste changes throughout the year.
        </p>
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
