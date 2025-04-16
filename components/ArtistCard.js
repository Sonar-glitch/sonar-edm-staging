import { useState } from 'react';
import styles from '../styles/ArtistCard.module.css';

const ArtistCard = ({ artist }) => {
  const [expanded, setExpanded] = useState(false);
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setExpanded(!expanded);
  };
  
  return (
    <div className={`${styles.artistCard} ${expanded ? styles.expanded : ''}`}>
      <div className={styles.mainContent} onClick={toggleExpanded}>
        {artist.image && (
          <div className={styles.artistImageContainer}>
            <img src={artist.image} alt={artist.name} className={styles.artistImage} />
          </div>
        )}
        <div className={styles.artistInfo}>
          <h3 className={styles.artistName}>{artist.name}</h3>
          <div className={styles.matchBadge}>{artist.match}% match</div>
        </div>
        <button 
          className={styles.expandButton} 
          aria-label={expanded ? "Hide similar artists" : "Show similar artists"}
        >
          <svg 
            className={`${styles.expandIcon} ${expanded ? styles.rotated : ''}`} 
            viewBox="0 0 24 24" 
            width="24" 
            height="24"
          >
            <path 
              fill="currentColor" 
              d="M7.41,8.58L12,13.17L16.59,8.58L18,10L12,16L6,10L7.41,8.58Z"
            />
          </svg>
        </button>
      </div>
      
      {/* Similar Artists Section */}
      <div className={`${styles.similarArtistsContainer} ${expanded ? styles.visible : ''}`}>
        <h4 className={styles.similarArtistsTitle}>Similar Artists</h4>
        {artist.similarArtists && artist.similarArtists.length > 0 ? (
          <ul className={styles.similarArtistsList}>
            {artist.similarArtists.map((similarArtist, index) => (
              <li key={index} className={styles.similarArtistItem}>
                {similarArtist}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.noSimilarArtists}>No similar artists found</p>
        )}
      </div>
    </div>
  );
};

export default ArtistCard;
