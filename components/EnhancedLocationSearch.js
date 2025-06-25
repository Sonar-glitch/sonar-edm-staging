import React, { useState, useEffect, useRef } from 'react';

/**
 * Enhanced Location Search component with Google Places autocomplete
 * Preserves the original dark theme styling while adding search functionality
 */
export default function EnhancedLocationSearch({ selectedLocation, onLocationSelect }) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const suggestionsTimeoutRef = useRef(null);

  // Default location (Toronto fallback)
  const currentLocation = selectedLocation || {
    city: 'Toronto',
    stateCode: 'ON',
    countryCode: 'CA',
    lat: 43.653226,
    lon: -79.383184,
    formattedAddress: 'Toronto, ON, Canada'
  };

  // Load Google Maps API when component mounts
  useEffect(() => {
    loadGoogleMapsAPI();
  }, []);

  // Focus input when entering search mode
  useEffect(() => {
    if (isSearchMode && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
    }
  }, [isSearchMode]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (isSearchMode && window.google && window.google.maps && inputRef.current && !autocompleteRef.current) {
      initializeAutocomplete();
    }
  }, [isSearchMode]);

  const loadGoogleMapsAPI = () => {
    // Check if Google Maps API is already loaded
    if (window.google && window.google.maps) {
      return;
    }

    // Check if script is already being loaded
    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.initGoogleMaps = () => {
      console.log('Google Maps API loaded successfully');
      delete window.initGoogleMaps;
    };

    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setError('Failed to load location search. Please try again.');
    };

    document.head.appendChild(script);
  };

  const initializeAutocomplete = () => {
    try {
      const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
        types: ['(cities)'],
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'address_components']
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        
        if (!place.geometry) {
          console.error('No geometry found for selected place');
          return;
        }

        const locationData = extractLocationData(place);
        handleLocationSelect(locationData);
      });

      autocompleteRef.current = autocomplete;
    } catch (error) {
      console.error('Error initializing Google Places Autocomplete:', error);
      setError('Location search unavailable. Please try again.');
    }
  };

  const extractLocationData = (place) => {
    const location = {
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address,
      lat: place.geometry.location.lat(),
      lon: place.geometry.location.lng(),
      city: '',
      stateCode: '',
      countryCode: '',
      country: ''
    };

    // Extract city, state, and country from address components
    if (place.address_components) {
      place.address_components.forEach(component => {
        const types = component.types;
        
        if (types.includes('locality')) {
          location.city = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          location.stateCode = component.short_name;
        } else if (types.includes('country')) {
          location.country = component.long_name;
          location.countryCode = component.short_name;
        }
      });
    }

    // If no city found, try to use the place name
    if (!location.city && place.name) {
      location.city = place.name;
    }

    return location;
  };

  const handleLocationSelect = async (locationData) => {
    console.log('Location selected:', locationData);
    
    // Update the display
    setIsSearchMode(false);
    setSearchQuery('');
    setSuggestions([]);
    setError(null);

    // Call the parent callback to update the location
    if (onLocationSelect) {
      onLocationSelect(locationData);
    }

    // Trigger city expansion if it's a new city
    if (locationData.city && locationData.countryCode) {
      try {
        const response = await fetch('/api/events/request-city', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            city: locationData.city,
            country: locationData.countryCode,
            latitude: locationData.lat,
            longitude: locationData.lon
          }),
        });

        if (response.ok) {
          console.log('City expansion request sent successfully');
        } else {
          console.log('City expansion request failed:', response.status);
        }
      } catch (error) {
        console.error('Error requesting city expansion:', error);
      }
    }
  };

  const handleChangeClick = () => {
    setIsSearchMode(true);
    setError(null);
  };

  const handleCancelSearch = () => {
    setIsSearchMode(false);
    setSearchQuery('');
    setSuggestions([]);
    setError(null);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancelSearch();
    }
  };

  // Format location for display
  const formatLocationDisplay = (location) => {
    if (!location) return 'Unknown Location';
    
    if (location.formattedAddress) {
      return location.formattedAddress;
    }
    
    const parts = [];
    if (location.city) parts.push(location.city);
    if (location.stateCode) parts.push(location.stateCode);
    if (location.country) parts.push(location.country);
    
    return parts.join(', ') || 'Unknown Location';
  };

  return (
    <div style={{ 
      padding: '1rem', 
      background: '#1a1a1a', 
      borderRadius: '8px',
      border: '1px solid #333',
      color: '#fff',
      position: 'relative'
    }}>
      {!isSearchMode ? (
        // Display Mode - Shows current location
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#ff1493' }}>📍</span>
            <span>{formatLocationDisplay(currentLocation)}</span>
            <button 
              onClick={handleChangeClick}
              style={{
                background: 'linear-gradient(90deg, #00c6ff, #ff00ff)',
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Change
            </button>
          </div>
        </div>
      ) : (
        // Search Mode - Shows input field with autocomplete
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <span style={{ color: '#ff1493' }}>📍</span>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Search for a city..."
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  background: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  color: '#fff',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
            </div>
            <button 
              onClick={handleCancelSearch}
              style={{
                background: '#666',
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                color: 'white',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          </div>
          
          {error && (
            <div style={{ 
              fontSize: '0.8rem', 
              color: '#ff6b6b', 
              marginTop: '0.5rem' 
            }}>
              {error}
            </div>
          )}
          
          <div style={{ 
            fontSize: '0.8rem', 
            color: '#888', 
            marginTop: '0.5rem' 
          }}>
            Start typing to search for cities worldwide
          </div>
        </div>
      )}
    </div>
  );
}

