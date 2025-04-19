// Updated SeasonalMoodCard.js with better error handling
import React from 'react';

const SeasonalMoodCard = ({ seasonalMood }) => {
  if (!seasonalMood) return null;
  
  const { currentSeason = {}, previousSeason = {}, seasonalShift = {} } = seasonalMood;
  
  // Ensure all required properties exist with defaults
  const safeCurrentSeason = {
    name: currentSeason.name || 'Current Season',
    topGenres: Array.isArray(currentSeason.topGenres) ? currentSeason.topGenres : [],
    mood: currentSeason.mood || 'Unknown',
    energy: currentSeason.energy || 50
  };
  
  const safePreviousSeason = {
    name: previousSeason.name || 'Previous Season',
    topGenres: Array.isArray(previousSeason.topGenres) ? previousSeason.topGenres : []
  };
  
  const safeSeasonalShift = {
    intensity: seasonalShift.intensity || 0,
    changes: Array.isArray(seasonalShift.changes) ? seasonalShift.changes : []
  };
  
  return (
    <div style={{
      backgroundColor: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      padding: '20px',
      margin: '20px 0',
      boxShadow: '0 0 15px rgba(0, 255, 255, 0.2)'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ 
          fontSize: '1.5rem', 
          color: '#00ffff',
          marginBottom: '10px',
          textShadow: '0 0 5px rgba(0, 255, 255, 0.5)'
        }}>
          {safeCurrentSeason.name} Mood
        </h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' }}>
          {safeCurrentSeason.topGenres.map((genre, index) => (
            <span key={index} style={{
              backgroundColor: 'rgba(0, 255, 255, 0.1)',
              color: '#00ffff',
              padding: '5px 10px',
              borderRadius: '20px',
              fontSize: '0.9rem',
              border: '1px solid rgba(0, 255, 255, 0.3)'
            }}>
              {genre}
            </span>
          ))}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ marginRight: '10px' }}>Mood: {safeCurrentSeason.mood}</span>
          <span>Energy: {safeCurrentSeason.energy}%</span>
        </div>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <h4 style={{ 
          fontSize: '1.2rem', 
          color: '#ff00ff',
          marginBottom: '10px',
          textShadow: '0 0 5px rgba(255, 0, 255, 0.5)'
        }}>
          Seasonal Shift from {safePreviousSeason.name}
        </h4>
        
        <div style={{ marginBottom: '10px' }}>
          <div style={{ marginBottom: '5px' }}>Intensity: {safeSeasonalShift.intensity}%</div>
          <div style={{ 
            width: '100%', 
            height: '8px', 
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            overflow: 'hidden'
          }}>
            <div style={{ 
              width: `${safeSeasonalShift.intensity}%`, 
              height: '100%', 
              background: 'linear-gradient(to right, #00ffff, #ff00ff)',
              borderRadius: '4px'
            }} />
          </div>
        </div>
        
        {safeSeasonalShift.changes.length > 0 && (
          <div>
            <h5 style={{ marginBottom: '5px', color: '#ff00ff' }}>Notable Changes:</h5>
            <ul style={{ paddingLeft: '20px' }}>
              {safeSeasonalShift.changes.map((change, index) => (
                <li key={index} style={{ marginBottom: '5px' }}>{change}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
