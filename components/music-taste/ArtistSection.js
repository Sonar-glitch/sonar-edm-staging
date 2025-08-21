import React from 'react';
import ArtistCard from '../ArtistCard';

const ArtistSection = ({ artists = [] }) => {
  if (!artists || artists.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="section-title">Your Top Artists</h2>
        <p>No artist data available.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="section-title">Your Top Artists</h2>
      <div className="grid-layout">
        {artists.map((artist, index) => (
          <ArtistCard key={artist.id || index} artist={artist} />
        ))}
      </div>
    </div>
  );
};

export default ArtistSection;
