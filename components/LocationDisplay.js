import React, { useState, useEffect } from 'react';
import styles from './LocationDisplay.module.css';

export default function LocationDisplay({ location }) {
  const [userLocation, setUserLocation] = useState(location);
  const [loading, setLoading] = useState(!location);
  const [error, setError] = useState(null);
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  
  // Predefined locations
  const predefinedLocations = [
    { city: "Toronto", region: "ON", country: "Canada", latitude: 43.6532, longitude: -79.3832 },
    { city: "New York", region: "NY", country: "United States", latitude: 40.7128, longitude: -74.0060 },
    { city: "Los Angeles", region: "CA", country: "United States", latitude: 34.0522, longitude: -118.2437 },
    { city: "Chicago", region: "IL", country: "United States", latitude: 41.8781, longitude: -87.6298 },
    { city: "Miami", region: "FL", country: "United States", latitude: 25.7617, longitude: -80.1918 },
    { city: "London", region: "England", country: "United Kingdom", latitude: 51.5074, longitude: -0.1278 },
    { city: "Berlin", region: "Berlin", country: "Germany", latitude: 52.5200, longitude: 13.4050 },
    { city: "Amsterdam", region: "North Holland", country: "Netherlands", latitude: 52.3676, longitude: 4.9041 }
  ];
  
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
  
  const handleLocationChange = async (newLocation) => {
    setUserLocation(newLocation);
    setShowLocationSelector(false);
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
    }
    
    // Send to server
    try {
      await fetch('/api/user/set-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLocation)
      });
      
      // Reload the page to refresh events with new location
      window.location.reload();
    } catch (e) {
      console.error('Error sending location to server:', e);
    }
  };
  
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
      <button 
        className={styles.changeLocationButton}
        onClick={() => setShowLocationSelector(!showLocationSelector)}
      >
        Change
      </button>
      
      {showLocationSelector && (
        <div className={styles.locationSelector}>
          <h4>Select Location</h4>
          <ul>
            {predefinedLocations.map((loc, index) => (
              <li key={index} onClick={() => handleLocationChange(loc)}>
                {loc.city}, {loc.region}, {loc.country}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
