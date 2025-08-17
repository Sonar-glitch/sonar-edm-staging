import { useState, useEffect } from 'react';
import styles from '../styles/CompactSeasonalVibes.module.css';

export default function CompactSeasonalVibes({ data, dataSource }) {
  const [seasonalData, setSeasonalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSeason, setCurrentSeason] = useState('Summer'); // Default current season

  useEffect(() => {
    loadSeasonalData();
  }, [data]);

  const loadSeasonalData = async () => {
    try {
      setLoading(true);
      
      if (data && data.seasonalPreferences) {
        setSeasonalData(data.seasonalPreferences);
      } else {
        // Fallback seasonal data
        setSeasonalData({
          Spring: {
            title: "Spring",
            description: "Fresh beats & uplifting vibes",
            subtext: "Progressive House, Melodic Techno",
            genres: ["Progressive House", "Melodic Techno"]
          },
          Summer: {
            title: "Summer",
            description: "High energy, open air sounds",
            subtext: "Tech House, Festival Progressive",
            genres: ["Tech House", "Festival Progressive"]
          },
          Fall: {
            title: "Fall", 
            description: "Organic House, Downtempo",
            subtext: "Deep House, Organic House",
            genres: ["Deep House", "Organic House"]
          },
          Winter: {
            title: "Winter",
            description: "Deep House, Ambient Techno", 
            subtext: "Deep Techno, Ambient",
            genres: ["Deep Techno", "Ambient"]
          }
        });
      }
      
      // Determine current season
      const month = new Date().getMonth();
      if (month >= 2 && month <= 4) setCurrentSeason('Spring');
      else if (month >= 5 && month <= 7) setCurrentSeason('Summer');
      else if (month >= 8 && month <= 10) setCurrentSeason('Fall');
      else setCurrentSeason('Winter');
      
    } catch (err) {
      console.error('Seasonal data loading error:', err.message || err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading seasonal vibes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>Unable to load seasonal data</p>
          <p>{error?.message || error?.toString() || 'An unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  if (!seasonalData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>No seasonal data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.seasonalGrid}>
        {Object.entries(seasonalData).map(([season, info]) => (
          <div 
            key={season}
            className={`${styles.seasonCard} ${season === currentSeason ? styles.currentSeason : ''}`}
            data-season={season}
          >
            <div className={styles.seasonContent}>
              <div className={styles.seasonHeader}>
                <h3 className={styles.seasonTitle}>{info.title}</h3>
                {season === currentSeason && (
                  <div className={styles.currentIndicator}>
                    <span className={styles.currentBadge}>Current</span>
                  </div>
                )}
              </div>
              
              <p className={styles.seasonDescription}>{info.description}</p>
              <p className={styles.seasonSubtext}>{info.subtext}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* REMOVED: "Using static seasonal data" button as requested */}
    </div>
  );
}

