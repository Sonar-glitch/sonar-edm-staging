import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../../styles/MusicTaste.module.css';

// Mock data for development and testing
const mockAnalysisData = {
  topGenres: [
    { id: 1, name: 'House', affinity: 95 },
    { id: 2, name: 'Techno', affinity: 88 },
    { id: 3, name: 'Trance', affinity: 82 },
    { id: 4, name: 'Dubstep', affinity: 75 },
    { id: 5, name: 'Drum & Bass', affinity: 70 },
    { id: 6, name: 'Future Bass', affinity: 65 }
  ],
  topArtists: [
    { id: 1, name: 'Daft Punk', image: 'https://i.scdn.co/image/ab6761610000e5eb10c53f4f54c604d776d9af76' },
    { id: 2, name: 'Deadmau5', image: 'https://i.scdn.co/image/ab6761610000e5eb7eb7f6371aad8e67e01f0a03' },
    { id: 3, name: 'Avicii', image: 'https://i.scdn.co/image/ab6761610000e5eb6d5c33afc9f8873835b2d2a6' },
    { id: 4, name: 'Calvin Harris', image: 'https://i.scdn.co/image/ab6761610000e5eb66b24d02d3a2f9b3f1331f0e' },
    { id: 5, name: 'Martin Garrix', image: 'https://i.scdn.co/image/ab6761610000e5eb33c009a583e8289c5c9f1c29' },
    { id: 6, name: 'Skrillex', image: 'https://i.scdn.co/image/ab6761610000e5eb8ee9a6f54f6bf22037b3f0e1' }
  ],
  recommendedEvents: [
    { id: 1, name: 'Electric Daisy Carnival' },
    { id: 2, name: 'Tomorrowland' },
    { id: 3, name: 'Ultra Music Festival' },
    { id: 4, name: 'Creamfields' },
    { id: 5, name: 'Electric Zoo' },
    { id: 6, name: 'HARD Summer' }
  ]
};

export default function MusicTasteAnalyzer() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [selectedArtist, setSelectedArtist] = useState(null);
  const [results, setResults] = useState(null);

  // Function to analyze music taste
  const analyzeMusicTaste = async () => {
    setLoading(true);
    setError(null);

    try {
      // In a production environment, this would call the actual API
      // For now, we'll use mock data with a simulated delay
      setTimeout(() => {
        setAnalysis(mockAnalysisData);
        setLoading(false);
      }, 2000);
      
      // Actual API call would look like this:
      /*
      const response = await axios.post('/api/prediction?type=music-taste', {
        userData: {
          accessToken: session.accessToken,
          userId: session.user.id
        }
      });
      setAnalysis(response.data);
      */
    } catch (err) {
      console.error('Error analyzing music taste:', err);
      setError('Failed to analyze your music taste. Please try again.');
      setLoading(false);
    }
  };

  // Handle genre selection
  const handleGenreSelect = (genre) => {
    setSelectedGenre(genre);
    setSelectedArtist(null);
    
    // Simulate API call for genre-specific recommendations
    setLoading(true);
    setTimeout(() => {
      setResults({
        type: 'genre',
        name: genre,
        recommendations: [
          { id: 1, name: 'Electric Dreams Festival', location: 'Miami', date: 'July 15, 2025', match: '95%' },
          { id: 2, name: 'Bass Canyon', location: 'Washington', date: 'August 20, 2025', match: '92%' },
          { id: 3, name: 'Tomorrowland', location: 'Belgium', date: 'July 22, 2025', match: '88%' }
        ]
      });
      setLoading(false);
    }, 1500);
  };

  // Handle artist selection
  const handleArtistSelect = (artist) => {
    setSelectedArtist(artist);
    setSelectedGenre(null);
    
    // Simulate API call for artist-specific recommendations
    setLoading(true);
    setTimeout(() => {
      setResults({
        type: 'artist',
        name: artist,
        recommendations: [
          { id: 1, name: `${artist} World Tour`, location: 'New York', date: 'June 10, 2025', match: '98%' },
          { id: 2, name: 'EDM Summer Festival', location: 'Los Angeles', date: 'August 5, 2025', match: '90%' },
          { id: 3, name: 'Club Night with ' + artist, location: 'Chicago', date: 'September 15, 2025', match: '85%' }
        ]
      });
      setLoading(false);
    }, 1500);
  };

  // Reset selections and go back to main analysis
  const handleBack = () => {
    setSelectedGenre(null);
    setSelectedArtist(null);
    setResults(null);
  };

  // Run analysis when component mounts
  useEffect(() => {
    if (!analysis && !loading) {
      analyzeMusicTaste();
    }
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Analyzing your music taste...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          onClick={analyzeMusicTaste}
          className={styles.retryButton}
        >
          Try Again
        </button>
      </div>
    );
  }

  // If we have selected a genre or artist and have results
  if ((selectedGenre || selectedArtist) && results) {
    return (
      <div className={styles.resultsContainer}>
        <h3 className={styles.resultsTitle}>
          {results.type === 'genre' 
            ? `${results.name} Events For You` 
            : `Events featuring ${results.name}`}
        </h3>
        
        <div className={styles.eventsList}>
          {results.recommendations.map(event => (
            <div key={event.id} className={styles.eventCard}>
              <h4>{event.name}</h4>
              <p>{event.location} • {event.date}</p>
              <span className={styles.matchBadge}>{event.match} Match</span>
            </div>
          ))}
        </div>
        
        <button 
          onClick={handleBack}
          className={styles.backButton}
        >
          Back to Analysis
        </button>
      </div>
    );
  }

  // If we have analysis data but no selection yet
  if (analysis) {
    return (
      <div className={styles.analysisContainer}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Your Top Genres</h3>
          <div className={styles.optionsGrid}>
            {analysis.topGenres.map(genre => (
              <div 
                key={genre.id} 
                className={styles.optionCard}
                onClick={() => handleGenreSelect(genre.name)}
              >
                <div className={styles.optionIcon}>🎵</div>
                <h4>{genre.name}</h4>
                <span className={styles.matchBadge}>{genre.affinity}%</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Your Top Artists</h3>
          <div className={styles.optionsGrid}>
            {analysis.topArtists.map(artist => (
              <div 
                key={artist.id} 
                className={styles.optionCard}
                onClick={() => handleArtistSelect(artist.name)}
              >
                {artist.image ? (
                  <img 
                    src={artist.image} 
                    alt={artist.name} 
                    className={styles.artistImage}
                  />
                ) : (
                  <div className={styles.optionIcon}>👤</div>
                )}
                <h4>{artist.name}</h4>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Recommended Events</h3>
          <div className={styles.recommendationGrid}>
            {analysis.recommendedEvents.map(event => (
              <div key={event.id} className={styles.recommendationCard}>
                <div className={styles.cardImage}></div>
                <p>{event.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default state - no analysis yet
  return (
    <div className={styles.initialContainer}>
      <p>We'll analyze your Spotify listening history to provide personalized EDM event recommendations.</p>
      <button 
        onClick={analyzeMusicTaste}
        className={styles.analyzeButton}
      >
        Analyze My Music Taste
      </button>
    </div>
  );
}
