import React, { useState, useEffect, useRef } from 'react';

const EnhancedLocationSearch = ({ selectedLocation, onLocationSelect }) => {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const searchTimeoutRef = useRef(null);

  // FIXED: Comprehensive country code to full name mapping
  const countryCodeToName = {
    'US': 'United States',
    'CA': 'Canada', 
    'GB': 'United Kingdom',
    'UK': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'NL': 'Netherlands',
    'ES': 'Spain',
    'IT': 'Italy',
    'AU': 'Australia',
    'BR': 'Brazil',
    'MX': 'Mexico',
    'JP': 'Japan',
    'KR': 'South Korea'
  };

  // FIXED: Extract location data ensuring full country names are sent to API
  const extractLocationData = (place) => {
    const addressComponents = place.address_components || [];
    
    let city = '';
    let country = '';
    let countryCode = '';
    
    // Extract city name
    city = place.name || '';
    
    // Extract country from address components
    for (const component of addressComponents) {
      if (component.types.includes('country')) {
        countryCode = component.short_name;
        country = component.long_name;
        break;
      }
    }
    
    // CRITICAL FIX: Always ensure we send full country name to API
    if (countryCode && countryCodeToName[countryCode]) {
      country = countryCodeToName[countryCode];
    } else if (!country && countryCode) {
      // Fallback: use country code if no mapping found
      country = countryCode;
    }
    
    return {
      placeId: place.place_id,
      name: city,
      formattedAddress: place.formatted_address,
      lat: place.geometry?.location?.lat() || 0,
      lon: place.geometry?.location?.lng() || 0,
      country: country, // ALWAYS full country name for API consistency
      countryCode: countryCode // Keep code for reference
    };
  };

  // Search for cities using Google Geocoding API
  const searchCities = async (query) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        throw new Error('Google Maps API key not configured');
      }

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&types=(cities)&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch city suggestions');
      }

      const data = await response.json();
      
      if (data.status === 'OK' && data.results) {
        // Process results and extract city data
        const cityResults = data.results
          .filter(result => {
            // Filter for cities/localities
            return result.types.some(type => 
              ['locality', 'administrative_area_level_1', 'political'].includes(type)
            );
          })
          .slice(0, 5) // Limit to 5 suggestions
          .map(result => {
            // Convert Geocoding API result to our format
            const addressComponents = result.address_components || [];
            
            let city = '';
            let country = '';
            let countryCode = '';
            
            // Extract city and country from address components
            for (const component of addressComponents) {
              if (component.types.includes('locality') || 
                  component.types.includes('administrative_area_level_1')) {
                if (!city) city = component.long_name;
              }
              if (component.types.includes('country')) {
                countryCode = component.short_name;
                country = component.long_name;
              }
            }
            
            // CRITICAL FIX: Map country code to full name for API compatibility
            if (countryCode && countryCodeToName[countryCode]) {
              country = countryCodeToName[countryCode];
            } else if (!country && countryCode) {
              country = countryCode;
            }
            
            return {
              placeId: result.place_id,
              name: city || result.formatted_address.split(',')[0],
              formattedAddress: result.formatted_address,
              lat: result.geometry?.location?.lat || 0,
              lon: result.geometry?.location?.lng || 0,
              country: country, // ALWAYS full country name for API
              countryCode: countryCode
            };
          });

        setSuggestions(cityResults);
      } else {
        setSuggestions([]);
        if (data.status === 'ZERO_RESULTS') {
          setError('No cities found for your search');
        } else {
          setError('Error searching for cities');
        }
      }
    } catch (err) {
      console.error('City search error:', err);
      setError('Failed to search cities');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input changes with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search by 300ms
    searchTimeoutRef.current = setTimeout(() => {
      searchCities(query);
    }, 300);
  };

  // Handle city selection
  const handleCitySelect = (cityData) => {
    console.log('City selected:', cityData);
    console.log('Country being sent to API:', cityData.country); // Debug log
    
    // Call the parent callback with the selected location
    onLocationSelect(cityData);
    
    // Exit search mode
    setIsSearchMode(false);
    setSearchQuery('');
    setSuggestions([]);
    setError('');
  };

  // Handle search mode toggle
  const handleChangeClick = () => {
    setIsSearchMode(true);
    setSearchQuery('');
    setSuggestions([]);
    setError('');
  };

  // Handle cancel
  const handleCancel = () => {
    setIsSearchMode(false);
    setSearchQuery('');
    setSuggestions([]);
    setError('');
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Display mode - show current location
  if (!isSearchMode) {
    const displayLocation = selectedLocation || { name: 'Toronto', country: 'Canada' };
    
    return (
      <div style={{ 
        padding: '1rem', 
        background: '#1a1a1a',
        borderRadius: '8px',
        border: '1px solid #333',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: '#ff1493' }}>📍</span>
          <span>{displayLocation.name}{displayLocation.country ? `, ${displayLocation.country}` : ''}</span>
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
    );
  }

  // Search mode - show search input and suggestions
  return (
    <div style={{ 
      padding: '1rem', 
      background: '#1a1a1a',
      borderRadius: '8px',
      border: '1px solid #333',
      color: '#fff'
    }}>
      <div style={{ marginBottom: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <span style={{ color: '#ff1493' }}>📍</span>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Start typing to search for cities worldwide"
            style={{
              flex: 1,
              padding: '0.5rem',
              background: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              fontSize: '0.9rem'
            }}
            autoFocus
          />
          <button 
            onClick={handleCancel}
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
        
        {isLoading && (
          <div style={{ color: '#888', fontSize: '0.8rem' }}>
            Searching...
          </div>
        )}
        
        {error && (
          <div style={{ color: '#ff6b6b', fontSize: '0.8rem' }}>
            {error}
          </div>
        )}
      </div>

      {/* Suggestions dropdown */}
      {suggestions.length > 0 && (
        <div style={{
          background: '#2a2a2a',
          border: '1px solid #444',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto'
        }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.placeId || index}
              onClick={() => handleCitySelect(suggestion)}
              style={{
                padding: '0.75rem',
                borderBottom: index < suggestions.length - 1 ? '1px solid #444' : 'none',
                cursor: 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#3a3a3a';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                {suggestion.name}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#ccc' }}>
                {suggestion.formattedAddress}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '0.25rem' }}>
                Will send: {suggestion.country} (Full name for API)
              </div>
            </div>
          ))}
        </div>
      )}
      
      {searchQuery && !isLoading && suggestions.length === 0 && !error && (
        <div style={{ 
          color: '#888', 
          fontSize: '0.8rem',
          padding: '0.5rem',
          textAlign: 'center'
        }}>
          No cities found. Try a different search term.
        </div>
      )}
    </div>
  );
};

export default EnhancedLocationSearch;
