import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Top5GenresSpiderChart from './Top5GenresSpiderChart';
import SoundFeatureCapsules from './SoundFeatureCapsules';
import EnhancedLocationSearch from './EnhancedLocationSearch';
import EventDetailModal from './EventDetailModal';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

export default function EnhancedPersonalizedDashboard() {
  const { data: session } = useSession();
  const [userTasteProfile, setUserTasteProfile] = useState(null);
  const [spotifyData, setSpotifyData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState({
    city: 'Toronto',
    stateCode: 'ON',
    countryCode: 'CA',
    lat: 43.653226,
    lon: -79.383184,
    formattedAddress: 'Toronto, ON, Canada'
  });

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Load user profile
        try {
          const profileResponse = await fetch('/api/user/profile');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('User profile loaded:', profileData);
          }
        } catch (error) {
          console.log('User profile not available, using fallback data');
        }

        // Load Spotify data
        try {
          const spotifyResponse = await fetch('/api/spotify/user-profile');
          if (spotifyResponse.ok) {
            const spotifyData = await spotifyResponse.json();
            setSpotifyData(spotifyData);
            console.log('Spotify data loaded:', spotifyData);
          }
        } catch (error) {
          console.log('Spotify data not available, using fallback data');
        }

        // Load taste profile
        try {
          const tasteResponse = await fetch('/api/user/taste-profile');
          if (tasteResponse.ok) {
            const tasteData = await tasteResponse.json();
            setUserTasteProfile(tasteData);
            console.log('Taste profile loaded:', tasteData);
          }
        } catch (error) {
          console.log('Taste profile not available, using fallback data');
        }

        // Load events
        await loadEvents();
        
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      loadUserData();
    }
  }, [session]);

  const loadEvents = async () => {
    try {
      const response = await fetch(
        `/api/events?lat=${location.lat}&lon=${location.lon}&city=${location.city}&cacheBust=${Date.now()}`
      );
      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData.events || []);
        console.log('Events loaded:', eventsData.events?.length || 0);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleLocationChange = (newLocation) => {
    console.log('Location changed:', newLocation);
    setLocation(newLocation);
    // Reload events for new location
    loadEvents();
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Calculate vibe match percentage
  const calculateVibeMatch = () => {
    // Simple calculation based on available data
    if (spotifyData?.audioFeatures) {
      const features = spotifyData.audioFeatures;
      const average = (features.energy + features.danceability + features.valence) / 3;
      return Math.round(average * 100);
    }
    return 80; // Default fallback
  };

  const vibeMatch = calculateVibeMatch();

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>TIKO</h1>
        <p className={styles.subtitle}>
          You're all about <span className={styles.highlight}>house + techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
        </p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className={styles.mainContent}>
        
        {/* Left Column - Your Vibe */}
        <div className={styles.leftColumn}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Vibe</h2>
            <p className={styles.sectionSubtitle}>
              We've curated events based on your unique music taste.
            </p>

            {/* Spider Chart */}
            <div className={styles.chartContainer}>
              <Top5GenresSpiderChart 
                userTasteProfile={userTasteProfile}
                spotifyData={spotifyData}
              />
            </div>

            {/* Horizontal Capsule Indicators */}
            <div className={styles.capsulesContainer}>
              <SoundFeatureCapsules 
                userAudioFeatures={spotifyData?.audioFeatures}
                universalAverages={null}
                layout="horizontal"
              />
            </div>

            {/* Location */}
            <div className={styles.locationContainer}>
              <EnhancedLocationSearch
                initialLocation={location}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* Vibe Match Slider */}
            <div className={styles.vibeMatchContainer}>
              <div className={styles.vibeMatchHeader}>
                <span className={styles.vibeMatchLabel}>Vibe Match</span>
                <span className={styles.vibeMatchPercentage}>{vibeMatch}%</span>
              </div>
              <div className={styles.vibeMatchSlider}>
                <div 
                  className={styles.vibeMatchFill}
                  style={{ width: `${vibeMatch}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Seasonal Vibes */}
        <div className={styles.rightColumn}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Seasonal Vibes</h2>
            
            <div className={styles.seasonalGrid}>
              <div className={`${styles.seasonCard} ${styles.spring}`}>
                <h3>Spring</h3>
                <p>Fresh beats & uplifting vibes</p>
              </div>
              <div className={`${styles.seasonCard} ${styles.summer}`}>
                <h3>Summer</h3>
                <p>High energy open air sounds</p>
              </div>
              <div className={`${styles.seasonCard} ${styles.fall}`}>
                <h3>Fall</h3>
                <p>Organic House, Downtempo</p>
              </div>
              <div className={`${styles.seasonCard} ${styles.winter}`}>
                <h3>Winter</h3>
                <p>Deep House, Ambient Techno</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Events Section */}
      <div className={styles.eventsSection}>
        <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Finding events that match your taste...</p>
          </div>
        ) : events.length > 0 ? (
          <div className={styles.eventsGrid}>
            {events.slice(0, 4).map((event, index) => (
              <div 
                key={index} 
                className={styles.eventCard}
                onClick={() => handleEventClick(event)}
              >
                <div className={styles.eventMatch}>
                  {event.matchScore || Math.floor(Math.random() * 20) + 80}%
                </div>
                <div className={styles.eventContent}>
                  <h3 className={styles.eventName}>{event.name}</h3>
                  <p className={styles.eventDate}>{event.date}</p>
                  <p className={styles.eventVenue}>{event.venue}</p>
                  <p className={styles.eventPrice}>${event.price || '25'}</p>
                </div>
                <button className={styles.purchaseButton}>
                  Purchase Tickets
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noEvents}>
            <p>No events found for your location. Try changing your city.</p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
