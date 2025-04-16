import React from 'react';
import styles from '../styles/EventCorrelationIndicator.module.css';

export default function EventCorrelationIndicator({ correlationScore }) {
  // Determine correlation level based on score
  let correlationLevel = 'low';
  if (correlationScore >= 80) {
    correlationLevel = 'high';
  } else if (correlationScore >= 50) {
    correlationLevel = 'medium';
  }

  // Get appropriate label based on correlation level
  const getCorrelationLabel = () => {
    switch (correlationLevel) {
      case 'high':
        return 'Strong Match';
      case 'medium':
        return 'Good Match';
      case 'low':
        return 'Moderate Match';
      default:
        return 'Moderate Match';
    }
  };

  return (
    <div className={`${styles.correlationIndicator} ${styles[correlationLevel]}`}>
      <div className={styles.correlationBadge}>
        <span className={styles.correlationScore}>{correlationScore}%</span>
      </div>
      <div className={styles.correlationLabel}>
        {getCorrelationLabel()}
      </div>
      <div className={styles.correlationBars}>
        <div className={`${styles.correlationBar} ${styles.bar1}`}></div>
        <div className={`${styles.correlationBar} ${styles.bar2} ${correlationLevel === 'low' ? styles.inactive : ''}`}></div>
        <div className={`${styles.correlationBar} ${styles.bar3} ${correlationLevel === 'high' ? styles.active : styles.inactive}`}></div>
      </div>
    </div>
  );
}
