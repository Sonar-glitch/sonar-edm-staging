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
        
        // First try to get from localStorage
        if (typeof window !== 'undefined') {
          const savedLocation = localStorage.getItem('userLocation');
          if (savedLocation) {
            try {
              const parsedLocation = JSON.parse(savedLocation);
              setLocation(parsedLocation);
              setLoading(false);
              return;
            } catch (e) {
              console.error('Error parsing saved location:', e);
            }
          }
        }
        
        // Then try browser geolocation
        try {
          const browserLocation = await getUserLocationFromBrowser();
          setLocation(browserLocation);
          
          // Store location in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('userLocation', JSON.stringify(browserLocation));
          }
          
          // Also send to server for API calls
          try {
            await fetch('/api/user/set-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(browserLocation)
            });
          } catch (e) {
            console.error('Error sending location to server:', e);
          }
          
          setLoading(false);
          return;
        } catch (browserError) {
          console.log('Browser geolocation failed, trying IP fallback');
        }
        
        // Try IP-based geolocation as fallback
        const ipLocation = await getUserLocationFromIP();
        
        if (ipLocation) {
          setLocation(ipLocation);
          
          // Store location in localStorage for persistence
          if (typeof window !== 'undefined') {
            localStorage.setItem('userLocation', JSON.stringify(ipLocation));
          }
          
          // Also send to server for API calls
          try {
            await fetch('/api/user/set-location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(ipLocation)
            });
          } catch (e) {
            console.error('Error sending location to server:', e);
          }
        } else {
          throw new Error('Could not detect location');
        }
      } catch (err) {
        console.error('Location detection error:', err);
        setError(err.message);
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
