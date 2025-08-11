import React from 'react';
import styles from '@/styles/EnhancedEventCard.module.css';
import MatchPercentage from './MatchPercentage';
import { FaCalendarAlt, FaMapMarkerAlt, FaMusic } from 'react-icons/fa';

export default function EnhancedEventCard({ event }) {
  // Format date to display as "Thu, May 1"
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Extract venue type from event data
  const getVenueType = () => {
    const venueTypes = {
      'club': 'Club',
      'warehouse': 'Warehouse',
      'bar': 'Bar',
      'festival': 'Festival',
      'venue': 'Venue'
    };
    
    // Try to determine venue type from venue name or type property
    const venueLower = (event.venue || '').toLowerCase();
    
    for (const [key, value] of Object.entries(venueTypes)) {
      if (venueLower.includes(key)) {
        return value;
      }
    }
    
    // Default to "Venue" if no match
    return event.venueType || 'Venue';
  };

  // Format artists with match percentages
  const formatArtists = () => {
    if (!event.artists || !Array.isArray(event.artists) || event.artists.length === 0) {
      // If no artists array, try to extract from name or use default
      return [{ name: event.name.split(' - ')[0] || 'TBA', matchScore: Math.round(event.matchScore * 0.9) }];
    }
    
    // Return up to 3 artists with match scores
    return event.artists.slice(0, 3).map(artist => ({
      name: artist.name,
      matchScore: artist.matchScore || Math.round(event.matchScore * 0.9)
    }));
  };

  // Get formatted date
  const formattedDate = formatDate(event.date);
  
  // Get venue type
  const venueType = getVenueType();
  
  // Get artists
  const artists = formatArtists();
  
  // Get primary genre
  const primaryGenre = event.genres && event.genres.length > 0 
    ? event.genres[0] 
    : 'Electronic';

  return (
    <div className={styles.card}>
      {/* Event header with name and venue */}
      <div className={styles.header}>
        <h3 className={styles.title}>{event.name}</h3>
        <p className={styles.venue}>
          {typeof event.venue === 'object' ? (event.venue?.name || 'Venue TBA') : (event.venue || 'Venue TBA')} {venueType && <span className={styles.venueType}>• {venueType}</span>}
        </p>
      </div>
      
      {/* Artists section */}
      <div className={styles.artistsSection}>
        <p className={styles.featuring}>Featuring:</p>
        {artists.map((artist, index) => (
          <div key={index} className={styles.artist}>
            <span className={styles.artistName}>{artist.name}</span>
            <span className={styles.artistMatch}>{artist.matchScore}%</span>
          </div>
        ))}
        
        {/* View more artists link if needed */}
        {event.artists && event.artists.length > 3 && (
          <button className={styles.viewMore}>
            +{event.artists.length - 3} more
          </button>
        )}
      </div>
      
      {/* Event details */}
      <div className={styles.details}>
        {/* Genre tag */}
        <div className={styles.genreTag}>
          <FaMusic className={styles.icon} />
          <span>{primaryGenre}</span>
        </div>
        
        {/* Price tag if available */}
        {event.price && (
          <div className={styles.priceTag}>
            <span>${event.price}</span>
          </div>
        )}
        
        {/* Date tag */}
        <div className={styles.dateTag}>
          <span>{formattedDate}</span>
        </div>
      </div>
      
      {/* Bottom section with details button and match percentage */}
      <div className={styles.bottomSection}>
        <button className={styles.detailsButton}>Details</button>
        <div className={styles.matchPercentage}>
          <MatchPercentage percentage={event.matchScore} />
        </div>
      </div>
    </div>
  );
}
