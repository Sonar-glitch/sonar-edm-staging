// components/AnimatedMusicTasteLoader.js
// 🎵 ANIMATED LOADER FOR FIRST LOGIN MUSIC TASTE COLLECTION
// Shows progressive animation: "Understanding your music taste" → "Fetching your events"

import { useState, useEffect } from 'react';
import styles from '../styles/AnimatedMusicTasteLoader.module.css';

const AnimatedMusicTasteLoader = ({ stage, progress, onComplete }) => {
  const [currentStage, setCurrentStage] = useState('understanding'); // 'understanding' | 'fetching'
  const [dots, setDots] = useState('');

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Stage transition logic
  useEffect(() => {
    if (stage === 'taste_complete' && currentStage === 'understanding') {
      // Transition from understanding to fetching events
      setTimeout(() => setCurrentStage('fetching'), 1000);
    } else if (stage === 'complete') {
      onComplete?.();
    }
  }, [stage, currentStage, onComplete]);

  const getStageContent = () => {
    switch (currentStage) {
      case 'understanding':
        return {
          emoji: '🎵',
          title: 'Understanding your music taste',
          subtitle: 'Analyzing your Spotify data and sound characteristics',
          color: '#06b6d4',
          progress: Math.min(progress?.taste || 0, 85)
        };
      case 'fetching':
        return {
          emoji: '🎪',
          title: 'Fetching your events',
          subtitle: 'Finding events that match your music taste',
          color: '#8b5cf6',
          progress: progress?.events || 0
        };
      default:
        return {
          emoji: '🎵',
          title: 'Getting started',
          subtitle: 'Preparing your music profile',
          color: '#06b6d4',
          progress: 0
        };
    }
  };

  const content = getStageContent();

  return (
    <div className={styles.loaderContainer}>
      {/* Animated background */}
      <div className={styles.animatedBackground}>
        <div className={styles.wave}></div>
        <div className={styles.wave}></div>
        <div className={styles.wave}></div>
      </div>

      {/* Main content */}
      <div className={styles.content}>
        {/* Large animated emoji */}
        <div 
          className={styles.emoji}
          style={{ color: content.color }}
        >
          {content.emoji}
        </div>

        {/* Title with animated dots */}
        <h1 className={styles.title}>
          {content.title}{dots}
        </h1>

        {/* Subtitle */}
        <p className={styles.subtitle}>
          {content.subtitle}
        </p>

        {/* Progress bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressTrack}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${content.progress}%`,
                backgroundColor: content.color
              }}
            ></div>
          </div>
          <span className={styles.progressText}>
            {Math.round(content.progress)}%
          </span>
        </div>

        {/* Stage indicators */}
        <div className={styles.stageIndicators}>
          <div className={`${styles.indicator} ${currentStage === 'understanding' ? styles.active : styles.complete}`}>
            <span className={styles.indicatorIcon}>🎵</span>
            <span className={styles.indicatorText}>Music Taste</span>
          </div>
          <div className={styles.connector}></div>
          <div className={`${styles.indicator} ${currentStage === 'fetching' ? styles.active : ''}`}>
            <span className={styles.indicatorIcon}>🎪</span>
            <span className={styles.indicatorText}>Events</span>
          </div>
        </div>

        {/* Detailed progress for debugging */}
        {process.env.NODE_ENV === 'development' && (
          <div className={styles.debugInfo}>
            <small>Stage: {currentStage} | Progress: {JSON.stringify(progress)}</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimatedMusicTasteLoader;
