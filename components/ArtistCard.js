import React from 'react';

const ArtistCard = ({ artist }) => {
  if (!artist) return null;
  
  const name = artist.name || 'Unknown Artist';
  const imageUrl = artist.images && artist.images[0] ? artist.images[0].url : 'https://via.placeholder.com/300?text=No+Image';
  const genres = artist.genres || [];
  const popularity = artist.popularity || 0;
  const spotifyUrl = artist.external_urls && artist.external_urls.spotify ? artist.external_urls.spotify : '#';
  
  return (
    <div className="artist-card">
      <div className="relative overflow-hidden h-48">
        <img 
          src={imageUrl} 
          alt={name} 
          className="card-image"
          loading="lazy"
          onError={(e) => {e.target.src = 'https://via.placeholder.com/300?text=No+Image'}}
        />
      </div>
      <div className="card-body">
        <h3 className="card-title">{name}</h3>
        {genres.length > 0 && (
          <div className="flex flex-wrap mb-2">
            {genres.slice(0, 2).map((genre, i) => (
              <span key={i} className="badge-primary">
                {genre}
              </span>
            ))}
          </div>
        )}
        <p className="text-sm mb-3">Popularity: {popularity}/100</p>
        <a 
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary"
        >
          View on Spotify
        </a>
      </div>
    </div>
  );
};

export default ArtistCard;
