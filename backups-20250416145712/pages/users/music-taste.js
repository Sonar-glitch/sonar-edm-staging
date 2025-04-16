import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import styles from '../../styles/MusicTaste.module.css';
import Navigation from '../../components/Navigation';
import SpiderChart from '../../components/SpiderChart';
import ArtistCard from '../../components/ArtistCard';
import TrackCard from '../../components/TrackCard';
import SeasonalMoodCard from '../../components/SeasonalMoodCard';
import EventCard from '../../components/EventCard';

export default function MusicTaste() {
  const { data: session } = useSession();
  const [tasteData, setTasteData] = useState(null);
  const [correlatedEvents, setCorrelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);

  // Fetch music taste data
  useEffect(() => {
    const fetchTasteData = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/spotify/user-taste');
        if (response.data.success) {
          setTasteData(response.data.taste);
        } else {
          setError('Failed to load music taste data');
        }
      } catch (err) {
        console.error('Error fetching music taste data:', err);
        setError('Error fetching music taste data');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchTasteData();
    }
  }, [session]);

  // Fetch correlated events
  useEffect(() => {
    const fetchCorrelatedEvents = async () => {
      try {
        // Get user's location if available
        let locationParams = '';
        if (navigator.geolocation) {
          try {
            const position = await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                maximumAge: 600000
              });
            });
            
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
            
            locationParams = `?lat=${position.coords.latitude}&lon=${position.coords.longitude}`;
          } catch (locErr) {
            console.warn('Could not get user location:', locErr);
            // Continue without location params
          }
        }
        
        const response = await axios.get(`/api/events/correlated-events${locationParams}`);
        if (response.data.success) {
          setCorrelatedEvents(response.data.events);
          if (!userLocation && response.data.userLocation) {
            setUserLocation(response.data.userLocation);
          }
        }
      } catch (err) {
        console.error('Error fetching correlated events:', err);
        // Don't set error state here to avoid blocking the whole page if just events fail
      }
    };

    if (tasteData) {
      fetchCorrelatedEvents();
    }
  }, [tasteData]);

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing your sonic DNA...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.errorContainer}>
          <h2>Error loading music taste</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // If no taste data yet
  if (!tasteData) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.loadingContainer}>
          <p>Preparing your music taste profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navigation activePage="music-taste" />
      
      <div className={styles.header}>
        <h1 className={styles.title}>Your Music Taste Profile</h1>
        <div className={styles.tasteLabels}>
          {tasteData.tasteLabels && tasteData.tasteLabels.map((label, index) => (
            <span key={index} className={styles.tasteLabel}>{label}</span>
          ))}
        </div>
      </div>
      
      {/* Spider Chart Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Genre Affinity</h2>
        <div className={styles.spiderChartContainer}>
          {tasteData.topGenres && tasteData.topGenres.length > 0 ? (
            <SpiderChart genres={tasteData.topGenres} />
          ) : (
            <p className={styles.noData}>No genre data available</p>
          )}
        </div>
      </section>
      
      {/* Music Personality Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Music Personality</h2>
        <p className={styles.personalityText}>{tasteData.tasteProfile}</p>
      </section>
      
      {/* Top Artists Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Artists</h2>
        <div className={styles.artistsGrid}>
          {tasteData.topArtists && tasteData.topArtists.length > 0 ? (
            tasteData.topArtists.map((artist, index) => (
              <ArtistCard key={index} artist={artist} rank={index + 1} />
            ))
          ) : (
            <p className={styles.noData}>No artist data available</p>
          )}
        </div>
      </section>
      
      {/* Top Tracks Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Tracks</h2>
        <div className={styles.tracksGrid}>
          {tasteData.topTracks && tasteData.topTracks.length > 0 ? (
            tasteData.topTracks.map((track, index) => (
              <TrackCard key={index} track={track} rank={index + 1} />
            ))
          ) : (
            <p className={styles.noData}>No track data available</p>
          )}
        </div>
      </section>
      
      {/* Seasonal Mood Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Seasonal Music Mood</h2>
        <div className={styles.seasonalMoodGrid}>
          {tasteData.seasonalMood && Object.keys(tasteData.seasonalMood).length > 0 ? (
            Object.entries(tasteData.seasonalMood).map(([season, genres], index) => (
              <SeasonalMoodCard key={index} season={season} genres={genres} />
            ))
          ) : (
            <p className={styles.noData}>No seasonal mood data available</p>
          )}
        </div>
      </section>
      
      {/* Discover Events Section */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Discover Events Based on Your Taste</h2>
        {userLocation && (
          <p className={styles.locationText}>
            Showing events near {userLocation.city || ''} {userLocation.region || ''}
          </p>
        )}
        <div className={styles.eventsGrid}>
          {correlatedEvents && correlatedEvents.length > 0 ? (
            correlatedEvents.map((event, index) => (
              <EventCard key={index} event={event} />
            ))
          ) : (
            <p className={styles.noData}>No matching events found in your area</p>
          )}
        </div>
      </section>
      
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Sonar EDM Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
