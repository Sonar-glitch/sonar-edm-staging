import React from 'react';
import styles from '../styles/SpiderChart.module.css';

const SpiderChart = ({ genres }) => {
  // Error handling: Check if genres is valid
  if (!genres || !Array.isArray(genres) || genres.length === 0) {
    return (
      <div className={styles.spiderChartContainer}>
        <div className={styles.errorMessage}>
          <p>Unable to display genre chart. No genre data available.</p>
        </div>
      </div>
    );
  }

  // Ensure all genres have valid properties
  const validGenres = genres.map(genre => ({
    name: genre.name || 'Unknown',
    score: typeof genre.score === 'number' && !isNaN(genre.score) ? genre.score : 0
  }));

  // Calculate positions for each genre on the spider chart
  const calculatePoints = (genres) => {
    try {
      const points = [];
      const centerX = 150;
      const centerY = 150;
      const radius = 120;
      
      genres.forEach((genre, index) => {
        const angle = (Math.PI * 2 * index) / genres.length;
        const x = centerX + radius * Math.cos(angle) * (genre.score / 100);
        const y = centerY + radius * Math.sin(angle) * (genre.score / 100);
        points.push({ x, y, name: genre.name, score: genre.score });
      });
      
      return points;
    } catch (error) {
      console.error('Error calculating points:', error);
      return [];
    }
  };
  
  // Create SVG path for the spider web
  const createWebPath = (points) => {
    try {
      if (!points || points.length < 3) {
        return '';
      }
      
      let path = '';
      points.forEach((point, index) => {
        if (index === 0) {
          path += `M ${point.x} ${point.y} `;
        } else {
          path += `L ${point.x} ${point.y} `;
        }
      });
      path += 'Z';
      return path;
    } catch (error) {
      console.error('Error creating web path:', error);
      return '';
    }
  };
  
  // Create grid lines for the spider chart
  const createGridLines = (count) => {
    try {
      const lines = [];
      const centerX = 150;
      const centerY = 150;
      const radius = 120;
      
      for (let i = 1; i <= count; i++) {
        const gridPoints = [];
        const gridRadius = (radius * i) / count;
        
        for (let j = 0; j < validGenres.length; j++) {
          const angle = (Math.PI * 2 * j) / validGenres.length;
          const x = centerX + gridRadius * Math.cos(angle);
          const y = centerY + gridRadius * Math.sin(angle);
          gridPoints.push({ x, y });
        }
        
        lines.push(createWebPath(gridPoints));
      }
      
      return lines;
    } catch (error) {
      console.error('Error creating grid lines:', error);
      return [];
    }
  };
  
  // Create axis lines for each genre
  const createAxisLines = () => {
    try {
      const lines = [];
      const centerX = 150;
      const centerY = 150;
      const radius = 120;
      
      validGenres.forEach((genre, index) => {
        const angle = (Math.PI * 2 * index) / validGenres.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        lines.push({ x1: centerX, y1: centerY, x2: x, y2: y });
      });
      
      return lines;
    } catch (error) {
      console.error('Error creating axis lines:', error);
      return [];
    }
  };
  
  // Calculate all the necessary data with error handling
  let points = [];
  let webPath = '';
  let gridLines = [];
  let axisLines = [];
  
  try {
    points = calculatePoints(validGenres);
    webPath = createWebPath(points);
    gridLines = createGridLines(4);
    axisLines = createAxisLines();
  } catch (error) {
    console.error('Error in SpiderChart calculations:', error);
  }
  
  return (
    <div className={styles.spiderChartContainer}>
      {points.length > 0 ? (
        <svg viewBox="0 0 300 300" className={styles.spiderChart}>
          {/* Grid lines */}
          {gridLines.map((line, index) => (
            <path
              key={`grid-${index}`}
              d={line}
              className={styles.gridLine}
            />
          ))}
          
          {/* Axis lines */}
          {axisLines.map((line, index) => (
            <line
              key={`axis-${index}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={styles.axisLine}
            />
          ))}
          
          {/* Data web */}
          {webPath && (
            <path
              d={webPath}
              className={styles.dataWeb}
            />
          )}
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              className={styles.dataPoint}
            />
          ))}
          
          {/* Genre labels */}
          {points.map((point, index) => {
            const angle = (Math.PI * 2 * index) / validGenres.length;
            const labelRadius = 140;
            const labelX = 150 + labelRadius * Math.cos(angle);
            const labelY = 150 + labelRadius * Math.sin(angle);
            
            return (
              <text
                key={`label-${index}`}
                x={labelX}
                y={labelY}
                className={styles.genreLabel}
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {point.name}
              </text>
            );
          })}
        </svg>
      ) : (
        <div className={styles.errorMessage}>
          <p>Unable to render chart. Please try again later.</p>
        </div>
      )}
      
      <div className={styles.legend}>
        {validGenres.map((genre, index) => (
          <div key={`legend-${index}`} className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: `hsl(${index * (360 / validGenres.length)}, 100%, 50%)` }}></span>
            <span className={styles.legendText}>{genre.name}: {genre.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpiderChart;
