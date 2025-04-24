// /c/sonar/users/sonar-edm-user/components/music-taste/ArtistsTab.js
import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from 'recharts';
import SpotifyImage from '../common/SpotifyImage';

const ArtistsTab = ({ userProfile }) => {
  if (!userProfile) return null;
  
  // Prepare artist data for bar chart
  const prepareArtistData = () => {
    if (!userProfile?.artistProfile) return [];
    return userProfile.artistProfile.slice(0, 5);
  };
  
  const artistData = prepareArtistData();
  
  // Get featured artist (first in the list)
  const featuredArtist = artistData.length > 0 ? artistData[0] : null;
  
  return (
    <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
      <h2 className="text-xl text-cyan-500 font-semibold mb-6">Your Top Artists</h2>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={artistData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
            <XAxis type="number" domain={[0, 'dataMax + 5']} />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip 
              content={({ payload }) => {
                if (payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-gray-900 p-2 rounded border border-cyan-500/30">
                      <p className="font-medium">{data.name}</p>
                      <p className="text-sm text-cyan-400">{data.plays} plays</p>
                      <p className="text-sm text-gray-400">{data.genre}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="plays" fill="#00e5ff" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {featuredArtist && (
        <div className="mt-8">
          <h3 className="text-lg font-medium mb-4">Artist Spotlight</h3>
          <div className="bg-black/30 p-4 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 flex items-center justify-center mr-4">
                <span className="text-xl font-bold">{featuredArtist.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
              <div>
                <h4 className="text-xl font-medium">{featuredArtist.name}</h4>
                <p className="text-sm text-gray-400">{featuredArtist.genre} • {featuredArtist.plays} plays</p>
              </div>
            </div>
            <p className="text-sm text-gray-300">
              You've been listening to {featuredArtist.name} consistently over the last 3 months.
              Their music features strongly in your {featuredArtist.genre} preferences.
            </p>
            <div className="mt-3">
              <button className="text-cyan-400 text-sm font-medium">Find events with {featuredArtist.name} →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistsTab;
