import React from 'react';
import styles from '../styles/EventCorrelationIndicator.module.css';

const EventCorrelationIndicator = ({ correlation, matchFactors }) => {
  // Format correlation as percentage
  const correlationPercent = Math.round(correlation * 100);
  
  // Determine correlation level for styling
  const getCorrelationLevel = (percent) => {
    if (percent >= 80) return 'high';
    if (percent >= 60) return 'medium';
    if (percent >= 40) return 'moderate';
    return 'low';
  };
  
  const correlationLevel = getCorrelationLevel(correlationPercent);
  
  return (
    <div className={styles.correlationContainer}>
      <div className={styles.correlationHeader}>
        <div className={styles.correlationValue}>
          <span className={`${styles.correlationPercent} ${styles[correlationLevel]}`}>
            {correlationPercent}%
          </span>
          <span className={styles.correlationLabel}>match</span>
        </div>
        
        {matchFactors && matchFactors.recentListenBoost && (
          <div className={styles.recentBoostBadge}>
            Recent Listen Boost
          </div>
        )}
      </div>
      
      {matchFactors && (
        <div className={styles.matchFactors}>
          <h4 className={styles.matchFactorsTitle}>Match Factors</h4>
          <ul className={styles.factorsList}>
            {matchFactors.genres && (
              <li className={styles.factorItem}>
                <span className={styles.factorLabel}>Genres:</span>
                <span className={styles.factorValue}>{matchFactors.genres.join(', ')}</span>
              </li>
            )}
            
            {matchFactors.artists && (
              <li className={styles.factorItem}>
                <span className={styles.factorLabel}>Artists:</span>
                <span className={styles.factorValue}>{matchFactors.artists.join(', ')}</span>
              </li>
            )}
            
            {matchFactors.mood && (
              <li className={styles.factorItem}>
                <span className={styles.factorLabel}>Mood:</span>
                <span className={styles.factorValue}>{matchFactors.mood}</span>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default EventCorrelationIndicator;
