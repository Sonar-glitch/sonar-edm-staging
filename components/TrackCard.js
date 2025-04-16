import styles from '../styles/TrackCard.module.css';

const TrackCard = ({ track, rank }) => {
  return (
    <div className={styles.trackCard}>
      {/* Rank indicator */}
      <div className={styles.rankBadge}>{rank}</div>
      
      {track.image && (
        <div className={styles.trackImageContainer}>
          <img src={track.image} alt={track.name} className={styles.trackImage} />
          {track.previewUrl && (
            <button 
              className={styles.playButton}
              onClick={() => window.open(track.previewUrl, '_blank')}
              aria-label={`Play ${track.name}`}
            >
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path fill="currentColor" d="M8,5.14V19.14L19,12.14L8,5.14Z" />
              </svg>
            </button>
          )}
        </div>
      )}
      <div className={styles.trackInfo}>
        <h3 className={styles.trackName}>{track.name}</h3>
        <p className={styles.trackArtist}>{track.artist}</p>
      </div>
    </div>
  );
};

export default TrackCard;
