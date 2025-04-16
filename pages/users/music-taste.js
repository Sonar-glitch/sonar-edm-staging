import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import SpiderChart from '../../components/SpiderChart';
import styles from '../../styles/MusicTaste.module.css';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tasteData, setTasteData] = useState(null);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch music taste data
  useEffect(() => {
    const fetchTasteData = async () => {
      if (status !== 'authenticated') return;

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching music taste data...');
        const response = await fetch('/api/spotify/user-taste');
        const data = await response.json();
        
        if (data.success) {
          console.log('Successfully fetched music taste data');
          setTasteData(data.taste);
        } else {
          console.error('Error in API response:', data.error);
          setError(data.error || 'Failed to load music taste data');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching music taste data:', error);
        setError('Error fetching music taste data');
        setIsLoading(false);
      }
    };
    
    fetchTasteData();
  }, [status]);

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your music taste profile...</p>
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
          <h1>Error loading music taste</h1>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetch('/api/spotify/user-taste')
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    setTasteData(data.taste);
                  } else {
                    setError(data.error || 'Failed to load music taste data');
                  }
                  setIsLoading(false);
                })
                .catch(err => {
                  console.error('Error fetching music taste data:', err);
                  setError('Error fetching music taste data');
                  setIsLoading(false);
                });
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Navigation activePage="music-taste" />
      <h1 className={styles.title}>Your Music Taste Profile</h1>
      <p className={styles.subtitle}>Based on your Spotify listening history</p>
      
      {/* Spider Chart for Top Genres */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Genre Affinity</h2>
        <div className={styles.spiderChartContainer}>
          <SpiderChart genres={tasteData.topGenres} />
        </div>
      </div>
      
      {/* Your Music Personality */}
      <div className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Your Music Personality</h2>
        <div className={styles.tasteLabels}>
          {tasteData.tasteLabels.map((label, index) => (
            <span key={index} className={styles.tasteLabel}>{label}</span>
          ))}
        </div>
        <p className={styles.tasteProfile}>{tasteData.tasteProfile}</p>
      </div>
      
      {/* Top Artists */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Artists</h2>
        <div className={styles.artistsGrid}>
          {tasteData.topArtists.slice(0, 5).map((artist, index) => (
            <div key={index} className={styles.artistCard}>
              {artist.image && (
                <div className={styles.artistImageContainer}>
                  <img src={artist.image} alt={artist.name} className={styles.artistImage} />
                </div>
              )}
              <h3 className={styles.artistName}>{artist.name}</h3>
              <div className={styles.matchBadge}>{artist.match}% match</div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Top Tracks */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Tracks</h2>
        <div className={styles.tracksGrid}>
          {tasteData.topTracks.slice(0, 5).map((track, index) => (
            <div key={index} className={styles.trackCard}>
              {track.image && (
                <div className={styles.trackImageContainer}>
                  <img src={track.image} alt={track.album} className={styles.trackImage} />
                </div>
              )}
              <div className={styles.trackInfo}>
                <h3 className={styles.trackName}>{track.name}</h3>
                <p className={styles.trackArtist}>{track.artist}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Top Genres List (as a backup/complement to the spider chart) */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Genres</h2>
        <div className={styles.genresGrid}>
          {tasteData.topGenres.map((genre, index) => (
            <div key={index} className={styles.genreCard}>
              <div className={styles.genreBar} style={{ width: `${genre.value}%` }}></div>
              <span className={styles.genreLabel}>{genre.label}</span>
              <span className={styles.genreValue}>{genre.value}%</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Seasonal Music Mood */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Seasonal Music Mood</h2>
        <div className={styles.seasonsGrid}>
          {Object.entries(tasteData.seasonalMood).map(([season, genres]) => (
            <div key={season} className={styles.seasonCard}>
              <h3 className={styles.seasonName}>{season.charAt(0).toUpperCase() + season.slice(1)}</h3>
              <ul className={styles.seasonGenres}>
                {genres.map((genre, index) => (
                  <li key={index}>{genre}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      
      {/* Discover Events Based on Your Taste */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Discover Events Based on Your Taste</h2>
        <button 
          className={styles.eventsButton}
          onClick={() => router.push('/users/events')}
        >
          Find Events
        </button>
      </div>
    </div>
  );
}
