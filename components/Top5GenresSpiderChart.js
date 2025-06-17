import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

const Top5GenresSpiderChart = ({ userTasteProfile, spotifyData }) => {
  // Default genre data with PROPER NORMALIZATION (max 100%)
  const defaultGenres = [
    { genre: 'House', value: 100, normalizedValue: 100 },
    { genre: 'Techno', value: 85, normalizedValue: 85 },
    { genre: 'Progressive house', value: 70, normalizedValue: 70 },
    { genre: 'Progressive', value: 68, normalizedValue: 68 },
    { genre: 'Deep house', value: 61, normalizedValue: 61 }
  ];

  // Process user data with proper normalization
  const processGenreData = (data) => {
    if (!data || !data.topGenres) return defaultGenres;
    
    const genres = data.topGenres.slice(0, 5);
    
    // Find the maximum value for normalization
    const maxValue = Math.max(...genres.map(g => g.count || g.value || 0));
    
    return genres.map(genre => {
      const rawValue = genre.count || genre.value || 0;
      // ENSURE VALUES NEVER EXCEED 100%
      const normalizedValue = Math.min(100, Math.round((rawValue / maxValue) * 100));
      
      return {
        genre: genre.name || genre.genre,
        value: rawValue,
        normalizedValue: normalizedValue
      };
    });
  };

  const genresData = userTasteProfile ? processGenreData(userTasteProfile) : defaultGenres;

  // Prepare data for radar chart
  const radarData = genresData.map(item => ({
    genre: item.genre,
    value: item.normalizedValue // Use normalized value (0-100%)
  }));

  return (
    <div className={styles.container}>
      {/* REDUCED HEIGHT SPIDER CHART */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}> {/* Reduced from 300 to 200 */}
          <RadarChart data={radarData}>
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
              stroke="#ff006e"
              fill="rgba(255, 0, 110, 0.3)"
              strokeWidth={2}
              dot={{ 
                fill: '#ff006e', 
                strokeWidth: 2, 
                stroke: '#fff',
                r: 4
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Top5GenresSpiderChart;
