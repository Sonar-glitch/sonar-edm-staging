import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import axios from 'axios';
import styles from '../styles/EnhancedDashboard.module.css';
import MatchPercentage from '../components/MatchPercentage';

// Simple placeholder component for SoundCharacteristics if it doesn't exist
const SoundCharacteristics = () => {
  return (
    <div>
      <div className={styles.characteristic}>
        <span>Melody</span>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: '80%' }}></div>
        </div>
      </div>
      <div className={styles.characteristic}>
        <span>Danceability</span>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: '90%' }}></div>
        </div>
      </div>
      <div className={styles.characteristic}>
        <span>Energy</span>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: '85%' }}></div>
        </div>
      </div>
      <div className={styles.characteristic}>
        <span>Tempo</span>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: '75%' }}></div>
        </div>
      </div>
      <div className={styles.characteristic}>
        <span>Obscurity</span>
        <div className={styles.progressBar}>
          <div className={styles.progress} style={{ width: '60%' }}></div>
        </div>
      </div>
    </div>
  );
};

// Simple placeholder component for SeasonalVibes if it doesn't exist
const SeasonalVibes = () => {
  return (
    <div>
      <div className={styles.season}>
        <h3>Spring/Now</h3>
        <p>House, Progressive</p>
        <p>Fresh beats & uplifting vibes</p>
      </div>
      <div className={styles.season}>
        <h3>Summer</h3>
        <p>Techno, Tech House</p>
        <p>High energy open air sounds</p>
      </div>
      <div className={styles.season}>
        <h3>Fall</h3>
        <p>Organic House, Downtempo</p>
        <p>Mellow grooves & deep beats</p>
      </div>
      <div className={styles.season}>
        <h3>Winter</h3>
        <p>Deep House, Ambient Techno</p>
        <p>Hypnotic journeys & warm basslines</p>
      </div>
    </div>
  );
};

// Enhanced Event Card Component
const EnhancedEventCard = ({ event }) => {
  // Format date to display as "Thu, May 29"
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  // Get up to 3 artists from the event
  const getArtists = () => {
    if (!event.artists || event.artists.length === 0) {
      return [{ name: event.name, matchScore: event.matchScore }];
    }
    return event.artists.slice(0, 3);
  };

  const artists = getArtists();
  const matchScore = Math.round(event.matchScore || 0);
  
  return (
    <div className={styles.eventCard}>
      <div className={styles.eventHeader}>
        <h3>{event.name}</h3>
        <p>{event.venue?.name || 'Venue not specified'}</p>
      </div>
      
      <div className={styles.eventDetails}>
        <div className={styles.artistList}>
          <p className={styles.featuring}>Featuring:</p>
          {artists.map((artist, index) => (
            <div key={index} className={styles.artist}>
              <span>{artist.name}</span>
              <span className={styles.artistMatch}>
                {Math.round(artist.matchScore || matchScore)}%
              </span>
            </div>
          ))}
        </div>
        
        <div className={styles.eventMeta}>
          <div className={styles.eventType}>
            <span className={styles.genre}>Dance/Electronic</span>
            <span className={styles.date}>{formatDate(event.date)}</span>
          </div>
          
          <a href={event.url} target="_blank" rel="noopener noreferrer" className={styles.detailsButton}>
            Details
          </a>
        </div>
      </div>
      
      <div className={styles.matchScoreContainer}>
        <MatchPercentage percentage={matchScore} />
      </div>
    </div>
  );
};

// Enhanced Filter Panel Component
const EnhancedFilterPanel = ({ onFilterChange, initialFilters }) => {
  const [filters, setFilters] = useState(initialFilters || {
    vibeMatch: 50,
    price: 'all',
    genre: 'all',
    distance: 'local'
  });
  
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  
  const handleVibeMatchChange = (e) => {
    const value = parseInt(e.target.value);
    const newFilters = { ...filters, vibeMatch: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  return (
    <div className={styles.filterPanel}>
      <div className={styles.mainFilter}>
        <div className={styles.vibeMatchLabel}>
          <span>Vibe Match</span>
          <span className={styles.vibeMatchValue}>{filters.vibeMatch}%+</span>
        </div>
        
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={filters.vibeMatch} 
          onChange={handleVibeMatchChange}
          className={styles.vibeMatchSlider}
        />
        
        <button 
          className={styles.moreFiltersButton}
          onClick={() => setShowMoreFilters(!showMoreFilters)}
        >
          <span>More Filters</span>
          <span className={styles.arrowIcon}>{showMoreFilters ? '▲' : '▼'}</span>
        </button>
      </div>
      
      {showMoreFilters && (
        <div className={styles.additionalFilters}>
          <div className={styles.filterGroup}>
            <label>Price Range</label>
            <select 
              value={filters.price} 
              onChange={(e) => handleFilterChange('price', e.target.value)}
            >
              <option value="all">All Prices</option>
              <option value="free">Free</option>
              <option value="low">$</option>
              <option value="medium">$$</option>
              <option value="high">$$$</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Genre</label>
            <select 
              value={filters.genre} 
              onChange={(e) => handleFilterChange('genre', e.target.value)}
            >
              <option value="all">All Genres</option>
              <option value="house">House</option>
              <option value="techno">Techno</option>
              <option value="trance">Trance</option>
              <option value="dnb">Drum & Bass</option>
              <option value="ambient">Ambient</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label>Distance</label>
            <select 
              value={filters.distance} 
              onChange={(e) => handleFilterChange('distance', e.target.value)}
            >
              <option value="local">Local</option>
              <option value="national">National</option>
              <option value="international">International</option>
            </select>
          </div>
        </div>
      )}
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
            <h2 className={styles.sectionTitle}>Your Year-Round Vibes</h2>
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
