import React from 'react';
import styles from '../styles/TrackCard.module.css';

const TrackCard = ({ track, correlation, duration, popularity }) => {
  // Error handling: Check if track is valid
  if (!track || typeof track !== 'object') {
    return (
      <div className={styles.trackCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display track information. Invalid track data.</p>
        </div>
      </div>
    );
  }

  // Ensure correlation is a valid number
  const validCorrelation = typeof correlation === 'number' && !isNaN(correlation) ? correlation : 0;
  const correlationPercent = Math.round(validCorrelation * 100);
  
  // Ensure popularity is a valid number
  const validPopularity = typeof popularity === 'number' && !isNaN(popularity) ? popularity : 50;
  
  // Format duration
  const formatDuration = (ms) => {
    if (!ms || typeof ms !== 'number' || isNaN(ms)) return '0:00';
    
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className={styles.trackCard}>
      <div className={styles.trackHeader}>
        <div className={styles.trackImageContainer}>
          {track.image ? (
            <div 
              className={styles.trackImage}
              style={{ backgroundImage: `url(${track.image})` }}
            />
          ) : (
            <div className={styles.trackImagePlaceholder}>
              <span>{track.name ? track.name.charAt(0) : '?'}</span>
            </div>
          )}
          
          {track.preview && (
            <button className={styles.previewButton} title="Play preview">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>
        
        <div className={styles.trackInfo}>
          <h3 className={styles.trackName}>{track.name || 'Unknown Track'}</h3>
          <p className={styles.trackArtist}>{track.artist || 'Unknown Artist'}</p>
          
          {duration > 0 && (
            <span className={styles.trackDuration}>{formatDuration(duration)}</span>
          )}
        </div>
      </div>
      
      <div className={styles.trackMetrics}>
        <div className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Popularity</span>
            <span className={styles.metricValue}>{validPopularity}%</span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill} 
              style={{ width: `${validPopularity}%` }}
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
      
      {track.album && (
        <div className={styles.trackAlbum}>
          <span className={styles.albumLabel}>Album:</span>
          <span className={styles.albumName}>{track.album}</span>
        </div>
      )}
    </div>
  );
};

export default TrackCard;
