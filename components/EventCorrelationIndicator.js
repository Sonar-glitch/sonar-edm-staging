import React from 'react';
import styles from '../styles/EventCorrelationIndicator.module.css';

const EventCorrelationIndicator = ({ correlation }) => {
  const getCorrelationLabel = () => {
    if (correlation >= 80) return 'Perfect Match';
    if (correlation >= 70) return 'Strong Match';
    if (correlation >= 60) return 'Good Match';
    if (correlation >= 50) return 'Decent Match';
    return 'Potential Match';
  };
  
  const getCorrelationClass = () => {
    if (correlation >= 80) return styles.perfectMatch;
    if (correlation >= 70) return styles.strongMatch;
    if (correlation >= 60) return styles.goodMatch;
    if (correlation >= 50) return styles.decentMatch;
    return styles.potentialMatch;
  };
  
  return (
    <div className={styles.correlationContainer}>
      <div className={styles.correlationLabel}>
        <span>Taste Match:</span>
        <span className={getCorrelationClass()}>{getCorrelationLabel()}</span>
      </div>
      <div className={styles.correlationBar}>
        <div 
          className={`${styles.correlationFill} ${getCorrelationClass()}`}
          style={{ width: `${correlation}%` }}
        ></div>
      </div>
    </div>
  );
};

export default EventCorrelationIndicator;
