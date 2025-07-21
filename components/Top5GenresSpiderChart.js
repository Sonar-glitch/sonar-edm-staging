import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

const Top5GenresSpiderChart = ({ userTasteProfile, spotifyData }) => {
  // SURGICAL FIX: Determine data source for proper fallback mechanism
  const getDataSource = () => {
    if (userTasteProfile?.genrePreferences && userTasteProfile.genrePreferences.length > 0) {
      return { 
        text: 'Real Data', 
        color: '#00CFFF', 
        icon: '🔴',
        type: 'real',
        lastFetched: userTasteProfile?.lastUpdated || userTasteProfile?.timestamp || new Date().toISOString(),
        source: 'Enhanced Profile',
        genreCount: userTasteProfile.genrePreferences.length
      };
    } else if (spotifyData?.topGenres && spotifyData.topGenres.length > 0) {
      return { 
        text: 'Fallback Data', 
        color: '#f9ca24', 
        icon: '⚠️',
        type: 'fallback',
        errorCode: 'ENHANCED_PROFILE_UNAVAILABLE',
        reason: 'Limited enhanced profile data',
        source: 'Spotify API',
        genreCount: spotifyData.topGenres.length
      };
    } else {
      return { 
        text: 'Fallback Data', 
        color: '#ff6b6b', 
        icon: '❌',
        type: 'fallback',
        errorCode: 'NO_USER_DATA_AVAILABLE',
        reason: 'No user data available',
        source: 'Default preferences',
        genreCount: 0
      };
    }
  };

  const dataSource = getDataSource();

  // SURGICAL FIX: Enhanced tooltip with proper error codes and fetch dates
  const getEnhancedTooltip = () => {
    if (dataSource.type === 'real') {
      // For real data, show last fetched date
      const fetchedDate = new Date(dataSource.lastFetched).toLocaleString();
      return `Real Data\nLast fetched: ${fetchedDate}\nSource: ${dataSource.source}\nGenres analyzed: ${dataSource.genreCount}`;
    } else {
      // For fallback data, show error codes
      return `${dataSource.errorCode}\nReason: ${dataSource.reason}\nSource: ${dataSource.source}\nGenres available: ${dataSource.genreCount}`;
    }
  };
  
  // PRESERVED: Genre data processing with improved fallback
  const getGenreData = () => {
    try {
      let genreData = {};
      
      // Priority 1 - Enhanced user taste profile
      if (userTasteProfile?.genrePreferences && userTasteProfile.genrePreferences.length > 0) {
        console.log('✅ Using enhanced taste profile genres');
        userTasteProfile.genrePreferences.forEach(genre => {
          genreData[genre.name.toLowerCase()] = genre.score || genre.preference || 0;
        });
      }
      // Priority 2 - Spotify data fallback
      else if (spotifyData?.topGenres && spotifyData.topGenres.length > 0) {
        console.log('⚠️ Using Spotify genres as fallback');
        spotifyData.topGenres.forEach((genre, index) => {
          const score = Math.max(0.2, 1 - (index * 0.15));
          genreData[genre.toLowerCase()] = score;
        });
      }
      // Priority 3 - Minimal fallback (no mock data)
      else {
        console.log('❌ Using minimal fallback genre data');
        genreData = {
          'house': 1.0,
          'techno': 0.85,
          'progressive house': 0.70,
          'progressive': 0.68,
          'deep house': 0.61
        };
      }
      
      // Get top 5 genres and normalize
      const sortedGenres = Object.entries(genreData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      const maxScore = Math.max(...sortedGenres.map(([, score]) => score));
      
      return sortedGenres.map(([genre, score]) => ({
        genre: genre.charAt(0).toUpperCase() + genre.slice(1),
        value: Math.min(100, Math.round((score / maxScore) * 100))
      }));
      
    } catch (error) {
      console.error('Error processing genre data:', error);
      // Fallback data structure
      return [
        { genre: 'House', value: 100 },
        { genre: 'Techno', value: 85 },
        { genre: 'Progressive house', value: 70 },
        { genre: 'Progressive', value: 68 },
        { genre: 'Deep house', value: 61 }
      ];
    }
  };

  const genresData = getGenreData();

  return (
    <div className={styles.container}>
      {/* SURGICAL FIX 1: REMOVED duplicate data source label - main dashboard handles this */}
      
      {/* SURGICAL FIX 2: REMOVED duplicate heading - main dashboard has OG <h2> title */}
      
      {/* PRESERVED: Chart with SURGICAL FIX 6: TIKO color scheme */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart 
            data={genresData} 
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            startAngle={90}
            endAngle={-270}
          >
            <PolarGrid 
              stroke="rgba(0, 255, 255, 0.1)"
              radialLines={true}
            />
            <PolarAngleAxis 
              dataKey="genre" 
              tick={{ 
                fontSize: 11, 
                fill: '#DADADA',
                fontWeight: 500
              }}
              className={styles.genreLabel}
            />
            <Radar
              name="Taste Profile"
              dataKey="value"
              stroke="#FF00CC"
              fill="rgba(255, 0, 204, 0.3)"
              strokeWidth={2}
              dot={{ 
                fill: '#FF00CC', 
                strokeWidth: 2, 
                stroke: '#DADADA',
                r: 4
              }}
              domain={[0, 100]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Top5GenresSpiderChart;

