import React from 'react';
import { useLocation } from './LocationProvider';
import styles from './LocationDisplay.module.css';

export default function LocationDisplay() {
  const { location, loading, error } = useLocation();
  
  if (loading) {
    return <div className={styles.locationDisplay}>Detecting your location...</div>;
  }
  
  if (error) {
    return (
      <div className={styles.locationDisplay}>
        <span className={styles.error}>Location detection failed.</span>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  if (!location) {
    return <div className={styles.locationDisplay}>Location unavailable</div>;
  }
  
  return (
    <div className={styles.locationDisplay}>
      <span className={styles.locationIcon}>📍</span>
      <span className={styles.locationText}>
        {location.city}, {location.region}, {location.country}
      </span>
    </div>
  );
}
