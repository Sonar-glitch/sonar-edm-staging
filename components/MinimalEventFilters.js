// MINIMAL EVENT FILTERS - SURGICAL LAYOUT FIX
// Fixes location input layout to make room for autocomplete suggestions
// Preserves 100% of existing thematic styling and functionality
// Only modifies layout structure for better UX

import { useState, useEffect } from 'react';
import styles from '../styles/MinimalEventFilters.module.css';

export default function MinimalEventFilters({ 
  onLocationChange, 
  onVibeMatchChange, 
  initialLocation, 
  initialVibeMatch = 50 
}) {
  const [vibeMatch, setVibeMatch] = useState(initialVibeMatch);
  const [location, setLocation] = useState(initialLocation || '');
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Handle vibe match slider changes
  const handleVibeMatchChange = (e) => {
    const value = parseInt(e.target.value);
    setVibeMatch(value);
    onVibeMatchChange(value);
  };

  // Handle location search input
  const handleLocationInput = async (e) => {
    const value = e.target.value;
    setLocation(value);

    if (value.length > 2) {
      setIsLoadingLocation(true);
      try {
        // Use our new hybrid location search API
        const response = await fetch(`/api/location/search?query=${encodeURIComponent(value)}`);
        if (response.ok) {
          const data = await response.json();
          setLocationSuggestions(data.suggestions || []);
          setShowSuggestions(true);
        }
      } catch (error) {
        console.error('Location search error:', error);
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
    const locationString = selectedLocation.formattedAddress || 
                          `${selectedLocation.name}, ${selectedLocation.country}`;
    setLocation(locationString);
    setShowSuggestions(false);
    onLocationChange(selectedLocation);
  };

  // Auto-detect user location
  const handleAutoLocation = async () => {
    setIsLoadingLocation(true);
    try {
      const response = await fetch('/api/user/get-location');
      if (response.ok) {
        const locationData = await response.json();
        const locationString = `${locationData.city}, ${locationData.region}, ${locationData.country}`;
        setLocation(locationString);
        onLocationChange(locationData);
      }
    } catch (error) {
      console.error('Auto location error:', error);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Close suggestions when clicking outside
  const handleClickOutside = () => {
    setShowSuggestions(false);
  };

  return (
    <div className={styles.filtersContainer}>
      
      {/* VIBE MATCH SLIDER - UNCHANGED */}
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

      {/* LOCATION SEARCH - SURGICAL LAYOUT FIX */}
      <div className={styles.filterGroup}>
        <div className={styles.filterHeader}>
          <label className={styles.filterLabel}>Location</label>
        </div>
        
        {/* MODIFIED: Inline layout for input + auto button */}
        <div className={styles.locationInputContainer}>
          <div className={styles.locationInputRow}>
            <input
              type="text"
              value={location}
              onChange={handleLocationInput}
              placeholder="Search city or venue..."
              className={styles.locationInput}
              onBlur={handleClickOutside}
            />
            <button 
              onClick={handleAutoLocation}
              disabled={isLoadingLocation}
              className={styles.autoLocationButton}
            >
              {isLoadingLocation ? '📍' : '🎯'} Auto
            </button>
          </div>
          
          {/* ENHANCED: Better positioned suggestions dropdown */}
          {showSuggestions && locationSuggestions.length > 0 && (
            <div className={styles.locationSuggestions}>
              {locationSuggestions.slice(0, 5).map((suggestion, index) => (
                <div
                  key={index}
                  onMouseDown={(e) => e.preventDefault()} // Prevent blur before click
                  onClick={() => handleLocationSelect(suggestion)}
                  className={styles.locationSuggestion}
                >
                  <span className={styles.suggestionIcon}>📍</span>
                  <div className={styles.suggestionContent}>
                    <span className={styles.suggestionText}>
                      {suggestion.name || suggestion.formattedAddress}
                    </span>
                    {suggestion.country && (
                      <span className={styles.suggestionSubtext}>
                        {suggestion.country}
                      </span>
                    )}
                  </div>
                  {suggestion.source === 'google_maps' && (
                    <span className={styles.suggestionSource}>🌍</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

