import { useState, useEffect } from 'react';
import styles from '../styles/Dashboard.module.css';

const LocationDisplay = ({ onLocationChange }) => {
  const [location, setLocation] = useState({
    city: '',
    region: '',
    country: '',
    lat: null,
    lon: null,
    isLoading: true,
    error: null
  });
  
  const [isChangingLocation, setIsChangingLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState('');
  
  // Predefined locations
  const predefinedLocations = [
    { name: 'Toronto, ON, Canada', lat: 43.65, lon: -79.38 },
    { name: 'Montreal, QC, Canada', lat: 45.50, lon: -73.57 },
    { name: 'Vancouver, BC, Canada', lat: 49.28, lon: -123.12 },
    { name: 'New York, NY, USA', lat: 40.71, lon: -74.01 },
    { name: 'Los Angeles, CA, USA', lat: 34.05, lon: -118.24 }
  ];
  
  useEffect(() => {
    // Try to get location from localStorage first
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation);
        setLocation({
          ...parsedLocation,
          isLoading: false,
          error: null
        });
        
        // Notify parent component
        if (onLocationChange && parsedLocation.lat && parsedLocation.lon) {
          onLocationChange({
            lat: parsedLocation.lat,
            lon: parsedLocation.lon,
            city: parsedLocation.city
          });
        }
        return;
      } catch (e) {
        console.error("Error parsing saved location:", e);
        // Continue with geolocation if parsing fails
      }
    }
    
    // Default to Toronto if geolocation fails or is not available
    const defaultToToronto = () => {
      const toronto = {
        city: 'Toronto',
        region: 'ON',
        country: 'Canada',
        lat: 43.65,
        lon: -79.38,
        isLoading: false,
        error: null
      };
      
      setLocation(toronto);
      localStorage.setItem('userLocation', JSON.stringify(toronto));
      
      // Notify parent component
      if (onLocationChange) {
        onLocationChange({
          lat: toronto.lat,
          lon: toronto.lon,
          city: toronto.city
        });
      }
    };
    
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Use reverse geocoding to get city name
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}&zoom=10`
            );
            
            if (!response.ok) {
              throw new Error('Geocoding failed');
            }
            
            const data = await response.json();
            
            // Extract location information
            const locationData = {
              city: data.address.city || data.address.town || data.address.village || 'Unknown',
              region: data.address.state || data.address.county || '',
              country: data.address.country || '',
              lat: position.coords.latitude,
              lon: position.coords.longitude,
              isLoading: false,
              error: null
            };
            
            setLocation(locationData);
            localStorage.setItem('userLocation', JSON.stringify(locationData));
            
            // Notify parent component
            if (onLocationChange) {
              onLocationChange({
                lat: locationData.lat,
                lon: locationData.lon,
                city: locationData.city
              });
            }
          } catch (error) {
            console.error("Error getting location details:", error);
            defaultToToronto();
          }
        },
        (error) => {
          console.error("Geolocation error:", error);
          defaultToToronto();
        },
        { timeout: 10000 }
      );
    } else {
      // Geolocation not supported
      console.log("Geolocation not supported");
      defaultToToronto();
    }
  }, [onLocationChange]);
  
  const handleChangeClick = () => {
    setIsChangingLocation(true);
  };
  
  const handleLocationSelect = (selectedLocation) => {
    // Update location
    const newLocation = {
      city: selectedLocation.name.split(',')[0],
      region: selectedLocation.name.split(',')[1]?.trim() || '',
      country: selectedLocation.name.split(',')[2]?.trim() || '',
      lat: selectedLocation.lat,
      lon: selectedLocation.lon,
      isLoading: false,
      error: null
    };
    
    setLocation(newLocation);
    localStorage.setItem('userLocation', JSON.stringify(newLocation));
    setIsChangingLocation(false);
    
    // Notify parent component
    if (onLocationChange) {
      onLocationChange({
        lat: newLocation.lat,
        lon: newLocation.lon,
        city: newLocation.city
      });
    }
  };
  
  const handleCustomLocationSubmit = async () => {
    if (!customLocation.trim()) return;
    
    try {
      // Use geocoding to get coordinates
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customLocation)}`
      );
      
      if (!response.ok) {
        throw new Error('Geocoding failed');
      }
      
      const data = await response.json();
      
      if (data.length === 0) {
        alert('Location not found. Please try a different location.');
        return;
      }
      
      // Use the first result
      const result = data[0];
      
      // Extract location information
      const locationData = {
        city: customLocation.split(',')[0] || 'Unknown',
        region: customLocation.split(',')[1]?.trim() || '',
        country: customLocation.split(',')[2]?.trim() || '',
        lat: parseFloat(result.lat),
        lon: parseFloat(result.lon),
        isLoading: false,
        error: null
      };
      
      setLocation(locationData);
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      setIsChangingLocation(false);
      setCustomLocation('');
      
      // Notify parent component
      if (onLocationChange) {
        onLocationChange({
          lat: locationData.lat,
          lon: locationData.lon,
          city: locationData.city
        });
      }
    } catch (error) {
      console.error("Error geocoding custom location:", error);
      alert('Error finding location. Please try again.');
    }
  };
  
  if (location.isLoading) {
    return <div className={styles.locationDisplay}>Loading location...</div>;
  }
  
  if (location.error) {
    return (
      <div className={styles.locationDisplay}>
        <span>Location error. Using default.</span>
        <button onClick={handleChangeClick}>Change</button>
      </div>
    );
  }
  
  return (
    <div className={styles.locationDisplayContainer}>
      {!isChangingLocation ? (
        <div className={styles.locationDisplay}>
          <span className={styles.locationIcon}>📍</span>
          <span className={styles.locationText}>
            {location.city}{location.region ? `, ${location.region}` : ''}{location.country ? `, ${location.country}` : ''}
          </span>
          <button className={styles.changeButton} onClick={handleChangeClick}>Change</button>
        </div>
      ) : (
        <div className={styles.locationSelector}>
          <div className={styles.predefinedLocations}>
            <h4>Select a location:</h4>
            <div className={styles.locationButtons}>
              {predefinedLocations.map((loc) => (
                <button
                  key={loc.name}
                  className={styles.locationButton}
                  onClick={() => handleLocationSelect(loc)}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.customLocation}>
            <h4>Or enter a custom location:</h4>
            <div className={styles.customLocationInput}>
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder="City, Region, Country"
              />
              <button onClick={handleCustomLocationSubmit}>Set Location</button>
            </div>
          </div>
          <button 
            className={styles.cancelButton}
            onClick={() => setIsChangingLocation(false)}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default LocationDisplay;
