import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';
import { FaSnowflake, FaLeaf, FaSun, FaCanadianMapleLeaf } from 'react-icons/fa';

const SeasonalMoodCard = ({ seasonalMood }) => {
  const { currentSeason, previousSeason, seasonalShift } = seasonalMood;
  
  const getSeasonIcon = (season) => {
    switch(season.toLowerCase()) {
      case 'winter':
        return <FaSnowflake className={styles.winterIcon} />;
      case 'spring':
        return <FaLeaf className={styles.springIcon} />;
      case 'summer':
        return <FaSun className={styles.summerIcon} />;
      case 'fall':
      case 'autumn':
        return <FaCanadianMapleLeaf className={styles.fallIcon} />;
      default:
        return <FaSun className={styles.defaultIcon} />;
    }
  };
  
  const getShiftDescription = () => {
    if (seasonalShift.intensity < 20) {
      return "Your music taste has been very consistent across seasons.";
    } else if (seasonalShift.intensity < 50) {
      return "Your music taste shows moderate seasonal variation.";
    } else {
      return "Your music taste changes significantly with the seasons.";
    }
  };
  
  return (
    <div className={styles.seasonalMoodCard}>
      <div className={styles.currentSeason}>
        <div className={styles.seasonHeader}>
          <h3>Current Season</h3>
          {getSeasonIcon(currentSeason.name)}
        </div>
        <div className={styles.seasonContent}>
          <p className={styles.seasonName}>{currentSeason.name}</p>
          <div className={styles.genreList}>
            <p>Top Genres:</p>
            <ul>
              {currentSeason.topGenres.map((genre, index) => (
                <li key={index}>{genre}</li>
              ))}
            </ul>
          </div>
          <div className={styles.moodIndicator}>
            <p>Mood: {currentSeason.mood}</p>
            <div className={styles.moodBar}>
              <div 
                className={styles.moodFill} 
                style={{
                  width: `${currentSeason.energy}%`,
                  background: currentSeason.energy > 70 ? 'var(--neon-pink)' : 
                              currentSeason.energy > 40 ? 'var(--neon-blue)' : 'var(--neon-purple)'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.seasonalShift}>
        <h3>Seasonal Shift</h3>
        <div className={styles.shiftIndicator}>
          <div className={styles.shiftBar}>
            <div 
              className={styles.shiftFill} 
              style={{width: `${seasonalShift.intensity}%`}}
            ></div>
          </div>
          <p>{getShiftDescription()}</p>
        </div>
        <div className={styles.shiftDetails}>
          <p>From {previousSeason.name} to {currentSeason.name}:</p>
          <ul>
            {seasonalShift.changes.map((change, index) => (
              <li key={index}>{change}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
