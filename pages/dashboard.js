import { useState, useEffect } from 'react';
import Head from 'next/head';
import ErrorBoundary from '../components/ErrorBoundary';

// Sample events for fallback
const sampleEvents = [
  {
    name: "House & Techno Night",
    venue: "CODA",
    city: "Toronto",
    address: "794 Bathurst St",
    date: "2025-05-03",
    time: "22:00",
    image: "/images/placeholders/event_placeholder_medium.jpg",
    url: "https://ticketmaster.ca",
    matchScore: 85
  },
  {
    name: "Deep House Sessions",
    venue: "Rebel",
    city: "Toronto",
    address: "11 Polson St",
    date: "2025-05-10",
    time: "21:00",
    image: "/images/placeholders/event_placeholder_medium.jpg",
    url: "https://ticketmaster.ca",
    matchScore: 80
  },
  {
    name: "Techno Underground",
    venue: "Vertigo",
    city: "Toronto",
    address: "567 Queen St W",
    date: "2025-05-17",
    time: "23:00",
    image: "/images/placeholders/event_placeholder_medium.jpg",
    url: "https://ticketmaster.ca",
    matchScore: 75
  }
];

export default function Dashboard() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState({
    lat: '43.65',
    lon: '-79.38',
    city: 'Toronto'
  });

  // Initialize location in localStorage
  useEffect(() => {
    try {
      // Try to get location from localStorage
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        if (parsedLocation && parsedLocation.lat && parsedLocation.lon) {
          setLocation(parsedLocation);
          console.log('Using location from localStorage:', parsedLocation);
          return;
        }
      }
      
      // If no valid location in localStorage, set default Toronto location
      const torontoLocation = { lat: '43.65', lon: '-79.38', city: 'Toronto' };
      localStorage.setItem('userLocation', JSON.stringify(torontoLocation));
      console.log('Set default Toronto location in localStorage');
    } catch (error) {
      console.error('Error handling location:', error);
      // Ensure we have a fallback location
      setLocation({ lat: '43.65', lon: '-79.38', city: 'Toronto' });
    }
  }, []);

  // Fetch events with the location
  useEffect(() => {
    const fetchEvents = async () => {
      if (!location.lat || !location.lon) {
        console.log('Location not available yet, waiting...');
        return;
      }
      
      try {
        setLoading(true);
        console.log(`Fetching events with location: ${location.lat},${location.lon}`);
        
        // Set a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
          console.log('API request timed out, using fallback events');
          setEvents(sampleEvents);
          setLoading(false);
          setError('Request timed out');
        }, 10000);
        
        const response = await fetch(`/api/events?lat=${location.lat}&lon=${location.lon}&city=${location.city}`);
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Events data received:', data);
        
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        } else {
          console.log('No events found, using fallback');
          setEvents(sampleEvents);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
        setError(error.message);
        // Use fallback events
        setEvents(sampleEvents);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, [location]);

  // Handle image errors
  const handleImageError = (e) => {
    e.target.src = '/images/placeholders/event_placeholder_medium.jpg';
  };

  return (
    <div>
      <Head>
        <title>TIKO Dashboard</title>
        <meta name="description" content="Discover electronic music events that match your taste" />
      </Head>

      <main style={{ backgroundColor: '#121225', color: 'white', minHeight: '100vh', padding: '20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <header style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h1 style={{ fontSize: '48px', marginBottom: '10px' }}>TIKO</h1>
            <p>
              You're all about <span style={{ color: '#00ffff' }}>house</span> + <span style={{ color: '#ff00ff' }}>techno</span> with a vibe shift toward <span style={{ color: '#00ff00' }}>fresh sounds</span>.
            </p>
          </header>

          <ErrorBoundary>
            <div style={{ marginBottom: '40px' }}>
              <h2>Events Matching Your Vibe</h2>
              
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Loading events...</div>
              ) : error ? (
                <div style={{ textAlign: 'center', padding: '20px', backgroundColor: '#1e1e2f', borderRadius: '10px' }}>
                  <p>Error loading events: {error}</p>
                  <p>Showing recommended events instead</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {events.map((event, index) => (
                    <div key={event.id || index} style={{ backgroundColor: '#1e1e2f', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.2)' }}>
                      <div style={{ height: '150px', backgroundColor: '#333', position: 'relative' }}>
                        <img 
                          src={event.image || '/images/placeholders/event_placeholder_medium.jpg'} 
                          alt={event.name}
                          onError={handleImageError}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                      <div style={{ padding: '15px' }}>
                        <h3 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>{event.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ color: '#ff00ff', marginRight: '8px' }}>📅</span>
                          <span style={{ fontSize: '14px' }}>{event.date} • {event.time}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                          <span style={{ color: '#00ffff', marginRight: '8px' }}>📍</span>
                          <span style={{ fontSize: '14px' }}>{event.venue}, {event.city}</span>
                        </div>
                        <a 
                          href={event.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          style={{ display: 'block', backgroundColor: '#ff00ff', color: 'white', textAlign: 'center', padding: '8px 0', borderRadius: '5px', textDecoration: 'none', fontWeight: 'bold' }}
                        >
                          Get Tickets
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
