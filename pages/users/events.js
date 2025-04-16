import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '../../components/Navigation';
import styles from '../../styles/Events.module.css';
import Link from 'next/link';

export default function Events() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minMatch, setMinMatch] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const [apiStatus, setApiStatus] = useState(null);
  
  // Protect route - redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  // Fetch events data
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchEvents = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await fetch('/api/events');
          const data = await response.json();
          
          if (data.success) {
            setEvents(data.events);
            if (data.userLocation) {
              setUserLocation(data.userLocation);
            }
            if (data.apiStatus) {
              setApiStatus(data.apiStatus);
            }
          } else {
            setError(data.error || 'Failed to load events');
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching events:', error);
          setError('Unable to load events. Please try again later.');
          setLoading(false);
        }
      };
      
      fetchEvents();
    }
  }, [status]);
  
  // Filter events by match percentage
  const filteredEvents = events.filter(event => event.match >= minMatch);
  
  // Handle slider change
  const handleSliderChange = (e) => {
    setMinMatch(parseInt(e.target.value));
  };
  
  // Navigate back to Music Taste page
  const handleBackToMusicTaste = () => {
    router.push('/users/music-taste');
  };
  
  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Finding events that match your taste...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Discover Events - Sonar EDM Platform</title>
        <meta name="description" content="Find events that match your music taste" />
      </Head>
      
      {/* Add consistent navigation */}
      <Navigation activePage="events" />
      
      <main className={styles.main}>
        {/* Back button to Music Taste */}
        <button 
          className={styles.backButton}
          onClick={handleBackToMusicTaste}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
          Back to Music Taste
        </button>
        
        <h1 className={styles.title}>Discover <span className={styles.highlight}>Events</span></h1>
        
        {/* User's taste badge */}
        {session?.user?.tasteBadge && (
          <div className={styles.tasteBadge}>{session.user.tasteBadge}</div>
        )}
        
        {/* Filters section */}
        <div className={styles.filtersSection}>
          <h2 className={styles.sectionTitle}>Filters</h2>
          
          <div className={styles.filterControl}>
            <label htmlFor="matchSlider" className={styles.filterLabel}>
              Minimum Match Percentage
            </label>
            <div className={styles.sliderContainer}>
              <input
                id="matchSlider"
                type="range"
                min="0"
                max="100"
                value={minMatch}
                onChange={handleSliderChange}
                className={styles.slider}
              />
              <span className={styles.sliderValue}>{minMatch}%</span>
            </div>
          </div>
          
          {userLocation && (
            <div className={styles.locationInfo}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>
                Showing events near {userLocation.city}, {userLocation.region}, {userLocation.country}
              </span>
            </div>
          )}
          
          {/* API Status indicators */}
          {apiStatus && (
            <div className={styles.apiStatus}>
              <div className={`${styles.apiIndicator} ${apiStatus.ticketmaster.error ? styles.apiError : styles.apiSuccess}`}>
                <span className={styles.apiName}>Ticketmaster</span>
                <span className={styles.apiStatusText}>
                  {apiStatus.ticketmaster.error ? 'Error' : `${apiStatus.ticketmaster.count} events`}
                </span>
              </div>
              <div className={`${styles.apiIndicator} ${apiStatus.edmtrain.error ? styles.apiError : styles.apiSuccess}`}>
                <span className={styles.apiName}>EDMtrain</span>
                <span className={styles.apiStatusText}>
                  {apiStatus.edmtrain.error ? 'Error' : `${apiStatus.edmtrain.count} events`}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Events list */}
        <div className={styles.eventsSection}>
          <h2 className={styles.sectionTitle}>
            Events Matching Your Taste
            <span className={styles.eventCount}>{filteredEvents.length} events</span>
          </h2>
          
          {error ? (
            <div className={styles.errorMessage}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              <p>{error}</p>
              <button 
                className={styles.retryButton}
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className={styles.eventsList}>
              {filteredEvents.map(event => (
                <div key={event.id} className={styles.eventCard}>
                  <div className={styles.eventImageContainer}>
                    <img 
                      src={event.image || '/event-placeholder.jpg'} 
                      alt={event.name} 
                      className={styles.eventImage}
                    />
                    <div className={styles.matchBadge}>{event.match}%</div>
                    {event.source === 'mock' && (
                      <div className={styles.mockBadge}>Demo</div>
                    )}
                  </div>
                  
                  <div className={styles.eventInfo}>
                    <h3 className={styles.eventName}>{event.name}</h3>
                    <p className={styles.eventDate}>
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                    <p className={styles.eventVenue}>{event.venue.name}</p>
                    <p className={styles.eventLocation}>{event.venue.location}</p>
                    
                    {event.distance && (
                      <p className={styles.eventDistance}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {event.distance.toFixed(1)} miles away
                      </p>
                    )}
                    
                    <div className={styles.eventGenres}>
                      {event.genres.slice(0, 3).map((genre, idx) => (
                        <span key={idx} className={styles.genreTag}>{genre}</span>
                      ))}
                    </div>
                    
                    {event.ticketLink && (
                      <a 
                        href={event.ticketLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.ticketButton}
                      >
                        Get Tickets
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noEvents}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              <p>No events match your current filter settings</p>
              <p className={styles.noEventsSubtext}>Try lowering the minimum match percentage</p>
              <button 
                className={styles.resetButton}
                onClick={() => setMinMatch(0)}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        {/* Link to venues */}
        <div className={styles.venuesLinkSection}>
          <Link href="/users/venues">
            <a className={styles.venuesLink}>
              <span>Discover Venues</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14"></path>
                <path d="m12 5 7 7-7 7"></path>
              </svg>
            </a>
          </Link>
        </div>
      </main>
    </div>
  );
}
