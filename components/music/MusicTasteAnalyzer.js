import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import styles from '../../styles/MusicTaste.module.css';

export default function MusicTasteAnalyzer() {
  const { data: session, status } = useSession();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Function to analyze music taste
  const analyzeMusicTaste = async () => {
    if (!session?.accessToken) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Call our API endpoint that uses the prediction module
      const response = await axios.post('/api/prediction?type=music-taste', {
        userData: {
          accessToken: session.accessToken,
          userId: session.user.id
        }
      });
      
      setAnalysis(response.data);
    } catch (err) {
      console.error('Error analyzing music taste:', err);
      setError(err.response?.data?.message || 'Failed to analyze music taste');
    } finally {
      setLoading(false);
    }
  };

  // Analyze music taste when session is available
  useEffect(() => {
    if (session && !analysis && !loading) {
      analyzeMusicTaste();
    }
  }, [session]);

  if (status === 'loading') {
    return <div className={styles.container}>Loading session...</div>;
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <p>Please sign in to analyze your music taste.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Music Taste Analysis</h2>
      
      {loading && <p className={styles.loading}>Analyzing your music taste...</p>}
      
      {error && (
        <div className={styles.error}>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={analyzeMusicTaste}
          >
            Retry Analysis
          </button>
        </div>
      )}
      
      {analysis && !loading && (
        <div className={styles.results}>
          <div className={styles.section}>
            <h3>Top Genres</h3>
            <ul className={styles.genreList}>
              {analysis.topGenres.map((genre, index) => (
                <li key={index} className={styles.genreItem}>
                  <span className={styles.genreName}>{genre.name}</span>
                  <div className={styles.genreBar}>
                    <div 
                      className={styles.genreBarFill} 
                      style={{ width: `${genre.score}%` }}
                    />
                  </div>
                  <span className={styles.genreScore}>{genre.score}%</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className={styles.section}>
            <h3>Music Attributes</h3>
            <div className={styles.attributesGrid}>
              {Object.entries(analysis.attributes).map(([key, value]) => (
                <div key={key} className={styles.attribute}>
                  <span className={styles.attributeName}>
                    {key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                  <div className={styles.attributeBar}>
                    <div 
                      className={styles.attributeBarFill} 
                      style={{ width: `${value * 100}%` }}
                    />
                  </div>
                  <span className={styles.attributeValue}>
                    {Math.round(value * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.section}>
            <h3>Recommended EDM Artists</h3>
            <div className={styles.artistsGrid}>
              {analysis.recommendedArtists.map((artist, index) => (
                <div key={index} className={styles.artistCard}>
                  {artist.image && (
                    <div className={styles.artistImage}>
                      <img src={artist.image} alt={artist.name} />
                    </div>
                  )}
                  <h4 className={styles.artistName}>{artist.name}</h4>
                  <p className={styles.artistGenre}>{artist.genre}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
