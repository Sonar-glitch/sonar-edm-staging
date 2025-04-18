import React from 'react';
import styles from '../styles/ArtistCard.module.css';

const ArtistCard = ({ artist, correlation, similarArtists }) => {
  // Error handling: Check if artist is valid
  if (!artist || typeof artist !== 'object') {
    return (
      <div className={styles.artistCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display artist information. Invalid artist data.</p>
        </div>
      </div>
    );
  }

  // Ensure correlation is a valid number
  const validCorrelation = typeof correlation === 'number' && !isNaN(correlation) ? correlation : 0;
  const correlationPercent = Math.round(validCorrelation * 100);
  
  // Validate similarArtists array
  const validSimilarArtists = Array.isArray(similarArtists) ? similarArtists : [];
  
  // Ensure popularity is a valid number
  const popularity = typeof artist.popularity === 'number' && !isNaN(artist.popularity) ? artist.popularity : 50;
  
  // Get artist image with fallbacks
  const getArtistImage = () => {
    // Check for Spotify-style images array
    if (artist.images && artist.images.length > 0) {
      return artist.images[0].url;
    }
    
    // Check for direct image property
    if (artist.image) {
      return artist.image;
    }
    
    // No image available
    return null;
  };
  
  const artistImage = getArtistImage();
  
  // Extract genres with fallbacks
  const genres = Array.isArray(artist.genres) ? artist.genres : [];
  
  return (
    <div className={styles.artistCard}>
      <div className={styles.artistHeader}>
        <div className={styles.artistImageContainer}>
          {artistImage ? (
            <div 
              className={styles.artistImage}
              style={{ backgroundImage: `url(${artistImage})` }}
            />
          ) : (
            <div className={styles.artistImagePlaceholder}>
              <span>{artist.name ? artist.name.charAt(0) : '?'}</span>
            </div>
          )}
        </div>
        
        <div className={styles.artistNameContainer}>
          <h3 className={styles.artistName}>{artist.name || 'Unknown Artist'}</h3>
          
          <div className={styles.genreTags}>
            {genres.slice(0, 3).map((genre, index) => (
              <span key={index} className={styles.genreTag}>{genre}</span>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.artistMetrics}>
        <div className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Popularity</span>
            <span className={styles.metricValue}>{popularity}%</span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill} 
              style={{ width: `${popularity}%` }}
            ></div>
          </div>
        </div>
        
        <div className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Taste Match</span>
            <span className={styles.metricValue}>{correlationPercent}%</span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill} 
              style={{ width: `${correlationPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {validSimilarArtists.length > 0 && (
        <div className={styles.similarArtistsSection}>
          <h4 className={styles.similarArtistsTitle}>Similar Artists</h4>
          <div className={styles.similarArtistsList}>
            {validSimilarArtists.slice(0, 3).map((similar, index) => (
              <div key={index} className={styles.similarArtist}>
                {similar.image ? (
                  <div 
                    className={styles.similarArtistImage}
                    style={{ backgroundImage: `url(${similar.image})` }}
                  />
                ) : (
                  <div className={styles.similarArtistImagePlaceholder}>
                    <span>{similar.name ? similar.name.charAt(0) : '?'}</span>
                  </div>
                )}
                <span className={styles.similarArtistName}>{similar.name || 'Unknown Artist'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistCard;
