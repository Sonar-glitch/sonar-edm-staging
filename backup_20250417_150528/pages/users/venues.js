import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '../../components/Navigation';
import styles from '../../styles/Venues.module.css';
import Link from 'next/link';

export default function Venues() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [minMatch, setMinMatch] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  
  // Protect route - redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  // Fetch venues data
  useEffect(() => {
    if (status === 'authenticated') {
      const fetchVenues = async () => {
        try {
          setLoading(true);
          setError(null);
          
          const response = await fetch('/api/venues');
          const data = await response.json();
          
          if (data.success) {
            setVenues(data.venues);
            if (data.userLocation) {
              setUserLocation(data.userLocation);
            }
          } else {
            setError(data.error || 'Failed to load venues');
          }
          
          setLoading(false);
        } catch (error) {
          console.error('Error fetching venues:', error);
          setError('Unable to load venues. Please try again later.');
          setLoading(false);
        }
      };
      
      fetchVenues();
    }
  }, [status]);
  
  // Filter venues by match percentage
  const filteredVenues = venues.filter(venue => venue.match >= minMatch);
  
  // Handle slider change
  const handleSliderChange = (e) => {
    setMinMatch(parseInt(e.target.value));
  };
  
  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Finding venues that match your taste...</p>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Discover Venues - Sonar EDM Platform</title>
        <meta name="description" content="Find venues that match your music taste" />
      </Head>
      
      {/* Add consistent navigation */}
      <Navigation activePage="venues" />
      
      <main className={styles.main}>
        <h1 className={styles.title}>Discover <span className={styles.highlight}>Venues</span></h1>
        
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
                Showing venues near {userLocation.city}, {userLocation.region}, {userLocation.country}
              </span>
            </div>
          )}
        </div>
        
        {/* Venues list */}
        <div className={styles.venuesSection}>
          <h2 className={styles.sectionTitle}>
            Venues Matching Your Taste
            <span className={styles.venueCount}>{filteredVenues.length} venues</span>
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
          ) : filteredVenues.length > 0 ? (
            <div className={styles.venuesList}>
              {filteredVenues.map(venue => (
                <div key={venue.id} className={styles.venueCard}>
                  <div className={styles.venueImageContainer}>
                    <img 
                      src={venue.image || '/venue-placeholder.jpg'} 
                      alt={venue.name} 
                      className={styles.venueImage}
                    />
                    <div className={styles.matchBadge}>{venue.match}%</div>
                  </div>
                  
                  <div className={styles.venueInfo}>
                    <h3 className={styles.venueName}>{venue.name}</h3>
                    <p className={styles.venueLocation}>{venue.location}</p>
                    
                    {venue.distance && (
                      <p className={styles.venueDistance}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"></circle>
                          <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        {venue.distance.toFixed(1)} miles away
                      </p>
                    )}
                    
                    <div className={styles.venueGenres}>
                      {venue.genres.map((genre, idx) => (
                        <span key={idx} className={styles.genreTag}>{genre}</span>
                      ))}
                    </div>
                    
                    <p className={styles.venueDescription}>
                      {venue.description || 'No description available'}
                    </p>
                    
                    {venue.website && (
                      <a 
                        href={venue.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.websiteButton}
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noVenues}>
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
              </svg>
              <p>No venues match your current filter settings</p>
              <p className={styles.noVenuesSubtext}>Try lowering the minimum match percentage</p>
              <button 
                className={styles.resetButton}
                onClick={() => setMinMatch(0)}
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
        
        {/* Link to events */}
        <div className={styles.eventsLinkSection}>
          <Link href="/users/events">
            <a className={styles.eventsLink}>
              <span>Discover Events</span>
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
