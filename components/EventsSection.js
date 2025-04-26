import { useState, useEffect } from 'react';
import styles from '../styles/EventsSection.module.css';

export default function EventsSection({ location }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [matchScore, setMatchScore] = useState(70);

  useEffect(() => {
    if (!location) return;
    
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 10000);
        });
        
        const fetchPromise = fetch(`/api/events?lat=${location.lat}&lon=${location.lon}&city=${location.city}`);
        
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        } else {
          setError('No events found for your location');
        }
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [location]);

  const handleMatchScoreChange = (e) => {
    setMatchScore(e.target.value);
  };

  const filteredEvents = events.filter(event => event.matchScore >= matchScore);

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Events Matching Your Vibe</h2>
      
      <div className={styles.matchSlider}>
        <span>Vibe Match: {matchScore}%+</span>
        <input
          type="range"
          min="0"
          max="100"
          value={matchScore}
          onChange={handleMatchScoreChange}
          className={styles.slider}
        />
      </div>
      
      {isLoading ? (
        <div className={styles.loading}>Loading events...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : filteredEvents.length === 0 ? (
        <div className={styles.noEvents}>No events match your current filter. Try lowering the match score.</div>
      ) : (
        <div className={styles.eventsGrid}>
          {filteredEvents.map((event, index) => (
            <EventCard key={index} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

function EventCard({ event }) {
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = '/images/placeholders/event_placeholder_medium.jpg';
  };

  return (
    <div className={styles.eventCard}>
      <div className={styles.imageContainer}>
        <img 
          src={event.image || '/images/placeholders/event_placeholder_medium.jpg'} 
          alt={event.name}
          onError={handleImageError}
          className={styles.eventImage}
        />
      </div>
      <div className={styles.eventDetails}>
        <h3 className={styles.eventName}>{event.name}</h3>
        <div className={styles.eventDate}>
          <span className={styles.icon}>📅</span>
          <span>{event.date} • {event.time}</span>
        </div>
        <div className={styles.eventVenue}>
          <span className={styles.icon}>📍</span>
          <span>{event.venue}, {event.city}</span>
        </div>
        <a 
          href={event.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.ticketButton}
        >
          Get Tickets
        </a>
      </div>
    </div>
  );
}
