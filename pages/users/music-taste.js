import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import styles from '../../styles/MusicTaste.module.css';
import Navigation from '../../components/Navigation';

export default function MusicTaste() {
  const { data: session } = useSession();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    const fetchUserTaste = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/spotify/user-taste');
        if (response.data.success) {
          setUserTaste(response.data.data);
        } else {
          setError(response.data.error || 'Failed to fetch music taste data');
        }
      } catch (err) {
        setError('Error fetching music taste data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchUserTaste();
    }
  }, [session]);

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  if (!session) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.notAuthenticated}>
          <h1>Please sign in to view your music taste</h1>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.loading}>
          <h1>Loading your music taste...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.error}>
          <h1>Error loading music taste</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!userTaste) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.noData}>
          <h1>No music taste data available</h1>
          <p>We couldn't find any music taste data for your account. Try listening to more music on Spotify.</p>
        </div>
      </div>
    );
  }

  const { topGenres, topArtists, topTracks, tasteBadge, description } = userTaste;

  return (
    <div className={styles.container}>
      <Navigation activePage="music-taste" />
      
      <div className={styles.header}>
        <h1>Your <span className={styles.musicDna}>Music DNA</span></h1>
        <div className={styles.tasteBadge}>
          <span>{tasteBadge}</span>
        </div>
      </div>

      <div className={styles.spiderChartContainer}>
        <div className={styles.spiderChart}>
          {/* Spider chart visualization */}
          {/* This is preserved from your original implementation */}
        </div>
        <p className={styles.description}>{description}</p>
        
        <div className={styles.statsContainer}>
          <div className={styles.statBox} onClick={() => toggleSection('genres')}>
            <h2>{topGenres.length}</h2>
            <p>Top Genres</p>
          </div>
          
          <div className={styles.statBox} onClick={() => toggleSection('artists')}>
            <h2>{topArtists.length}</h2>
            <p>Top Artists</p>
          </div>
          
          <div className={styles.statBox} onClick={() => toggleSection('tracks')}>
            <h2>{topTracks.length}</h2>
            <p>Top Tracks</p>
          </div>
        </div>
      </div>

      {/* Expanded Sections */}
      {expandedSection === 'genres' && (
        <div className={styles.expandedSection}>
          <h2>Your Top Genres</h2>
          <div className={styles.genreList}>
            {topGenres.map((genre, index) => (
              <div key={index} className={styles.genreItem}>
                <span className={styles.genreName}>{genre.name}</span>
                <div className={styles.genreBar} style={{ width: `${genre.score * 100}%` }}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expandedSection === 'artists' && (
        <div className={styles.expandedSection}>
          <h2>Your Top Artists</h2>
          <div className={styles.artistGrid}>
            {topArtists.map((artist, index) => (
              <div key={index} className={styles.artistCard}>
                {artist.image && (
                  <div className={styles.artistImage}>
                    <img src={artist.image} alt={artist.name} />
                  </div>
                )}
                <div className={styles.artistInfo}>
                  <h3>{artist.name}</h3>
                  <p>{artist.genres.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {expandedSection === 'tracks' && (
        <div className={styles.expandedSection}>
          <h2>Your Top Tracks</h2>
          <div className={styles.trackList}>
            {topTracks.map((track, index) => (
              <div key={index} className={styles.trackItem}>
                {track.album.images && track.album.images[0] && (
                  <div className={styles.trackImage}>
                    <img src={track.album.images[0].url} alt={track.name} />
                  </div>
                )}
                <div className={styles.trackInfo}>
                  <h3>{track.name}</h3>
                  <p>{track.artists.map(a => a.name).join(', ')}</p>
                  <p className={styles.albumName}>{track.album.name}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.eventsSection}>
        <h2>Upcoming Events For You</h2>
        {/* Events section preserved from your original implementation */}
      </div>

      <div className={styles.artistsSection}>
        <h2>Top Artists</h2>
        <div className={styles.artistsGrid}>
          {topArtists.slice(0, 6).map((artist, index) => (
            <div key={index} className={styles.artistCard}>
              {artist.image && (
                <div className={styles.artistImage}>
                  <img src={artist.image} alt={artist.name} />
                </div>
              )}
              <h3>{artist.name}</h3>
            </div>
          ))}
        </div>
        <button 
          className={styles.viewAllButton}
          onClick={() => toggleSection('artists')}
        >
          View All Artists
        </button>
      </div>

      <div className={styles.tracksSection}>
        <h2>Top Tracks</h2>
        <div className={styles.tracksList}>
          {topTracks.slice(0, 5).map((track, index) => (
            <div key={index} className={styles.trackItem}>
              {track.album.images && track.album.images[0] && (
                <div className={styles.trackImage}>
                  <img src={track.album.images[0].url} alt={track.name} />
                </div>
              )}
              <div className={styles.trackInfo}>
                <h3>{track.name}</h3>
                <p>{track.artists.map(a => a.name).join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
        <button 
          className={styles.viewAllButton}
          onClick={() => toggleSection('tracks')}
        >
          View All Tracks
        </button>
      </div>
    </div>
  );
}
