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


  // Enhanced CustomTooltip with protocol-compliant delta and tooltip logic
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const deltaInfo = genreDeltas[label];
      // Try to extract delta value and direction
      let change = 0;
      let direction = '';
      if (deltaInfo) {
        const match = /([↗↘])\s*(\d+)/.exec(deltaInfo);
        if (match) {
          direction = match[1] === '↗️' ? 'up' : 'down';
          change = parseInt(match[2], 10);
        }
      }
      // Determine data source (real or fallback)
      let isReal = false;
      if (dataSource && dataSource.isReal) {
        isReal = true;
      }
      // Tooltip message per protocol
      let tooltip = '';
      if (isReal && change !== 0) {
        tooltip = `Your ${label} taste ${direction === 'up' ? 'increased' : 'decreased'} ${change}% in the last 7 days`;
      } else if (!isReal) {
        if (dataSource && dataSource.error === 'API_ERROR') {
          tooltip = 'Demo data - waiting for your music activity';
        } else {
          tooltip = 'Demo data - personalizing your experience (3 more days)';
        }
      }
      return (
        <div className={styles.customTooltip}>
          <p className={styles.tooltipGenre}>{label}</p>
          <p className={styles.tooltipValue}>{value}% {deltaInfo && (
              <span className={styles.deltaIndicator} style={{ marginLeft: 8, border: '1px solid #FFD700', padding: '0 4px', borderRadius: '4px', background: '#15151F' }}>{deltaInfo} <span style={{color:'#FFD700',fontWeight:'bold'}}>DEBUG</span></span>
          )}</p>
          <p className={styles.tooltipDelta}>{tooltip}</p>
        </div>
      );
    }
    return null;
  };


  // Custom label component for genre names with always-visible delta
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
          {deltaInfo && (
              <tspan
                dx={8}
                fontSize={11}
                fill={deltaInfo.includes('↗️') ? '#00FF88' : '#FF4444'}
                fontWeight="600"
              >
                {deltaInfo} DEBUG
              </tspan>
          )}
        </text>
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

