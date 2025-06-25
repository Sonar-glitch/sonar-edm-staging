import React, { useState, useEffect, useRef } from 'react';

/**
 * Enhanced Location Search component with Google Places autocomplete
 * Preserves the original dark theme styling while adding search functionality
 * Updated to use non-deprecated Google Geocoding API
 */
export default function EnhancedLocationSearch({ selectedLocation, onLocationSelect }) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Default location (Toronto fallback)
  const currentLocation = selectedLocation || {
    city: 'Toronto',
    stateCode: 'ON',
    countryCode: 'CA',
    lat: 43.653226,
    lon: -79.383184,
    formattedAddress: 'Toronto, ON, Canada'
  };

  // Focus input when entering search mode
  useEffect(() => {
    if (isSearchMode && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery('');
    }
  }, [isSearchMode]);

  // Search for cities when query changes
  useEffect(() => {
    if (searchQuery.length >= 2 && isSearchMode) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Debounce search requests
      searchTimeoutRef.current = setTimeout(() => {
        searchCities(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, isSearchMode]);

  const searchCities = async (query) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps API key not found. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use Google Geocoding API to search for cities
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&components=locality&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        // Filter and format results for cities
        const cityResults = data.results
          .filter(result => 
            result.types.includes('locality') || 
            result.types.includes('administrative_area_level_1') ||
            result.types.includes('political')
          )
          .slice(0, 5) // Limit to 5 suggestions
          .map(result => ({
            place_id: result.place_id,
            formatted_address: result.formatted_address,
            geometry: result.geometry,
            address_components: result.address_components,
            name: extractCityName(result.address_components) || result.formatted_address.split(',')[0]
          }));

        setSuggestions(cityResults);
      } else if (data.status === 'ZERO_RESULTS') {
        setSuggestions([]);
      } else {
        throw new Error(data.error_message || `Geocoding API Error: ${data.status}`);
      }
    } catch (err) {
      console.error("Error fetching city suggestions:", err);
      setError('Failed to fetch suggestions. Please try again.');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractCityName = (addressComponents) => {
    const cityComponent = addressComponents.find(component =>
      component.types.includes('locality') ||
      component.types.includes('administrative_area_level_1')
    );
    return cityComponent ? cityComponent.long_name : null;
  };

  const extractLocationData = (place) => {
    const location = {
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address,
      lat: place.geometry.location.lat,
      lon: place.geometry.location.lng,
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

  const handleSuggestionClick = (suggestion) => {
    const locationData = extractLocationData(suggestion);
    handleLocationSelect(locationData);
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
        // Search Mode - Shows input field with suggestions
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
              
              {/* Suggestions Dropdown */}
              {(suggestions.length > 0 || isLoading || error) && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#2a2a2a',
                  border: '1px solid #444',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 1000
                }}>
                  {isLoading && (
                    <div style={{
                      padding: '0.5rem',
                      color: '#888',
                      fontSize: '0.8rem'
                    }}>
                      Searching...
                    </div>
                  )}
                  
                  {error && (
                    <div style={{
                      padding: '0.5rem',
                      color: '#ff6b6b',
                      fontSize: '0.8rem'
                    }}>
                      {error}
                    </div>
                  )}
                  
                  {!isLoading && !error && suggestions.length === 0 && searchQuery.length >= 2 && (
                    <div style={{
                      padding: '0.5rem',
                      color: '#888',
                      fontSize: '0.8rem'
                    }}>
                      No cities found
                    </div>
                  )}
                  
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.place_id || index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      style={{
                        padding: '0.5rem',
                        cursor: 'pointer',
                        borderBottom: index < suggestions.length - 1 ? '1px solid #444' : 'none',
                        fontSize: '0.9rem',
                        ':hover': {
                          background: '#333'
                        }
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#333'}
                      onMouseLeave={(e) => e.target.style.background = 'transparent'}
                    >
                      {suggestion.formatted_address}
                    </div>
                  ))}
                </div>
              )}
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

