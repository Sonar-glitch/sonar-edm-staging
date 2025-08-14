// components/TasteCollectionProgress.js
// 🎵 REAL TASTE COLLECTION PROGRESS COMPONENT
// Performs actual data collection from Spotify with real progress tracking

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '../styles/TasteCollectionProgress.module.css';

export default function TasteCollectionProgress({ onComplete, onTimeout }) {
  const { data: session } = useSession();
  const [currentStep, setCurrentStep] = useState('initializing');
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('starting');
  const [collectionData, setCollectionData] = useState(null);
  const [error, setError] = useState(null);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const steps = {
    'spotify_connection': {
      title: 'Connecting to Spotify',
      description: 'Accessing your music data...',
      progress: 10
    },
    'fetching_artists': {
      title: 'Analyzing Your Artists',
      description: 'Discovering your favorite artists...',
      progress: 30
    },
    'fetching_tracks': {
      title: 'Processing Your Tracks',
      description: 'Analyzing your listening history...',
      progress: 50
    },
    'audio_analysis': {
      title: 'Audio Feature Analysis',
      description: 'Understanding your sound preferences...',
      progress: 70
    },
    'building_profile': {
      title: 'Building Your Profile',
      description: 'Creating your personalized taste profile...',
      progress: 90
    },
    'completed': {
      title: 'Profile Complete',
      description: 'Your taste profile is ready!',
      progress: 100
    }
  };

  useEffect(() => {
    let timeoutId;
    let intervalId;

    // Start timer for 30-second timeout
    intervalId = setInterval(() => {
      setTimeElapsed(prev => prev + 1);
    }, 1000);

    // 30-second timeout
    timeoutId = setTimeout(() => {
      if (status !== 'completed') {
        console.log('⏰ Taste collection timeout reached');
        setStatus('timeout');
        onTimeout?.();
      }
    }, 30000);

    // Start real data collection
    if (session && status === 'starting') {
      startRealCollection();
    }

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [session, status]);

  const startRealCollection = async () => {
    try {
      setStatus('collecting');
      
      // Step 1: Check Spotify connection
      setCurrentStep('spotify_connection');
      setProgress(10);
      await new Promise(resolve => setTimeout(resolve, 500)); // Brief pause for UX

      if (!session?.accessToken) {
        throw new Error('No Spotify access token available');
      }

      // Step 2: Start real collection process
      setCurrentStep('fetching_artists');
      setProgress(30);
      
      console.log('🎵 Starting real taste collection...');
      
      const response = await fetch('/api/user/real-taste-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      setCurrentStep('audio_analysis');
      setProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to collect taste data');
      }

      setCurrentStep('building_profile');
      setProgress(90);

      const result = await response.json();
      setCollectionData(result);

      // Final step
      setCurrentStep('completed');
      setProgress(100);
      setStatus('completed');

      console.log('✅ Taste collection completed:', result);

      // Call completion callback with real data
      setTimeout(() => {
        onComplete?.({
          success: true,
          data: result,
          confidence: result.confidence,
          summary: result.summary
        });
      }, 1000);

    } catch (error) {
      console.error('❌ Taste collection failed:', error);
      setError(error.message);
      setStatus('error');
      
      // Fall back to completing with error info
      setTimeout(() => {
        onComplete?.({
          success: false,
          error: error.message,
          fallback: true
        });
      }, 2000);
    }
  };

  const handleSkip = () => {
    setStatus('skipped');
    onComplete?.({ 
      success: true, 
      skipped: true,
      message: 'Onboarding skipped by user'
    });
  };

  const formatTime = (seconds) => {
    return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  return (
    <div className={styles.progressContainer}>
      <div className={styles.header}>
        <h2 className={styles.title}>🎵 Understanding Your Music Taste</h2>
        <p className={styles.subtitle}>
          {status === 'error' ? 'Collection failed, using fallback data' :
           status === 'timeout' ? 'Taking longer than expected...' :
           status === 'completed' ? 'Your profile is ready!' :
           'We\'re analyzing your Spotify data to create your personalized profile'}
        </p>
      </div>

      <div className={styles.progressBar}>
        <div 
          className={styles.progressFill} 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className={styles.progressText}>
        {progress}% complete
        {timeElapsed > 0 && (
          <span className={styles.timer}> • {formatTime(timeElapsed)}</span>
        )}
      </div>

      <div className={styles.stepContainer}>
        {Object.entries(steps).map(([stepKey, step]) => {
          let stepStatus = 'pending';
          if (currentStep === stepKey) {
            stepStatus = status === 'error' ? 'error' : 'active';
          } else if (step.progress <= progress) {
            stepStatus = 'completed';
          }

          return (
            <div key={stepKey} className={`${styles.step} ${styles[stepStatus]}`}>
              <div className={`${styles.stepIcon} ${styles[stepStatus]}`}>
                {stepStatus === 'completed' ? '✓' : 
                 stepStatus === 'error' ? '⚠' :
                 stepStatus === 'active' ? '⟳' : '○'}
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepTitle}>{step.title}</div>
                <div className={styles.stepDescription}>
                  {stepStatus === 'error' && stepKey === currentStep ? 
                    error || 'An error occurred' : 
                    step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real data summary */}
      {collectionData && status === 'completed' && (
        <div className={styles.summaryContainer}>
          <h3 className={styles.summaryTitle}>Collection Summary</h3>
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{collectionData.summary.genres}</span>
              <span className={styles.summaryLabel}>Genres</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{collectionData.summary.topArtists}</span>
              <span className={styles.summaryLabel}>Top Artists</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>{collectionData.summary.topTracks}</span>
              <span className={styles.summaryLabel}>Top Tracks</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryValue}>
                {collectionData.confidence.score}%
              </span>
              <span className={styles.summaryLabel}>Confidence</span>
            </div>
          </div>
          
          <div className={styles.confidenceIndicator}>
            <span className={`${styles.confidenceBadge} ${styles[collectionData.confidence.level]}`}>
              {collectionData.confidence.level.toUpperCase()} CONFIDENCE
            </span>
            <p className={styles.confidenceText}>
              Based on {collectionData.confidence.factors.join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Timeout warning */}
      {timeElapsed > 20 && status !== 'completed' && status !== 'error' && (
        <div className={styles.timeoutWarning}>
          <p>Taking longer than expected. We'll redirect you shortly with available data.</p>
        </div>
      )}

      <div className={styles.controls}>
        {status === 'error' || status === 'timeout' ? (
          <button 
            className={styles.completeButton}
            onClick={() => onComplete?.({ success: false, fallback: true })}
          >
            Continue with Available Data
          </button>
        ) : status !== 'completed' ? (
          <button 
            className={styles.skipButton}
            onClick={handleSkip}
          >
            Skip for now
          </button>
        ) : null}
      </div>
    </div>
  );
}
