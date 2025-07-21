import React, { useState, useEffect } from 'react';

const CompactSeasonalVibes = ({ userTasteProfile, spotifyData }) => {
  const [seasonalData, setSeasonalData] = useState(null);
  const [dataSource, setDataSource] = useState('loading');
  const [errorDetails, setErrorDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeasonalVibes();
  }, [userTasteProfile, spotifyData]);

  // SURGICAL FIX 4: Improved fallback data mechanism
  const fetchSeasonalVibes = async () => {
    try {
      setLoading(true);
      setDataSource('loading');
      
      // Try to fetch real seasonal data from enhanced profile
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
          console.log('✅ Real seasonal vibes loaded');
        } else {
          throw new Error('SEASONAL_PREFERENCES_EMPTY: Enhanced profile has no seasonal data');
        }
      } else {
        throw new Error(`ENHANCED_PROFILE_API_FAILED: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Failed to fetch real seasonal vibes:', error);
      
      // SURGICAL FIX: Improved fallback with better error tracking
      setSeasonalData({
        spring: { description: 'Fresh beats & uplifting vibes', genres: ['Progressive House', 'Melodic Techno'] },
        summer: { description: 'High energy, open air sounds', genres: ['Tech House', 'Festival Progressive'] },
        fall: { description: 'Organic House, Downtempo', genres: ['Deep House', 'Organic House'] },
        winter: { description: 'Deep House, Ambient Techno', genres: ['Deep Techno', 'Ambient'] }
      });
      setDataSource('fallback');
      setErrorDetails({
        code: error.message.includes('SEASONAL_PREFERENCES_EMPTY') ? 'SEASONAL_PREFERENCES_EMPTY' : 'ENHANCED_PROFILE_API_FAILED',
        message: error.message,
        fallbackUsed: 'Default seasonal patterns',
        attemptedSources: ['Enhanced Profile API']
      });
      console.log('⚠️ Using fallback seasonal vibes data');
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

  // SURGICAL FIX: Enhanced tooltip with proper error codes and fetch dates
  const getEnhancedTooltip = () => {
    if (dataSource === 'live') {
      const lastFetched = seasonalData.lastFetched || seasonalData.timestamp || new Date().toISOString();
      const fetchedDate = new Date(lastFetched).toLocaleString();
      return `Real Data\nLast fetched: ${fetchedDate}\nSource: Enhanced Profile\nAnalyzed periods: ${seasonalData.analyzedPeriods || 'Multiple'}`;
    } else if (errorDetails) {
      return `${errorDetails.code}\nDetails: ${errorDetails.message}\nFallback: ${errorDetails.fallbackUsed}\nAttempted: ${errorDetails.attemptedSources?.join(', ')}`;
    } else {
      return `Fallback Data\nReason: Limited temporal data\nSource: Default seasonal patterns`;
    }
  };

  const getDataSourceInfo = () => {
    switch (dataSource) {
      case 'live':
        return { text: 'Real Data', color: '#00CFFF', icon: '🔴' };
      case 'fallback':
        return { text: 'Fallback Data', color: '#f9ca24', icon: '⚠️' };
      case 'error':
        return { text: 'Fallback Data', color: '#ff6b6b', icon: '❌' };
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
          <p style={{ color: '#DADADA' }}>Loading seasonal vibes...</p>
        </div>
      </div>
    );
  }

  const dataSourceInfo = getDataSourceInfo();
  const seasons = ['spring', 'summer', 'fall', 'winter'];

  return (
    <div className="seasonal-vibes-container" style={{ position: 'relative' }}>
      {/* SURGICAL FIX 1: REMOVED duplicate data source label - main dashboard handles this */}

      {/* SURGICAL FIX 2: REMOVED duplicate heading - main dashboard has OG <h2> title */}

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
                border: isCurrentSeason ? '2px solid #00CFFF' : '1px solid rgba(0, 255, 255, 0.1)',
                borderRadius: '12px',
                padding: '16px',
                margin: '8px',
                position: 'relative',
                minHeight: '120px'
              }}
            >
              <h4 style={{ 
                color: '#DADADA', 
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
                color: '#999999', 
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
                  color: '#888888'
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
          box-shadow: 0 0 12px rgba(255, 0, 204, 0.3);
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

// SURGICAL FIX 6: TIKO color scheme for season gradients
const getSeasonGradient = (season) => {
  const gradients = {
    spring: 'linear-gradient(135deg, #2D5016, #4A7C59)',
    summer: 'linear-gradient(135deg, #8B4513, #CD853F)',
    fall: 'linear-gradient(135deg, #722F37, #A0522D)',
    winter: 'linear-gradient(135deg, #1E3A8A, #3B82F6)'
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

