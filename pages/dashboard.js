import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import styles from '../styles/Dashboard.module.css';
import LocationDisplay from '../components/LocationDisplay';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userTaste, setUserTaste] = useState(null);
  const [events, setEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [location, setLocation] = useState({
    lat: null,
    lon: null,
    city: null
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Fetch user taste data
  useEffect(() => {
    if (session) {
      const fetchUserTaste = async () => {
        try {
          const response = await axios.get('/api/spotify/user-taste');
          setUserTaste(response.data);
        } catch (error) {
          console.error('Error fetching user taste:', error);
        }
      };

      fetchUserTaste();
    }
  }, [session]);

  // Fetch events when location changes
  useEffect(() => {
    if (location.lat && location.lon) {
      fetchEvents();
    } else if (location.city) {
      fetchEvents();
    }
  }, [location]);

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    setLoadingTimeout(false);
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log("Events loading timeout triggered");
      setLoadingTimeout(true);
      setEventsError('Loading took too long. Please try again.');
      setIsLoadingEvents(false);
    }, 10000); // 10 second timeout

    try {
      let params = {};
      
      if (location.lat && location.lon) {
        params = { 
          lat: location.lat, 
          lon: location.lon 
        };
        console.log(`Fetching events with coordinates: lat=${location.lat}, lon=${location.lon}`);
      } else if (location.city) {
        params = { city: location.city };
        console.log(`Fetching events with city: ${location.city}`);
      } else {
        // Default to Toronto if no location
        params = { 
          city: 'Toronto',
          lat: '43.65',
          lon: '-79.38'
        };
        console.log('No location set, defaulting to Toronto');
      }
      
      // Add a timestamp to prevent caching
      params.timestamp = new Date().getTime();
      
      console.log("Fetching events with params:", params);
      const response = await axios.get('/api/events', { 
        params,
        timeout: 15000 // 15 second timeout
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      // Log the response for debugging
      console.log("Events API response:", {
        source: response.data.source,
        eventCount: response.data.events?.length || 0
      });
      
      // Validate events data before setting state
      if (response.data.events && Array.isArray(response.data.events)) {
        // Filter out any invalid events
        const validEvents = response.data.events.filter(event => event && event.id);
        setEvents(validEvents);
      } else {
        console.error("Invalid events data received:", response.data);
        setEvents([]);
        setEventsError('Received invalid event data. Please try again.');
      }
      
      setIsLoadingEvents(false);
      setLoadingTimeout(false);
    } catch (error) {
      // Clear the timeout since we got an error
      clearTimeout(timeoutId);
      
      console.error('Error fetching events:', error);
      setEventsError('Failed to load events. Please try again.');
      setIsLoadingEvents(false);
      setLoadingTimeout(false);
    }
  };

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
  };

  const handleRetry = () => {
    fetchEvents();
  };

  // Fallback events for when API fails
  const fallbackEvents = [
    {
      id: "fallback-1",
      name: "Toronto House Night",
      url: "https://www.ticketmaster.ca/event/fallback1",
      images: [{ url: "/images/placeholders/event_placeholder_medium.jpg" }],
      _embedded: {
        venues: [{
          name: "CODA",
          city: { name: "Toronto" },
          address: { line1: "794 Bathurst St" }
        }]
      },
      dates: {
        start: {
          localDate: "2025-05-15",
          localTime: "22:00:00"
        }
      },
      matchScore: 85
    },
    {
      id: "fallback-2",
      name: "Techno Underground",
      url: "https://www.ticketmaster.ca/event/fallback2",
      images: [{ url: "/images/placeholders/event_placeholder_medium.jpg" }],
      _embedded: {
        venues: [{
          name: "REBEL",
          city: { name: "Toronto" },
          address: { line1: "11 Polson St" }
        }]
      },
      dates: {
        start: {
          localDate: "2025-05-22",
          localTime: "23:00:00"
        }
      },
      matchScore: 92
    }
  ];

  if (status === 'loading') {
    return <div className={styles.container}>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>TIKO</h1>
        <p className={styles.subtitle}>
          You're all about <span style={{ color: '#00c6ff' }}>house</span> + <span style={{ color: '#ff00cc' }}>techno</span> with a vibe shift toward <span style={{ color: '#00ff9d' }}>fresh sounds</span>.
        </p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Your Sound Characteristics</h2>
          <div className={styles.soundCharacteristics}>
            <div className={styles.characteristicRow}>
              <span className={styles.characteristicLabel}>Melody</span>
              <div className={styles.characteristicBar}>
                <div className={styles.characteristicFill} style={{ width: '65%', background: 'linear-gradient(90deg, #00c6ff, #ff00cc)' }}></div>
              </div>
            </div>
            <div className={styles.characteristicRow}>
              <span className={styles.characteristicLabel}>Danceability</span>
              <div className={styles.characteristicBar}>
                <div className={styles.characteristicFill} style={{ width: '85%', background: 'linear-gradient(90deg, #00c6ff, #ff00cc)' }}></div>
              </div>
            </div>
            <div className={styles.characteristicRow}>
              <span className={styles.characteristicLabel}>Energy</span>
              <div className={styles.characteristicBar}>
                <div className={styles.characteristicFill} style={{ width: '75%', background: 'linear-gradient(90deg, #00c6ff, #ff00cc)' }}></div>
              </div>
            </div>
            <div className={styles.characteristicRow}>
              <span className={styles.characteristicLabel}>Tempo</span>
              <div className={styles.characteristicBar}>
                <div className={styles.characteristicFill} style={{ width: '60%', background: 'linear-gradient(90deg, #00c6ff, #ff00cc)' }}></div>
              </div>
            </div>
            <div className={styles.characteristicRow}>
              <span className={styles.characteristicLabel}>Obscurity</span>
              <div className={styles.characteristicBar}>
                <div className={styles.characteristicFill} style={{ width: '50%', background: 'linear-gradient(90deg, #00c6ff, #ff00cc)' }}></div>
              </div>
            </div>
          </div>
          <div className={styles.locationDisplayContainer}>
            <LocationDisplay onLocationChange={handleLocationChange} />
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.cardTitle}>
            <span role="img" aria-label="sparkles">✨</span> Your Year-Round Vibes
          </h2>
          <p className={styles.cardContent}>
            Your taste evolves from <span style={{ color: '#ff00cc' }}>deep house vibes</span> in winter to <span style={{ color: '#00ff9d' }}>high-energy techno</span> in summer, with a consistent appreciation for <span style={{ color: '#ff00cc' }}>melodic elements</span> year-round.
          </p>

          <div className={styles.seasonGrid}>
            <div className={styles.seasonCard}>
              <h3 className={styles.seasonTitle}>
                <span role="img" aria-label="cherry blossom">🌸</span> Spring
                <span className={styles.currentSeason}>Now</span>
              </h3>
              <p className={styles.seasonDescription}>
                <strong>Vibe:</strong><br />
                House, Progressive<br />
                Fresh beats & uplifting vibes
              </p>
            </div>
            <div className={styles.seasonCard}>
              <h3 className={styles.seasonTitle}>
                <span role="img" aria-label="sun">☀️</span> Summer
              </h3>
              <p className={styles.seasonDescription}>
                <strong>Vibe:</strong><br />
                Techno, Tech House<br />
                High energy open air sounds
              </p>
            </div>
            <div className={styles.seasonCard}>
              <h3 className={styles.seasonTitle}>
                <span role="img" aria-label="fallen leaf">🍂</span> Fall
              </h3>
              <p className={styles.seasonDescription}>
                <strong>Vibe:</strong><br />
                Organic House, Downtempo<br />
                Mellow grooves & deep beats
              </p>
            </div>
            <div className={styles.seasonCard}>
              <h3 className={styles.seasonTitle}>
                <span role="img" aria-label="snowflake">❄️</span> Winter
              </h3>
              <p className={styles.seasonDescription}>
                <strong>Vibe:</strong><br />
                Deep House, Ambient Techno<br />
                Hypnotic journeys & warm basslines
              </p>
            </div>
          </div>
          
          <div style={{ textAlign: 'right', marginTop: '1rem' }}>
            <span>Did we get it right? </span>
            <a href="#" style={{ color: '#ff00cc' }}>No</a>
          </div>
        </div>
      </div>

      <div className={styles.eventList}>
        <h2 className={styles.cardTitle}>Events Matching Your Vibe</h2>
        <div>
          <p>Vibe Match: 70%+</p>
          <div style={{ 
            width: '100%', 
            height: '10px', 
            background: 'linear-gradient(90deg, #2a2a3a, #2a2a3a)', 
            borderRadius: '5px',
            position: 'relative',
            marginBottom: '2rem'
          }}>
            <div style={{
              position: 'absolute',
              left: '70%',
              top: '-5px',
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              background: '#00c6ff',
            }}></div>
          </div>
        </div>

        {isLoadingEvents ? (
          <div className={styles.noEvents}>Loading events...</div>
        ) : loadingTimeout ? (
          <div className={styles.noEvents}>
            <p>Loading took too long. Showing fallback events instead.</p>
            <div>
              {fallbackEvents.map((event) => (
                <div 
                  key={event.id} 
                  className={styles.eventCard}
                  onClick={() => event.url ? window.open(event.url, "_blank") : null}
                >
                  <img 
                    src="/images/placeholders/event_placeholder_medium.jpg" 
                    alt={event.name || 'Event'} 
                    className={styles.eventImage}
                  />
                  <div className={styles.eventInfo}>
                    <h3 className={styles.eventTitle}>{event.name || 'Unnamed Event'}</h3>
                    <p className={styles.eventDetails}>
                      {event._embedded?.venues?.[0]?.name || 'Unknown Venue'}, {event._embedded?.venues?.[0]?.city?.name || 'Unknown City'}<br />
                      {event._embedded?.venues?.[0]?.address?.line1 || ''}<br />
                      {event.dates?.start?.localDate ? new Date(event.dates.start.localDate).toLocaleDateString() : 'TBD'} at {event.dates?.start?.localTime || 'TBD'}
                    </p>
                  </div>
                  <span className={styles.eventMatch}>{event.matchScore || 70}% Match</span>
                </div>
              ))}
              <button className={styles.retryButton} onClick={handleRetry}>Retry with Ticketmaster</button>
            </div>
          </div>
        ) : eventsError ? (
          <div className={styles.noEvents}>
            <p>{eventsError}</p>
            <div>
              {fallbackEvents.map((event) => (
                <div 
                  key={event.id} 
                  className={styles.eventCard}
                  onClick={() => event.url ? window.open(event.url, "_blank") : null}
                >
                  <img 
                    src="/images/placeholders/event_placeholder_medium.jpg" 
                    alt={event.name || 'Event'} 
                    className={styles.eventImage}
                  />
                  <div className={styles.eventInfo}>
                    <h3 className={styles.eventTitle}>{event.name || 'Unnamed Event'}</h3>
                    <p className={styles.eventDetails}>
                      {event._embedded?.venues?.[0]?.name || 'Unknown Venue'}, {event._embedded?.venues?.[0]?.city?.name || 'Unknown City'}<br />
                      {event._embedded?.venues?.[0]?.address?.line1 || ''}<br />
                      {event.dates?.start?.localDate ? new Date(event.dates.start.localDate).toLocaleDateString() : 'TBD'} at {event.dates?.start?.localTime || 'TBD'}
                    </p>
                  </div>
                  <span className={styles.eventMatch}>{event.matchScore || 70}% Match</span>
                </div>
              ))}
              <button className={styles.retryButton} onClick={handleRetry}>Retry with Ticketmaster</button>
            </div>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.noEvents}>
            <p>No events found. Showing fallback events instead.</p>
            <div>
              {fallbackEvents.map((event) => (
                <div 
                  key={event.id} 
                  className={styles.eventCard}
                  onClick={() => event.url ? window.open(event.url, "_blank") : null}
                >
                  <img 
                    src="/images/placeholders/event_placeholder_medium.jpg" 
                    alt={event.name || 'Event'} 
                    className={styles.eventImage}
                  />
                  <div className={styles.eventInfo}>
                    <h3 className={styles.eventTitle}>{event.name || 'Unnamed Event'}</h3>
                    <p className={styles.eventDetails}>
                      {event._embedded?.venues?.[0]?.name || 'Unknown Venue'}, {event._embedded?.venues?.[0]?.city?.name || 'Unknown City'}<br />
                      {event._embedded?.venues?.[0]?.address?.line1 || ''}<br />
                      {event.dates?.start?.localDate ? new Date(event.dates.start.localDate).toLocaleDateString() : 'TBD'} at {event.dates?.start?.localTime || 'TBD'}
                    </p>
                  </div>
                  <span className={styles.eventMatch}>{event.matchScore || 70}% Match</span>
                </div>
              ))}
              <button className={styles.retryButton} onClick={handleRetry}>Retry with Ticketmaster</button>
            </div>
          </div>
        ) : (
          <div>
            {events.map((event) => {
              // Skip rendering if event is missing critical data
              if (!event || !event.id) return null;
              
              // Safely extract nested properties
              const venueName = event._embedded?.venues?.[0]?.name || 'Unknown Venue';
              const cityName = event._embedded?.venues?.[0]?.city?.name || 'Unknown City';
              const address = event._embedded?.venues?.[0]?.address?.line1 || '';
              const eventDate = event.dates?.start?.localDate ? new Date(event.dates.start.localDate).toLocaleDateString() : 'TBD';
              const eventTime = event.dates?.start?.localTime || 'TBD';
              const imageUrl = event.images?.[0]?.url || "/images/placeholders/event_placeholder_medium.jpg";
              const matchScore = event.matchScore || 70;
              
              return (
                <div 
                  key={event.id} 
                  className={styles.eventCard}
                  onClick={() => event.url ? window.open(event.url, "_blank") : null}
                >
                  <img 
                    src={imageUrl} 
                    alt={event.name || 'Event'} 
                    className={styles.eventImage} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/images/placeholders/event_placeholder_medium.jpg";
                    }}
                  />
                  <div className={styles.eventInfo}>
                    <h3 className={styles.eventTitle}>{event.name || 'Unnamed Event'}</h3>
                    <p className={styles.eventDetails}>
                      {venueName}, {cityName}<br />
                      {address}<br />
                      {eventDate} at {eventTime}
                    </p>
                  </div>
                  <span className={styles.eventMatch}>{matchScore}% Match</span>
                </div>
              );
            })}
            <button className={styles.loadMoreButton}>More Filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
