import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserLocation } from '../lib/locationUtils';

// Create location context
const LocationContext = createContext();

// Custom hook to use location context
export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

// LocationProvider component
export default function LocationProvider({ children }) {
  const [location, setLocation] = useState({
    latitude: null,
    longitude: null,
    city: null,
    region: null,
    country: null,
    isLoading: true,
    error: null
  });

  const [isManualOverride, setIsManualOverride] = useState(false);

  // Function to detect location automatically
  const detectLocation = async (forceRefresh = false) => {
    console.log('🎯 LocationProvider: Starting location detection...');
    
    setLocation(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check localStorage first (unless force refresh)
      if (!forceRefresh) {
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            const parsedLocation = JSON.parse(savedLocation);
            
            // Validate saved location data
            if (parsedLocation.latitude && parsedLocation.longitude && parsedLocation.city) {
              // Check if saved location is not corrupted (e.g., wrong city for coordinates)
              const isValidLocation = (
                parsedLocation.city !== 'vancouver' || 
                (parsedLocation.latitude >= 49.0 && parsedLocation.latitude <= 49.5 && 
                 parsedLocation.longitude >= -123.5 && parsedLocation.longitude <= -122.5)
              );
              
              if (isValidLocation) {
                console.log('✅ LocationProvider: Using valid saved location');
                setLocation({
                  ...parsedLocation,
                  isLoading: false,
                  error: null
                });
                return;
              } else {
                console.log('⚠️ LocationProvider: Saved location appears corrupted, clearing...');
                localStorage.removeItem('userLocation');
              }
            }
          } catch (error) {
            console.log('⚠️ LocationProvider: Error parsing saved location, clearing...');
            localStorage.removeItem('userLocation');
          }
        }
      }

      // Get fresh location using enhanced detection
      console.log('🔍 LocationProvider: Getting fresh location...');
      const detectedLocation = await getUserLocation();
      
      if (detectedLocation) {
        const newLocation = {
          latitude: detectedLocation.latitude,
          longitude: detectedLocation.longitude,
          city: detectedLocation.city,
          region: detectedLocation.region,
          country: detectedLocation.country,
          isLoading: false,
          error: null
        };

        console.log('✅ LocationProvider: Location detected successfully:', newLocation);
        
        // Save to localStorage
        localStorage.setItem('userLocation', JSON.stringify(newLocation));
        
        // Update state
        setLocation(newLocation);
      } else {
        throw new Error('Unable to detect location');
      }
    } catch (error) {
      console.error('❌ LocationProvider: Location detection failed:', error);
      
      const errorLocation = {
        latitude: null,
        longitude: null,
        city: null,
        region: null,
        country: null,
        isLoading: false,
        error: error.message
      };
      
      setLocation(errorLocation);
    }
  };

  // Function to manually set location
  const setManualLocation = (newLocation) => {
    console.log('📍 LocationProvider: Setting manual location:', newLocation);
    
    const manualLocation = {
      latitude: newLocation.latitude,
      longitude: newLocation.longitude,
      city: newLocation.city,
      region: newLocation.region,
      country: newLocation.country,
      isLoading: false,
      error: null
    };

    // Save to localStorage
    localStorage.setItem('userLocation', JSON.stringify(manualLocation));
    
    // Update state
    setLocation(manualLocation);
    setIsManualOverride(true);
  };

  // Function to clear location and re-detect
  const refreshLocation = () => {
    console.log('🔄 LocationProvider: Refreshing location...');
    localStorage.removeItem('userLocation');
    setIsManualOverride(false);
    detectLocation(true);
  };

  // Function to get current location for API calls
  const getCurrentLocation = () => {
    return {
      latitude: location.latitude,
      longitude: location.longitude,
      city: location.city,
      region: location.region,
      country: location.country
    };
  };

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  // Context value
  const contextValue = {
    // Location data
    location: getCurrentLocation(),
    
    // State flags
    isLoading: location.isLoading,
    error: location.error,
    isManualOverride,
    
    // Actions
    detectLocation,
    setManualLocation,
    refreshLocation,
    
    // Convenience getters
    hasLocation: !!(location.latitude && location.longitude),
    displayName: location.city && location.region && location.country 
      ? `${location.city}, ${location.region}, ${location.country}`
      : 'Unknown Location'
  };

  return (
    <LocationContext.Provider value={contextValue}>
      {children}
    </LocationContext.Provider>
  );
}
