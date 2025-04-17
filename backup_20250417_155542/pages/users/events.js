import React from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Events.module.css';
import EventCard from '../../components/EventCard';
import Navigation from '../../components/Navigation';

export default function Events() {
  const { data: session, status } = useSession();
  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [filters, setFilters] = React.useState({
    genre: 'all',
    date: 'all',
    matchScore: 0
  });

  React.useEffect(() => {
    if (status === 'authenticated') {
      fetchEvents();
    }
  }, [status]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from your API
      // For now, we'll use mock data
      const mockEvents = [
        {
          id: 'event1',
          name: 'Neon Pulse Festival',
          date: '2025-05-15',
          time: '20:00:00',
          venue: 'Skyline Arena',
          price: '$45-85',
          image: 'https://example.com/events/neon-pulse.jpg',
          artists: ['DJ Quantum', 'Synthwave Sisters', 'Electro Horizon'],
          correlation: 0.87,
          matchFactors: {
            genres: ['Techno', 'House'],
            artists: ['DJ Quantum'],
            mood: 'Energetic',
            recentListenBoost: true
          }
        },
        {
          id: 'event2',
          name: 'Bass Drop Underground',
          date: '2025-05-22',
          time: '22:00:00',
          venue: 'The Warehouse',
          price: '$30',
          image: 'https://example.com/events/bass-drop.jpg',
          artists: ['Sub Tremor', 'Bass Mechanics', 'Waveform'],
          correlation: 0.75,
          matchFactors: {
            genres: ['Dubstep', 'Drum & Bass'],
            artists: [],
            mood: 'Dark'
          }
        },
        {
          id: 'event3',
          name: 'Melodic Dreams',
          date: '2025-06-05',
          time: '21:00:00',
          venue: 'Cloud Nine Lounge',
          price: '$35-60',
          image: 'https://example.com/events/melodic-dreams.jpg',
          artists: ['Harmony Project', 'Aurora Waves', 'Celestial'],
          correlation: 0.92,
          matchFactors: {
            genres: ['Trance', 'Progressive House'],
            artists: ['Aurora Waves'],
            mood: 'Melodic',
            recentListenBoost: true
          }
        },
        {
          id: 'event4',
          name: 'Rhythm Collective',
          date: '2025-06-12',
          time: '20:30:00',
          venue: 'Urban Beat Club',
          price: '$25',
          image: 'https://example.com/events/rhythm-collective.jpg',
          artists: ['Groove Masters', 'Percussion Ensemble', 'Beat Architects'],
          correlation: 0.68,
          matchFactors: {
            genres: ['House', 'Tech House'],
            artists: [],
            mood: 'Groovy'
          }
        },
        {
          id: 'event5',
          name: 'Future Sound Expo',
          date: '2025-06-20',
          time: '19:00:00',
          venue: 'Innovation Center',
          price: '$50-120',
          image: 'https://example.com/events/future-sound.jpg',
          artists: ['Digital Frontier', 'Neural Beats', 'AI Soundscape', 'Quantum Noise'],
          correlation: 0.81,
          matchFactors: {
            genres: ['Experimental', 'IDM'],
            artists: ['Neural Beats'],
            mood: 'Futuristic'
          }
        },
        {
          id: 'event6',
          name: 'Summer Bass Festival',
          date: '2025-07-10',
          time: '16:00:00',
          venue: 'Riverside Park',
          price: '$65-150',
          image: 'https://example.com/events/summer-bass.jpg',
          artists: ['Bass Droppers', 'Low Frequency', 'Subwoofer Crew', 'Amplitude', 'Wave Riders'],
          correlation: 0.79,
          matchFactors: {
            genres: ['Bass House', 'Dubstep'],
            artists: [],
            mood: 'Energetic'
          }
        }
      ];
      
      // Simulate API delay
      setTimeout(() => {
        setEvents(mockEvents);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const filteredEvents = events.filter(event => {
    // Filter by match score
    if (event.correlation * 100 < filters.matchScore) {
      return false;
    }
    
    // Filter by genre (if not 'all')
    if (filters.genre !== 'all' && 
        !event.matchFactors.genres.some(g => g.toLowerCase().includes(filters.genre.toLowerCase()))) {
      return false;
    }
    
    // Filter by date
    const eventDate = new Date(event.date);
    const today = new Date();
    
    if (filters.date === 'this-week') {
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      return eventDate >= today && eventDate <= nextWeek;
    } else if (filters.date === 'this-month') {
      const nextMonth = new Date();
      nextMonth.setMonth(today.getMonth() + 1);
      return eventDate >= today && eventDate <= nextMonth;
    }
    
    return true; // 'all' dates
  });

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Events | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Finding events that match your taste...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Events | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.unauthorizedContainer}>
          <h1 className={styles.title}>Connect to Discover Events</h1>
          <p className={styles.subtitle}>Sign in with Spotify to find events that match your music taste</p>
          <Link href="/api/auth/signin" className={styles.connectButton}>
            Connect with Spotify
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Events | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.errorContainer}>
          <h1 className={styles.title}>Oops! Something went wrong</h1>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchEvents} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Events | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Events For You</h1>
          <p className={styles.subtitle}>
            Discover events that match your unique music taste
          </p>
        </div>
        
        <div className={styles.filtersContainer}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Genre</label>
            <select 
              className={styles.filterSelect}
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
            >
              <option value="all">All Genres</option>
              <option value="house">House</option>
              <option value="techno">Techno</option>
              <option value="trance">Trance</option>
              <option value="dubstep">Dubstep</option>
              <option value="drum">Drum & Bass</option>
              <option value="experimental">Experimental</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Date</label>
            <select 
              className={styles.filterSelect}
              value={filters.date}
              onChange={(e) => handleFilterChange('date', e.target.value)}
            >
              <option value="all">All Dates</option>
              <option value="this-week">This Week</option>
              <option value="this-month">This Month</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Match Score</label>
            <div className={styles.rangeContainer}>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={filters.matchScore}
                onChange={(e) => handleFilterChange('matchScore', parseInt(e.target.value))}
                className={styles.rangeInput}
              />
              <span className={styles.rangeValue}>{filters.matchScore}%+</span>
            </div>
          </div>
        </div>
        
        {filteredEvents.length > 0 ? (
          <div className={styles.eventsGrid}>
            {filteredEvents.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                correlation={event.correlation}
              />
            ))}
          </div>
        ) : (
          <div className={styles.noEventsContainer}>
            <h2 className={styles.noEventsTitle}>No matching events found</h2>
            <p className={styles.noEventsMessage}>
              Try adjusting your filters or check back later for new events.
            </p>
            <button 
              className={styles.resetButton}
              onClick={() => setFilters({ genre: 'all', date: 'all', matchScore: 0 })}
            >
              Reset Filters
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
