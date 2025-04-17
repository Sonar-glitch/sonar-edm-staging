import React from 'react';
import styles from '../styles/ArtistCard.module.css';

const ArtistCard = ({ artist, correlation, similarArtists }) => {
  // Format correlation as percentage
  const correlationPercent = Math.round(correlation * 100);
  
  return (
    <div className={styles.artistCard}>
      <div className={styles.artistImageContainer}>
        {artist.images && artist.images.length > 0 ? (
          <div 
            className={styles.artistImage}
            style={{ backgroundImage: `url(${artist.images[0].url})` }}
          />
        ) : (
          <div className={styles.artistImagePlaceholder}>
            <span>{artist.name.charAt(0)}</span>
          </div>
        )}
        
        <div className={styles.correlationBadge}>
          <span className={styles.correlationValue}>{correlationPercent}%</span>
          <span className={styles.correlationLabel}>match</span>
        </div>
      </div>
      
      <div className={styles.artistInfo}>
        <h3 className={styles.artistName}>{artist.name}</h3>
        
        <div className={styles.artistGenres}>
          {artist.genres && artist.genres.slice(0, 3).map((genre, index) => (
            <span key={index} className={styles.genreTag}>{genre}</span>
          ))}
        </div>
        
        <div className={styles.similarArtistsSection}>
          <h4 className={styles.similarArtistsTitle}>Similar Artists</h4>
          <div className={styles.similarArtistsList}>
            {similarArtists && similarArtists.slice(0, 3).map((similar, index) => (
              <div key={index} className={styles.similarArtist}>
                <span className={styles.similarArtistName}>{similar.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistCard;
