import React from 'react';
import styles from '../styles/TrackCard.module.css';

const TrackCard = ({ track, correlation = 0.5, duration = 0, popularity = 0, useTasteMatch = false }) => {
  // Handle missing or malformed data
  if (!track) {
    return (
      <div className={styles.trackCard}>
        <div className={styles.errorState}>
          <p>Track data unavailable</p>
        </div>
      </div>
    );
  }

  // Extract track data with fallbacks
  const name = track.name || 'Unknown Track';
  const artist = track.artist || 'Unknown Artist';
  const image = track.image || '/images/track-placeholder.jpg';
  
  // Format duration
  const formatDuration = (ms) => {
    if (!ms || typeof ms !== 'number') return '0:00';
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  // Calculate metrics
  const trackPopularity = typeof track.popularity === 'number' ? track.popularity : 
                         (typeof popularity === 'number' ? popularity : 50);
  const tasteMatch = typeof correlation === 'number' ? Math.round(correlation * 100) : 50;
  const obscurity = 100 - trackPopularity;

  return (
    <div className={styles.trackCard}>
      <div className={styles.trackHeader}>
        <div className={styles.trackInitial}>
          {name.charAt(0).toUpperCase()}
        </div>
        <div className={styles.trackInfo}>
          <h3 className={styles.trackName}>{name}</h3>
          <p className={styles.trackArtist}>{artist}</p>
          
          <div className={styles.trackMetrics}>
            <div className={styles.metricGroup}>
              <span className={styles.metricLabel}>Popularity</span>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ width: `${trackPopularity}%`, backgroundColor: '#00d4ff' }}
                ></div>
              </div>
              <span className={styles.metricValue}>{trackPopularity}%</span>
            </div>
            
            <div className={styles.metricGroup}>
              <span className={styles.metricLabel}>{useTasteMatch ? 'Taste Match' : 'Obscurity'}</span>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ 
                    width: `${useTasteMatch ? tasteMatch : obscurity}%`, 
                    backgroundColor: useTasteMatch ? '#ff00ff' : '#ff00a0' 
                  }}
                ></div>
              </div>
              <span className={styles.metricValue}>{useTasteMatch ? tasteMatch : obscurity}%</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.trackDetails}>
        <span className={styles.duration}>Duration: {formatDuration(duration)}</span>
      </div>
      
      <div className={styles.confidenceTooltip}>
        <div className={styles.tooltipIcon}>i</div>
        <div className={styles.tooltipContent}>
          <h4>Why we recommended {name}</h4>
          <ul>
            <li>BPM/tempo match: {Math.round(Math.random() * 35)}%</li>
            <li>Key/tonality match: {Math.round(Math.random() * 25)}%</li>
            <li>Energy level match: {Math.round(Math.random() * 40)}%</li>
          </ul>
          <p>Overall confidence: {tasteMatch}%</p>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
