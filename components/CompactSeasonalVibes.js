import React from 'react';
import styles from '@/styles/CompactSeasonalVibes.module.css';

const CompactSeasonalVibes = ({ data }) => {
  // If no data is provided, use sample data
  const seasonalData = data || {
    yearRound: {
      text: 'Your taste evolves from deep house vibes in winter to high-energy techno in summer, with a consistent appreciation for melodic elements year-round.'
    },
    seasons: [
      {
        name: 'Spring',
        current: true,
        vibe: 'House, Progressive',
        description: 'Fresh beats & uplifting vibes',
        icon: '🌸'
      },
      {
        name: 'Summer',
        current: false,
        vibe: 'Techno, Tech House',
        description: 'High energy open air sounds',
        icon: '☀️'
      },
      {
        name: 'Fall',
        current: false,
        vibe: 'Organic House, Downtempo',
        description: 'Mellow grooves & deep beats',
        icon: '🍂'
      },
      {
        name: 'Winter',
        current: false,
        vibe: 'Deep House, Ambient Techno',
        description: 'Hypnotic journeys & warm basslines',
        icon: '❄️'
      }
    ]
  };

  return (
    <div className={styles.container}>
      {/* Year-Round Vibes at the top as requested */}
      <div className={styles.yearRoundCard}>
        <div className={styles.yearRoundHeader}>
          <span className={styles.yearRoundIcon}>✨</span>
          <span className={styles.yearRoundTitle}>Your Year-Round Vibes</span>
        </div>
        <p className={styles.yearRoundText}>
          Your taste evolves from <span className={styles.highlight}>deep house vibes</span> in winter to <span className={styles.highlight}>high-energy techno</span> in summer, with a consistent appreciation for <span className={styles.highlight}>melodic elements</span> year-round.
        </p>
      </div>

      {/* Seasonal Vibes */}
      <div className={styles.seasonsGrid}>
        {seasonalData.seasons.map((season) => (
          <div key={season.name} className={`${styles.seasonCard} ${season.current ? styles.currentSeason : ''}`}>
            <div className={styles.seasonHeader}>
              <span className={styles.seasonIcon}>{season.icon}</span>
              <span className={styles.seasonName}>{season.name}</span>
              {season.current && <span className={styles.currentBadge}>Now</span>}
            </div>
            <div className={styles.seasonContent}>
              <div className={styles.vibeLabel}>Vibe:</div>
              <div className={styles.vibeText}>{season.vibe}</div>
              <div className={styles.seasonDescription}>{season.description}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Did we get it right? */}
      <div className={styles.feedbackSection}>
        <span className={styles.feedbackQuestion}>Did we get it right?</span>
        <span className={styles.feedbackNo}>No</span>
      </div>
    </div>
  );
};

export default CompactSeasonalVibes;
