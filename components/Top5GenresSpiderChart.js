import { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts'; // SURGICAL FIX: Changed from Chart.js to Recharts
import styles from '../styles/Top5GenresSpiderChart.module.css';

export default function Top5GenresSpiderChart({ data, dataSource, getDeltaIndicator }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadChartData();
  }, [data]);

  const loadChartData = async () => {
    try {
      setLoading(true);

      let genreData;

      if (data && data.topGenres && data.topGenres.length > 0) {
        genreData = data.topGenres.slice(0, 5);
      } else {
        // Fallback genre data
        genreData = [
          { name: 'Melodic Techno', percentage: 95 },
          { name: 'Melodic House', percentage: 95 },
          { name: 'Progressive House', percentage: 60 },
          { name: 'Techno', percentage: 30 },
          { name: 'Organic House', percentage: 15 }
        ];
      }

      // SURGICAL FIX: Convert data format for Recharts (was Chart.js format)
      const rechartData = genreData.map(genre => ({
        genre: genre.name,
        value: genre.percentage
      }));

      setChartData(rechartData);

    } catch (err) {
      console.error('Chart data loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // CORRECTED: Custom label component with proper error handling and null safety
  const CustomLabel = ({ payload, x, y, textAnchor, ...props }) => {
    // CRITICAL FIX: Early return for invalid data to prevent crashes
    if (!payload || !payload.genre || typeof payload.genre !== 'string') {
      return null;
    }

    // CRITICAL FIX: Safe genre key normalization with null checks
    const genreKey = payload.genre ? 
      payload.genre.toLowerCase().replace(/\s+/g, ' ').trim() : '';

    // CRITICAL FIX: Safe delta indicator access with null checks
    const deltaIndicator = getDeltaIndicator && genreKey ? 
      getDeltaIndicator('genres', genreKey) : null;

    return (
      <g>
        <text
          x={x}
          y={y}
          textAnchor={textAnchor}
          fontSize={12}
          fill="#DADADA"
          fontWeight="500"
        >
          {payload.genre}
        </text>
        {deltaIndicator && (
          <text
            x={x}
            y={y + 15}
            textAnchor={textAnchor}
            fontSize={10}
            fill={deltaIndicator?.props?.style?.color || '#DADADA'}
            fontWeight="600"
          >
            {deltaIndicator?.props?.children || ''}
          </text>
        )}
      </g>
    );
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your top genres...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Unable to load genre chart</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>No genre data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* ONLY SPIDER CHART - REMOVED DUPLICATE GENRE LIST */}
      <div className={styles.chartContainer}>
        {/* SURGICAL FIX: Recharts implementation instead of Chart.js */}
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <PolarGrid
              stroke="rgba(0, 255, 255, 0.2)" // TIKO cyan grid
            />
            <PolarAngleAxis
              dataKey="genre"
              tick={<CustomLabel />}
            />
            <Radar
              name="Genre Preference"
              dataKey="value"
              stroke="#FF00CC" // TIKO pink
              fill="rgba(255, 0, 204, 0.2)" // TIKO pink with transparency
              strokeWidth={2}
              dot={{
                fill: '#FF00CC', // TIKO pink
                strokeWidth: 2,
                stroke: '#DADADA', // TIKO primary text
                r: 4
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* REMOVED: Enhanced Profile button as requested */}
      {/* REMOVED: Duplicate genre list below chart as requested */}
    </div>
  );
}

