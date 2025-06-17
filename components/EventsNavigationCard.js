import React from 'react';
import Link from 'next/link';
import styles from '../styles/EventsNavigationCard.module.css';

export default function EventsNavigationCard({ correlatedEvents = [], userTaste = {} }) {
  // Get top genres from user taste if available
  const topGenres = userTaste.topGenres ? userTaste.topGenres.slice(0, 3).map(g => g.name) : [];
  
  // Count events by correlation level
  const strongMatches = correlatedEvents.filter(event => event.correlationScore >= 80).length;
  const goodMatches = correlatedEvents.filter(event => event.correlationScore >= 50 && event.correlationScore < 80).length;
  
  return (
    <div className={styles.navigationCard}>
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>Discover Events Based on Your Taste</h3>
        
        <div className={styles.matchSummary}>
          {correlatedEvents.length > 0 ? (
            <>
              <div className={styles.matchCount}>
                <span className={styles.countNumber}>{strongMatches}</span>
                <span className={styles.countLabel}>Strong Matches</span>
              </div>
              <div className={styles.matchCount}>
                <span className={styles.countNumber}>{goodMatches}</span>
                <span className={styles.countLabel}>Good Matches</span>
              </div>
              <div className={styles.matchCount}>
                <span className={styles.countNumber}>{correlatedEvents.length - strongMatches - goodMatches}</span>
                <span className={styles.countLabel}>Other Events</span>
              </div>
            </>
          ) : (
            <p className={styles.noEventsMessage}>
              We're finding events that match your taste profile
            </p>
          )}
        </div>
        
        {topGenres.length > 0 && (
          <div className={styles.genreTags}>
            <span className={styles.tagsLabel}>Based on your top genres:</span>
            <div className={styles.tags}>
              {topGenres.map((genre, index) => (
                <span key={index} className={styles.genreTag}>{genre}</span>
              ))}
            </div>
          </div>
        )}
        
        <div className={styles.actionButtons}>
          <Link href="/users/events" className={styles.primaryButton}>
              <span className={styles.buttonIcon}>🎭</span>
              Explore All Events
            </Link>
          
          <Link href="/users/events?filter=nearby" className={styles.secondaryButton}>
              <span className={styles.buttonIcon}>📍</span>
              Nearby Events
            </Link>
        </div>
        
        <div className={styles.decorativeLine}></div>
      </div>
    </div>
  );
}
