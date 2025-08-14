// components/TasteCollectionProgress.js
// 🎵 PROGRESSIVE LOADING COMPONENT FOR MUSIC TASTE COLLECTION
// Shows real-time progress of first-login taste collection

import { useState, useEffect } from 'react';
import styles from '../styles/TasteCollectionProgress.module.css';

const TasteCollectionProgress = ({ onComplete }) => {
  const [progress, setProgress] = useState({
    overall: 'loading',
    spotify: 'pending',
    essentia: 'pending',
    seasonal: 'pending'
  });
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    // Start polling for progress
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/user/taste-collection-progress');
        if (response.ok) {
          const data = await response.json();
          setProgress(data.status);
          
          // Call onComplete when done
          if (data.status.overall === 'complete' && onComplete) {
            clearInterval(pollInterval);
            onComplete(data.status);
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [onComplete]);

  const getElapsedTime = () => {
    return Math.floor((Date.now() - startTime) / 1000);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'in_progress': return '🔄';
      case 'complete': return '✅';
      case 'error': return '❌';
      case 'queued': return '📋';
      default: return '⏳';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'complete': return '#10b981'; // Green
      case 'in_progress': return '#3b82f6'; // Blue
      case 'error': return '#ef4444'; // Red
      case 'queued': return '#f59e0b'; // Yellow
      default: return '#6b7280'; // Gray
    }
  };

  return (
    <div className={styles.progressContainer}>
      <div className={styles.header}>
        <h2>🎵 Building Your Music Profile</h2>
        <div className={styles.timer}>
          {getElapsedTime()}s elapsed
        </div>
      </div>

      <div className={styles.progressSteps}>
        {/* Spotify Data Collection */}
        <div className={`${styles.step} ${progress.spotify === 'complete' ? styles.complete : ''}`}>
          <div className={styles.stepIcon} style={{ color: getStatusColor(progress.spotify) }}>
            {getStatusIcon(progress.spotify)}
          </div>
          <div className={styles.stepContent}>
            <h3>Spotify Data Collection</h3>
            <p>
              {progress.spotify === 'complete' 
                ? `✅ Collected ${progress.tracksAnalyzed || 0} tracks, ${progress.artistsAnalyzed || 0} artists`
                : progress.spotify === 'in_progress'
                ? '📊 Fetching your top artists and tracks...'
                : '⏳ Waiting to start...'
              }
            </p>
            {progress.spotify === 'complete' && progress.duration && (
              <small>Completed in {Math.floor(progress.duration / 1000)}s</small>
            )}
          </div>
        </div>

        {/* Sound Characteristics Analysis */}
        <div className={`${styles.step} ${progress.essentia === 'complete' ? styles.complete : ''}`}>
          <div className={styles.stepIcon} style={{ color: getStatusColor(progress.essentia) }}>
            {getStatusIcon(progress.essentia)}
          </div>
          <div className={styles.stepContent}>
            <h3>Sound Characteristics Analysis</h3>
            <p>
              {progress.essentia === 'complete'
                ? '✅ Your sound DNA analyzed with Essentia ML'
                : progress.essentia === 'in_progress'
                ? '🎵 Analyzing your music characteristics...'
                : progress.essentia === 'queued'
                ? `📋 Queued for analysis (position ${progress.queuePosition || '?'})`
                : progress.essentia === 'error'
                ? '❌ Analysis failed - using Spotify audio features'
                : '⏳ Waiting for Spotify data...'
              }
            </p>
            {progress.essentia === 'queued' && (
              <small>ETA: ~45 seconds</small>
            )}
          </div>
        </div>

        {/* Seasonal & Mood Mapping */}
        <div className={`${styles.step} ${progress.seasonal === 'complete' ? styles.complete : ''}`}>
          <div className={styles.stepIcon} style={{ color: getStatusColor(progress.seasonal) }}>
            {getStatusIcon(progress.seasonal)}
          </div>
          <div className={styles.stepContent}>
            <h3>Seasonal Vibes & Mood Mapping</h3>
            <p>
              {progress.seasonal === 'complete'
                ? '✅ Your seasonal preferences mapped'
                : progress.seasonal === 'in_progress'
                ? '🌙 Processing your listening patterns...'
                : '⏳ Waiting for track analysis...'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Overall Status Message */}
      <div className={styles.statusMessage}>
        {progress.message}
      </div>

      {/* Manual Trigger Button (if needed) */}
      {progress.overall === 'not_started' && (
        <button 
          className={styles.triggerButton}
          onClick={async () => {
            try {
              const response = await fetch('/api/user/trigger-taste-collection', {
                method: 'POST'
              });
              if (response.ok) {
                console.log('Manual taste collection triggered');
              }
            } catch (error) {
              console.error('Error triggering collection:', error);
            }
          }}
        >
          🚀 Start Building My Music Profile
        </button>
      )}

      {/* Error State */}
      {progress.overall === 'error' && (
        <div className={styles.errorState}>
          <h3>⚠️ Collection Failed</h3>
          <p>{progress.error}</p>
          <button 
            className={styles.retryButton}
            onClick={async () => {
              const response = await fetch('/api/user/trigger-taste-collection', {
                method: 'POST'
              });
              if (response.ok) {
                setStartTime(Date.now());
              }
            }}
          >
            🔄 Retry Collection
          </button>
        </div>
      )}
    </div>
  );
};

export default TasteCollectionProgress;
