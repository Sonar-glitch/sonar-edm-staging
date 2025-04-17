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
      console.log('API response:', data); // For debugging
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
          <Link href="/api/auth/signin">
            <a className={styles.connectButton}>Connect with Spotify</a>
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

  // Safely extract data with null checks and fallbacks
  const genres = Array.isArray(userTaste.genres) ? userTaste.genres : 
                 Array.isArray(userTaste.topGenres) ? userTaste.topGenres.map(g => typeof g === 'string' ? {name: g, score: 50} : g) : 
                 [];
  
  const topArtists = Array.isArray(userTaste.topArtists) ? userTaste.topArtists : [];
  const topTracks = Array.isArray(userTaste.topTracks) ? userTaste.topTracks : [];
  
  // Handle seasonal mood data with fallbacks
  const seasonalMood = userTaste.seasonalMood && typeof userTaste.seasonalMood === 'object' ? userTaste.seasonalMood : {};
  
  // Create currentSeason if it doesn't exist or is incomplete
  if (!seasonalMood.currentSeason || typeof seasonalMood.currentSeason !== 'object') {
    const currentSeasonName = seasonalMood.current || 'Current Season';
    seasonalMood.currentSeason = {
      name: currentSeasonName,
      primaryMood: seasonalMood[currentSeasonName]?.mood || 'Unknown',
      topGenres: Array.isArray(seasonalMood[currentSeasonName]?.genres) ? 
                seasonalMood[currentSeasonName].genres : []
    };
  }
  
  // Ensure seasons array exists
  if (!Array.isArray(seasonalMood.seasons)) {
    seasonalMood.seasons = [];
  }
  
  const suggestedEvents = Array.isArray(userTaste.suggestedEvents) ? userTaste.suggestedEvents : [];

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
            Your taste profile shows a strong affinity for {genres.length > 0 ? 
              genres.slice(0, Math.min(3, genres.length)).map(g => g.name || 'Unknown').join(', ') : 
              'various genres'} 
            with recent listening trends toward {seasonalMood.currentSeason && 
              Array.isArray(seasonalMood.currentSeason.topGenres) && 
              seasonalMood.currentSeason.topGenres.length > 0 ? 
              seasonalMood.currentSeason.topGenres.slice(0, Math.min(2, seasonalMood.currentSeason.topGenres.length)).join(' and ') : 
              'various styles'}.
            We've found {suggestedEvents.length} events that match your taste profile.
          </p>
        </div>
        
        <section className={styles.genreSection}>
          <h2 className={styles.sectionTitle}>Genre Affinity</h2>
          <div className={styles.spiderChartContainer}>
            {genres.length > 0 ? (
              <SpiderChart genres={genres} />
            ) : (
              <div className={styles.noDataMessage}>
                <p>No genre data available. Try listening to more music on Spotify.</p>
              </div>
            )}
          </div>
        </section>
        
        <section className={styles.artistsSection}>
          <h2 className={styles.sectionTitle}>Your Favorite Artists</h2>
          {topArtists.length > 0 ? (
            <div className={styles.artistsGrid}>
              {topArtists.map((artist, index) => (
                <ArtistCard 
                  key={artist.id || `artist-${index}`} 
                  artist={artist} 
                  correlation={artist.correlation || 0.5}
                  similarArtists={Array.isArray(artist.similarArtists) ? artist.similarArtists : []}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No artist data available. Try listening to more music on Spotify.</p>
            </div>
          )}
        </section>
        
        <section className={styles.tracksSection}>
          <h2 className={styles.sectionTitle}>Your Top Tracks</h2>
          {topTracks.length > 0 ? (
            <div className={styles.tracksGrid}>
              {topTracks.map((track, index) => (
                <TrackCard 
                  key={track.id || `track-${index}`} 
                  track={track} 
                  correlation={track.correlation || 0.5}
                  duration={track.duration_ms || 0}
                  popularity={track.popularity || 0}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No track data available. Try listening to more music on Spotify.</p>
            </div>
          )}
        </section>
        
        <section className={styles.seasonalSection}>
          <h2 className={styles.sectionTitle}>Seasonal Mood Analysis</h2>
          <SeasonalMoodCard seasonalMood={seasonalMood} />
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
          {suggestedEvents.length > 0 ? (
            <div className={styles.eventsGrid}>
              {suggestedEvents.slice(0, Math.min(3, suggestedEvents.length)).map((event, index) => (
                <EventCard 
                  key={event.id || `event-${index}`} 
                  event={event} 
                  correlation={event.correlation || 0.5}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No matching events found. Check back later for new events.</p>
            </div>
          )}
          
          {suggestedEvents.length > 0 && (
            <div className={styles.viewMoreContainer}>
              <Link href="/users/events">
                <a className={styles.viewMoreButton}>View All Matching Events</a>
              </Link>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
