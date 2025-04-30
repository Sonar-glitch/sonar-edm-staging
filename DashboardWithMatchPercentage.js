import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import MatchPercentage from '../components/MatchPercentage'; // Import the component
import styles from '../styles/Dashboard.module.css'; // Assuming original styles
import matchStyles from '../styles/MatchPercentage.module.css'; // Import MatchPercentage styles

// Placeholder components (assuming they exist in the restored version)
const SoundCharacteristics = () => { /* ... implementation ... */ return <div>Sound Characteristics Placeholder</div>; };
const SeasonalVibes = () => { /* ... implementation ... */ return <div>Seasonal Vibes Placeholder</div>; };

// Basic Event Card structure from the restored version (adapt as needed)
const EventCard = ({ event }) => {
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    } catch (e) {
      return dateString; // Fallback
    }
  };

  const matchScore = Math.round(event.matchScore || 0);

  return (
    <div className={styles.eventCard}> {/* Use original dashboard styles */} 
      {/* Add MatchPercentage component */} 
      <div className={matchStyles.matchScoreContainer}> {/* Use MatchPercentage styles for positioning */} 
        <MatchPercentage percentage={matchScore} />
      </div>
      
      {/* Assume original event card content structure */} 
      <img src={event.image || '/placeholder-event.jpg'} alt={event.name} className={styles.eventImage} />
      <h3>{event.name}</h3>
      <p>{event.venue?.name || 'Venue TBD'}</p>
      <p>{formatDate(event.date)}</p>
      {/* Add other details as they were in the original card */} 
      <a href={event.url} target="_blank" rel="noopener noreferrer" className={styles.getTicketsButton}>
        Get Tickets
      </a>
    </div>
  );
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ vibeMatch: 47 }); // Default from screenshot
  // Removed showAllEvents state for simplicity in this step

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        // Using correlated-events endpoint as likely source
        const response = await axios.get('/api/events/correlated-events', {
          params: {
            minMatchScore: filters.vibeMatch,
            // Add other params like lat/lon if needed
          }
        });
        const sortedEvents = (response.data.events || []).sort((a, b) => b.matchScore - a.matchScore);
        setEvents(sortedEvents);
        setError(null);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events.');
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status, filters]);

  // Basic filter change handler (only vibeMatch for now)
  const handleFilterChange = (e) => {
    setFilters({ ...filters, vibeMatch: parseInt(e.target.value) });
  };

  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.container}> {/* Use original dashboard styles */} 
      <Head>
        <title>TIKO - Your EDM Dashboard</title>
        {/* Add other head elements */} 
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>TIKO</h1>
        <p className={styles.description}>
          You're all about house + techno with a vibe shift toward fresh sounds.
        </p>

        {/* Assume top sections exist */} 
        <div className={styles.grid}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Your Sound Characteristics</h2>
            <SoundCharacteristics />
          </div>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Your Year-Round Vibes</h2>
            <SeasonalVibes />
          </div>
        </div>

        <h2 className={styles.eventsTitle}>Events Matching Your Vibe</h2>

        {/* Basic Filter Slider (from screenshot) */} 
        <div className={styles.filterPanel}> {/* Use original dashboard styles */} 
          <label>Vibe Match: {filters.vibeMatch}%+</label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={filters.vibeMatch} 
            onChange={handleFilterChange} 
            className={styles.vibeMatchSlider}
          />
        </div>

        {loading ? (
          <div className={styles.loading}>Loading events...</div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.eventsGrid}> {/* Use original dashboard styles */} 
            {events.map((event) => (
              <EventCard key={event.id || event.name} event={event} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

