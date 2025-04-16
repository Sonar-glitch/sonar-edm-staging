import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import SpiderChart from '../../components/SpiderChart';
import ArtistCard from '../../components/ArtistCard';
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

  // If tasteData is null or undefined, show a loading message
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
      
      <h1 className={styles.title}>Your Music Taste Profile</h1>
      
      {/* Spider Chart for Top Genres */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Genre Affinity</h2>
        <div className={styles.spiderChartContainer}>
          {tasteData && tasteData.topGenres && tasteData.topGenres.length > 0 ? (
            <SpiderChart genres={tasteData.topGenres} />
          ) : (
            <p>No genre data available</p>
          )}
        </div>
      </div>
      
      {/* Your Music Personality */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Music Personality</h2>
        {tasteData && tasteData.tasteLabels && tasteData.tasteLabels.length > 0 ? (
          <div className={styles.tasteLabels}>
            {tasteData.tasteLabels.map((label, index) => (
              <span key={index} className={styles.tasteLabel}>{label}</span>
            ))}
          </div>
        ) : (
          <p>No personality data available</p>
        )}
        {tasteData && tasteData.tasteProfile && (
          <p className={styles.tasteProfile}>{tasteData.tasteProfile}</p>
        )}
      </div>
      
      {/* Top Artists with Similar Artists */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Artists</h2>
        {tasteData && tasteData.topArtists && tasteData.topArtists.length > 0 ? (
          <div className={styles.artistsList}>
            {tasteData.topArtists.map((artist, index) => (
              <ArtistCard key={index} artist={artist} rank={index + 1} />
            ))}
          </div>
        ) : (
          <p>No artist data available</p>
        )}
      </div>
      
      {/* Top Tracks */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Tracks</h2>
        {tasteData && tasteData.topTracks && tasteData.topTracks.length > 0 ? (
          <div className={styles.tracksList}>
            {tasteData.topTracks.map((track, index) => (
              <div key={index} className={styles.trackItem}>
                {track.image && (
                  <div className={styles.trackImageContainer}>
                    <img src={track.image} alt={track.name} className={styles.trackImage} />
                  </div>
                )}
                <div className={styles.trackInfo}>
                  <h3 className={styles.trackName}>{track.name}</h3>
                  <p className={styles.trackArtist}>{track.artist}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No track data available</p>
        )}
      </div>
      
      {/* Seasonal Music Mood */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Seasonal Music Mood</h2>
        {tasteData && tasteData.seasonalMood ? (
          <div className={styles.seasonalContainer}>
            {Object.entries(tasteData.seasonalMood).map(([season, genres]) => (
              <div key={season} className={styles.seasonCard}>
                <h3 className={styles.seasonName}>{season.charAt(0).toUpperCase() + season.slice(1)}</h3>
                {genres && genres.length > 0 ? (
                  <ul className={styles.seasonGenres}>
                    {genres.map((genre, index) => (
                      <li key={index} className={styles.seasonGenreItem}>{genre}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No genre data for this season</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p>No seasonal mood data available</p>
        )}
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
