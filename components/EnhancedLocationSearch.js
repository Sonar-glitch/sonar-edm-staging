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
  const [displayLocation, setDisplayLocation] = useState(selectedLocation); // Track display location separately
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Default location (Toronto fallback)
  const currentLocation = displayLocation || selectedLocation || {
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
      const inHouseResponse = await fetch(`/api/location/search?query=${encodeURIComponent(query)}`);
      
      if (inHouseResponse.ok) {
        const inHouseData = await inHouseResponse.json();
        
        if (inHouseData.success && inHouseData.suggestions && inHouseData.suggestions.length > 0) {
          // Format in-house results to match our expected structure
          const inHouseResults = inHouseData.suggestions.map(city => ({
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
          
          setSuggestions(inHouseResults);
          setIsLoading(false);
          return;
        }
      }
      
      // STEP 2: Use Google Places Autocomplete API (FIXED)
      if (typeof window !== 'undefined' && window.google && window.google.maps && window.google.maps.places) {
        const service = new window.google.maps.places.AutocompleteService();
        
        const request = {
          input: query,
          types: ['(cities)'],
          componentRestrictions: {} // Allow all countries
        };
        
        service.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            // Format Google results to match our expected structure
            const googleResults = predictions.slice(0, 5).map(prediction => ({
              place_id: prediction.place_id,
              formatted_address: prediction.description,
              geometry: null, // Will be filled when selected
              address_components: null, // Will be filled when selected
              name: prediction.structured_formatting.main_text,
              source: 'google'
            }));
            
            setSuggestions(googleResults);
            setIsLoading(false);
            return;
          } else {
            console.warn('Google Places API failed:', status);
            setSuggestions([]);
            setError('No cities found. Try typing a major city name.');
          }
        });
      } else {
        console.warn('Google Maps not loaded yet, falling back to in-house only');
        setSuggestions([]);
        setError('Search temporarily unavailable. Try typing a major city name.');
      }
    } catch (error) {
      console.error('🔍 [EnhancedLocationSearch] Search Error:', error.message);
      setError(`Search error: ${error.message}`);
      setSuggestions([]);
    } finally {
      // Don't set loading false here if Google API is handling it
      if (!window.google || !window.google.maps || !window.google.maps.places) {
        setIsLoading(false);
      }
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
    // Update the display location immediately
    setDisplayLocation(locationData);
    
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
          // Silent fail - city expansion is not critical
        }
      } catch (error) {
        // Silent fail - city expansion is not critical
      }
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    // Check if this is a Google Places result that needs additional details
    if (suggestion.source === 'google' && !suggestion.geometry) {
      setIsLoading(true);
      try {
        // Get place details using Google Places API
        if (window.google && window.google.maps && window.google.maps.places) {
          const service = new window.google.maps.places.PlacesService(document.createElement('div'));
          
          const request = {
            placeId: suggestion.place_id,
            fields: ['place_id', 'formatted_address', 'geometry', 'address_components', 'name']
          };
          
          service.getDetails(request, (place, status) => {
            setIsLoading(false);
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
              const locationData = extractLocationData(place);
              handleLocationSelect(locationData);
            } else {
              console.error('Google Places getDetails failed:', status);
              setError('Unable to get location details. Please try another city.');
            }
          });
          return;
        } else {
          setIsLoading(false);
          setError('Google Maps not available. Please try again.');
          return;
        }
      } catch (error) {
        setIsLoading(false);
        console.error('Error getting place details:', error?.message || error?.toString() || 'Unknown error');
        setError('Unable to get location details. Please try another city.');
        return;
      }
    }
    
    // Handle in-house results or Google results that already have geometry
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
      marginBottom: '2rem', // Add spacing between sections
      background: 'rgba(21, 21, 31, 0.8)', // Glassmorphic background
      backdropFilter: 'blur(20px)',
      borderRadius: '8px',
      border: '1px solid rgba(0, 255, 255, 0.1)', // Subtle cyan glow
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)', // Multi-layer depth
      color: '#DADADA', // Primary text color
      position: 'relative'
    }}>
      {!isSearchMode ? (
        // Display Mode - Shows current location
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ color: '#00CFFF' }}>📍</span> {/* Cyan interactive highlight */}
              <span style={{ color: '#DADADA' }}>{formatLocationDisplay(currentLocation)}</span>
            </div>
            <button 
              onClick={handleChangeClick}
              style={{
                background: 'linear-gradient(90deg, #00CFFF, #FF00CC)', // TIKO gradient
                border: 'none',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                color: '#000000', // Black text for gradient buttons
                fontSize: '0.8rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 8px rgba(255, 0, 204, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 0, 204, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 8px rgba(255, 0, 204, 0.3)';
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
            <span style={{ color: '#00CFFF' }}>📍</span> {/* Cyan interactive highlight */}
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
                  background: 'rgba(17, 24, 39, 0.8)', // Dark glassmorphic input
                  border: '1px solid rgba(0, 255, 255, 0.3)', // Cyan border
                  borderRadius: '4px',
                  color: '#DADADA', // Primary text
                  fontSize: '0.9rem',
                  outline: 'none',
                  backdropFilter: 'blur(10px)',
                  transition: 'border-color 0.2s ease'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'rgba(0, 207, 255, 0.6)';
                  e.target.style.boxShadow = '0 0 0 2px rgba(0, 207, 255, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(0, 255, 255, 0.3)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              
              {/* Suggestions Dropdown */}
              {(suggestions.length > 0 || isLoading || error) && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'rgba(21, 21, 31, 0.95)', // Enhanced glassmorphic background
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(0, 255, 255, 0.2)', // Cyan border
                  borderTop: 'none',
                  borderRadius: '0 0 4px 4px',
                  maxHeight: '200px',
                  overflowY: 'auto',
                  zIndex: 9999,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 255, 255, 0.1)'
                }}>
                  
                  {isLoading && (
                    <div style={{
                      padding: '0.5rem',
                      color: '#999999', // Secondary text
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
                          borderBottom: index < suggestions.length - 1 ? '1px solid rgba(0, 255, 255, 0.1)' : 'none',
                          fontSize: '0.9rem',
                          color: '#DADADA', // Primary text
                          backgroundColor: 'transparent',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.background = 'rgba(0, 207, 255, 0.1)'; // Cyan hover
                          e.target.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.background = 'transparent';
                          e.target.style.transform = 'translateY(0)';
                        }}
                      >
                        <span style={{ 
                          color: '#DADADA',
                          display: 'block',
                          width: '100%'
                        }}>
                          {suggestion.formatted_address || suggestion.name || 'Unknown Location'}
                        </span>
                        {isInHouse && (
                          <span style={{
                            fontSize: '0.7rem',
                            color: '#00CFFF', // Cyan for TIKO brand
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
                background: 'rgba(102, 102, 102, 0.8)', // Glassmorphic gray
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                color: '#DADADA',
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = 'rgba(102, 102, 102, 1)';
                e.target.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(102, 102, 102, 0.8)';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              Cancel
            </button>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#999999' }}> {/* Secondary text */}
            Start typing to search for cities worldwide
          </div>
        </div>
      )}
    </div>
  );
}
