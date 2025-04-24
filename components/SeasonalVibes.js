// /c/sonar/users/sonar-edm-user/components/SeasonalVibes.js
import React from 'react';

const SeasonalVibes = ({ seasonalData }) => {
  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };
  
  const currentSeason = getCurrentSeason();
  
  // If no data, show placeholder
  if (!seasonalData) {
    return (
      <div className="bg-black/20 p-6 rounded-xl border border-fuchsia-500/20">
        <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Seasonal Vibes</h2>
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-400">No seasonal data available</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-black/20 p-6 rounded-xl border border-fuchsia-500/20">
      <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Seasonal Vibes</h2>
      
      {/* Year-Round Signature */}
      <div className="mb-6 p-4 bg-black/30 rounded-lg border-l-2 border-cyan-500">
        <div className="flex items-center mb-2">
          <span className="mr-2 text-xl">✨</span>
          <span className="text-cyan-400 font-medium">Your Year-Round Vibes</span>
        </div>
        <p className="text-white/90 text-sm">
          Your taste evolves from <span className="text-cyan-400 font-medium">deep house vibes</span> in winter 
          to <span className="text-cyan-400 font-medium">high-energy techno</span> in summer, with a consistent 
          appreciation for <span className="text-teal-400 font-medium">melodic elements</span> year-round.
        </p>
      </div>
      
      {/* Seasonal Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {Object.entries(seasonalData).map(([season, data]) => (
          <div 
            key={season}
            className={`p-3 rounded-lg ${season === currentSeason 
              ? 'bg-black/40 border border-cyan-500/50 shadow-lg shadow-cyan-900/20' 
              : 'bg-black/20 border border-white/10'}`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <span className="mr-2 text-xl">{data.emoji}</span>
                <span className="font-medium">{data.title}</span>
              </div>
              {season === currentSeason && (
                <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">Now</span>
              )}
            </div>
            
            <div className="mb-1">
              <span className="text-xs text-white/60 mr-1">Vibe:</span>
              <span className="text-sm">{data.genres}</span>
            </div>
            
            <div className="text-xs text-white/70 italic">
              {data.message}
            </div>
          </div>
        ))}
      </div>
      
      {/* Feedback section */}
      <div className="flex items-center justify-center mt-4 pt-3 border-t border-white/10">
        <span className="text-sm text-white/70 mr-2">Did we get it right?</span>
        <button className="text-cyan-400 font-bold hover:text-cyan-300 transition">
          No
        </button>
      </div>
    </div>
  );
};

export default SeasonalVibes;
