import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/MusicTaste.module.css';
import SpiderChart from '../../components/SpiderChart';
import ArtistCard from '../../components/ArtistCard';
import TrackCard from '../../components/TrackCard';
import SeasonalMoodCard from '../../components/SeasonalMoodCard';
import VibeQuizCard from '../../components/VibeQuizCard';
import EventCard from '../../components/EventCard';
import Navigation from '../../components/Navigation';
import EventFilters from '../../components/EventFilters';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);
  const [refreshingEvents, setRefreshingEvents] = useState(false);
  const [filterOptions, setFilterOptions] = useState({
    genre: 'all',
    date: 'upcoming',
    distance: 50,
    price: 'all'
  });
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserTaste();
      getUserLocation();
    }
  }, [status]);

  useEffect(() => {
    if (userTaste && Array.isArray(userTaste.suggestedEvents)) {
      applyFilters();
    }
  }, [userTaste, filterOptions]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting user location:', error);
        }
      );
    }
  };

  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/user-taste');
      if (!response.ok) {
        throw new Error('Failed to fetch music taste data');
      }
      const data = await response.json();
      console.log('API response:', data); // For debugging
      setUserTaste(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const refreshEvents = async () => {
    try {
      setRefreshingEvents(true);
      await fetchUserTaste();
      setRefreshingEvents(false);
    } catch (err) {
      console.error('Error refreshing events:', err);
      setRefreshingEvents(false);
    }
  };

  const applyFilters = () => {
    if (!userTaste || !Array.isArray(userTaste.suggestedEvents)) {
      setFilteredEvents([]);
      return;
    }

    let filtered = [...userTaste.suggestedEvents];

    // Apply genre filter
    if (filterOptions.genre !== 'all') {
      filtered = filtered.filter(event => {
        if (!event.genres) return false;
        return event.genres.some(genre => 
          genre.toLowerCase().includes(filterOptions.genre.toLowerCase())
        );
      });
    }

    // Apply date filter
    const now = new Date();
    if (filterOptions.date === 'today') {
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === now.toDateString();
      });
    } else if (filterOptions.date === 'this-week') {
      const weekLater = new Date(now);
      weekLater.setDate(weekLater.getDate() + 7);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= weekLater;
      });
    } else if (filterOptions.date === 'this-month') {
      const monthLater = new Date(now);
      monthLater.setMonth(monthLater.getMonth() + 1);
      filtered = filtered.filter(event => {
        const eventDate = new Date(event.date);
        return eventDate >= now && eventDate <= monthLater;
      });
    }

    // Apply distance filter if user location is available
    if (userLocation && filterOptions.distance !== 'all') {
      const maxDistance = parseInt(filterOptions.distance);
      filtered = filtered.filter(event => {
        if (!event.venue || !event.venue.location) return true;
        
        // Try to extract coordinates from venue
        let eventLat, eventLng;
        if (event.venue.coordinates) {
          eventLat = event.venue.coordinates.latitude;
          eventLng = event.venue.coordinates.longitude;
        } else {
          // For mock data or incomplete data, return true
          return true;
        }
        
        if (!eventLat || !eventLng) return true;
        
        // Calculate distance using Haversine formula
        const distance = calculateDistance(
          userLocation.latitude, userLocation.longitude,
          eventLat, eventLng
        );
        
        return distance <= maxDistance;
      });
    }

    // Apply price filter
    if (filterOptions.price !== 'all') {
      const priceRange = filterOptions.price.split('-');
      const minPrice = parseInt(priceRange[0]);
      const maxPrice = priceRange.length > 1 ? parseInt(priceRange[1]) : Infinity;
      
      filtered = filtered.filter(event => {
        if (!event.price) return true;
        return event.price >= minPrice && event.price <= maxPrice;
      });
    }

    setFilteredEvents(filtered);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 3958.8; // Earth's radius in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const handleFilterChange = (newFilters) => {
    setFilterOptions(prev => ({
      ...prev,
      ...newFilters
    }));
  };

  const handleVibeQuizSubmit = async (preferences) => {
    try {
      const response = await fetch('/api/user/update-taste-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      
      // Refresh user taste data
      fetchUserTaste();
      setShowVibeQuiz(false);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err.message);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your vibe...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.unauthorizedContainer}>
          <h1 className={styles.title}>Connect to see your sound</h1>
          <p className={styles.subtitle}>Link Spotify. Get your vibe. Find your scene.</p>
          <Link href="/api/auth/signin">
            <a className={styles.connectButton}>Connect Spotify</a>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.errorContainer}>
          <h1 className={styles.title}>Oops! That didn't work</h1>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchUserTaste} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userTaste) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.noDataContainer}>
          <h1 className={styles.title}>No vibe data yet</h1>
          <p className={styles.subtitle}>
            Play more tracks on Spotify. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  // Safely extract data with null checks and fallbacks
  const genres = Array.isArray(userTaste.genres) ? userTaste.genres : 
                 Array.isArray(userTaste.topGenres) ? userTaste.topGenres.map(g => typeof g === 'string' ? {name: g, score: 50} : g) : 
                 [];
  
  const topArtists = Array.isArray(userTaste.topArtists) ? userTaste.topArtists : [];
  const topTracks = Array.isArray(userTaste.topTracks) ? userTaste.topTracks : [];
  
  // Handle seasonal mood data with fallbacks
  const seasonalMood = userTaste.seasonalMood && typeof userTaste.seasonalMood === 'object' ? userTaste.seasonalMood : {
    winter: { genres: ['Deep House', 'Ambient Techno'], mood: 'Introspective' },
    spring: { genres: ['Progressive House', 'Melodic House'], mood: 'Uplifting' },
    summer: { genres: ['Tech House', 'House'], mood: 'Energetic' },
    fall: { genres: ['Organic House', 'Downtempo'], mood: 'Melancholic' },
    current: 'spring'
  };
  
  // Get suggested events with fallback
  const suggestedEvents = Array.isArray(userTaste.suggestedEvents) ? userTaste.suggestedEvents : [];
  const displayEvents = filteredEvents.length > 0 ? filteredEvents : suggestedEvents;

  // Create a more concise, ADHD-friendly summary
  const getTopGenres = () => {
    if (genres.length === 0) return "your fav beats";
    return genres.slice(0, Math.min(2, genres.length)).map(g => g.name || 'Unknown').join(' + ');
  };

  const getRecentTrends = () => {
    if (!seasonalMood.currentSeason || 
        !Array.isArray(seasonalMood.currentSeason.topGenres) || 
        seasonalMood.currentSeason.topGenres.length === 0) {
      return "fresh sounds";
    }
    return seasonalMood.currentSeason.topGenres.slice(0, 1).join('');
  };

  // Determine if data is real or mock
  const isRealData = {
    artists: userTaste.dataSource?.artists === 'spotify',
    tracks: userTaste.dataSource?.tracks === 'spotify',
    genres: userTaste.dataSource?.genres === 'spotify',
    events: userTaste.dataSource?.events === 'ticketmaster' || userTaste.dataSource?.events === 'edmtrain'
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Sound | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.optimizedMain}>
        {/* Compact summary section - no header needed */}
        <div className={styles.summary}>
          <p>
            You're all about <span className={styles.highlight}>{getTopGenres()}</span> with 
            a vibe shift toward <span className={styles.highlight}>{getRecentTrends()}</span>. 
            {displayEvents.length > 0 ? 
              ` ` : 
              " Events coming soon that match your sound."}
          </p>
        </div>
        
        {/* Top section: Two-column layout with genre mix and seasonal mood */}
        <div className={styles.topSection}>
          {/* Left column: Genre mix with spider chart */}
          <div className={styles.genreSection}>
            <h3 className={styles.sectionSubtitle}>Your Genre Mix</h3>
            <div className={styles.dataSourceIndicator}>
              {isRealData.genres ? 
                <span className={styles.realDataBadge}>Real Data</span> : 
                <span className={styles.mockDataBadge}>Sample Data</span>
              }
            </div>
            <div className={styles.spiderChartContainer}>
              {genres.length > 0 ? (
                <SpiderChart genres={genres} />
              ) : (
                <div className={styles.noDataMessage}>
                  <p>No genre data yet. Keep streaming!</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Right column: Seasonal mood */}
          <div className={styles.seasonalSection}>
            <h3 className={styles.sectionSubtitle}>Your Seasonal Vibes</h3>
            <div className={styles.dataSourceIndicator}>
              {isRealData.genres ? 
                <span className={styles.realDataBadge}>Real Data</span> : 
                <span className={styles.mockDataBadge}>Sample Data</span>
              }
            </div>
            <SeasonalMoodCard seasonalMood={seasonalMood} />
          </div>
        </div>
        
        {/* Events section - prioritized and full width */}
        <section className={styles.eventsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Events That Match Your Vibe {displayEvents.length > 0 ? `(Found ${displayEvents.length} events)` : ""}</h2>
            <div className={styles.dataSourceIndicator}>
              {isRealData.events ? 
                <span className={styles.realDataBadge}>Real Data</span> : 
                <span className={styles.mockDataBadge}>Sample Data</span>
              }
            </div>
          </div>
          
          {/* Event filters */}
          <EventFilters 
            onFilterChange={handleFilterChange} 
            currentFilters={filterOptions}
          />
          
          {displayEvents.length > 0 ? (
            <div className={styles.eventsGrid}>
              {displayEvents.slice(0, Math.min(3, displayEvents.length)).map((event, index) => (
                <EventCard 
                  key={event.id || `event-${index}`} 
                  event={event} 
                  correlation={event.correlation || 0.5}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noEventsMessage}>
              <p>Events coming soon. Check back!</p>
              <button 
                className={styles.refreshButton} 
                onClick={refreshEvents}
                disabled={refreshingEvents}
              >
                {refreshingEvents ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          )}
          
          {displayEvents.length > 0 && (
            <div className={styles.viewMoreContainer}>
              <Link href="/users/events">
                <a className={styles.viewMoreButton}>See All Events</a>
              </Link>
            </div>
          )}
        </section>
        
        {/* Vibe Quiz section */}
        <section className={styles.vibeQuizSection}>
          <div className={styles.vibeQuizPrompt}>
            <p>Not feeling this vibe? Tell us what you're into</p>
            <button 
              className={styles.vibeQuizButton}
              onClick={() => setShowVibeQuiz(!showVibeQuiz)}
            >
              {showVibeQuiz ? 'Hide Quiz' : 'Take Quiz'}
            </button>
          </div>
          
          {showVibeQuiz && (
            <VibeQuizCard onSubmit={handleVibeQuizSubmit} />
          )}
        </section>
        
        {/* Artists and Tracks side by side */}
        <div className={styles.artistsTracksSection}>
          {/* Left column: Artists */}
          <section className={styles.artistsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Artists You Vibe With</h2>
              <div className={styles.dataSourceIndicator}>
                {isRealData.artists ? 
                  <span className={styles.realDataBadge}>Real Data</span> : 
                  <span className={styles.mockDataBadge}>Sample Data</span>
                }
              </div>
            </div>
            
            {topArtists.length > 0 ? (
              <div className={styles.artistsGrid}>
                {/* Show top 5 artists */}
                {topArtists.slice(0, 5).map((artist, index) => (
                  <ArtistCard 
                    key={artist.id || `artist-${index}`} 
                    artist={artist} 
                    correlation={artist.correlation || 0.5}
                    similarArtists={Array.isArray(artist.similarArtists) ? artist.similarArtists.slice(0, 2) : []}
                    useTasteMatch={true}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.noDataMessage}>
                <p>No artist data yet. Keep streaming!</p>
              </div>
            )}
          </section>
          
          {/* Right column: Tracks */}
          <section className={styles.tracksSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Your Repeat Tracks</h2>
              <div className={styles.dataSourceIndicator}>
                {isRealData.tracks ? 
                  <span className={styles.realDataBadge}>Real Data</span> : 
                  <span className={styles.mockDataBadge}>Sample Data</span>
                }
              </div>
            </div>
            
            {topTracks.length > 0 ? (
              <div className={styles.tracksGrid}>
                {/* Show top 5 tracks */}
                {topTracks.slice(0, 5).map((track, index) => (
                  <TrackCard 
                    key={track.id || `track-${index}`} 
                    track={track} 
                    correlation={track.correlation || 0.5}
                    duration={track.duration_ms || 0}
                    popularity={track.popularity || 0}
                    useTasteMatch={true}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.noDataMessage}>
                <p>No track data yet. Keep streaming!</p>
              </div>
            )}
          </section>
        </div>
        
        {/* Confidence score explanation */}
      </main>
    </div>
  );
}
