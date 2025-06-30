import React, { useState, useEffect, useRef } from 'react';
import { searchCities, getCoordinatesFromPlaceId } from '../lib/locationUtils';
import { useLocation } from './LocationProvider';

/**
 * Enhanced Location Search component with Google Places autocomplete
 * Preserves the original dark theme styling while adding robust search functionality
 * Updated to use Google Places API with proper error handling
 */
export default function EnhancedLocationSearch({ selectedLocation, onLocationSelect }) {
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const { refreshLocation } = useLocation();

  // Default location (Toronto fallback)
  const currentLocation = selectedLocation || {
    city: "Toronto",
    region: "ON", 
    country: "Canada"
  };

  // Handle search input changes with debouncing
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    setError(null);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search requests
    if (query.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        await performSearch(query.trim());
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  // Perform city search using Google Places API
  const performSearch = async (query) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`🔍 Searching for cities: "${query}"`);
      const results = await searchCities(query);
      
      if (results.length > 0) {
        setSuggestions(results);
        console.log(`✅ Found ${results.length} city suggestions`);
      } else {
        setSuggestions([]);
        setError('No cities found. Try a different search term.');
      }
    } catch (error) {
      console.error('❌ City search failed:', error);
      setSuggestions([]);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log(`📍 Getting coordinates for: ${suggestion.name}`);
      
      // Get coordinates from place ID
      const locationData = await getCoordinatesFromPlaceId(suggestion.id);
      
      if (locationData) {
        console.log('✅ Location data retrieved:', locationData);
        
        // Call the parent callback with the new location
        if (onLocationSelect) {
          onLocationSelect(locationData);
        }
        
        // Update search query to show selected location
        setSearchQuery(suggestion.name);
        setSuggestions([]);
        setIsSearchMode(false);
        
        console.log('📍 Location selected successfully');
      } else {
        throw new Error('Unable to get location details');
      }
    } catch (error) {
      console.error('❌ Location selection failed:', error);
      setError('Failed to select location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search mode toggle
  const toggleSearchMode = () => {
    if (isSearchMode) {
      // Exiting search mode
      setIsSearchMode(false);
      setSearchQuery('');
      setSuggestions([]);
      setError(null);
    } else {
      // Entering search mode
      setIsSearchMode(true);
      setSearchQuery('');
      setSuggestions([]);
      setError(null);
      
      // Focus input after state update
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 100);
    }
  };

  // Handle auto-detect location
  const handleAutoDetect = () => {
    console.log('🎯 Auto-detecting location...');
    setIsLoading(true);
    setError(null);
    
    // Use LocationProvider's refresh function
    refreshLocation();
    
    // Reset search mode
    setIsSearchMode(false);
    setSearchQuery('');
    setSuggestions([]);
    
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Location Display / Search Toggle */}
      <div className="flex items-center space-x-2">
        {!isSearchMode ? (
          // Display current location
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 text-gray-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm">
                {currentLocation.city}, {currentLocation.region}
              </span>
            </div>
            
            {/* Search Button */}
            <button
              onClick={toggleSearchMode}
              className="text-cyan-400 hover:text-cyan-300 transition-colors"
              title="Search for a different city"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            
            {/* Auto-detect Button */}
            <button
              onClick={handleAutoDetect}
              disabled={isLoading}
              className="text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
              title="Auto-detect my location"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        ) : (
          // Search input mode
          <div className="flex items-center space-x-2 w-full">
            <div className="relative flex-1" ref={inputRef}>
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search for a city..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                autoFocus
              />
              
              {/* Loading indicator */}
              {isLoading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <svg className="w-4 h-4 animate-spin text-cyan-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
              )}
            </div>
            
            {/* Cancel Button */}
            <button
              onClick={toggleSearchMode}
              className="text-gray-400 hover:text-gray-300 transition-colors"
              title="Cancel search"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Search Suggestions */}
      {isSearchMode && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion.id}
              onClick={() => handleSuggestionSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-700 transition-colors border-b border-gray-700 last:border-b-0"
              disabled={isLoading}
            >
              <div className="text-white text-sm">
                {suggestion.structured_formatting?.main_text || suggestion.name}
              </div>
              {suggestion.structured_formatting?.secondary_text && (
                <div className="text-gray-400 text-xs mt-1">
                  {suggestion.structured_formatting.secondary_text}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
