import React, { useState, useEffect } from 'react';

const CompactSeasonalVibes = () => {
  const [seasonalData, setSeasonalData] = useState(null);
  const [dataSource, setDataSource] = useState('loading');
  const [errorDetails, setErrorDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSeasonalVibes();
  }, []);

  const fetchSeasonalVibes = async () => {
    try {
      setIsLoading(true);
      console.log('🌟 Fetching real seasonal vibes data...');

      // Fetch enhanced user taste profile with temporal patterns
      const response = await fetch('/api/user/enhanced-taste-profile');
      
      if (!response.ok) {
        throw new Error(`Enhanced profile API failed: ${response.status}`);
      }

      const profileData = await response.json();
      console.log('✅ Enhanced profile data received:', profileData);

      // Extract temporal patterns from Phase 2 data
      const temporalPattern = profileData.temporalPattern;
      const genrePreferences = profileData.genrePreferences || [];
      
      if (temporalPattern && temporalPattern.analyzedPeriods) {
        // Calculate seasonal vibes from real temporal data
        const calculatedSeasonalData = calculateSeasonalVibesFromTemporalData(
          temporalPattern, 
          genrePreferences,
          profileData.soundCharacteristics
        );
        
        setSeasonalData(calculatedSeasonalData);
        setDataSource(profileData.dataSource || 'live');
        setErrorDetails(null);
        
        console.log('🌟 Real seasonal vibes calculated from temporal patterns');
      } else {
        // Fallback to basic seasonal calculation
        const fallbackData = calculateBasicSeasonalVibes(genrePreferences);
        setSeasonalData(fallbackData);
        setDataSource('fallback');
        setErrorDetails({
          code: 'TEMPORAL_DATA_INSUFFICIENT',
          message: 'Insufficient temporal pattern data, using genre-based estimation'
        });
        
        console.log('⚠️ Using fallback seasonal calculation');
      }

    } catch (error) {
      console.error('❌ Error fetching seasonal vibes:', error);
      
      // Default seasonal data when everything fails
      const defaultData = getDefaultSeasonalVibes();
      setSeasonalData(defaultData);
      setDataSource('default');
      setErrorDetails({
        code: 'SEASONAL_FETCH_FAILED',
        message: error.message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // PHASE 2: Calculate seasonal vibes from real temporal patterns
  const calculateSeasonalVibesFromTemporalData = (temporalPattern, genrePreferences, soundCharacteristics) => {
    const { discoveryRate, tasteStability, stableInterests, emergingInterests, fadingInterests } = temporalPattern;
    
    // Determine current season
    const currentMonth = new Date().getMonth();
    const currentSeason = getCurrentSeason(currentMonth);
    
    // Calculate seasonal characteristics based on user data
    const seasonalVibes = {
      spring: calculateSeasonalCharacteristics('spring', {
        discoveryRate,
        tasteStability,
        stableInterests,
        emergingInterests,
        genrePreferences,
        soundCharacteristics
      }),
      summer: calculateSeasonalCharacteristics('summer', {
        discoveryRate,
        tasteStability,
        stableInterests,
        emergingInterests,
        genrePreferences,
        soundCharacteristics
      }),
      fall: calculateSeasonalCharacteristics('fall', {
        discoveryRate,
        tasteStability,
        stableInterests,
        emergingInterests,
        genrePreferences,
        soundCharacteristics
      }),
      winter: calculateSeasonalCharacteristics('winter', {
        discoveryRate,
        tasteStability,
        stableInterests,
        emergingInterests,
        genrePreferences,
        soundCharacteristics
      })
    };

    // Add metadata
    seasonalVibes.currentSeason = currentSeason;
    seasonalVibes.confidence = Math.min(0.95, (temporalPattern.analyzedPeriods?.recent?.tracks || 0) / 50);
    seasonalVibes.dataQuality = temporalPattern.analyzedPeriods?.recent?.tracks > 20 ? 'high' : 'medium';
    
    return seasonalVibes;
  };

  const calculateSeasonalCharacteristics = (season, userData) => {
    const { discoveryRate, tasteStability, stableInterests, emergingInterests, genrePreferences, soundCharacteristics } = userData;
    
    // Season-specific characteristics based on user's actual patterns
    const seasonalMappings = {
      spring: {
        energyModifier: 0.1,
        discoveryBoost: 0.2,
        description: discoveryRate > 0.3 ? 'Fresh beats & uplifting vibes' : 'Renewed energy in familiar sounds',
        mood: soundCharacteristics?.valence > 0.6 ? 'optimistic' : 'contemplative'
      },
      summer: {
        energyModifier: 0.2,
        discoveryBoost: 0.3,
        description: soundCharacteristics?.energy > 0.7 ? 'High-energy festival sounds' : 'Warm, laid-back grooves',
        mood: 'vibrant'
      },
      fall: {
        energyModifier: -0.1,
        discoveryBoost: -0.1,
        description: tasteStability > 0.7 ? 'Organic house, downtempo' : 'Exploring deeper sounds',
        mood: soundCharacteristics?.valence < 0.4 ? 'introspective' : 'nostalgic'
      },
      winter: {
        energyModifier: -0.2,
        discoveryBoost: -0.2,
        description: stableInterests.length > 3 ? 'Deep house, ambient techno' : 'Cozy electronic warmth',
        mood: 'contemplative'
      }
    };

    const mapping = seasonalMappings[season];
    const baseEnergy = soundCharacteristics?.energy || 0.6;
    const adjustedEnergy = Math.max(0.1, Math.min(0.9, baseEnergy + mapping.energyModifier));
    
    // Find dominant genre for this season
    const dominantGenre = genrePreferences[0]?.name || 'electronic';
    const genreMatch = emergingInterests.includes(dominantGenre) ? 'emerging' : 
                      stableInterests.includes(dominantGenre) ? 'stable' : 'neutral';

    return {
      title: season.charAt(0).toUpperCase() + season.slice(1),
      description: mapping.description,
      mood: mapping.mood,
      energy: Math.round(adjustedEnergy * 100),
      dominantGenre: dominantGenre,
      genreMatch: genreMatch,
      confidence: Math.round((tasteStability + (discoveryRate * 0.5)) * 100)
    };
  };

  const calculateBasicSeasonalVibes = (genrePreferences) => {
    const dominantGenre = genrePreferences[0]?.name || 'electronic';
    const genreWeight = genrePreferences[0]?.weight || 0.5;
    
    return {
      spring: {
        title: 'Spring',
        description: `Fresh ${dominantGenre} & uplifting vibes`,
        mood: 'optimistic',
        energy: Math.round((genreWeight + 0.2) * 100),
        dominantGenre: dominantGenre,
        genreMatch: 'estimated',
        confidence: Math.round(genreWeight * 60)
      },
      summer: {
        title: 'Summer',
        description: `High-energy ${dominantGenre} sounds`,
        mood: 'vibrant',
        energy: Math.round((genreWeight + 0.3) * 100),
        dominantGenre: dominantGenre,
        genreMatch: 'estimated',
        confidence: Math.round(genreWeight * 60)
      },
      fall: {
        title: 'Fall',
        description: `Organic ${dominantGenre}, downtempo`,
        mood: 'introspective',
        energy: Math.round((genreWeight - 0.1) * 100),
        dominantGenre: dominantGenre,
        genreMatch: 'estimated',
        confidence: Math.round(genreWeight * 60)
      },
      winter: {
        title: 'Winter',
        description: `Deep ${dominantGenre}, ambient warmth`,
        mood: 'contemplative',
        energy: Math.round((genreWeight - 0.2) * 100),
        dominantGenre: dominantGenre,
        genreMatch: 'estimated',
        confidence: Math.round(genreWeight * 60)
      },
      currentSeason: getCurrentSeason(new Date().getMonth()),
      confidence: 0.6,
      dataQuality: 'basic'
    };
  };

  const getDefaultSeasonalVibes = () => {
    return {
      spring: {
        title: 'Spring',
        description: 'Fresh beats & uplifting vibes',
        mood: 'optimistic',
        energy: 70,
        dominantGenre: 'electronic',
        genreMatch: 'default',
        confidence: 30
      },
      summer: {
        title: 'Summer',
        description: 'High-energy festival sounds',
        mood: 'vibrant',
        energy: 85,
        dominantGenre: 'electronic',
        genreMatch: 'default',
        confidence: 30
      },
      fall: {
        title: 'Fall',
        description: 'Organic house, downtempo',
        mood: 'introspective',
        energy: 55,
        dominantGenre: 'electronic',
        genreMatch: 'default',
        confidence: 30
      },
      winter: {
        title: 'Winter',
        description: 'Deep house, ambient techno',
        mood: 'contemplative',
        energy: 45,
        dominantGenre: 'electronic',
        genreMatch: 'default',
        confidence: 30
      },
      currentSeason: getCurrentSeason(new Date().getMonth()),
      confidence: 0.3,
      dataQuality: 'default'
    };
  };

  const getCurrentSeason = (month) => {
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  const getDataSourceInfo = () => {
    switch (dataSource) {
      case 'live':
        return { text: 'Live Data', color: '#00CFFF', icon: '🔴' };
      case 'fallback':
        return { text: 'Fallback Data', color: '#FFD700', icon: '⚠️' };
      case 'default':
        return { text: 'Default Data', color: '#ff6b6b', icon: '❌' };
      default:
        return { text: 'Loading...', color: '#999999', icon: '⏳' };
    }
  };

  const getSeasonalColor = (season) => {
    const colors = {
      spring: '#00FF7F',
      summer: '#FFD700',
      fall: '#FF6347',
      winter: '#87CEEB'
    };
    return colors[season] || '#00CFFF';
  };

  if (isLoading) {
    return (
      <div className="seasonal-vibes-container">
        <div className="seasonal-header">
          <h3 style={{ color: '#DADADA' }}>Seasonal Vibes</h3>
          <div className="data-source-badge loading">
            <span style={{ color: '#999999' }}>⏳ Loading...</span>
          </div>
        </div>
        <div className="seasonal-grid loading">
          <div style={{ color: '#999999', textAlign: 'center', padding: '20px' }}>
            Analyzing your seasonal music patterns...
          </div>
        </div>
      </div>
    );
  }

  if (!seasonalData) {
    return (
      <div className="seasonal-vibes-container">
        <div className="seasonal-header">
          <h3 style={{ color: '#DADADA' }}>Seasonal Vibes</h3>
          <div className="data-source-badge error">
            <span style={{ color: '#ff6b6b' }}>❌ Error</span>
          </div>
        </div>
        <div className="seasonal-grid error">
          <div style={{ color: '#ff6b6b', textAlign: 'center', padding: '20px' }}>
            Unable to load seasonal data
          </div>
        </div>
      </div>
    );
  }

  const dataSourceInfo = getDataSourceInfo();
  const seasons = ['spring', 'summer', 'fall', 'winter'];

  return (
    <div className="seasonal-vibes-container">
      <div className="seasonal-header">
        <h3 style={{ color: '#DADADA' }}>Seasonal Vibes</h3>
        <div 
          className="data-source-badge"
          title={errorDetails ? `${errorDetails.code}: ${errorDetails.message}` : `Data source: ${dataSource}`}
          style={{ 
            backgroundColor: dataSource === 'live' ? 'rgba(0, 207, 255, 0.1)' : 
                           dataSource === 'fallback' ? 'rgba(255, 215, 0, 0.1)' : 
                           'rgba(255, 107, 107, 0.1)',
            border: `1px solid ${dataSourceInfo.color}`,
            borderRadius: '12px',
            padding: '4px 8px',
            fontSize: '12px',
            cursor: errorDetails ? 'help' : 'default'
          }}
        >
          <span style={{ color: dataSourceInfo.color }}>
            {dataSourceInfo.icon} {dataSourceInfo.text}
          </span>
        </div>
      </div>

      <div className="seasonal-grid">
        {seasons.map((season) => {
          const seasonData = seasonalData[season];
          const isCurrentSeason = season === seasonalData.currentSeason;
          const seasonColor = getSeasonalColor(season);
          
          return (
            <div 
              key={season}
              className={`seasonal-card ${isCurrentSeason ? 'current' : ''}`}
              style={{
                backgroundColor: isCurrentSeason ? 'rgba(0, 207, 255, 0.1)' : '#15151F',
                border: `1px solid ${isCurrentSeason ? '#00CFFF' : 'rgba(255, 255, 255, 0.1)'}`,
                borderRadius: '12px',
                padding: '16px',
                position: 'relative',
                transition: 'all 0.3s ease'
              }}
            >
              <div className="season-header">
                <h4 style={{ 
                  color: seasonColor, 
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600'
                }}>
                  {seasonData.title}
                  {isCurrentSeason && (
                    <span style={{ 
                      color: '#00CFFF', 
                      fontSize: '12px', 
                      marginLeft: '8px' 
                    }}>
                      • Current
                    </span>
                  )}
                </h4>
              </div>

              <div className="season-content">
                <p style={{ 
                  color: '#DADADA', 
                  fontSize: '14px', 
                  margin: '0 0 12px 0',
                  lineHeight: '1.4'
                }}>
                  {seasonData.description}
                </p>

                <div className="season-stats">
                  <div className="stat-item">
                    <span style={{ color: '#999999', fontSize: '12px' }}>Energy</span>
                    <div className="energy-bar" style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '2px',
                      marginTop: '4px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${seasonData.energy}%`,
                        height: '100%',
                        background: `linear-gradient(90deg, ${seasonColor}, #FF00CC)`,
                        borderRadius: '2px'
                      }} />
                    </div>
                    <span style={{ color: seasonColor, fontSize: '12px', fontWeight: '600' }}>
                      {seasonData.energy}%
                    </span>
                  </div>

                  <div className="genre-info" style={{ marginTop: '8px' }}>
                    <span style={{ 
                      color: '#999999', 
                      fontSize: '11px' 
                    }}>
                      {seasonData.dominantGenre} • {seasonData.mood}
                    </span>
                  </div>

                  <div className="confidence-info" style={{ marginTop: '4px' }}>
                    <span style={{ 
                      color: seasonData.confidence > 70 ? '#00CFFF' : 
                             seasonData.confidence > 40 ? '#FFD700' : '#ff6b6b',
                      fontSize: '11px'
                    }}>
                      {seasonData.confidence}% confidence
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>{`
        .seasonal-vibes-container {
          background: #0D0C1D;
          border-radius: 16px;
          padding: 20px;
          margin: 16px 0;
        }

        .seasonal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .seasonal-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }

        .seasonal-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }

        .seasonal-grid.loading,
        .seasonal-grid.error {
          grid-template-columns: 1fr;
        }

        .seasonal-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .seasonal-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(255, 0, 204, 0.2);
        }

        .seasonal-card.current {
          box-shadow: 0 0 12px rgba(0, 207, 255, 0.3);
        }

        @media (max-width: 768px) {
          .seasonal-grid {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .seasonal-vibes-container {
            padding: 16px;
          }
          
          .seasonal-card {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default CompactSeasonalVibes;

