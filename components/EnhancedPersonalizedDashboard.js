import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedEventList from './EnhancedEventList';
import EnhancedLocationSearch from './EnhancedLocationSearch';
import Top5GenresSpiderChart from './Top5GenresSpiderChart';
import SoundFeatureCapsules from './SoundFeatureCapsules';
import EventDetailModal from './EventDetailModal';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';

const EnhancedPersonalizedDashboard = () => {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [spotifyData, setSpotifyData] = useState(null);
  const [userTasteProfile, setUserTasteProfile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Load user's Spotify data and taste profile
  useEffect(() => {
    if (session?.user) {
      loadSpotifyData();
      loadUserTasteProfile();
    }
  }, [session]);

  // Load events when location changes
  useEffect(() => {
    if (selectedLocation) {
      loadEvents();
    }
  }, [selectedLocation]);

  const loadSpotifyData = async () => {
    try {
      const response = await fetch('/api/spotify/user-profile');
      if (response.ok) {
        const data = await response.json();
        setSpotifyData(data);
      }
    } catch (error) {
      console.error('Error loading Spotify data:', error);
    }
  };

  const loadUserTasteProfile = async () => {
    try {
      const response = await fetch('/api/user/taste-profile');
      if (response.ok) {
        const data = await response.json();
        setUserTasteProfile(data);
      }
    } catch (error) {
      console.error('Error loading taste profile:', error);
    }
  };

  const loadEvents = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { latitude, longitude } = selectedLocation;
      const response = await fetch(
        `/api/events/near?latitude=${latitude}&longitude=${longitude}&radius=50&userId=${session?.user?.id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load events');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (event) => {
    try {
      const response = await fetch('/api/user/interested-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id || event.id })
      });
      
      if (response.ok) {
        setEvents(prevEvents => 
          prevEvents.map(e => 
            (e._id || e.id) === (event._id || event.id) 
              ? { ...e, isInterested: true }
              : e
          )
        );
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.authPrompt}>
          <h2>Welcome to TIKO</h2>
          <p>Please sign in with Spotify to discover events tailored to your music taste.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.title}>
            <span className={styles.logo}>TIKO</span>
          </h1>
          <p className={styles.subtitle}>
            You're all about <span className={styles.highlight}>house + techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
          </p>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* Location Search */}
        <div className={styles.locationSection}>
          <EnhancedLocationSearch 
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* User Profile Section - NEW COMPONENTS */}
        <div className={styles.profileSection}>
          <div className={styles.profileGrid}>
            {/* Spider Chart for Top 5 Genres */}
            <div className={styles.profileCard}>
              <Top5GenresSpiderChart 
                userTasteProfile={userTasteProfile}
                spotifyData={spotifyData}
              />
            </div>

            {/* Sound Feature Capsules */}
            <div className={styles.profileCard}>
              <SoundFeatureCapsules 
                userAudioFeatures={spotifyData?.audioFeatures}
                universalAverages={null}
              />
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className={styles.eventsSection}>
          <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Finding events that match your taste...</p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={loadEvents} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          )}
          
          {!loading && !error && events.length > 0 && (
            <EnhancedEventList 
              events={events}
              onEventClick={handleEventClick}
              onSaveEvent={handleSaveEvent}
            />
          )}
          
          {!loading && !error && events.length === 0 && selectedLocation && (
            <div className={styles.noEvents}>
              <p>No events found in this area. Try a different location or check back later.</p>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSaveEvent={handleSaveEvent}
          spotifyData={spotifyData}
        />
      )}
    </div>
  );
};

export default EnhancedPersonalizedDashboard;
