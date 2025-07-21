import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

export default function Top5GenresSpiderChart() {
  const { data: session } = useSession();
  const [genreData, setGenreData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('unknown');

  // PHASE 1: Enhanced genre data loading with fallback handling
  const loadGenreData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 Loading genre preferences...');
      
      // Try enhanced profile first
      try {
        const enhancedResponse = await fetch('/api/user/enhanced-taste-profile');
        if (enhancedResponse.ok) {
          const enhancedData = await enhancedResponse.json();
          if (enhancedData.genrePreferences && enhancedData.genrePreferences.length > 0) {
            const processedData = processGenreData(enhancedData.genrePreferences);
            setGenreData(processedData);
            setDataSource('enhanced_profile');
            console.log('✅ Enhanced profile genres loaded');
            return;
          }
        }
      } catch (enhancedError) {
        console.log('⚠️ Enhanced profile not available:', enhancedError.message);
      }
      
      // Try basic Spotify profile
      try {
        const spotifyResponse = await fetch('/api/spotify/user-profile');
        if (spotifyResponse.ok) {
          const spotifyData = await spotifyResponse.json();
          if (spotifyData.topGenres && spotifyData.topGenres.length > 0) {
            const processedData = processGenreData(spotifyData.topGenres);
            setGenreData(processedData);
            setDataSource(spotifyData.dataSource === 'mock' ? 'mock' : 'spotify');
            console.log('✅ Spotify genres loaded');
            return;
          }
        }
      } catch (spotifyError) {
        console.log('⚠️ Spotify API not available:', spotifyError.message);
      }
      
      // PHASE 1: Fallback to default genres
      console.log('⚠️ All APIs failed, using fallback genres');
      setGenreData(getFallbackGenreData());
      setDataSource('fallback');
      setError('NO_GENRE_DATA');
      
    } catch (err) {
      console.error('❌ Error loading genre data:', err);
      setGenreData(getFallbackGenreData());
      setDataSource('error');
      setError('LOADING_ERROR');
    } finally {
      setLoading(false);
    }
  };

  // PHASE 1: Enhanced genre data processing with null safety
  const processGenreData = (genres) => {
    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      console.warn('⚠️ Invalid genre data, using fallback');
      return getFallbackGenreData();
    }
    
    return genres.slice(0, 5).map(genre => ({
      genre: genre.name || 'Unknown',
      value: genre.percentage || (genre.weight ? Math.round(genre.weight * 100) : 50),
      fullMark: 100
    }));
  };

  // PHASE 1: Enhanced fallback genre data
  const getFallbackGenreData = () => [
    { genre: 'House', value: 85, fullMark: 100 },
    { genre: 'Techno', value: 72, fullMark: 100 },
    { genre: 'Progressive House', value: 68, fullMark: 100 },
    { genre: 'Deep House', value: 61, fullMark: 100 },
    { genre: 'Trance', value: 45, fullMark: 100 }
  ];

  useEffect(() => {
    if (session) {
      loadGenreData();
    }
  }, [session]);

  // PHASE 1: Enhanced loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ color: '#999999' }}>Analyzing your genre preferences...</p>
        </div>
      </div>
    );
  }

  // PHASE 1: Enhanced error state with fallback display
  if (!genreData || genreData.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p style={{ color: '#FF00CC' }}>⚠️ Genre data unavailable</p>
          <p style={{ color: '#999999' }}>Unable to load genre preferences</p>
          <div className={styles.fallbackMessage}>
            <span style={{ color: '#888888', fontSize: '12px' }}>
              Using default genre distribution
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* PHASE 1: Removed duplicate heading - main dashboard handles this */}
      
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={genreData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid 
              stroke="rgba(0, 255, 255, 0.1)" // PHASE 1: TIKO card border color
            />
            <PolarAngleAxis 
              dataKey="genre" 
              tick={{ 
                fill: '#DADADA', // PHASE 1: TIKO primary text color
                fontSize: 12 
              }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ 
                fill: '#999999', // PHASE 1: TIKO secondary text color
                fontSize: 10 
              }}
            />
            <Radar
              name="Genre Preference"
              dataKey="value"
              stroke="#00CFFF" // PHASE 1: TIKO interactive highlight color
              fill="#FF00CC" // PHASE 1: TIKO action button color
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* PHASE 1: Genre breakdown list */}
      <div className={styles.genreList}>
        {genreData.map((item, index) => (
          <div key={index} className={styles.genreItem}>
            <span 
              className={styles.genreName}
              style={{ color: '#DADADA' }} // PHASE 1: TIKO primary text
            >
              {item.genre}
            </span>
            <span 
              className={styles.genreValue}
              style={{ color: '#00CFFF' }} // PHASE 1: TIKO interactive highlight
            >
              {item.value}%
            </span>
          </div>
        ))}
      </div>

      {/* PHASE 1: Data source indicator */}
      <div className={styles.dataSourceInfo}>
        <span style={{ color: '#888888', fontSize: '12px' }}>
          {dataSource === 'enhanced_profile' && '🟡 Enhanced Profile'}
          {dataSource === 'spotify' && '🟢 Spotify API'}
          {dataSource === 'mock' && '⚠️ Mock Data'}
          {dataSource === 'fallback' && '⚠️ Fallback Data'}
          {dataSource === 'error' && '❌ Error State'}
        </span>
      </div>

      {/* PHASE 1: Error indicator */}
      {error && (
        <div className={styles.errorIndicator}>
          <span style={{ color: '#999999', fontSize: '12px' }}>
            ⚠️ {error === 'NO_GENRE_DATA' ? 'Genre APIs unavailable - using defaults' : 'Data loading error'}
          </span>
        </div>
      )}
    </div>
  );
}

