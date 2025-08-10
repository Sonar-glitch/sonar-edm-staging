import { useState, useEffect, useMemo } from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import styles from '../styles/Top5GenresSpiderChart.module.css';

export default function Top5GenresSpiderChart({ data, dataSource, getDeltaIndicator }) {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setLoading(true);
      let genreData;
      if (data && data.topGenres && data.topGenres.length > 0) {
        genreData = data.topGenres.slice(0, 5);
      } else {
        genreData = [
          { name: 'Melodic Techno', percentage: 95 },
          { name: 'Melodic House', percentage: 95 },
          { name: 'Progressive House', percentage: 60 },
          { name: 'Techno', percentage: 30 },
          { name: 'Organic House', percentage: 15 }
        ];
      }
      const rechartData = genreData.map(g => ({ genre: g.name, value: g.percentage }));
      setChartData(rechartData);
    } catch (err) {
      console.error('Chart data loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [data]);

  // Compute deltas each render to avoid stale snapshot & parsing issues
  const genreDeltas = useMemo(() => {
    if (!chartData || !getDeltaIndicator) return {};
    const map = {};
    chartData.forEach(item => {
      // Normalize key to match weeklyDeltas structure
      const key = item.genre.toLowerCase().trim();
      const delta = getDeltaIndicator('genres', key);
      if (delta) map[item.genre] = delta;
    });
    return map;
  }, [chartData, getDeltaIndicator]);


  // Enhanced CustomTooltip with protocol-compliant delta and tooltip logic
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const value = payload[0].value;
    const deltaInfo = genreDeltas[label];
    const isReal = !!(dataSource && dataSource.isReal);
    let tooltip = '';
    if (isReal && deltaInfo) {
      tooltip = `Your ${label} taste ${deltaInfo.arrow === '↗️' ? 'increased' : 'decreased'} ${deltaInfo.change} in the last 7 days`;
    } else if (!isReal) {
      tooltip = dataSource?.error === 'API_ERROR'
        ? 'Demo data - waiting for your music activity'
        : 'Demo data - personalizing your experience (3 more days)';
    }
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipGenre}>{label}</p>
        <p className={styles.tooltipValue}>
          {value}%
          {deltaInfo && (
            <span className={styles.deltaIndicator} style={{ color: deltaInfo.color }}>
              {deltaInfo.arrow} {deltaInfo.change}
            </span>
          )}
        </p>
        <p className={styles.tooltipDelta}>{tooltip}</p>
      </div>
    );
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
                fill={deltaInfo.color}
                fontWeight="600"
              >
                {deltaInfo.arrow} {deltaInfo.change}
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

