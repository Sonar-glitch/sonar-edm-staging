import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

const Top5GenresSpiderChart = ({ userTasteProfile, spotifyData }) => {
  // SURGICAL ADDITION: Determine data source for labeling
  const getDataSource = () => {
    if (userTasteProfile?.genrePreferences && userTasteProfile.genrePreferences.length > 0) {
      return { text: 'Live Data', color: '#4ecdc4', icon: '🔴' };
    } else if (spotifyData?.topGenres && spotifyData.topGenres.length > 0) {
      return { text: 'Fallback Data', color: '#f9ca24', icon: '⚠️' };
    } else {
      return { text: 'Demo Data', color: '#ff6b6b', icon: '❌' };
    }
  };

  const dataSource = getDataSource();

  // SURGICAL ADDITION: Enhanced tooltip with error codes and last fetched dates
  const getEnhancedTooltip = () => {
    if (dataSource.text === 'Live Data') {
      // For live data, show last fetched date
      const lastFetched = userTasteProfile?.lastUpdated || userTasteProfile?.timestamp || new Date().toISOString();
      const fetchedDate = new Date(lastFetched).toLocaleString();
      const genreCount = userTasteProfile?.genrePreferences?.length || 0;
      return `Live Data\nLast fetched: ${fetchedDate}\nSource: Enhanced Profile\nGenres analyzed: ${genreCount}`;
    } else if (dataSource.text === 'Fallback Data') {
      // For fallback data, show limited info
      const genreCount = spotifyData?.topGenres?.length || 0;
      return `Fallback Data\nReason: Limited enhanced profile data\nSource: Spotify API\nGenres available: ${genreCount}`;
    } else {
      // For demo data, show default info
      return `Demo Data\nReason: No user data available\nSource: Default genre preferences\nNote: Connect Spotify for personalized data`;
    }
  };
  
  // PRESERVED: Default genre data with PROPER NORMALIZATION (max 100%)
  const getGenreData = () => {
    try {
      let genreData = {};
      
      // PRESERVED: Priority 1 - Enhanced user taste profile
      if (userTasteProfile?.genrePreferences && userTasteProfile.genrePreferences.length > 0) {
        console.log('✅ Using enhanced taste profile genres');
        userTasteProfile.genrePreferences.forEach(genre => {
          genreData[genre.name.toLowerCase()] = genre.score || genre.preference || 0;
        });
      }
      // PRESERVED: Priority 2 - Spotify data
      else if (spotifyData?.topGenres && spotifyData.topGenres.length > 0) {
        console.log('⚠️ Using Spotify genres as fallback');
        spotifyData.topGenres.forEach((genre, index) => {
          // Convert array position to score (first = highest)
          const score = Math.max(0.2, 1 - (index * 0.15));
          genreData[genre.toLowerCase()] = score;
        });
      }
      // PRESERVED: Priority 3 - Demo data
      else {
        console.log('❌ Using demo genre data');
        genreData = {
          'house': 1.0,
          'techno': 0.85,
          'progressive house': 0.70,
          'progressive': 0.68,
          'deep house': 0.61
        };
      }
      
      // PRESERVED: Get top 5 genres and normalize
      const sortedGenres = Object.entries(genreData)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5);
      
      // PRESERVED: FIXED: Ensure proper normalization with highest value always at 100%
      const maxScore = Math.max(...sortedGenres.map(([, score]) => score));
      
      return sortedGenres.map(([genre, score]) => ({
        genre: genre.charAt(0).toUpperCase() + genre.slice(1),
        value: Math.min(100, Math.round((score / maxScore) * 100)) // Normalize to 100% max
      }));
      
    } catch (error) {
      console.error('Error processing genre data:', error);
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
      {/* FIXED: Data Source Label - Top-Right Positioning */}
      <div className={styles.dataSourceLabel} 
           title={getEnhancedTooltip()}
           style={{
             position: 'absolute',
             top: '10px',
             right: '10px',
             color: dataSource.color,
             fontSize: '12px',
             opacity: 0.8,
             zIndex: 10,
             cursor: 'help'
           }}>
        {dataSource.icon} {dataSource.text}
      </div>

      {/* PRESERVED: Section Header */}
      <div className={styles.headerSection}>
        <h3 className={styles.sectionTitle}>Your Top 5 Genres</h3>
      </div>
      
      {/* PRESERVED: Properly configured chart with FIXED COLORS */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart 
            data={genresData} 
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            startAngle={90}
            endAngle={-270}
          >
            <PolarGrid 
              stroke="rgba(255, 255, 255, 0.2)"
              radialLines={true}
            />
            <PolarAngleAxis 
              dataKey="genre" 
              tick={{ 
                fontSize: 11, 
                fill: '#fff',
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
                stroke: '#fff',
                r: 4
              }}
              // PRESERVED: FIXED: Explicitly set domain to ensure 0-100% scale
              domain={[0, 100]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Top5GenresSpiderChart;

