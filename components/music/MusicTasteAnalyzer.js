import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import styles from '../../styles/MusicTaste.module.css';

export default function MusicTasteAnalyzer() {
  const { data: session, status } = useSession();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [results, setResults] = useState(null);

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
      setError('Failed to analyze your music taste. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle genre selection
  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
    setResults({
      type: 'genre',
      name: genre,
      description: `Based on your listening history, you have a strong affinity for ${genre} music. Here are some recommendations and events that match your taste.`,
      recommendations: [
        { name: `Top ${genre} Artist 1`, image: '/images/artist1.jpg' },
        { name: `Top ${genre} Artist 2`, image: '/images/artist2.jpg' },
        { name: `Top ${genre} Artist 3`, image: '/images/artist3.jpg' }
      ],
      events: [
        { name: `${genre} Festival 2025`, location: 'Miami, FL', date: 'June 15, 2025' },
        { name: `${genre} Club Night`, location: 'New York, NY', date: 'May 22, 2025' }
      ]
    });
  };

  // Handle artist selection
  const handleArtistSelect = (artist) => {
    setSelectedArtist(artist);
    setResults({
      type: 'artist',
      name: artist,
      description: `You've been listening to a lot of ${artist} lately. Here are similar artists and upcoming events you might enjoy.`,
      recommendations: [
        { name: `Similar to ${artist} 1`, image: '/images/similar1.jpg' },
        { name: `Similar to ${artist} 2`, image: '/images/similar2.jpg' },
        { name: `Similar to ${artist} 3`, image: '/images/similar3.jpg' }
      ],
      events: [
        { name: `${artist} World Tour`, location: 'Los Angeles, CA', date: 'July 10, 2025' },
        { name: `${artist} Album Release Party`, location: 'Chicago, IL', date: 'August 5, 2025' }
      ]
    });
  };

  // Run analysis when component mounts
  useEffect(() => {
    if (session) {
      analyzeMusicTaste();
    }
  }, [session]);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Analyzing your music taste...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={analyzeMusicTaste}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (results) {
    return (
      <div className={styles.resultsContainer}>
        <h2>{results.name}</h2>
        <p className={styles.resultDescription}>{results.description}</p>
        
        <div className={styles.section}>
          <h3>Recommended Artists</h3>
          <div className={styles.recommendationGrid}>
            {results.recommendations.map((rec, index) => (
              <div key={index} className={styles.recommendationCard}>
                <div className={styles.cardImage}></div>
                <p>{rec.name}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.section}>
          <h3>Upcoming Events</h3>
          <div className={styles.eventsList}>
            {results.events.map((event, index) => (
              <div key={index} className={styles.eventCard}>
                <h4>{event.name}</h4>
                <p>{event.location} • {event.date}</p>
              </div>
            ))}
          </div>
        </div>
        
        <button 
          className={styles.backButton}
          onClick={() => setResults(null)}
        >
          Back to Analysis
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Music Taste Analysis</h2>
      
      {analysis ? (
        <>
          <div className={styles.section}>
            <h3>Top Genres</h3>
            <div className={styles.optionsGrid}>
              {analysis.topGenres.map((genre, index) => (
                <div 
                  key={index} 
                  className={styles.optionCard}
                  onClick={() => handleGenreSelect(genre.name)}
                >
                  <h4>{genre.name}</h4>
                  <p>{genre.percentage}% affinity</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className={styles.section}>
            <h3>Top Artists</h3>
            <div className={styles.optionsGrid}>
              {analysis.topArtists.map((artist, index) => (
                <div 
                  key={index} 
                  className={styles.optionCard}
                  onClick={() => handleArtistSelect(artist.name)}
                >
                  <h4>{artist.name}</h4>
                  <p>{artist.playCount} plays</p>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className={styles.noData}>No analysis data available. Please check back later.</p>
      )}
    </div>
  );
}
