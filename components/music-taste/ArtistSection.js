import React from 'react';
import ArtistCard from '../ArtistCard';
import ErrorBoundary from '../common/ErrorBoundary';

const ArtistSection = ({ artists = [] }) => {
  // Ensure artists is always an array
  const safeArtists = Array.isArray(artists) ? artists : [];
  
  if (safeArtists.length === 0) {
    return (
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">
          Your Top Artists
        </h2>
        <p>No artist data available.</p>
      </div>
    );
  }
  
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">
        Your Top Artists
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {safeArtists.map((artist, index) => (
          <ErrorBoundary key={artist.id || index}>
            <ArtistCard artist={artist} />
          </ErrorBoundary>
        ))}
      </div>
    </div>
  );
};

export default ArtistSection;
