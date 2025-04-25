import React from 'react';
import styles from './LocationDisplay.module.css';

export default function LocationDisplay({ location }) {
  const [userLocation, setUserLocation] = React.useState(location);
  const [loading, setLoading] = React.useState(!location);
  const [error, setError] = React.useState(null);
  
  React.useEffect(() => {
    if (location) {
      setUserLocation(location);
      return;
    }
    
    async function getLocation() {
      try {
        setLoading(true);
        
        // Try to get location from localStorage
        if (typeof window !== 'undefined') {
          const savedLocation = localStorage.getItem('userLocation');
          if (savedLocation) {
            try {
              setUserLocation(JSON.parse(savedLocation));
              setLoading(false);
              return;
            } catch (e) {
              console.error('Error parsing saved location:', e);
            }
          }
        }
        
        // Try to get location from API
        const response = await fetch('/api/user/get-location');
        if (response.ok) {
          const data = await response.json();
          setUserLocation(data);
          
          // Save to localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('userLocation', JSON.stringify(data));
          }
        } else {
          throw new Error('Failed to get location');
        }
      } catch (err) {
        console.error('Error getting location:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    getLocation();
  }, [location]);
  
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
  
  if (!userLocation) {
    return <div className={styles.locationDisplay}>Location unavailable</div>;
  }
  
  return (
    <div className={styles.locationDisplay}>
      <span className={styles.locationIcon}>📍</span>
      <span className={styles.locationText}>
        {userLocation.city}, {userLocation.region}, {userLocation.country}
      </span>
    </div>
  );
}
