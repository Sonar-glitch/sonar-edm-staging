import React, { useState } from 'react';
import styles from '@/styles/EventRecommendation.module.css';

// Helper function to format price safely
const formatPrice = (price) => {
  if (!price) return 'Price TBA';
  
  // If it's already a number, format it
  if (typeof price === 'number') return `$${price}`;
  
  // If it's a string, return it
  if (typeof price === 'string') return price;
  
  // If it's an object with min/max/currency
  if (typeof price === 'object' && price.min !== undefined) {
    const { min, max, currency = 'USD' } = price;
    if (min === 0 && max === 0) return 'Free';
    if (min === max) return `$${min}`;
    return `$${min} - $${max}`;
  }
  
  return 'Price TBA';
};

export default function EventRecommendation({ events, userGenres }) {
  const [filterValue, setFilterValue] = useState(50);
  
  // Filter events based on the slider value
  const filteredEvents = events
    ? events.filter(event => event.matchScore >= filterValue)
    : [];
  
  // Sort events by match score (descending)
  const sortedEvents = [...filteredEvents].sort((a, b) => b.matchScore - a.matchScore);
  
  const handleSliderChange = (e) => {
    setFilterValue(parseInt(e.target.value));
  };
  
  // Format date to display day and date
  const formatEventDate = (dateString) => {
    const date = new Date(dateString);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const day = days[date.getDay()];
    const dayOfMonth = date.getDate();
    
    return `${day}, ${dayOfMonth}`;
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Events You'll Like</h2>
      
      <div className={styles.filterContainer}>
        <div className={styles.filterLabels}>
          <span>Music</span>
          <span>Venue</span>
          <span>Event</span>
          <span>Price</span>
          <span>Vibe</span>
        </div>
        
        <div className={styles.sliderContainer}>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={filterValue}
            onChange={handleSliderChange}
            className={styles.slider}
          />
          <div 
            className={styles.sliderFill} 
            style={{ width: `${filterValue}%` }}
          ></div>
        </div>
      </div>
      
      {sortedEvents.length > 0 ? (
        <div className={styles.eventsList}>
          {sortedEvents.map((event, index) => (
            <div key={event.id} className={styles.eventCard}>
              <div className={styles.matchScore}>
                <span className={styles.scoreValue}>{event.matchScore}%</span>
                <span className={styles.scoreLabel}>Vibe Match</span>
              </div>
              
              <div className={styles.eventDetails}>
                <h3 className={styles.eventName}>
                  {typeof event.venue === 'object' ? (event.venue?.name || 'Venue TBD') : (event.venue || 'Venue TBD')} - {event.name}
                </h3>
                <div className={styles.eventMeta}>
                  <span>{typeof event.location === 'object' ? (event.location?.city || event.location?.name || 'Location TBD') : (event.location || 'Location TBD')}</span>
                  <span className={styles.bulletSeparator}>•</span>
                  <span>{formatEventDate(event.date)}</span>
                  <span className={styles.bulletSeparator}>•</span>
                  <span className={styles.genreTag}>{event.primaryGenre}</span>
                </div>
              </div>
              
              <div className={styles.eventPrice}>
                {formatPrice(event.price)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noEvents}>
          <p>No events match your current filter settings.</p>
          <p>Try lowering the match threshold.</p>
        </div>
      )}
      
      <div className={styles.feedbackContainer}>
        <p>Did we get it right? <button className={styles.noButton}>no</button></p>
      </div>
    </div>
  );
}