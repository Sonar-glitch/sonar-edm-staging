import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

const Top5GenresSpiderChart = ({ userTasteProfile, spotifyData }) => {
  const getTop5GenresData = () => {
    // Fallback demo data
    if (!userTasteProfile?.genrePreferences && !spotifyData?.topGenres) {
      return [
        { genre: 'House', value: 85, normalizedValue: 85 },
        { genre: 'Techno', value: 72, normalizedValue: 72 },
        { genre: 'Progressive', value: 68, normalizedValue: 68 },
        { genre: 'Deep House', value: 61, normalizedValue: 61 },
        { genre: 'Trance', value: 45, normalizedValue: 45 }
      ];
    }

    // Real data processing
    const genreScores = new Map();
    
    if (userTasteProfile?.genrePreferences) {
      userTasteProfile.genrePreferences.forEach(genre => {
        genreScores.set(genre.name, (genre.weight || 0) * 100);
      });
    }
    
    if (spotifyData?.topGenres) {
      spotifyData.topGenres.forEach((genre, index) => {
        const spotifyScore = Math.max(0, 100 - (index * 15));
        const existingScore = genreScores.get(genre.name) || 0;
        genreScores.set(genre.name, Math.max(existingScore, spotifyScore));
      });
    }
    
    const sortedGenres = Array.from(genreScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const maxScore = Math.max(...sortedGenres.map(([, score]) => score));
    return sortedGenres.map(([genre, score]) => ({
      genre: genre.charAt(0).toUpperCase() + genre.slice(1),
      value: score,
      normalizedValue: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    }));
  };

  const genresData = getTop5GenresData();

  return (
    <div className={styles.container}>
      {/* CLEAN: Just the chart, no redundant content */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={genresData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" radialLines={true} />
            <PolarAngleAxis 
              dataKey="genre"
              tick={{ fill: '#fff', fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }}
              tickCount={6}
            />
            <Radar
              name="Genre Preference"
              dataKey="normalizedValue"
              stroke="#ff1493"
              fill="#ff1493"
              fillOpacity={0.3}
              strokeWidth={3}
              dot={{ fill: '#ff1493', strokeWidth: 2, stroke: '#00bfff', r: 6 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* NO GENRE LIST - REMOVED PERMANENTLY */}
      {/* NO TASTE STRENGTH - REMOVED TO SAVE SPACE */}
      {/* NO REDUNDANT SUMMARY - REMOVED FOR CLEAN LAYOUT */}
    </div>
  );
};

export default Top5GenresSpiderChart;
