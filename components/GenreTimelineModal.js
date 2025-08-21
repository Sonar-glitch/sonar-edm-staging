// components/GenreTimelineModal.js
import { useState, useEffect } from 'react';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

const GenreTimelineModal = ({ onClose }) => {
  const [timelineData, setTimelineData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch timeline data or use mock data
    const fetchTimelineData = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockData = {
          months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
          genres: {
            'House': [45, 48, 52, 55, 58, 60],
            'Techno': [30, 32, 35, 33, 35, 35],
            'Trance': [15, 12, 8, 7, 5, 3],
            'Progressive': [10, 8, 5, 5, 2, 2]
          }
        };
        setTimelineData(mockData);
      } catch (error) {
        console.error('Error fetching timeline data:', error?.message || error?.toString() || 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, []);

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (loading) {
    return (
      <div className={styles.modalOverlay} onClick={handleOverlayClick}>
        <div className={styles.modalContent}>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p className={styles.loadingText}>Loading timeline...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Genre Evolution Over Time</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className={styles.timelineContainer}>
          <div className={styles.timelineChart}>
            <svg width="100%" height="300" viewBox="0 0 600 300">
              {/* Grid lines */}
              {[0, 1, 2, 3, 4, 5].map(i => (
                <line
                  key={i}
                  x1={50 + i * 100}
                  y1={50}
                  x2={50 + i * 100}
                  y2={250}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
              ))}
              
              {[0, 1, 2, 3, 4].map(i => (
                <line
                  key={i}
                  x1={50}
                  y1={50 + i * 50}
                  x2={550}
                  y2={50 + i * 50}
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1"
                />
              ))}

              {/* Genre lines */}
              {timelineData && Object.entries(timelineData.genres).map(([genre, values], genreIndex) => {
                const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];
                const color = colors[genreIndex % colors.length];
                
                const points = values.map((value, index) => ({
                  x: 50 + index * 100,
                  y: 250 - (value * 2) // Scale values
                }));

                const pathData = points.map((point, index) => 
                  `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                ).join(' ');

                return (
                  <g key={genre}>
                    <path
                      d={pathData}
                      fill="none"
                      stroke={color}
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {points.map((point, index) => (
                      <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill={color}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Month labels */}
              {timelineData && timelineData.months.map((month, index) => (
                <text
                  key={month}
                  x={50 + index * 100}
                  y={275}
                  textAnchor="middle"
                  fill="rgba(255,255,255,0.7)"
                  fontSize="12"
                >
                  {month}
                </text>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className={styles.timelineLegend}>
            {timelineData && Object.keys(timelineData.genres).map((genre, index) => {
              const colors = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B'];
              const color = colors[index % colors.length];
              
              return (
                <div key={genre} className={styles.legendItem}>
                  <div 
                    className={styles.legendColor}
                    style={{ backgroundColor: color }}
                  ></div>
                  <span className={styles.legendLabel}>{genre}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenreTimelineModal;

