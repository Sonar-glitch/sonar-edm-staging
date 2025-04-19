import React from 'react';
import Image from 'next/image';

const ArtistCard = ({ artist }) => {
  if (!artist) return null;
  
  // Default image if none provided
  const imageUrl = artist.image || 'https://via.placeholder.com/300';
  
  // Blur placeholder for progressive loading
  const blurDataURL = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdwI2QOQvhwAAAABJRU5ErkJggg==";
  
  return (
    <div className="artist-card">
      <div className="artist-image-container">
        <Image 
          src={imageUrl}
          alt={artist.name || 'Artist'}
          width={300}
          height={300}
          layout="responsive"
          loading="lazy"
          placeholder="blur"
          blurDataURL={blurDataURL}
          className="artist-image"
        />
      </div>
      
      <div className="artist-info">
        <h3 className="artist-name">{artist.name}</h3>
        {artist.genres && artist.genres.length > 0 && (
          <div className="artist-genres">
            {artist.genres.map((genre, index)  => (
              <span key={index} className="genre-tag">{genre}</span>
            ))}
          </div>
        )}
        <div className="artist-popularity">
          Popularity: {artist.popularity || 'N/A'}
        </div>
        {artist.spotifyUrl && (
          <a 
            href={artist.spotifyUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="spotify-link"
          >
            View on Spotify
          </a>
        )}
      </div>
    </div>
  );
};

export default ArtistCard;
