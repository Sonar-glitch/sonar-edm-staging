// MINIMAL EVENT FILTERS - VIBE MATCH + LOCATION SEARCH
// Uses TIKO glassmorphic theme and existing styling patterns
// Only includes filters we can confidently support with Phase 1 metadata

import { useState, useEffect } from 'react';
import { getUserLocationFromBrowser, getUserLocationFromIP } from '@/lib/locationUtils';
import styles from '../styles/MinimalEventFilters.module.css';

export default function MinimalEventFilters({ 
  userLocation,
  onLocationChange, 
  filters,
  onFiltersChange
}) {
  const [vibeMatch, setVibeMatch] = useState(filters?.vibeMatch || 50);
  const [location, setLocation] = useState(userLocation ? `${userLocation.city}, ${userLocation.region}, ${userLocation.country}` : '');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Handle vibe match slider changes
  const handleVibeMatchChange = (e) => {
    const value = parseInt(e.target.value);
    setVibeMatch(value);
    onFiltersChange({
      ...filters,
      vibeMatch: value
    });
  };

  // Handle location search input
  const handleLocationInput = async (e) => {
    const value = e.target.value;
    setLocation(value);

    if (value.length > 2) {
      setIsLoadingLocation(true);
      try {
        // Use Google Places API for location suggestions
        const response = await fetch(`/api/location/search?query=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setLocationSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Location search error:', error.message || error);
        setLocationSuggestions([]);
      } finally {
        setIsLoadingLocation(false);
      }
    } else {
      setLocationSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle location selection from suggestions
  const handleLocationSelect = (selectedLocation) => {
    const locationString = `${selectedLocation.city}, ${selectedLocation.region}, ${selectedLocation.country}`;
    setLocation(locationString);
    setShowSuggestions(false);
    onLocationChange(selectedLocation);
    onFiltersChange({
      ...filters,
      location: selectedLocation
    });
  };

  // Auto-detect user location
  const handleAutoLocation = async () => {
    setIsLoadingLocation(true);
    try {
      // First try browser geolocation (GPS)
      try {
        const locationData = await getUserLocationFromBrowser();
        const locationString = `${locationData.city}, ${locationData.region}, ${locationData.country}`;
        setLocation(locationString);
        onLocationChange(locationData);
        onFiltersChange({
          ...filters,
          location: locationData
        });
        return; // Success, exit early
      } catch (browserError) {
        console.log('Browser geolocation failed, trying client-side IP detection:', browserError.message);
      }
      
      // Fallback to client-side IP detection (user's actual IP)
      try {
        const locationData = await getUserLocationFromIP();
        const locationString = `${locationData.city}, ${locationData.region}, ${locationData.country}`;
        setLocation(locationString);
        onLocationChange(locationData);
        onFiltersChange({
          ...filters,
          location: locationData
        });
        return; // Success, exit early
      } catch (ipError) {
        console.log('Client-side IP detection failed, defaulting to Toronto:', ipError.message);
      }
      
      // Default to Toronto if both methods fail
      const torontoData = {
        city: 'Toronto',
        region: 'Ontario',
        country: 'Canada',
        lat: 43.6532,
        lon: -79.3832,
        latitude: 43.6532,
        longitude: -79.3832
      };
      setLocation('Toronto, Ontario, Canada');
      onLocationChange(torontoData);
      onFiltersChange({
        ...filters,
        location: torontoData
      });
      
    } catch (error) {
      console.error('Auto location error:', error.message || error);
      // Even if there's an error, default to Toronto
      const torontoData = {
        city: 'Toronto',
        region: 'Ontario',
        country: 'Canada',
        lat: 43.6532,
        lon: -79.3832
      };
      setLocation('Toronto, Ontario, Canada');
      onLocationChange(torontoData);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  return (
    <div className={styles.filtersContainer}>
      
      {/* VIBE MATCH SLIDER */}
      <div className={styles.filterGroup}>
        <div className={styles.filterHeader}>
          <label className={styles.filterLabel}>Vibe Match</label>
          <span className={styles.filterValue}>{vibeMatch}%</span>
        </div>
        
        <div className={styles.sliderContainer}>
          <input
            type="range"
            min="0"
            max="100"
            value={vibeMatch}
            onChange={handleVibeMatchChange}
            className={styles.vibeSlider}
          />
          <div 
            className={styles.sliderFill} 
            style={{ width: `${vibeMatch}%` }}
          />
        </div>
        
        <div className={styles.sliderLabels}>
          <span className={styles.sliderLabel}>Any Vibe</span>
          <span className={styles.sliderLabel}>Perfect Match</span>
        </div>
      </div>

      {/* LOCATION SEARCH - INLINE LAYOUT */}
      <div className={styles.filterGroup}>
        <div className={styles.filterHeader}>
          <label className={styles.filterLabel}>Location</label>
        </div>
        
        <div className={styles.locationInputContainer}>
          <div className={styles.locationInputRow}>
            <input
              type="text"
              value={location}
              onChange={handleLocationInput}
              placeholder="Search city or venue..."
              className={styles.locationInput}
            />
            <button 
              onClick={handleAutoLocation}
              disabled={isLoadingLocation}
              className={styles.autoLocationButton}
            >
              {isLoadingLocation ? '📍' : '🎯'} Auto
            </button>
          </div>
          
        {showSuggestions && locationSuggestions.length > 0 && (
  <div className={styles.locationSuggestions}>
    {locationSuggestions.slice(0, 5).map((suggestion, index) => (
      <div
        key={index}
        onClick={() => handleLocationSelect(suggestion)}
        className={styles.locationSuggestion}
      >
        <span className={styles.suggestionIcon}>📍</span>
        <div className={styles.suggestionContent}>
          <span className={styles.suggestionText}>{suggestion.description}</span>
        </div>
      </div>
    ))}
  </div>
)}
        </div>
      </div>

    </div>
  );
}

