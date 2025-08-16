// components/ConfidenceIndicator.js
// 📊 CONFIDENCE INDICATOR COMPONENT
// Shows user's profile confidence and retry options

import { useState } from 'react';
import { useRouter } from 'next/router';
import styles from '../styles/ConfidenceIndicator.module.css';

export default function ConfidenceIndicator({ confidence, profileType, compact = false }) {
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();

  if (!confidence || confidence.score === undefined) {
    return null;
  }

  const handleRetryCollection = async () => {
    setIsRetrying(true);
    
    try {
      const response = await fetch('/api/user/retry-taste-collection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Retry initiated:', result);
        router.push('/onboarding?retry=true');
      } else {
        const error = await response.json();
        console.error('❌ Retry failed:', JSON.stringify(error));
        alert(`Failed to start retry: ${error.message}`);
      }
    } catch (error) {
      console.error('❌ Retry error:', error?.message || JSON.stringify(error));
      alert('An error occurred while starting retry');
    } finally {
      setIsRetrying(false);
    }
  };

  const getConfidenceColor = () => {
    if (confidence.score >= 80) return 'high';
    if (confidence.score >= 50) return 'medium';
    return 'low';
  };

  const getConfidenceMessage = () => {
    if (confidence.score >= 80) {
      return 'Your profile has high confidence based on rich Spotify data';
    } else if (confidence.score >= 50) {
      return 'Your profile has moderate confidence - you can improve it';
    } else {
      return 'Your profile has low confidence - consider retrying collection';
    }
  };

  const shouldShowRetry = confidence.score < 80 || profileType === 'fallback';

  if (compact) {
    return (
      <div className={`${styles.compactIndicator} ${styles[getConfidenceColor()]}`}>
        <span className={styles.compactScore}>{confidence.score}%</span>
        <span className={styles.compactLabel}>confidence</span>
        {shouldShowRetry && (
          <button 
            onClick={handleRetryCollection}
            disabled={isRetrying}
            className={styles.compactRetryButton}
            title="Improve your profile"
          >
            {isRetrying ? '⟳' : '↻'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={styles.confidenceContainer}>
      <div className={styles.confidenceHeader}>
        <h3 className={styles.title}>Profile Confidence</h3>
        <div className={`${styles.confidenceBadge} ${styles[getConfidenceColor()]}`}>
          {confidence.score}% {confidence.level.toUpperCase()}
        </div>
      </div>

      <div className={styles.confidenceBar}>
        <div 
          className={`${styles.confidenceFill} ${styles[getConfidenceColor()]}`}
          style={{ width: `${confidence.score}%` }}
        ></div>
      </div>

      <p className={styles.confidenceMessage}>
        {getConfidenceMessage()}
      </p>

      {confidence.factors && confidence.factors.length > 0 && (
        <div className={styles.factorsContainer}>
          <p className={styles.factorsLabel}>Based on:</p>
          <ul className={styles.factorsList}>
            {confidence.factors.map((factor, index) => (
              <li key={index} className={styles.factor}>{factor}</li>
            ))}
          </ul>
        </div>
      )}

      {shouldShowRetry && (
        <div className={styles.retryContainer}>
          <button 
            onClick={handleRetryCollection}
            disabled={isRetrying}
            className={styles.retryButton}
          >
            {isRetrying ? 'Starting retry...' : 'Improve Profile'}
          </button>
          <p className={styles.retryDescription}>
            Retry data collection to improve your profile confidence
          </p>
        </div>
      )}

      {profileType === 'fallback' && (
        <div className={styles.fallbackNotice}>
          <p>⚠️ This is a fallback profile created after data collection issues</p>
        </div>
      )}
    </div>
  );
}
