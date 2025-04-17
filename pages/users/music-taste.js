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
  const [refreshingEvents, setRefreshingEvents] = useState(false);

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
  
  // Get suggested events with fallback
  const suggestedEvents = Array.isArray(userTaste.suggestedEvents) ? userTaste.suggestedEvents : [];

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
            {suggestedEvents.length > 0 ? 
              ` Found ${suggestedEvents.length} events that match your sound.` : 
              " Events coming soon that match your sound."}
          </p>
        </div>
        
        {/* Top section: Two-column layout with genre mix and seasonal mood */}
        <div className={styles.topSection}>
          {/* Left column: Genre mix with spider chart */}
          <div className={styles.genreSection}>
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
            <SeasonalMoodCard seasonalMood={seasonalMood} />
          </div>
        </div>
        
        {/* Events section - prioritized and full width */}
        <section className={styles.eventsSection}>
          <h2 className={styles.sectionTitle}>Events That Match Your Vibe</h2>
          
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
          
          {suggestedEvents.length > 0 && (
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
        
        {/* Artists section - optimized grid */}
        <section className={styles.artistsSection}>
          <h2 className={styles.sectionTitle}>Artists You Vibe With</h2>
          {topArtists.length > 0 ? (
            <div className={styles.artistsGrid}>
              {/* Show top 5 artists with up to 3 similar artists each */}
              {topArtists.slice(0, 5).map((artist, index) => (
                <ArtistCard 
                  key={artist.id || `artist-${index}`} 
                  artist={artist} 
                  correlation={artist.correlation || 0.5}
                  similarArtists={Array.isArray(artist.similarArtists) ? artist.similarArtists.slice(0, 3) : []}
                />
              ))}
            </div>
          ) : (
            <div className={styles.noDataMessage}>
              <p>No artist data yet. Keep streaming!</p>
            </div>
          )}
        </section>
        
        {/* Tracks section - optimized grid */}
        <section className={styles.tracksSection}>
          <h2 className={styles.sectionTitle}>Your Repeat Tracks</h2>
          {topTracks.length > 0 ? (
            <div className={styles.tracksGrid}>
              {/* Show top 5 tracks based on the last 3 months */}
              {topTracks.slice(0, 5).map((track, index) => (
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
              <p>No track data yet. Keep streaming!</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
