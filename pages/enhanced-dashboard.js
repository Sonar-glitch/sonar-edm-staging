import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '@/styles/EnhancedDashboard.module.css';
import EnhancedEventCard from '@/components/EnhancedEventCard';
import EnhancedFilterPanel from '@/components/EnhancedFilterPanel';
import SoundCharacteristics from '@/components/SoundCharacteristics';
import SeasonalVibes from '@/components/SeasonalVibes';

export default function EnhancedDashboard() {
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

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/events/correlated-events', {
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

  if (status === 'loading') {
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
          You're all about <span className={styles.house}>house</span> + <span className={styles.techno}>techno</span> with a vibe shift toward <span className={styles.fresh}>fresh sounds</span>.
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Your Sound Characteristics</h2>
            <SoundCharacteristics />
          </div>

          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Your Seasonal Vibes</h2>
            <SeasonalVibes />
          </div>
        </div>

        <h2 className={styles.eventsTitle}>Events Matching Your Vibe</h2>
        
        {/* Enhanced Filter Panel */}
        <EnhancedFilterPanel 
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
                <EnhancedEventCard key={event.id || event.name} event={event} />
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
