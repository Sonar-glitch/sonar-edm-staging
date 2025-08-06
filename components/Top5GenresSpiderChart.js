import { useState, useEffect, useRef } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
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

      // Convert data format for Recharts
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

  // TIKO-themed custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      
      // Get delta for this genre
      let deltaText = '';
      if (getDeltaIndicator && data.genre) {
        const genreKey = data.genre.toLowerCase().replace(/\s+/g, ' ').trim();
        const deltaIndicator = getDeltaIndicator('genres', genreKey);
        if (deltaIndicator && deltaIndicator.props && deltaIndicator.props.children) {
          deltaText = deltaIndicator.props.children;
        }
      }

      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipGenre}>{data.genre}</p>
          <p className={styles.tooltipValue}>Preference: {data.value}%</p>
          {deltaText && (
            <p className={styles.tooltipDelta}>
              Weekly change: {deltaText}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // FIXED: Custom label that shows genre name + delta as separate text elements
  const CustomLabel = ({ payload, x, y, textAnchor, ...props }) => {
    if (!payload || !payload.value) {
      return null;
    }

    // Get delta indicator for this genre
    let deltaText = '';
    if (getDeltaIndicator && payload.value) {
      // Normalize the genre name to match what getDeltaIndicator expects
      const genreKey = payload.value.toLowerCase().replace(/\s+/g, ' ').trim();
      const deltaIndicator = getDeltaIndicator('genres', genreKey);
      
      // Extract the text content from the delta indicator if it exists
      if (deltaIndicator && deltaIndicator.props && deltaIndicator.props.children) {
        deltaText = deltaIndicator.props.children;
      }
    }

    // Position delta text slightly below genre name
    const deltaY = y + 14;

    return (
      <g>
        <text
          x={x}
          y={y}
          textAnchor={textAnchor}
          fontSize={11}
          fill="#DADADA"
          fontWeight="500"
        >
          {payload.value}
        </text>
        {deltaText && (
          <text
            x={x}
            y={deltaY}
            textAnchor={textAnchor}
            fontSize={10}
            fill={deltaText.includes('↗️') ? '#00FF88' : deltaText.includes('↘️') ? '#FF4444' : '#999999'}
            fontWeight="400"
          >
            {deltaText}
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
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart
            data={chartData}
            margin={{ top: 60, right: 60, bottom: 60, left: 60 }}
          >
            <PolarGrid
              stroke="rgba(0, 255, 255, 0.2)"
            />
            <PolarAngleAxis
              dataKey="genre"
              tick={<CustomLabel />}
            />
            <Radar
              name="Genre Preference"
              dataKey="value"
              stroke="#FF00CC"
              fill="rgba(255, 0, 204, 0.2)"
              strokeWidth={2}
              dot={{
                fill: '#FF00CC',
                strokeWidth: 2,
                stroke: '#DADADA',
                r: 4
              }}
            />
            <CustomTooltip />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

