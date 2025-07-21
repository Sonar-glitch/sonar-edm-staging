import React, { useState, useEffect } from 'react';

const CompactSeasonalVibes = ({ userTasteProfile, spotifyData }) => {
  const [seasonalData, setSeasonalData] = useState(null);
  const [dataSource, setDataSource] = useState('loading');
  const [errorDetails, setErrorDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasonalVibes();
  }, [userTasteProfile, spotifyData]);

  const fetchSeasonalVibes = async () => {
    try {
      setLoading(true);
      
      // PHASE 2: Try to fetch real seasonal data from enhanced profile
      const response = await fetch('/api/user/enhanced-taste-profile');
      
      if (response.ok) {
        const enhancedProfile = await response.json();
        
        if (enhancedProfile.seasonalPreferences && Object.keys(enhancedProfile.seasonalPreferences).length > 0) {
          // SUCCESS: Real seasonal data available
          setSeasonalData({
            spring: enhancedProfile.seasonalPreferences.spring || {},
            summer: enhancedProfile.seasonalPreferences.summer || {},
            fall: enhancedProfile.seasonalPreferences.fall || {},
            winter: enhancedProfile.seasonalPreferences.winter || {},
            lastFetched: enhancedProfile.lastUpdated,
            timestamp: enhancedProfile.timestamp,
            analyzedPeriods: enhancedProfile.analyzedPeriods
          });
          setDataSource('live');
          setErrorDetails(null);
          console.log('✅ Real seasonal vibes loaded from Phase 2');
        } else {
          throw new Error('No seasonal preferences in enhanced profile');
        }
      } else {
        throw new Error(`Enhanced profile API failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to fetch real seasonal vibes:', error);
      
      // FALLBACK: Use demo data with error tracking
      setSeasonalData({
        spring: { description: 'Fresh beats & uplifting vibes', genres: ['Progressive House', 'Melodic Techno'] },
        summer: { description: 'High energy, open air sounds', genres: ['Tech House', 'Festival Progressive'] },
        fall: { description: 'Organic House, Downtempo', genres: ['Deep House', 'Organic House'] },
        winter: { description: 'Deep House, Ambient Techno', genres: ['Deep Techno', 'Ambient'] }
      });
      setDataSource('fallback');
      setErrorDetails({
        code: 'SEASONAL_DATA_UNAVAILABLE',
        message: 'Enhanced seasonal preferences not available',
        fallbackUsed: 'Default seasonal patterns',
        attemptedSources: ['Enhanced Profile API']
      });
      console.log('⚠️ Using demo seasonal vibes data');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  // SURGICAL ADDITION: Enhanced tooltip with error codes and last fetched dates
  const getEnhancedTooltip = () => {
    if (dataSource === 'live') {
      // For live data, show last fetched date
      const lastFetched = seasonalData.lastFetched || seasonalData.timestamp || new Date().toISOString();
      const fetchedDate = new Date(lastFetched).toLocaleString();
      return `Live Data\nLast fetched: ${fetchedDate}\nSource: Enhanced Profile\nAnalyzed periods: ${seasonalData.analyzedPeriods || 'Multiple'}`;
    } else if (errorDetails) {
      // For non-live data, show error codes and details
      return `${errorDetails.code || 'UNKNOWN_ERROR'}\nDetails: ${errorDetails.message || 'No details available'}\nFallback: ${errorDetails.fallbackUsed || 'Default data'}\nAttempted: ${errorDetails.attemptedSources?.join(', ') || 'Multiple sources'}`;
    } else {
      // For fallback/demo data without specific errors
      return `${dataSource === 'fallback' ? 'Fallback Data' : 'Demo Data'}\nReason: ${dataSource === 'fallback' ? 'Limited temporal data' : 'No user data available'}\nSource: Default seasonal patterns`;
    }
  };

  const getDataSourceInfo = () => {
    switch (dataSource) {
      case 'live':
        return { text: 'Live Data', color: '#00CFFF', icon: '🔴' };
      case 'fallback':
        return { text: 'Fallback Data', color: '#f9ca24', icon: '⚠️' };
      case 'error':
        return { text: 'Demo Data', color: '#ff6b6b', icon: '❌' };
      case 'loading':
        return { text: 'Loading...', color: '#95a5a6', icon: '⏳' };
      default:
        return { text: 'Unknown', color: '#666', icon: '❓' };
    }
  };

  if (loading) {
    return (
      <div className="seasonal-vibes-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading seasonal vibes...</p>
        </div>
      </div>
    );
  }

  const dataSourceInfo = getDataSourceInfo();
  const seasons = ['spring', 'summer', 'fall', 'winter'];

  return (
    <div className="seasonal-vibes-container" style={{ position: 'relative' }}>
      {/* FIXED: Data Source Label - Top-Right Positioning */}
      <div className="data-source-label"
           title={getEnhancedTooltip()}
           style={{
             position: 'absolute',
             top: '10px',
             right: '10px',
             color: dataSourceInfo.color,
             fontSize: '12px',
             opacity: 0.8,
             zIndex: 10,
             cursor: 'help'
           }}>
        {dataSourceInfo.icon} {dataSourceInfo.text}
      </div>

      <div className="seasonal-header">
        <h3 style={{ color: '#DADADA' }}>Seasonal Vibes</h3>
      </div>

      <div className="seasonal-grid">
        {seasons.map((season) => {
          const seasonData = seasonalData?.[season] || {};
          const isCurrentSeason = getCurrentSeason() === season;
          
          return (
            <div 
              key={season}
              className={`season-card ${season} ${isCurrentSeason ? 'current' : ''}`}
              style={{
                background: getSeasonGradient(season),
                border: isCurrentSeason ? '2px solid #00CFFF' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                padding: '16px',
                margin: '8px',
                position: 'relative',
                minHeight: '120px'
              }}
            >
              <h4 style={{ 
                color: '#fff', 
                margin: '0 0 8px 0',
                textTransform: 'capitalize',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                {season}
                {isCurrentSeason && (
                  <span style={{ 
                    fontSize: '12px', 
                    marginLeft: '8px',
                    color: '#00CFFF'
                  }}>
                    Current
                  </span>
                )}
              </h4>
              <p style={{ 
                color: 'rgba(255,255,255,0.9)', 
                margin: '0',
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {seasonData.description || getDefaultSeasonDescription(season)}
              </p>
              {seasonData.genres && (
                <div style={{ 
                  marginTop: '8px',
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.7)'
                }}>
                  {seasonData.genres.slice(0, 2).join(', ')}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .seasonal-vibes-container {
          width: 100%;
        }
        
        .seasonal-header {
          margin-bottom: 16px;
        }
        
        .seasonal-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        
        .season-card {
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .season-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 20px;
          color: #DADADA;
        }
        
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top: 2px solid #00CFFF;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// FIXED: Helper functions with DARK THEMED COLORS
const getSeasonGradient = (season) => {
  const gradients = {
    spring: 'linear-gradient(135deg, #2D5016, #4A7C59)',     // Dark green
    summer: 'linear-gradient(135deg, #8B4513, #CD853F)',     // Dark brown
    fall: 'linear-gradient(135deg, #722F37, #A0522D)',       // Dark red
    winter: 'linear-gradient(135deg, #1E3A8A, #3B82F6)'      // Dark blue
  };
  return gradients[season] || gradients.spring;
};

const getDefaultSeasonDescription = (season) => {
  const descriptions = {
    spring: 'Fresh beats & uplifting vibes',
    summer: 'High energy, open air sounds',
    fall: 'Organic House, Downtempo',
    winter: 'Deep House, Ambient Techno'
  };
  return descriptions[season] || 'Seasonal music vibes';
};

export default CompactSeasonalVibes;

