import React from 'react';
import ArtistCard from '../ArtistCard';

const ArtistSection = ({ artists = [] }) => {
  if (!artists || artists.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Top Artists</h2>
        <p>No artist data available.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">Your Top Artists</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {artists.map((artist, index) => (
          <ArtistCard key={artist.id || index} artist={artist} />
        ))}
      </div>
    </div>
  );
};

export default ArtistSection;
