// /c/sonar/users/sonar-edm-user/components/music-taste/TracksTab.js
import React from 'react';
import SpotifyImage from '../common/SpotifyImage';

const TracksTab = ({ userProfile }) => {
  if (!userProfile) return null;
  
  const topTracks = userProfile.topTracks || [];
  
  return (
    <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
      <h2 className="text-xl text-cyan-500 font-semibold mb-6">Your Top Tracks</h2>
      
      <div className="space-y-4">
        {topTracks.map((track, index) => (
          <div key={index} className="flex items-center p-3 bg-black/30 rounded-lg">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500 flex items-center justify-center mr-4 flex-shrink-0">
              <span className="text-lg font-bold">{index + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{track.name}</h4>
              <p className="text-sm text-gray-400 truncate">{track.artist}</p>
            </div>
            <div className="text-right ml-4">
              <span className="text-cyan-400 font-medium">{track.plays} plays</span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 bg-black/30 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Track Analysis</h3>
        <p className="text-sm text-gray-300">
          Your top tracks show a strong preference for melodic elements and progressive structures.
          Most of your favorites have extended runtime (6+ minutes) with layered arrangements and 
          gradual progression.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-xl font-bold text-cyan-400">82%</div>
            <div className="text-xs text-gray-400">of your top tracks are melodic</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-cyan-400">7:24</div>
            <div className="text-xs text-gray-400">average track length</div>
          </div>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Recently Played</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {topTracks.slice(0, 2).map((track, index) => (
            <div key={`recent-${index}`} className="bg-black/30 p-3 rounded-lg flex items-center">
              <div className="w-12 h-12 mr-3 flex-shrink-0">
                <div className="w-full h-full rounded bg-gradient-to-r from-cyan-900 to-fuchsia-900 flex items-center justify-center">
                  <span>♪</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm truncate">{track.name}</h4>
                <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                <div className="mt-1">
                  <button className="text-xs text-cyan-400">Preview →</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TracksTab;
