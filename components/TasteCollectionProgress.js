// components/TasteCollectionProgress.js
// 🎵 PROGRESSIVE LOADING COMPONENT FOR MUSIC TASTE COLLECTION
// Shows real-time progress of first-login taste collection

import { useState, useEffect } from 'react';
import styles from '../styles/TasteCollectionProgress.module.css';

const TasteCollectionProgress = ({ onComplete, onTimeout }) => {
  const [progress, setProgress] = useState({
    overall: 'loading',
    spotify: 'pending',
    essentia: 'pending',
    seasonal: 'pending',
    currentStep: 'Initializing your music taste analysis...',
    details: '',
    percentage: 0
  });
  const [startTime, setStartTime] = useState(Date.now());

  useEffect(() => {
    // Timeout after 3 minutes - show dashboard with demo data
    const timeoutTimer = setTimeout(() => {
      console.log('🎵 Progress timed out after 3 minutes');
      if (onTimeout) {
        onTimeout();
      }
    }, 3 * 60 * 1000); // 3 minutes

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
            clearTimeout(timeoutTimer);
            onComplete(data.status);
          }
        } else {
          // If API fails, show basic profile after 30 seconds
          if (getElapsedTime() > 30) {
            console.log('🎵 API failed, showing basic profile');
            clearInterval(pollInterval);
            clearTimeout(timeoutTimer);
            if (onComplete) {
              onComplete({ fastMode: true, reason: 'api_error' });
            }
          }
        }
      } catch (error) {
        console.error('Error polling progress:', error);
        // If polling fails completely after 30 seconds, show basic profile
        if (getElapsedTime() > 30) {
          console.log('🎵 Polling failed, showing basic profile');
          clearInterval(pollInterval);
          clearTimeout(timeoutTimer);
          if (onComplete) {
            onComplete({ fastMode: true, reason: 'polling_error' });
          }
        }
      }
    }, 2000); // Poll every 2 seconds

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutTimer);
    };
  }, [onComplete, onTimeout]);

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
        <h2>🎵 Understanding Your Music Taste</h2>
        <div className={styles.timer}>
          {getElapsedTime()}s elapsed
        </div>
      </div>

      {/* Main Progress Bar */}
      <div className={styles.mainProgress}>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill} 
            style={{ width: `${progress.percentage || 0}%` }}
          ></div>
        </div>
        <div className={styles.currentStep}>
          <span className={styles.stepText}>{progress.currentStep}</span>
          {progress.details && (
            <span className={styles.stepDetails}>{progress.details}</span>
          )}
        </div>
      </div>

      <div className={styles.progressSteps}>
        {/* Spotify Data Collection */}
        <div className={`${styles.step} ${progress.spotify === 'complete' ? styles.complete : progress.spotify === 'in_progress' ? styles.active : ''}`}>
          <div className={styles.stepIcon} style={{ color: getStatusColor(progress.spotify) }}>
            {getStatusIcon(progress.spotify)}
          </div>
          <div className={styles.stepContent}>
            <h3>Spotify Data Collection</h3>
            <p>
              {progress.spotify === 'complete' 
                ? `✅ Analyzed ${progress.tracksAnalyzed || 50} tracks from ${progress.artistsAnalyzed || 20} artists`
                : progress.spotify === 'in_progress'
                ? '📊 Fetching your listening history and preferences...'
                : '⏳ Preparing to analyze your Spotify data...'
              }
            </p>
          </div>
        </div>

        {/* Sound Characteristics Analysis */}
        <div className={`${styles.step} ${progress.essentia === 'complete' ? styles.complete : progress.essentia === 'in_progress' ? styles.active : ''}`}>
          <div className={styles.stepIcon} style={{ color: getStatusColor(progress.essentia) }}>
            {getStatusIcon(progress.essentia)}
          </div>
          <div className={styles.stepContent}>
            <h3>Sound Characteristics Analysis</h3>
            <p>
              {progress.essentia === 'complete'
                ? '✅ Your sound DNA analyzed with Essentia ML'
                : progress.essentia === 'in_progress'
                ? '🧬 Analyzing audio characteristics with AI...'
                : progress.essentia === 'queued'
                ? `📋 Queued for analysis (position ${progress.queuePosition || '?'})`
                : progress.essentia === 'error'
                ? '⚡ Using fast inference mode (Spotify audio features)'
                : '⏳ Waiting for Spotify data to complete...'
              }
            </p>
            {progress.essentia === 'queued' && (
              <small>ETA: ~45 seconds</small>
            )}
            {progress.essentia === 'in_progress' && (
              <small>Processing track-by-track analysis...</small>
            )}
          </div>
        </div>

        {/* Genre & Event Matching */}
        <div className={`${styles.step} ${progress.seasonal === 'complete' ? styles.complete : progress.seasonal === 'in_progress' ? styles.active : ''}`}>
          <div className={styles.stepIcon} style={{ color: getStatusColor(progress.seasonal) }}>
            {getStatusIcon(progress.seasonal)}
          </div>
          <div className={styles.stepContent}>
            <h3>Genre Mapping & Event Discovery</h3>
            <p>
              {progress.seasonal === 'complete'
                ? '✅ Events matched to your music taste'
                : progress.seasonal === 'in_progress'
                ? '� Finding EDM events that match your vibe...'
                : '⏳ Waiting for audio analysis to complete...'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Quick Skip Option */}
      {getElapsedTime() > 30 && progress.overall !== 'complete' && (
        <div className={styles.skipOption}>
          <p>Taking longer than expected?</p>
          <button 
            className={styles.skipButton}
            onClick={() => onComplete && onComplete({ fastMode: true, reason: 'user_skip' })}
          >
            Continue with Basic Profile
          </button>
        </div>
      )}

      {/* Overall Status Message */}
      {progress.message && (
        <div className={styles.statusMessage}>
          {progress.message}
        </div>
      )}
    </div>
  );
};

export default TasteCollectionProgress;
