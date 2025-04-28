import React from 'react';
import styles from '@/styles/MatchPercentage.module.css';

export default function MatchPercentage({ percentage, size = 'medium' }) {
  // Calculate the circumference of the circle
  const radius = size === 'large' ? 40 : size === 'medium' ? 30 : 20;
  const circumference = 2 * Math.PI * radius;
  
  // Calculate the dash offset based on the percentage
  const dashOffset = circumference - (percentage / 100) * circumference;
  
  // Determine size-based styling
  const containerSize = size === 'large' ? 100 : size === 'medium' ? 80 : 60;
  const fontSize = size === 'large' ? 24 : size === 'medium' ? 18 : 14;
  
  return (
    <div 
      className={styles.container} 
      style={{ 
        width: `${containerSize}px`, 
        height: `${containerSize}px` 
      }}
    >
      <svg 
        className={styles.progressRing}
        width={containerSize} 
        height={containerSize}
      >
        {/* Background circle */}
        <circle
          className={styles.progressRingCircleBg}
          stroke="#1a1a2e"
          strokeWidth="8"
          fill="transparent"
          r={radius}
          cx={containerSize / 2}
          cy={containerSize / 2}
        />
        
        {/* Foreground circle with gradient */}
        <circle
          className={styles.progressRingCircle}
          stroke="url(#gradient)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx={containerSize / 2}
          cy={containerSize / 2}
          style={{
            strokeDasharray: `${circumference} ${circumference}`,
            strokeDashoffset: dashOffset
          }}
          transform={`rotate(-90, ${containerSize / 2}, ${containerSize / 2})`}
        />
        
        {/* Define gradient */}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00c6ff" />
            <stop offset="100%" stopColor="#ff00ea" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Percentage text */}
      <div 
        className={styles.percentageText}
        style={{ fontSize: `${fontSize}px` }}
      >
        {percentage}
      </div>
    </div>
  );
}
