import React from 'react';
import styles from '../styles/ArtistCard.module.css';

const ArtistCard = ({ artist, correlation = 0.5, similarArtists = [], useTasteMatch = false }) => {
  // Handle missing or malformed data
  if (!artist) {
    return (
      <div className={styles.artistCard}>
        <div className={styles.errorState}>
          <p>Artist data unavailable</p>
        </div>
      </div>
    );
  }

  // Extract artist data with fallbacks
  const name = artist.name || 'Unknown Artist';
  const image = artist.image || '/images/artist-placeholder.jpg';
  const genres = Array.isArray(artist.genres) ? artist.genres : [];
  
  // Calculate popularity and taste match
  const popularity = typeof artist.popularity === 'number' ? artist.popularity : 50;
  const tasteMatch = typeof correlation === 'number' ? Math.round(correlation * 100) : 50;

  return (
    <div className={styles.artistCard}>
      <div className={styles.artistHeader}>
        <div className={styles.artistInitial}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.artistInfo}>
          <h3 className={styles.artistName}>{name}</h3>
          
          <div className={styles.artistMetrics}>
            <div className={styles.metricGroup}>
              <span className={styles.metricLabel}>Popularity</span>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${popularity}%`, backgroundColor: '#00d4ff' }}
                ></div>
              </div>
              <span className={styles.metricValue}>{popularity}%</span>
            </div>
            
            <div className={styles.metricGroup}>
              <span className={styles.metricLabel}>Taste Match</span>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${tasteMatch}%`, backgroundColor: '#ff00ff' }}
                ></div>
              </div>
              <span className={styles.metricValue}>{tasteMatch}%</span>
            </div>
          </div>
        </div>
      </div>
      
      {genres.length > 0 && (
        <div className={styles.genreTags}>
          {genres.slice(0, 2).map((genre, index) => (
            <span key={index} className={styles.genreTag}>{genre}</span>
          ))}
        </div>
      )}
      
      {similarArtists.length > 0 && (
        <div className={styles.similarArtists}>
          <span className={styles.similarLabel}>SIMILAR ARTISTS</span>
          <div className={styles.similarList}>
            {similarArtists.map((similar, index) => (
              <div key={index} className={styles.similarArtist}>
                {similar.image && (
                  <img 
                    src={similar.image} 
                    alt={similar.name} 
                    className={styles.similarImage}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/artist-placeholder.jpg';
                    }}
                  />
                )}
                <span className={styles.similarName}>{similar.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistCard;
