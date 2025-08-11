import React, { useState, useEffect, useRef } from 'react';

/**
 * Enhanced Location Search component with Google Plac          // CRITICAL DEBUG: Only log when we have results
          console.log('🎯 CITY SEARCH:', { query, found: inHouseResults.length, firstResult: inHouseResults[0]?.formatted_address });
          setSuggestions(inHouseResults);
          setIsLoading(false);
          return;
        }
      }
      
      // STEP 2: Fallback to Google API if no in-house results found
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY; Preserves the original dark theme styling while adding search functionality
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
  };

  // Country code to full name mapping for API compatibility
  const countryCodeToName = {
    'CA': 'Canada',
    'US': 'United States',
    'GB': 'United Kingdom',
    'UK': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'CH': 'Switzerland',
    'AT': 'Austria',
    'SE': 'Sweden',
    'NO': 'Norway',
    'DK': 'Denmark',
    'FI': 'Finland',
    'IE': 'Ireland',
    'PT': 'Portugal',
    'AU': 'Australia',
    'NZ': 'New Zealand',
    'JP': 'Japan',
    'KR': 'South Korea',
    'SG': 'Singapore',
    'HK': 'Hong Kong',
    'MX': 'Mexico',
    'BR': 'Brazil',
    'AR': 'Argentina',
    'CL': 'Chile',
    'CO': 'Colombia',
    'PE': 'Peru'
  };

  // Focus input when entering search mode
  useEffect(() => {
    if (isSearchMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchMode]);

  // Debounced search function
  useEffect(() => {
    if (searchQuery.length >= 2) {
      // Clear previous timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set new timeout for debounced search
      searchTimeoutRef.current = setTimeout(() => {
        searchCities(searchQuery);
      }, 300);
    } else {
      setSuggestions([]);
    }

    // Cleanup timeout on unmount
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const searchCities = async (query) => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      // STEP 1: Search our in-house city database first
      const inHouseResponse = await fetch(`/api/location/search?q=${encodeURIComponent(query)}`);
      
      if (inHouseResponse.ok) {
        const inHouseData = await inHouseResponse.json();
        
        if (inHouseData.success && inHouseData.results && inHouseData.results.length > 0) {
          // Format in-house results to match our expected structure
          const inHouseResults = inHouseData.results.map(city => ({
            place_id: `inhouse_${city.name.toLowerCase().replace(/\s+/g, '_')}`,
            formatted_address: `${city.name}, ${city.region}, ${city.country}`,
            geometry: {
              location: {
                lat: city.lat,
                lng: city.lon
              }
            },
            address_components: [
              { long_name: city.name, types: ['locality'] },
              { long_name: city.region, short_name: city.region, types: ['administrative_area_level_1'] },
              { long_name: city.country, short_name: city.countryCode, types: ['country'] }
            ],
            name: city.name,
            source: 'inhouse'
          }));
          
          // CRITICAL DEBUG: Only log when we have results
          console.log('🎯 CITY SEARCH:', { query, found: inHouseResults.length, firstResult: inHouseResults[0]?.formatted_address });
          setSuggestions(inHouseResults);
          setIsLoading(false);
          return;
        }
      }
      
      // STEP 2: Fallback to Google API if no in-house results found
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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
            name: extractCityName(result.address_components) || (result.formatted_address ? result.formatted_address.split(',')[0] : 'Unknown City'),
            source: 'google'
          }));

        console.log('🌐 [EnhancedLocationSearch] Using Google API results:', cityResults.length);
        setSuggestions(cityResults);
      } else if (data.status === 'ZERO_RESULTS') {
        console.log('🌐 [EnhancedLocationSearch] No Google results found');
        setSuggestions([]);
      } else {
        console.error('🌐 [EnhancedLocationSearch] Google API Error:', data.status, data.error_message);
        setError(`Search failed: ${data.status} - ${data.error_message || 'Unknown error'}`);
        setSuggestions([]);
      }
    } catch (error) {
      console.error('🔍 [EnhancedLocationSearch] Search Error:', error.message);
      setError(`Search error: ${error.message}`);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const extractCityName = (addressComponents) => {
    for (const component of addressComponents) {
      if (component.types.includes('locality')) {
        return component.long_name;
      }
    }
    return null;
  };

  const extractLocationData = (place) => {
    // Handle both direct lat/lng and geometry.location
    const lat = place.geometry?.location?.lat || place.lat;
    const lng = place.geometry?.location?.lng || place.lng;
    
    const location = {
      placeId: place.place_id,
      name: place.name,
      formattedAddress: place.formatted_address,
      lat: lat,
      lon: lng,
      latitude: lat, // Add this for compatibility with EnhancedEventList
      longitude: lng // Add this for compatibility with EnhancedEventList
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
    console.log('🎯 [Location Selected]:', {
      city: locationData.city,
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      country: locationData.country
    });
    
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
        // Map country code to full name for API compatibility
        let countryName = locationData.country;
        if (locationData.countryCode && countryCodeToName[locationData.countryCode]) {
          countryName = countryCodeToName[locationData.countryCode];
        }
        
        console.log('Country being sent to API:', countryName);
        
        const response = await fetch('/api/events/request-city', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            city: locationData.city,
            country: countryName, // Send full country name
            latitude: locationData.lat,
            longitude: locationData.lon
          }),
        });

        if (!response.ok) {
          console.error('City expansion request failed:', response.status);
        } else {
          console.log('City expansion request successful');
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
    const value = e.target.value;
    setSearchQuery(value);
    setQuery(value); // Also update the main query state that triggers search
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCancelSearch();
    }
  };

  // Format location for display - FIXED to handle both 'region' and 'stateCode'
  const formatLocationDisplay = (location) => {
    if (!location) return 'Unknown Location';
    
    if (location.formattedAddress) {
      return location.formattedAddress;
    }
    
    const parts = [];
    if (location.city) parts.push(location.city);
    // Handle both 'stateCode' and 'region' property names
    if (location.stateCode || location.region) parts.push(location.stateCode || location.region);
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
                  background: '#1e1e1e',
                  border: '1px solid #555',
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 9999, // CRITICAL: Much higher z-index
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  
                  {isLoading && (
                    <div style={{
                      padding: '0.5rem',
                      color: '#888',
                      fontSize: '0.9rem'
                    }}>
                      Searching...
                    </div>
                  )}
                  
                  {error && (
                    <div style={{
                      padding: '0.5rem',
                      color: '#ff6b6b',
                      fontSize: '0.9rem'
                    }}>
                      {error}
                    </div>
                  )}
                  
                  {suggestions.map((suggestion, index) => {
                    const suggestionKey = suggestion.place_id || `suggestion-${index}`;
                    const isInHouse = suggestion.source === 'inhouse';
                    return (
                      <div
                        key={suggestionKey}
                        onClick={() => handleSuggestionClick(suggestion)}
                        style={{
                          padding: '0.75rem',
                          cursor: 'pointer',
                          borderBottom: index < suggestions.length - 1 ? '1px solid #333' : 'none',
                          fontSize: '0.9rem',
                          color: '#ffffff !important', // Force white text with !important
                          backgroundColor: 'transparent',
                          transition: 'background-color 0.2s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = '#404040';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                        }}
                      >
                        <span style={{ 
                          color: '#ffffff !important',
                          display: 'block',
                          width: '100%'
                        }}>
                          {suggestion.formatted_address || suggestion.name || 'Unknown Location'}
                        </span>
                        {isInHouse && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#00ff88',
                            fontWeight: 'bold',
                            marginLeft: '0.5rem'
                          }}>
                            ⚡ TIKO
                          </span>
                        )}
                      </div>
                    );
                  })}
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
          <div style={{ fontSize: '0.8rem', color: '#888' }}>
            Start typing to search for cities worldwide
          </div>
        </div>
      )}
    </div>
  );
}
