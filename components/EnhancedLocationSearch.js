import React, { useState } from 'react';

/**
 * Placeholder EnhancedLocationSearch component
 * TODO: Implement full location search functionality for Step 2
 */
export default function EnhancedLocationSearch({ initialLocation, onLocationChange }) {
  const [currentLocation] = useState(initialLocation || {
    city: 'Toronto',
    stateCode: 'ON',
    countryCode: 'CA',
    lat: 43.653226,
    lon: -79.383184,
    formattedAddress: 'Toronto, ON, Canada'
  });

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
        <span>{currentLocation.formattedAddress}</span>
        <button 
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
      <div style={{ 
        fontSize: '0.8rem', 
        color: '#888', 
        marginTop: '0.5rem' 
      }}>
        Step 2: Location search functionality coming soon
      </div>
    </div>
  );
}
