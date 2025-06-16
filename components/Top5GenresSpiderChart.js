import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

const Top5GenresSpiderChart = ({ userTasteProfile, spotifyData }) => {
  const getTop5GenresData = () => {
    // Fallback demo data for testing
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
  const overallTasteStrength = genresData.length > 0 
    ? Math.round(genresData.reduce((sum, genre) => sum + genre.normalizedValue, 0) / genresData.length)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Top 5 Genres</h3>
        <div className={styles.tasteStrength}>
          <span className={styles.strengthLabel}>Taste Strength</span>
          <span className={styles.strengthValue}>{overallTasteStrength}%</span>
        </div>
      </div>
      
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
      
      <div className={styles.genresList}>
        {genresData.map((genre, index) => (
          <div key={genre.genre} className={styles.genreItem}>
            <div className={styles.genreRank}>#{index + 1}</div>
            <div className={styles.genreInfo}>
              <span className={styles.genreName}>{genre.genre}</span>
              <span className={styles.genreScore}>{genre.normalizedValue}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Top5GenresSpiderChart;
