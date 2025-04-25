import React, { createContext, useState, useEffect, useContext } from 'react';
import { getUserLocationFromBrowser, getUserLocationFromIP } from '@/lib/locationUtils';

// Create location context
export const LocationContext = createContext();

export function LocationProvider({ children }) {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function detectLocation() {
      try {
        setLoading(true);
        
        // First try browser geolocation
        try {
          const browserLocation = await getUserLocationFromBrowser();
          setLocation(browserLocation);
          setLoading(false);
          
          // Store location in localStorage for persistence
          localStorage.setItem('userLocation', JSON.stringify(browserLocation));
          
          // Also send to server for API calls
          await fetch('/api/user/set-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(browserLocation)
          });
          
          return;
        } catch (browserError) {
          console.log('Browser geolocation failed, trying IP fallback');
        }
        
        // Try IP-based geolocation as fallback
        const ipLocation = await getUserLocationFromIP();
        
        if (ipLocation) {
          setLocation(ipLocation);
          
          // Store location in localStorage for persistence
          localStorage.setItem('userLocation', JSON.stringify(ipLocation));
          
          // Also send to server for API calls
          await fetch('/api/user/set-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ipLocation)
          });
        } else {
          throw new Error('Could not detect location');
        }
      } catch (err) {
        console.error('Location detection error:', err);
        setError(err.message);
        
        // Try to get from localStorage as last resort
        const savedLocation = localStorage.getItem('userLocation');
        if (savedLocation) {
          try {
            setLocation(JSON.parse(savedLocation));
          } catch (e) {
            console.error('Error parsing saved location:', e);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    
    detectLocation();
  }, []);

  return (
    <LocationContext.Provider value={{ location, loading, error, setLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

// Custom hook to use location context
export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}

export default LocationProvider;
