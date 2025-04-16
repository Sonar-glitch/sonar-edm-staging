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
import VibeQuizCard from '../../components/VibeQuizCard';
import EventsNavigationCard from '../../components/EventsNavigationCard';

export default function MusicTaste() {
  const { data: session } = useSession();
  const [tasteData, setTasteData] = useState(null);
  const [correlatedEvents, setCorrelatedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [activeSection, setActiveSection] = useState(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

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

  // Handle scroll events for section highlighting and scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Show/hide scroll to top button
      if (window.scrollY > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
      
      // Determine active section based on scroll position
      const sections = document.querySelectorAll('section[id]');
      let currentSection = null;
      
      sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        const sectionHeight = section.offsetHeight;
        
        if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
          currentSection = section.id;
        }
      });
      
      setActiveSection(currentSection);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle taste update from Vibe Quiz
  const handleTasteUpdate = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/spotify/user-taste');
      if (response.data.success) {
        setTasteData(response.data.taste);
      }
    } catch (err) {
      console.error('Error updating taste data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Scroll to section
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      window.scrollTo({
        top: section.offsetTop - 80,
        behavior: 'smooth'
      });
    }
  };

  // Scroll to top
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

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
      
      {/* Quick Navigation for Mobile */}
      <div className={styles.quickNav}>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'genre-affinity' ? styles.active : ''}`}
          onClick={() => scrollToSection('genre-affinity')}
        >
          Genres
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'top-artists' ? styles.active : ''}`}
          onClick={() => scrollToSection('top-artists')}
        >
          Artists
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'top-tracks' ? styles.active : ''}`}
          onClick={() => scrollToSection('top-tracks')}
        >
          Tracks
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'seasonal-mood' ? styles.active : ''}`}
          onClick={() => scrollToSection('seasonal-mood')}
        >
          Seasons
        </button>
        <button 
          className={`${styles.quickNavButton} ${activeSection === 'discover-events' ? styles.active : ''}`}
          onClick={() => scrollToSection('discover-events')}
        >
          Events
        </button>
      </div>
      
      {/* Spider Chart Section */}
      <section id="genre-affinity" className={styles.section}>
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
      
      {/* Vibe Quiz Card */}
      <VibeQuizCard onTasteUpdate={handleTasteUpdate} />
      
      {/* Top Artists Section */}
      <section id="top-artists" className={styles.section}>
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
      <section id="top-tracks" className={styles.section}>
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
      <section id="seasonal-mood" className={styles.section}>
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
      
      {/* Events Navigation Card */}
      <EventsNavigationCard correlatedEvents={correlatedEvents} userTaste={tasteData} />
      
      {/* Discover Events Section */}
      <section id="discover-events" className={styles.section}>
        <h2 className={styles.sectionTitle}>Discover Events Based on Your Taste</h2>
        {userLocation && (
          <p className={styles.locationText}>
            Showing events near {userLocation.city || ''} {userLocation.region || ''}
          </p>
        )}
        <div className={styles.eventsGrid}>
          {correlatedEvents && correlatedEvents.length > 0 ? (
            correlatedEvents.slice(0, 3).map((event, index) => (
              <EventCard key={index} event={event} />
            ))
          ) : (
            <p className={styles.noData}>No matching events found in your area</p>
          )}
        </div>
      </section>
      
      {/* Scroll to top button */}
      {showScrollToTop && (
        <button className={styles.scrollToTopButton} onClick={scrollToTop}>
          ↑
        </button>
      )}
      
      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} Sonar EDM Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
