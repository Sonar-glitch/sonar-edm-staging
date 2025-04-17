import React from 'react';
import styles from '../styles/ArtistCard.module.css';

const ArtistCard = ({ artist, correlation, similarArtists }) => {
  // Error handling: Check if artist is valid
  if (!artist || typeof artist !== 'object') {
    return (
      <div className={styles.artistCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display artist information</p>
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
  
  // Calculate obscurity level (inverse of popularity)
  const obscurityLevel = 100 - popularity;
  
  // Get first letter of artist name for placeholder
  const firstLetter = artist.name ? artist.name.charAt(0).toUpperCase() : '?';
  
  return (
    <div className={styles.artistCard}>
      <div className={styles.artistInitial}>
        {firstLetter}
      </div>
      
      <div className={styles.artistInfo}>
        <h3 className={styles.artistName}>{artist.name || 'Unknown Artist'}</h3>
        
        <div className={styles.artistMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Popularity</span>
            <div className={styles.popularityBar}>
              <div 
                className={styles.popularityFill} 
                style={{ width: `${popularity}%` }}
              ></div>
            </div>
            <span className={styles.metricValue}>{popularity}%</span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Obscurity</span>
            <div className={styles.obscurityBar}>
              <div 
                className={styles.obscurityFill} 
                style={{ width: `${obscurityLevel}%` }}
              ></div>
            </div>
            <span className={styles.metricValue}>{obscurityLevel}%</span>
          </div>
        </div>
        
        <div className={styles.artistGenres}>
          {artist.genres && Array.isArray(artist.genres) ? 
            artist.genres.slice(0, 2).map((genre, index) => (
              <span key={index} className={styles.genreTag}>{genre}</span>
            )) : 
            <span className={styles.genreTag}>No genres available</span>
          }
        </div>
      </div>
      
      <div className={styles.similarArtistsSection}>
        {validSimilarArtists.length > 0 && (
          <div className={styles.similarArtistsList}>
            {validSimilarArtists.slice(0, 2).map((similar, index) => (
              <div key={index} className={styles.similarArtist}>
                {similar.name || 'Unknown Artist'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistCard;
