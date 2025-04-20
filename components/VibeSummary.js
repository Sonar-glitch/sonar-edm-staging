import React from 'react';
import styles from '@/styles/VibeSummary.module.css';

export default function VibeSummary({ primaryGenres, vibeShift, eventCount }) {
  // Format primary genres for display
  const formatGenres = (genres) => {
    if (!genres || genres.length === 0) return 'Electronic Music';
    
    // Take top 2 genres
    const topGenres = Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([genre]) => genre);
    
    return topGenres.join(' + ');
  };

  // Default values
  const displayGenres = formatGenres(primaryGenres) || 'Melodic House + Techno';
  const displayShift = vibeShift || 'fresh sounds';
  const displayCount = eventCount || '6970';

  return (
    <div className={styles.container}>
      <p className={styles.summary}>
        You're all about <span className={styles.highlight}>{displayGenres}</span> with a vibe shift toward <span className={styles.highlight}>{displayShift}</span>. Found <span className={styles.highlight}>{displayCount} events</span> that match your sound.
      </p>
    </div>
  );
}