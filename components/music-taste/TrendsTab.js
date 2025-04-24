// /c/sonar/users/sonar-edm-user/components/music-taste/TrendsTab.js
import React from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

const TrendsTab = ({ userProfile }) => {
  if (!userProfile) return null;
  
  // Get listening trends data
  const listeningTrends = userProfile.listeningTrends || [];
  
  return (
    <div className="space-y-8">
      {/* Listening Trends Chart */}
      <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Listening Trends</h2>
        <p className="text-sm text-gray-300 mb-6">
          See how your genre preferences have evolved over the past 6 months.
        </p>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={listeningTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
              />
              <YAxis 
                tick={{ fill: 'rgba(255, 255, 255, 0.7)' }}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                  border: '1px solid #00e5ff',
                  borderRadius: '4px',
                  color: 'white'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="house" 
                stroke="#00e5ff" 
                strokeWidth={2}
                dot={{ fill: '#00e5ff', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="techno" 
                stroke="#ff00ff" 
                strokeWidth={2}
                dot={{ fill: '#ff00ff', r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="trance" 
                stroke="#1de9b6" 
                strokeWidth={2}
                dot={{ fill: '#1de9b6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Listening Insights */}
      <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-xl text-cyan-500 font-semibold mb-4">Listening Insights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-black/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Genre Exploration</h3>
            <p className="text-sm text-gray-300">
              You've been exploring more techno tracks recently, with a 15% increase in the last 3 months.
              Your house music listening has remained consistent, while trance has seen a gradual increase.
            </p>
            <div className="mt-3 flex items-center">
              <div className="w-2 h-2 rounded-full bg-cyan-400 mr-2"></div>
              <span className="text-xs text-gray-400">Trending: Melodic Techno</span>
            </div>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Listening Patterns</h3>
            <p className="text-sm text-gray-300">
              Your peak listening hours are between 6-9pm on weekdays and 2-5pm on weekends.
              You tend to listen to more energetic tracks during the day and more melodic tracks in the evening.
            </p>
            <div className="mt-3 flex items-center">
              <div className="w-2 h-2 rounded-full bg-fuchsia-400 mr-2"></div>
              <span className="text-xs text-gray-400">Most active: Thursday evenings</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recommendations Based on Trends */}
      <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
        <h2 className="text-xl text-cyan-500 font-semibold mb-4">Based on Your Trends</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-black/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Artists to Discover</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-900 to-fuchsia-900 flex items-center justify-center mr-3">
                  <span className="text-xs">1</span>
                </div>
                <span>Stephan Bodzin</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-900 to-fuchsia-900 flex items-center justify-center mr-3">
                  <span className="text-xs">2</span>
                </div>
                <span>Adriatique</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-cyan-900 to-fuchsia-900 flex items-center justify-center mr-3">
                  <span className="text-xs">3</span>
                </div>
                <span>Joris Voorn</span>
              </li>
            </ul>
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg">
            <h3 className="font-medium mb-2">Playlists for You</h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <div className="w-8 h-8 rounded bg-gradient-to-r from-cyan-900 to-fuchsia-900 flex items-center justify-center mr-3">
                  <span className="text-xs">♪</span>
                </div>
                <span>Melodic Techno Essentials</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded bg-gradient-to-r from-cyan-900 to-fuchsia-900 flex items-center justify-center mr-3">
                  <span className="text-xs">♪</span>
                </div>
                <span>Progressive House Journey</span>
              </li>
              <li className="flex items-center">
                <div className="w-8 h-8 rounded bg-gradient-to-r from-cyan-900 to-fuchsia-900 flex items-center justify-center mr-3">
                  <span className="text-xs">♪</span>
                </div>
                <span>Deep Trance Selections</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrendsTab;
