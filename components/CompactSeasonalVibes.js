import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/CompactSeasonalVibes.module.css';

export default function CompactSeasonalVibes() {
  const { data: session } = useSession();
  const [seasonalData, setSeasonalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSeason, setCurrentSeason] = useState('Summer');

  // PHASE 1: Enhanced seasonal data with fallback handling
  const getSeasonalPreferences = async () => {
    try {
      setLoading(true);
      
      // Try to get real seasonal preferences
      const response = await fetch('/api/user/enhanced-taste-profile');
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.seasonalPreferences && Object.keys(data.seasonalPreferences).length > 0) {
          setSeasonalData(data.seasonalPreferences);
          setError(null);
          return;
        }
      }
      
      // PHASE 1: Fallback to static seasonal data with proper error tracking
      console.log('⚠️ Using fallback seasonal data - API not available');
      setSeasonalData(getFallbackSeasonalData());
      setError('STATIC_SEASONAL_DATA');
      
    } catch (err) {
      console.error('❌ Error loading seasonal preferences:', err);
      setSeasonalData(getFallbackSeasonalData());
      setError('API_ERROR');
    } finally {
      setLoading(false);
    }
  };

  // PHASE 1: Enhanced fallback data
  const getFallbackSeasonalData = () => ({
    Spring: {
      title: 'Spring',
      description: 'Fresh beats & uplifting vibes',
      subtext: 'Progressive House, Melodic Techno',
      mood: 'energetic',
      color: '#4CAF50' // Green
    },
    Summer: {
      title: 'Summer',
      description: 'High energy, open air sounds',
      subtext: 'Tech House, Festival Progressive',
      mood: 'euphoric',
      color: '#FF9800', // Orange
      current: true
    },
    Fall: {
      title: 'Fall',
      description: 'Organic House, Downtempo',
      subtext: 'Deep House, Organic House',
      mood: 'contemplative',
      color: '#D84315' // Red-orange
    },
    Winter: {
      title: 'Winter',
      description: 'Deep House, Ambient Techno',
      subtext: 'Deep Techno, Ambient',
      mood: 'introspective',
      color: '#1976D2' // Blue
    }
  });

  // PHASE 1: TIKO color scheme for seasonal cards
  const getSeasonGradient = (season, isCurrentSeason) => {
    const seasonColors = {
      Spring: '#4CAF50',
      Summer: '#FF9800', 
      Fall: '#D84315',
      Winter: '#1976D2'
    };
    
    return {
      background: seasonColors[season] || '#4CAF50',
      // PHASE 1: TIKO compliant border colors
      border: isCurrentSeason ? '2px solid #00CFFF' : '1px solid rgba(0, 255, 255, 0.1)',
      boxShadow: isCurrentSeason ? '0 0 12px #FF00CC88' : 'none'
    };
  };

  useEffect(() => {
    if (session) {
      getSeasonalPreferences();
    }
    
    // Determine current season
    const month = new Date().getMonth();
    const seasons = ['Winter', 'Winter', 'Spring', 'Spring', 'Spring', 'Summer', 'Summer', 'Summer', 'Fall', 'Fall', 'Fall', 'Winter'];
    setCurrentSeason(seasons[month]);
  }, [session]);

  // PHASE 1: Enhanced loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ color: '#999999' }}>Loading seasonal preferences...</p>
        </div>
      </div>
    );
  }

  // PHASE 1: Enhanced error state with fallback display
  if (!seasonalData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p style={{ color: '#FF00CC' }}>⚠️ Seasonal data unavailable</p>
          <p style={{ color: '#999999' }}>Using default seasonal preferences</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* PHASE 1: Removed duplicate heading - main dashboard handles this */}
      
      <div className={styles.seasonalGrid}>
        {Object.entries(seasonalData).map(([season, data]) => {
          const isCurrentSeason = season === currentSeason;
          const seasonStyle = getSeasonGradient(season, isCurrentSeason);
          
          return (
            <div
              key={season}
              className={`${styles.seasonCard} ${isCurrentSeason ? styles.currentSeason : ''}`}
              style={seasonStyle}
            >
              <div className={styles.seasonContent}>
                <h4 
                  className={styles.seasonTitle}
                  style={{ 
                    // PHASE 1: TIKO primary text color
                    color: '#DADADA',
                    fontWeight: isCurrentSeason ? 'bold' : 'normal'
                  }}
                >
                  {data.title}
                  {isCurrentSeason && <span className={styles.currentBadge}>Current</span>}
                </h4>
                
                <p 
                  className={styles.seasonDescription}
                  style={{ 
                    // PHASE 1: TIKO secondary text color
                    color: '#999999',
                    fontSize: '14px',
                    marginBottom: '8px'
                  }}
                >
                  {data.description}
                </p>
                
                <p 
                  className={styles.seasonSubtext}
                  style={{ 
                    // PHASE 1: TIKO secondary text color
                    color: '#888888',
                    fontSize: '12px',
                    fontStyle: 'italic'
                  }}
                >
                  {data.subtext}
                </p>
              </div>
              
              {isCurrentSeason && (
                <div className={styles.currentIndicator}>
                  <span style={{ color: '#00CFFF' }}>●</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* PHASE 1: Error indicator for fallback data */}
      {error && (
        <div className={styles.fallbackIndicator}>
          <span style={{ color: '#999999', fontSize: '12px' }}>
            ⚠️ {error === 'STATIC_SEASONAL_DATA' ? 'Using static seasonal data' : 'Fallback data active'}
          </span>
        </div>
      )}
    </div>
  );
}

