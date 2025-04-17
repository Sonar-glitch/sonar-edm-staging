import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/MusicTaste.module.css';
import Navigation from '../../components/Navigation';

// Import components conditionally to prevent rendering errors
let SpiderChart = null;
let ArtistCard = null;
let TrackCard = null;
let SeasonalMoodCard = null;
let VibeQuizCard = null;
let EventCard = null;

// Only import components on client-side to prevent SSR issues
if (typeof window !== 'undefined') {
  SpiderChart = require('../../components/SpiderChart').default;
  ArtistCard = require('../../components/ArtistCard').default;
  TrackCard = require('../../components/TrackCard').default;
  SeasonalMoodCard = require('../../components/SeasonalMoodCard').default;
  VibeQuizCard = require('../../components/VibeQuizCard').default;
  EventCard = require('../../components/EventCard').default;
}

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);
  const [dataReady, setDataReady] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserTaste();
    }
  }, [status]);

  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      console.log('Fetching user taste data...');
      const response = await fetch('/api/spotify/user-taste');
      if (!response.ok) {
        throw new Error('Failed to fetch music taste data');
      }
      const data = await response.json();
      console.log('API response data:', JSON.stringify(data, null, 2));
      setUserTaste(data);
      setLoading(false);
      
      // Verify data structure before rendering components
      const isDataValid = validateData(data);
      setDataReady(isDataValid);
      
      if (!isDataValid) {
        console.warn('Data structure is not valid for rendering components');
        setError('Received incomplete data from API. Some sections may not display correctly.');
      }
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  // Validate data structure to ensure all required properties exist
  const validateData = (data) => {
    if (!data) return false;
    
    // Check if topGenres exists and has valid structure
    const hasValidGenres = Array.isArray(data.topGenres) && 
                          data.topGenres.length > 0 && 
                          data.topGenres.every(g => g && typeof g === 'object' && g.name && typeof g.value === 'number');
    
    // Check if topArtists exists and has valid structure
    const hasValidArtists = Array.isArray(data.topArtists) && 
                           data.topArtists.length > 0;
    
    // Check if topTracks exists and has valid structure
    const hasValidTracks = Array.isArray(data.topTracks) && 
                          data.topTracks.length > 0;
    
    // Check if seasonalMood exists and has valid structure
    const hasValidSeasonalMood = data.seasonalMood && 
                               typeof data.seasonalMood === 'object' && 
                               data.seasonalMood.current && 
                               data.seasonalMood[data.seasonalMood.current];
    
    console.log('Data validation results:', {
      hasValidGenres,
      hasValidArtists,
      hasValidTracks,
      hasValidSeasonalMood
    });
    
    // Return true if at least some of the data is valid
    return hasValidGenres || hasValidArtists || hasValidTracks || hasValidSeasonalMood;
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
          <title>Your Music Taste | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing your sonic DNA...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Music Taste | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.unauthorizedContainer}>
          <h1 className={styles.title}>Connect to Discover Your Taste</h1>
          <p className={styles.subtitle}>Sign in with Spotify to unlock your music taste profile</p>
          <Link href="/api/auth/signin" className={styles.connectButton}>
            Connect with Spotify
          </Link>
        </div>
      </div>
    );
  }

  if (error && !userTaste) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Music Taste | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.errorContainer}>
          <h1 className={styles.title}>Oops! Something went wrong</h1>
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
          <title>Your Music Taste | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.noDataContainer}>
          <h1 className={styles.title}>No Taste Data Available</h1>
          <p className={styles.subtitle}>
            We couldn't find any listening data for your profile. Try listening to more music on Spotify and check back later.
          </p>
        </div>
      </div>
    );
  }

  // Safely extract data with null checks and proper mapping to match API structure
  const genres = userTaste.topGenres || [];
  const topArtists = userTaste.topArtists || [];
  const topTracks = userTaste.topTracks || [];
  const seasonalMood = userTaste.seasonalMood || {};
  
  // Map current season string to an object with topGenres
  const currentSeason = seasonalMood.current ? {
    topGenres: seasonalMood[seasonalMood.current]?.genres || []
  } : { topGenres: [] };
  
  // Add currentSeason to seasonalMood object
  const enhancedSeasonalMood = {...seasonalMood, currentSeason};
  
  // Create empty suggestedEvents if not present
  const suggestedEvents = userTaste.suggestedEvents || [];

  // Ensure genres have valid values for SpiderChart
  const validGenres = genres.map(genre => ({
    name: genre.name || 'Unknown',
    value: typeof genre.value === 'number' && !isNaN(genre.value) ? genre.value : 0
  }));

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Music Taste | Sonar</title>
      </Head>
      
      <Navigation />
      
      {error && (
        <div className={styles.warningBanner}>
          <p>{error}</p>
          <button onClick={fetchUserTaste} className={styles.retryButton}>
            Refresh Data
          </button>
        </div>
      )}
      
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Music Taste</h1>
          <p className={styles.subtitle}>
            Based on your Spotify listening history and preferences
          </p>
        </div>
        
        <div className={styles.summary}>
          <p>
            {genres && genres.length > 0 ? (
              <>
                Your taste profile shows a strong affinity for {genres.slice(0, Math.min(3, genres.length)).map(g => g.name || 'Unknown').join(', ')} 
                {currentSeason && currentSeason.topGenres && currentSeason.topGenres.length > 0 ? (
                  <>with recent listening trends toward {currentSeason.topGenres.slice(0, Math.min(2, currentSeason.topGenres.length)).join(' and ')}.</>
                ) : (
                  <>.</>
                )}
              </>
            ) : (
              <>Your taste profile is being analyzed. Check back soon for detailed insights.</>
            )}
            {suggestedEvents && suggestedEvents.length > 0 ? (
              <> We've found {suggestedEvents.length} events that match your taste profile.</>
            ) : (
              <> We're finding events that match your taste profile.</>
            )}
          </p>
        </div>
        
        <section className={styles.genreSection}>
          <h2 className={styles.sectionTitle}>Genre Affinity</h2>
          <div className={styles.spiderChartContainer}>
            {typeof window !== 'undefined' && SpiderChart && validGenres && validGenres.length > 0 ? (
              <SpiderChart genres={validGenres} />
            ) : (
              <div className={styles.placeholderChart}>
                <p>Genre data visualization is loading...</p>
              </div>
            )}
          </div>
        </section>
        
        <section className={styles.artistsSection}>
          <h2 className={styles.sectionTitle}>Your Favorite Artists</h2>
          <div className={styles.artistsGrid}>
            {typeof window !== 'undefined' && ArtistCard && topArtists && topArtists.length > 0 ? (
              topArtists.map((artist, index) => (
                <ArtistCard 
                  key={artist.id || `artist-${index}`} 
                  artist={{
                    ...artist,
                    name: artist.name || 'Unknown Artist',
                    image: artist.image || 'https://via.placeholder.com/300',
                    genres: Array.isArray(artist.genres) ? artist.genres : [],
                    popularity: typeof artist.popularity === 'number' ? artist.popularity : 50
                  }} 
                  correlation={artist.correlation || 0.5}
                  similarArtists={Array.isArray(artist.similarArtists) ? artist.similarArtists : []}
                />
              ))
            ) : (
              <p>No artist data available</p>
            )}
          </div>
        </section>
        
        <section className={styles.tracksSection}>
          <h2 className={styles.sectionTitle}>Your Top Tracks</h2>
          <div className={styles.tracksGrid}>
            {typeof window !== 'undefined' && TrackCard && topTracks && topTracks.length > 0 ? (
              topTracks.map((track, index) => (
                <TrackCard 
                  key={track.id || `track-${index}`} 
                  track={{
                    ...track,
                    name: track.name || 'Unknown Track',
                    artist: track.artist || 'Unknown Artist',
                    image: track.image || 'https://via.placeholder.com/300'
                  }} 
                  correlation={track.correlation || 0.5}
                  duration={track.duration_ms || 0}
                  popularity={track.popularity || 50}
                />
              ))
            ) : (
              <p>No track data available</p>
            )}
          </div>
        </section>
        
        <section className={styles.seasonalSection}>
          <h2 className={styles.sectionTitle}>Seasonal Mood Analysis</h2>
          {typeof window !== 'undefined' && SeasonalMoodCard && enhancedSeasonalMood && Object.keys(enhancedSeasonalMood).length > 0 ? (
            <SeasonalMoodCard seasonalMood={enhancedSeasonalMood} />
          ) : (
            <p>No seasonal mood data available</p>
          )}
        </section>
        
        <section className={styles.vibeQuizSection}>
          <div className={styles.vibeQuizPrompt}>
            <p>Something doesn't feel right about your taste profile?</p>
            <button 
              className={styles.vibeQuizButton}
              onClick={() => setShowVibeQuiz(!showVibeQuiz)}
            >
              {showVibeQuiz ? 'Hide Vibe Quiz' : 'Take the Vibe Quiz'}
            </button>
          </div>
          
          {showVibeQuiz && typeof window !== 'undefined' && VibeQuizCard && (
            <VibeQuizCard onSubmit={handleVibeQuizSubmit} />
          )}
        </section>
        
        <section className={styles.eventsSection}>
          <h2 className={styles.sectionTitle}>Events You Might Like</h2>
          {typeof window !== 'undefined' && EventCard && suggestedEvents && suggestedEvents.length > 0 ? (
            <div className={styles.eventsGrid}>
              {suggestedEvents.slice(0, Math.min(3, suggestedEvents.length)).map((event, index) => (
                <EventCard 
                  key={event.id || `event-${index}`} 
                  event={{
                    ...event,
                    name: event.name || 'Upcoming Event',
                    venue: event.venue || 'TBA',
                    date: event.date || 'TBA',
                    image: event.image || 'https://via.placeholder.com/300'
                  }} 
                  correlation={event.correlation || 0.5}
                />
              ))}
              
              <div className={styles.viewMoreContainer}>
                <Link href="/users/events" className={styles.viewMoreButton}>
                  View All Matching Events
                </Link>
              </div>
            </div>
          ) : (
            <div>
              <p>No matching events found at this time.</p>
              <p className={styles.eventsMessage}>Check back later or explore our events page for upcoming shows.</p>
              <div className={styles.viewMoreContainer}>
                <Link href="/users/events" className={styles.viewMoreButton}>
                  Browse All Events
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
