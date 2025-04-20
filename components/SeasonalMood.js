
import React from 'react';

export default function SeasonalMood({ mood }) {
  return (
    <div className="seasonalMoodBanner">
      <h2>Your Current Vibe: {mood}</h2>
    </div>
  );
}
