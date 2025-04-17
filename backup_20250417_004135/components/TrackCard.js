import React from 'react';
import styles from '../styles/TrackCard.module.css';

const TrackCard = ({ track, correlation, duration, popularity }) => {
  // Format correlation as percentage
  const correlationPercent = Math.round(correlation * 100);
  
  // Format duration from ms to mm:ss
  const formatDuration = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className={styles.trackCard}>
      <div className={styles.albumArtContainer}>
        {track.album && track.album.images && track.album.images.length > 0 ? (
          <div 
            className={styles.albumArt}
            style={{ backgroundImage: `url(${track.album.images[0].url})` }}
          />
        ) : (
          <div className={styles.albumArtPlaceholder}>
            <span>{track.name.charAt(0)}</span>
          </div>
        )}
        
        <div className={styles.correlationBadge}>
          <span className={styles.correlationValue}>{correlationPercent}%</span>
          <span className={styles.correlationLabel}>match</span>
        </div>
      </div>
      
      <div className={styles.trackInfo}>
        <h3 className={styles.trackName}>{track.name}</h3>
        <p className={styles.artistName}>{track.artists.map(a => a.name).join(', ')}</p>
        
        <div className={styles.trackMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Duration</span>
            <span className={styles.metricValue}>{formatDuration(duration)}</span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Popularity</span>
            <div className={styles.popularityBar}>
              <div 
                className={styles.popularityFill} 
                style={{ width: `${popularity}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
