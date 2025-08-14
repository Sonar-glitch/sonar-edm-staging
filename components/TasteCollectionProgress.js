// components/TasteCollectionProgress.js
// 🎵 TASTE COLLECTION PROGRESS COMPONENT
// Progressive onboarding for first-time users

import { useState, useEffect } from 'react';
import styles from '../styles/TasteCollectionProgress.module.css';

export default function TasteCollectionProgress({ onComplete, onTimeout }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('initializing');

  const steps = [
    {
      id: 'spotify_connection',
      title: 'Connecting to Spotify',
      description: 'Accessing your music data...',
      duration: 3000
    },
    {
      id: 'genre_analysis',
      title: 'Analyzing Your Genres',
      description: 'Understanding your music preferences...',
      duration: 4000
    },
    {
      id: 'audio_features',
      title: 'Processing Audio Features',
      description: 'Analyzing sound characteristics...',
      duration: 5000
    },
    {
      id: 'taste_profile',
      title: 'Building Your Taste Profile',
      description: 'Creating personalized recommendations...',
      duration: 3000
    }
  ];

  useEffect(() => {
    let timeoutId;
    let progressInterval;

    const startStep = (stepIndex) => {
      if (stepIndex >= steps.length) {
        setStatus('completed');
        setProgress(100);
        onComplete?.({ success: true, profile: 'generated' });
        return;
      }

      setCurrentStep(stepIndex);
      setStatus('processing');
      
      const step = steps[stepIndex];
      const stepProgress = (stepIndex / steps.length) * 100;
      
      // Animate progress within the step
      let currentProgress = stepProgress;
      const stepSize = 100 / steps.length;
      const incrementSize = stepSize / (step.duration / 100);
      
      progressInterval = setInterval(() => {
        currentProgress += incrementSize;
        setProgress(Math.min(currentProgress, stepProgress + stepSize));
      }, 100);

      timeoutId = setTimeout(() => {
        clearInterval(progressInterval);
        startStep(stepIndex + 1);
      }, step.duration);
    };

    // Start the first step after a brief delay
    const initialTimeout = setTimeout(() => {
      startStep(0);
    }, 1000);

    // Overall timeout (30 seconds)
    const overallTimeout = setTimeout(() => {
      clearInterval(progressInterval);
      clearTimeout(timeoutId);
      setStatus('timeout');
      onTimeout?.();
    }, 30000);

    return () => {
      clearTimeout(initialTimeout);
      clearTimeout(timeoutId);
      clearTimeout(overallTimeout);
      clearInterval(progressInterval);
    };
  }, [onComplete, onTimeout]);

  const handleSkip = () => {
    setStatus('skipped');
    onComplete?.({ success: true, fastMode: true });
  };

  return (
    <div className={styles.container}>
      <div className={styles.progressCard}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            🎵 Understanding Your Music Taste
          </h1>
          <p className={styles.subtitle}>
            We're analyzing your Spotify data to create your personalized profile
          </p>
        </div>

        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className={styles.progressText}>
            {Math.round(progress)}% complete
          </div>
        </div>

        <div className={styles.stepsContainer}>
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`${styles.step} ${
                index === currentStep ? styles.active : 
                index < currentStep ? styles.completed : styles.pending
              }`}
            >
              <div className={styles.stepIcon}>
                {index < currentStep ? '✅' : 
                 index === currentStep ? '⏳' : '⏸️'}
              </div>
              <div className={styles.stepContent}>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDescription}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.actions}>
          <button 
            className={styles.skipButton}
            onClick={handleSkip}
          >
            Continue with Basic Profile
          </button>
          <p className={styles.skipNote}>
            You can always complete this later in settings
          </p>
        </div>

        {status === 'timeout' && (
          <div className={styles.timeoutMessage}>
            Taking longer than expected. You can continue with basic features.
          </div>
        )}
      </div>
    </div>
  );
}
