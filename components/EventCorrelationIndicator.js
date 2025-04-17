import React from 'react';
import styles from '../styles/EventCorrelationIndicator.module.css';

const EventCorrelationIndicator = ({ correlation, matchFactors }) => {
  // Error handling: Check if correlation is valid
  const validCorrelation = typeof correlation === 'number' && !isNaN(correlation) ? correlation : 0;
  
  // Format correlation as percentage
  const correlationPercent = Math.round(validCorrelation * 100);
  
  // Determine correlation level for styling
  const getCorrelationLevel = (percent) => {
    try {
      if (percent >= 80) return 'high';
      if (percent >= 60) return 'medium';
      if (percent >= 40) return 'moderate';
      return 'low';
    } catch (error) {
      console.error('Error determining correlation level:', error);
      return 'low';
    }
  };
  
  const correlationLevel = getCorrelationLevel(correlationPercent);
  
  // Validate matchFactors
  const validMatchFactors = matchFactors && typeof matchFactors === 'object' ? matchFactors : {};
  
  return (
    <div className={styles.correlationContainer}>
      <div className={styles.correlationHeader}>
        <div className={styles.correlationValue}>
          <span className={`${styles.correlationPercent} ${styles[correlationLevel]}`}>
            {correlationPercent}%
          </span>
          <span className={styles.correlationLabel}>match</span>
        </div>
        
        {validMatchFactors.recentListenBoost && (
          <div className={styles.recentBoostBadge}>
            Recent Listen Boost
          </div>
        )}
      </div>
      
      {validMatchFactors && Object.keys(validMatchFactors).length > 0 && (
        <div className={styles.matchFactors}>
          <h4 className={styles.matchFactorsTitle}>Match Factors</h4>
          <ul className={styles.factorsList}>
            {validMatchFactors.genres && Array.isArray(validMatchFactors.genres) && validMatchFactors.genres.length > 0 && (
              <li className={styles.factorItem}>
                <span className={styles.factorLabel}>Genres:</span>
                <span className={styles.factorValue}>{validMatchFactors.genres.join(', ')}</span>
              </li>
            )}
            
            {validMatchFactors.artists && Array.isArray(validMatchFactors.artists) && validMatchFactors.artists.length > 0 && (
              <li className={styles.factorItem}>
                <span className={styles.factorLabel}>Artists:</span>
                <span className={styles.factorValue}>{validMatchFactors.artists.join(', ')}</span>
              </li>
            )}
            
            {validMatchFactors.mood && (
              <li className={styles.factorItem}>
                <span className={styles.factorLabel}>Mood:</span>
                <span className={styles.factorValue}>{validMatchFactors.mood}</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EventCorrelationIndicator;
