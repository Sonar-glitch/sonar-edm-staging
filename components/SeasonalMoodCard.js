import React from 'react';

const SeasonalMoodCard = ({ seasonalMood }) => {
  if (!seasonalMood) return null;
  
  // Add defensive error handling
  const currentSeason = seasonalMood.currentSeason || {};
  const previousSeason = seasonalMood.previousSeason || {};
  const seasonalShift = seasonalMood.seasonalShift || {};
  
  // Use original component structure and styling
  return (
    <div className="seasonal-mood-card">
      <h3 className="spring Mood">
        {currentSeason.name || 'Current Season'} Mood
      </h3>
      
      <div className="genre-tags">
        {Array.isArray(currentSeason.topGenres) ? 
          currentSeason.topGenres.map((genre, index) => (
            <span key={index} className="genre-tag">{genre}</span>
          )) : null}
      </div>
      
      <div>
        Mood: {currentSeason.mood || 'Unknown'}, Energy: {currentSeason.energy || 0}%
      </div>
      
      <h4>Seasonal Shift from {previousSeason.name || 'Previous Season'}</h4>
      
      <div>
        Intensity: {seasonalShift.intensity || 0}%
      </div>
      
      {Array.isArray(seasonalShift.changes) && seasonalShift.changes.length > 0 ? (
        <div>
          <h5>Notable Changes:</h5>
          <ul>
            {seasonalShift.changes.map((change, index) => (
              <li key={index}>{change}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
};

export default SeasonalMoodCard;
