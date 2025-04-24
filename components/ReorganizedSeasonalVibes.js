import React, { useState } from 'react';
import styles from '@/styles/SeasonalVibes.module.css';
import UserFeedbackGrid from './UserFeedbackGrid';

export default function ReorganizedSeasonalVibes({ seasonalData, isLoading }) {
  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };
  
  const currentSeason = getCurrentSeason();
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Handle feedback submission
  const handleFeedbackSubmit = async (preferences) => {
    try {
      // Send preferences to API
      const response = await fetch('/api/user/update-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
      
      if (response.ok) {
        // Close feedback grid on successful submission
        setShowFeedback(false);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };
  
  // If loading or no data
  if (isLoading || !seasonalData) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Your Seasonal Vibes</h2>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Analyzing your seasonal taste...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Seasonal Vibes</h2>
      
      {/* Year-Round Signature - Now at the top as a summary */}
      <div className={styles.yearRoundContainer}>
        <div className={styles.yearRoundTitle}>
          <span className={styles.yearRoundEmoji}>✨</span>
          <span className={styles.yearRoundTitleText}>Your Year-Round Vibes</span>
        </div>
        <p className={styles.yearRoundText}>
          Your taste evolves from <span className={styles.highlight}>deep house vibes</span> in winter 
          to <span className={styles.highlight}>high-energy techno</span> in summer, with a consistent 
          appreciation for <span className={styles.highlight}>melodic elements</span> year-round.
        </p>
      </div>
      
      {/* Seasonal Grid - Now below the year-round summary */}
      <div className={styles.seasonGrid}>
        {Object.entries(seasonalData).map(([season, data]) => (
          <div 
            key={season}
            className={`${styles.seasonCard} ${season === currentSeason ? styles.currentSeason : ''}`}
          >
            <div className={styles.seasonHeader}>
              <div className={styles.seasonInfo}>
                <span className={styles.seasonEmoji}>{data.emoji}</span>
                <span className={styles.seasonName}>{data.title}</span>
              </div>
              {season === currentSeason && (
                <span className={styles.currentBadge}>Now</span>
              )}
            </div>
            
            <div className={styles.seasonGenres}>
              <span className={styles.genreLabel}>Vibe:</span>
              <span className={styles.genreList}>{data.genres}</span>
            </div>
            
            <div className={styles.seasonMessage}>
              {data.message}
            </div>
          </div>
        ))}
      </div>
      
      {/* Feedback section with updated "No" presentation */}
      <div className={styles.feedbackContainer}>
        <span className={styles.feedbackQuestion}>Did we get it right?</span>
        <button 
          className={styles.feedbackButton}
          onClick={() => setShowFeedback(!showFeedback)}
        >
          No
        </button>
      </div>
      
      {/* User feedback grid */}
      {showFeedback && (
        <div className={styles.feedbackGridOverlay}>
          <UserFeedbackGrid 
            onSubmit={handleFeedbackSubmit}
            onClose={() => setShowFeedback(false)}
          />
        </div>
      )}
    </div>
  );
}
