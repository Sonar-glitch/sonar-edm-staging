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

    try {
      let params = {};
      
      if (location.lat && location.lon) {
        params = { lat: location.lat, lon: location.lon };
      } else if (location.city) {
        params = { city: location.city };
      }
      
      const response = await axios.get('/api/events', { params });
      setEvents(response.data.events || []);
      setIsLoadingEvents(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEventsError('Failed to load events. Please try again.');
      setIsLoadingEvents(false);
    }
  };

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
  };

  const handleRetry = () => {
    fetchEvents();
  };

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
        ) : eventsError ? (
          <div className={styles.noEvents}>
            <p>{eventsError}</p>
            <button className={styles.retryButton} onClick={handleRetry}>Retry</button>
          </div>
        ) : events.length === 0 ? (
          <div className={styles.noEvents}>
            <p>No events found. Please try again later.</p>
            <button className={styles.retryButton} onClick={handleRetry}>Retry</button>
          </div>
        ) : (
          <>
            {events.map((event) => (
              <div 
                key={event.id} 
                className={styles.eventCard}
                onClick={() => window.open(event.url, "_blank")}
              >
                <img 
                  src={event.images?.[0]?.url || "/images/placeholders/event_placeholder_medium.jpg"} 
                  alt={event.name} 
                  className={styles.eventImage} 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/placeholders/event_placeholder_medium.jpg";
                  }}
                />
                <div className={styles.eventInfo}>
                  <h3 className={styles.eventTitle}>{event.name}</h3>
                  <p className={styles.eventDetails}>
                    {event._embedded?.venues?.[0]?.name}, {event._embedded?.venues?.[0]?.city?.name}<br />
                    {event._embedded?.venues?.[0]?.address?.line1}<br />
                    {new Date(event.dates?.start?.localDate).toLocaleDateString()} at {event.dates?.start?.localTime}
                  </p>
                </div>
                <span className={styles.eventMatch}>{event.matchScore}% Match</span>
              </div>
            ))}
            <button className={styles.loadMoreButton}>More Filters</button>
          </>
        )}
      </div>
    </div>
  );
}
