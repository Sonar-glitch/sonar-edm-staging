import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '../styles/EnhancedDashboard.module.css';

// Simple placeholder component for EnhancedEventCard if it doesn't exist
const PlaceholderEventCard = ({ event }) => {
  return (
    <div className={styles.card}>
      <h3>{event.name}</h3>
      <p>{event.venue?.name || 'Venue not specified'}</p>
      <p>{new Date(event.date).toLocaleDateString()}</p>
      <p>Match: {Math.round(event.matchScore || 0)}%</p>
      {event.url && (
        <a href={event.url} target="_blank" rel="noopener noreferrer">
          Get Tickets
        </a>
      )}
    </div>
  );
};

// Simple placeholder component for EnhancedFilterPanel if it doesn't exist
const PlaceholderFilterPanel = ({ onFilterChange, initialFilters }) => {
  const [vibeMatch, setVibeMatch] = useState(initialFilters.vibeMatch || 50);
  
  const handleVibeMatchChange = (e) => {
    const value = parseInt(e.target.value);
    setVibeMatch(value);
    onFilterChange({ ...initialFilters, vibeMatch: value });
  };
  
  return (
    <div className={styles.filterPanel}>
      <div className={styles.filterItem}>
        <label>Vibe Match: {vibeMatch}%+</label>
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={vibeMatch} 
          onChange={handleVibeMatchChange}
        />
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    vibeMatch: 50,
    price: 'all',
    genre: 'all',
    distance: 'local'
  });
  const [showAllEvents, setShowAllEvents] = useState(false);

  // Import components dynamically to handle missing components gracefully
  const [EventCard, setEventCard] = useState(null);
  const [FilterPanel, setFilterPanel] = useState(null);

  useEffect(() => {
    // Try to dynamically import the enhanced components
    const loadComponents = async () => {
      try {
        const eventCardModule = await import('../components/EnhancedEventCard');
        setEventCard(() => eventCardModule.default);
      } catch (err) {
        console.warn('EnhancedEventCard not found, using placeholder');
        setEventCard(() => PlaceholderEventCard);
      }

      try {
        const filterPanelModule = await import('../components/EnhancedFilterPanel');
        setFilterPanel(() => filterPanelModule.default);
      } catch (err) {
        console.warn('EnhancedFilterPanel not found, using placeholder');
        setFilterPanel(() => PlaceholderFilterPanel);
      }
    };

    loadComponents();
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/events', {
          params: {
            minMatchScore: filters.vibeMatch,
            lat: router.query.lat,
            lon: router.query.lon,
            genre: filters.genre !== 'all' ? filters.genre : undefined,
            price: filters.price !== 'all' ? filters.price : undefined,
            distance: filters.distance
          }
        });
        
        // Sort events by match score in descending order
        const sortedEvents = (response.data.events || []).sort((a, b) => 
          b.matchScore - a.matchScore
        );
        
        setEvents(sortedEvents);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status, filters, router.query.lat, router.query.lon]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Reset to only show first 6 events when filters change
    setShowAllEvents(false);
  };

  // Limit displayed events to 6 unless "Show More" is clicked
  const displayedEvents = showAllEvents ? events : events.slice(0, 6);

  if (status === 'loading' || !EventCard || !FilterPanel) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>TIKO - Your EDM Dashboard</title>
        <meta name="description" content="Discover electronic music events that match your taste" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          TIKO
        </h1>
        
        <p className={styles.description}>
          Your personalized EDM event dashboard
        </p>

        <h2 className={styles.eventsTitle}>Events Matching Your Vibe</h2>
        
        {/* Filter Panel */}
        <FilterPanel 
          onFilterChange={handleFilterChange}
          initialFilters={filters}
        />

        {loading ? (
          <div className={styles.loading}>Loading events...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : events.length === 0 ? (
          <div className={styles.noEvents}>No events found for your location</div>
        ) : (
          <>
            <div className={styles.eventsGrid}>
              {displayedEvents.map((event) => (
                <EventCard key={event.id || event.name} event={event} />
              ))}
            </div>
            
            {/* Show More button - only display if there are more than 6 events and not all are shown */}
            {events.length > 6 && !showAllEvents && (
              <button 
                className={styles.showMoreButton}
                onClick={() => setShowAllEvents(true)}
              >
                Show More Events ({events.length - 6} more)
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}
