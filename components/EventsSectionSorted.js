import { useState, useEffect } from 'react';
import styles from '../styles/EventsSection.module.css'; // Styles for container, list
import NewEventCardRevised from './NewEventCardRevised'; // Import the revised card component
import EnhancedFilterPanel from './EnhancedFilterPanel'; // Import the filter panel

export default function EventsSection({ location }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ matchScore: 70 });

  useEffect(() => {
    if (!location) return;

    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 10000);
        });

        const queryParams = new URLSearchParams({
          lat: location.lat,
          lon: location.lon,
          city: location.city,
        });

        const fetchPromise = fetch(`/api/events?${queryParams.toString()}`);
        const response = await Promise.race([fetchPromise, timeoutPromise]);

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.events && data.events.length > 0) {
          const eventsWithScore = data.events.map(event => ({
            ...event,
            matchScore: typeof event.matchScore === 'number' ? event.matchScore : 0,
            // Assuming API provides necessary fields for NewEventCardRevised
            // e.g., venueType, address, artistList, genres, priceRange, tags
          }));
          setEvents(eventsWithScore);
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

  const handleFilterChange = (newFilters) => {
    setFilters(prevFilters => ({ ...prevFilters, ...newFilters }));
  };

  // Filter and Sort events
  const processedEvents = events
    .filter(event => {
      const scoreMatch = event.matchScore >= filters.matchScore;
      // Add other filter logic here if needed
      return scoreMatch;
    })
    .sort((a, b) => b.matchScore - a.matchScore); // Sort by matchScore descending

  return (
    <div className={styles.container}> {/* Use existing container style */}
      {/* Use EnhancedFilterPanel */}
      <EnhancedFilterPanel
        initialMatchScore={filters.matchScore}
        onFilterChange={handleFilterChange}
      />

      <h2 className={styles.title}>Events Matching Your Vibe</h2>

      {isLoading ? (
        <div className={styles.loading}>Loading events...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : processedEvents.length === 0 ? (
        <div className={styles.noEvents}>No events match your current filters. Try adjusting the filters.</div>
      ) : (
        // Use a simple list layout for horizontal cards
        <div className={styles.eventsList}> 
          {processedEvents.map((event, index) => (
            // Use the revised card component
            <NewEventCardRevised key={index} event={event} /> 
          ))}
        </div>
      )}
    </div>
  );
}

