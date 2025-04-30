import React from 'react';
import MatchPercentage from './MatchPercentage';
import styles from '../styles/NewEventCard.module.css';

export default function NewEventCard({ event }) {
  const getSafe = (fn, defaultValue = '') => {
    try {
      return fn() || defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  // Extract data safely, assuming potential API field names
  const eventName = getSafe(() => event.name, 'Event Name Unavailable');
  const venueName = getSafe(() => event.venue, 'Venue Unavailable');
  const venueType = getSafe(() => event.venueType, ''); // e.g., 'Club', 'Warehouse'
  const venueAddress = getSafe(() => event.address, ''); // e.g., '123 Main St'
  const city = getSafe(() => event.city, '');
  const allArtists = getSafe(() => event.artistList?.map(a => a.name).join(', '), ''); // Join all artists
  const genres = getSafe(() => event.genres, []); // Assuming genres is an array like ['Techno', 'House']
  const priceRange = getSafe(() => event.priceRange, ''); // e.g., '$30-$50'
  const date = getSafe(() => event.date, '');
  const time = getSafe(() => event.time, '');
  const eventUrl = getSafe(() => event.url, '#');
  const matchScore = typeof event.matchScore === 'number' ? event.matchScore : 0;

  return (
    <div className={styles.card}>
      <div className={styles.details}>
        <h3 className={styles.eventName}>{eventName}</h3>
        <p className={styles.venue}>
          {venueName}{venueType ? ` (${venueType})` : ''}{city ? `, ${city}` : ''}
        </p>
        {venueAddress && <p className={styles.address}>📍 {venueAddress}</p>}
        {allArtists && <p className={styles.featuring}>Featuring: {allArtists}</p>}
        
        <div className={styles.tagsAndDate}>
          <div className={styles.tags}>
            {/* Display Genres */}
            {genres.map((genre, index) => (
              <span key={`genre-${index}`} className={`${styles.tag} ${styles.genreTag}`}>{genre}</span>
            ))}
            {/* Display Price Range if available */}
            {priceRange && <span key="price" className={`${styles.tag} ${styles.priceTag}`}>{priceRange}</span>}
          </div>
          {/* Display Date/Time */}
          {date && <span className={styles.date}>{date}{time ? ` • ${time}` : ''}</span>}
        </div>

      </div>
      <div className={styles.actions}>
        <MatchPercentage percentage={matchScore} size="medium" />
        <a href={eventUrl} target="_blank" rel="noopener noreferrer" className={styles.detailsLink}>
          Details
        </a>
      </div>
    </div>
  );
}

