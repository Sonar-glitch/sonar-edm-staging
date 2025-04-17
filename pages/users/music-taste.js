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

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserTaste();
    }
  }, [status]);

  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/user-taste');
      if (!response.ok) {
        throw new Error('Failed to fetch music taste data');
      }
      const data = await response.json();
      console.log('API response data:', data); // Log data for debugging
      setUserTaste(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message);
      setLoading(false);
    }
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

  if (error) {
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
  } : {};
  
  // Add currentSeason to seasonalMood object
  const enhancedSeasonalMood = {...seasonalMood, currentSeason};
  
  // Create empty suggestedEvents if not present
  const suggestedEvents = userTaste.suggestedEvents || [];

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Music Taste | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Music Taste</h1>
          <p className={styles.subtitle}>
            Based on your Spotify listening history and preferences
          </p>
        </div>
        
        <div className={styles.summary}>
          <p>
            Your taste profile shows a strong affinity for {genres && genres.length > 0 ? genres.slice(0, 3).map(g => g.name || 'Unknown').join(', ') : 'loading genres...'} 
            with recent listening trends toward {currentSeason && currentSeason.topGenres && currentSeason.topGenres.length > 0 ? currentSeason.topGenres.slice(0, 2).join(' and ') : 'loading trends...'}.
            We've found {suggestedEvents ? suggestedEvents.length : '0'} events that match your taste profile.
          </p>
        </div>
        
        <section className={styles.genreSection}>
          <h2 className={styles.sectionTitle}>Genre Affinity</h2>
          <div className={styles.spiderChartContainer}>
            {genres && genres.length > 0 ? (
              <SpiderChart genres={genres} />
            ) : (
              <p>No genre data available</p>
            )}
          </div>
        </section>
        
        <section className={styles.artistsSection}>
          <h2 className={styles.sectionTitle}>Your Favorite Artists</h2>
          <div className={styles.artistsGrid}>
            {topArtists && topArtists.length > 0 ? (
              topArtists.map((artist, index) => (
                <ArtistCard 
                  key={artist.id || index} 
                  artist={artist} 
                  correlation={artist.correlation}
                  similarArtists={artist.similarArtists || []}
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
            {topTracks && topTracks.length > 0 ? (
              topTracks.map((track, index) => (
                <TrackCard 
                  key={track.id || index} 
                  track={track} 
                  correlation={track.correlation}
                  duration={track.duration_ms}
                  popularity={track.popularity}
                />
              ))
            ) : (
              <p>No track data available</p>
            )}
          </div>
        </section>
        
        <section className={styles.seasonalSection}>
          <h2 className={styles.sectionTitle}>Seasonal Mood Analysis</h2>
          {enhancedSeasonalMood ? (
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
          
          {showVibeQuiz && (
            <VibeQuizCard onSubmit={handleVibeQuizSubmit} />
          )}
        </section>
        
        <section className={styles.eventsSection}>
          <h2 className={styles.sectionTitle}>Events You Might Like</h2>
          {suggestedEvents && suggestedEvents.length > 0 ? (
            <div className={styles.eventsGrid}>
              {suggestedEvents.slice(0, 3).map((event, index) => (
                <EventCard 
                  key={event.id || index} 
                  event={event} 
                  correlation={event.correlation}
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
