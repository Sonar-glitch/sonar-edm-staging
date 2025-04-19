import React from 'react';

const ArtistCard = ({ artist }) => {
  if (!artist) return null;
  
  const name = artist.name || 'Unknown Artist';
  const imageUrl = artist.images && artist.images[0] ? artist.images[0].url : 'https://via.placeholder.com/300?text=No+Image';
  const genres = artist.genres || [];
  const popularity = artist.popularity || 0;
  const spotifyUrl = artist.external_urls && artist.external_urls.spotify ? artist.external_urls.spotify : '#';
  
  return (
    <div className="bg-gray-800 bg-opacity-30 rounded-lg overflow-hidden">
      <div className="h-40 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {e.target.src = 'https://via.placeholder.com/300?text=No+Image'}}
        />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 truncate">{name}</h3>
        {genres.length > 0 && (
          <div className="flex flex-wrap mb-2">
            {genres.slice(0, 2).map((genre, i) => (
              <span key={i} className="bg-blue-600 text-xs px-2 py-1 rounded-full mr-1 mb-1">{genre}</span>
            ))}
          </div>
        )}
        <p className="text-sm mb-3">Popularity: {popularity}/100</p>
        <a 
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 text-sm font-bold"
        >
          View on Spotify
        </a>
      </div>
    </div>
  );
};

export default ArtistCard;
