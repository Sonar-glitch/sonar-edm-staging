import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

const Top5GenresSpiderChart = ({ userTasteProfile, spotifyData }) => {
  // Default genre data with PROPER NORMALIZATION (max 100%)
  const getGenreData = () => {
    try {
      // Default fallback data
      const defaultGenres = [
        { genre: 'House', value: 100 },
        { genre: 'Techno', value: 85 },
        { genre: 'Progressive house', value: 70 },
        { genre: 'Progressive', value: 68 },
        { genre: 'Deep house', value: 61 }
      ];

      // If no real data, return defaults
      if (!userTasteProfile?.genrePreferences && !spotifyData?.topGenres) {
        return defaultGenres;
      }

      // Process real data with proper normalization
      const genreScores = new Map();
      
      if (userTasteProfile?.genrePreferences) {
        userTasteProfile.genrePreferences.forEach(genre => {
          const score = (genre.weight || 0) * 100;
          genreScores.set(genre.name, score);
        });
      }
      
      if (spotifyData?.topGenres) {
        spotifyData.topGenres.forEach((genre, index) => {
          const spotifyScore = Math.max(0, 100 - (index * 15));
          const existingScore = genreScores.get(genre.name) || 0;
          genreScores.set(genre.name, Math.max(existingScore, spotifyScore));
        });
      }
      
      if (genreScores.size === 0) {
        return defaultGenres;
      }
      
      const sortedGenres = Array.from(genreScores.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      // ENSURE VALUES NEVER EXCEED 100% - PROPER NORMALIZATION
      const maxScore = Math.max(...sortedGenres.map(([, score]) => score));
      
      return sortedGenres.map(([genre, score]) => ({
        genre: genre.charAt(0).toUpperCase() + genre.slice(1),
        value: Math.min(100, Math.round((score / maxScore) * 100)) // CAP AT 100%
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
      {/* REDUCED HEIGHT SPIDER CHART - NO REDUNDANT CONTENT */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}>
          <RadarChart data={genresData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
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
      
      {/* NO GENRE LIST - NO TASTE STRENGTH - CLEAN DESIGN */}
    </div>
  );
};

export default Top5GenresSpiderChart;
