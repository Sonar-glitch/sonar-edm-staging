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

  // SURGICAL ADD: Custom label component to ensure genre labels are visible with delta indicators
  const CustomLabel = ({ payload, x, y, textAnchor, ...props }) => {
    // Ensure we have valid payload data
    if (!payload || !payload.genre || typeof payload.genre !== 'string') {
      return null;
    }

    // Safe genre key normalization for delta lookup
    const genreKey = payload.genre.toLowerCase().replace(/\s+/g, ' ').trim();
    
    // Get delta indicator if function is provided
    const deltaIndicator = getDeltaIndicator && genreKey ? 
      getDeltaIndicator('genres', genreKey) : null;

    // Extract delta information for tooltip
    const deltaText = deltaIndicator?.props?.children || '';
    const deltaValue = deltaText.split(' ')[1] || '';
    const isIncrease = deltaText.includes('↗️');
    const direction = isIncrease ? 'increased' : 'decreased';

    return (
      <g>
        {/* SURGICAL ADD: Always render genre label with enhanced visibility */}
        <text
          x={x}
          y={y}
          textAnchor={textAnchor}
          fontSize={12}
          fill="#DADADA"
          fontWeight="500"
          style={{ 
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
            userSelect: 'none'
          }}
        >
          {payload.genre}
        </text>
        
        {/* SURGICAL ADD: Delta indicator with enhanced tooltip */}
        {deltaIndicator && (
          <text
            x={x}
            y={y + 15}
            textAnchor={textAnchor}
            fontSize={10}
            fill={deltaIndicator?.props?.style?.color || '#00FF88'}
            fontWeight="600"
            style={{ 
              cursor: 'pointer',
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
            }}
          >
            {deltaText}
            {/* SURGICAL ADD: Enhanced tooltip explaining what the number means */}
            <title>
              {`${payload.genre} preference ${direction} by ${deltaValue}% since last week`}
            </title>
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
        {/* SURGICAL FIX: Recharts implementation with custom labels */}
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

