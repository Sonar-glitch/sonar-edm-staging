import { useState, useEffect } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import styles from '../styles/Top5GenresSpiderChart.module.css';

export default function Top5GenresSpiderChart({ data, dataSource, getDeltaIndicator }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [genreDeltas, setGenreDeltas] = useState({});

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

      // Pre-calculate deltas for all genres to avoid calling in render
      const deltas = {};
      if (getDeltaIndicator && typeof getDeltaIndicator === 'function') {
        genreData.forEach(genre => {
          try {
            const genreKey = genre.name.toLowerCase().replace(/\s+/g, ' ').trim();
            const indicator = getDeltaIndicator('genres', genreKey);
            if (indicator && indicator.props && indicator.props.children) {
              deltas[genre.name] = indicator.props.children;
            }
          } catch (err) {
            console.error('Error getting delta for genre:', genre.name, err);
          }
        });
      }

      setGenreDeltas(deltas);
      setChartData(rechartData);

    } catch (err) {
      console.error('Chart data loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      const deltaInfo = genreDeltas[data.genre];

      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipGenre}>{data.genre}</p>
          <p className={styles.tooltipValue}>Preference: {data.value}%</p>
          {deltaInfo && (
            <p className={styles.tooltipDelta}>
              Weekly change: {deltaInfo}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom label component for genre names
  const CustomLabel = ({ payload, x, y, textAnchor }) => {
    if (!payload || !payload.value) {
      return null;
    }

    const deltaInfo = genreDeltas[payload.value];
    
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
          {payload.value}
        </text>
        {deltaInfo && (
          <text
            x={x}
            y={y + 16}
            textAnchor={textAnchor}
            fontSize={10}
            fill="#00CFFF"
            fontWeight="400"
          >
            {deltaInfo}
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
            margin={{ top: 80, right: 60, bottom: 60, left: 60 }}  // Increased top margin for delta above labels
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
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}