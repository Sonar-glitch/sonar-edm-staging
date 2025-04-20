import React from 'react';
import styles from '@/styles/SeasonalVibes.module.css';

export default function SeasonalVibes({ seasonalData, isLoading = false }) {
  // Default data if none is provided or is loading
  const defaultData = {
    spring: {
      emoji: '🌸',
      title: 'Spring',
      genres: 'Progressive House, Melodic House',
      message: 'Keep listening!'
    },
    summer: {
      emoji: '☀️',
      title: 'Summer',
      genres: 'Tech House, House',
      message: 'Keep listening!'
    },
    fall: {
      emoji: '🍂',
      title: 'Fall',
      genres: 'Organic House, Downtempo',
      message: 'Keep listening!'
    },
    winter: {
      emoji: '❄️',
      title: 'Winter',
      genres: 'Deep House, Ambient Techno',
      message: 'Keep listening!'
    }
  };

  // Use provided data or default if not available
  const data = seasonalData || defaultData;
  
  // Handle current season highlight (just use a hardcoded example for now)
  const currentSeason = 'spring'; // This could be dynamically determined based on the date

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Your Seasonal Vibes</h2>
        {isLoading ? (
          <button className={styles.dataButton} disabled>Loading...</button>
        ) : (
          <button className={styles.dataButton}>
            {seasonalData ? 'Real Data' : 'Sample Data'}
          </button>
        )}
      </div>

      <div className={styles.grid}>
        <div className={`${styles.seasonCard} ${currentSeason === 'spring' ? styles.currentSeason : ''}`}>
          <div className={styles.seasonEmoji}>{data.spring.emoji}</div>
          <h3 className={styles.seasonTitle}>{data.spring.title}</h3>
          <p className={styles.seasonGenres}>{data.spring.genres}</p>
          <p className={styles.seasonMessage}>{data.spring.message}</p>
        </div>

        <div className={`${styles.seasonCard} ${currentSeason === 'summer' ? styles.currentSeason : ''}`}>
          <div className={styles.seasonEmoji}>{data.summer.emoji}</div>
          <h3 className={styles.seasonTitle}>{data.summer.title}</h3>
          <p className={styles.seasonGenres}>{data.summer.genres}</p>
          <p className={styles.seasonMessage}>{data.summer.message}</p>
        </div>

        <div className={`${styles.seasonCard} ${currentSeason === 'fall' ? styles.currentSeason : ''}`}>
          <div className={styles.seasonEmoji}>{data.fall.emoji}</div>
          <h3 className={styles.seasonTitle}>{data.fall.title}</h3>
          <p className={styles.seasonGenres}>{data.fall.genres}</p>
          <p className={styles.seasonMessage}>{data.fall.message}</p>
        </div>

        <div className={`${styles.seasonCard} ${currentSeason === 'winter' ? styles.currentSeason : ''}`}>
          <div className={styles.seasonEmoji}>{data.winter.emoji}</div>
          <h3 className={styles.seasonTitle}>{data.winter.title}</h3>
          <p className={styles.seasonGenres}>{data.winter.genres}</p>
          <p className={styles.seasonMessage}>{data.winter.message}</p>
        </div>
      </div>

      <div className={styles.yearRound}>
        <h2 className={styles.title}>Your Year-Round Vibes</h2>
        <p className={styles.description}>
          Your sound evolves with the seasons. We track how your taste changes throughout the year.
        </p>
        <button className={styles.dataButton}>Sample Data</button>
      </div>
    </div>
  );
}