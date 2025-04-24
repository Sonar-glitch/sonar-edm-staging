// /c/sonar/users/sonar-edm-user/components/music-taste/OverviewTab.js
import React from 'react';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip 
} from 'recharts';

const OverviewTab = ({ userProfile }) => {
  if (!userProfile) return null;
  
  // Prepare radar chart data
  const prepareGenreData = () => {
    if (!userProfile?.genreProfile) return [];
    
    return Object.entries(userProfile.genreProfile).map(([name, value]) => ({
      genre: name,
      value
    }));
  };
  
  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };
  
  const genreData = prepareGenreData();
  const currentSeason = getCurrentSeason();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Sonic Vibe Radar Chart */}
      <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Sonic Vibe</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart outerRadius="80%" data={genreData}>
              <PolarGrid stroke="rgba(0, 255, 255, 0.1)" />
              <PolarAngleAxis 
                dataKey="genre" 
                tick={{ fill: '#00e5ff', fontSize: 12 }} 
              />
              <PolarRadiusAxis 
                angle={90} 
                domain={[0, 100]} 
                tick={{ fill: 'rgba(255, 255, 255, 0.15)', fontSize: 8 }}
                tickCount={4}
                axisLine={false}
                tickFormatter={(value) => ``} // Hide the number labels
              />
              <Radar 
                name="Genre Score" 
                dataKey="value" 
                stroke="#00e5ff" 
                fill="#00e5ff" 
                fillOpacity={0.3} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: '1px solid #00e5ff',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Mood Analysis */}
      <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Mood Preferences</h2>
        <div className="space-y-4">
          {userProfile && userProfile.mood && Object.entries(userProfile.mood).map(([mood, value]) => (
            <div key={mood} className="space-y-1">
              <div className="flex justify-between">
                <span className="capitalize text-sm">{mood}</span>
                <span className="text-sm text-cyan-400">{value}%</span>
              </div>
              <div className="w-full h-2 bg-gray-800 rounded-full">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-500" 
                  style={{ width: `${value}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Seasonal Preferences */}
      <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20 lg:col-span-2">
        <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Seasonal Vibe Shifts</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {userProfile && userProfile.seasonalProfile && Object.entries(userProfile.seasonalProfile).map(([season, genres]) => (
            <div 
              key={season} 
              className={`p-4 rounded-lg ${season === currentSeason ? 'bg-black/40 border border-cyan-500/50' : 'bg-black/20 border border-white/10'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="capitalize font-medium">{season}</span>
                {season === currentSeason && (
                  <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded-full">Now</span>
                )}
              </div>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {genres.map((genre, index) => (
                  <li key={index} className="text-gray-300">{genre}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OverviewTab;
