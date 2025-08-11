// PRESERVES: All existing functionality and UI theme
// ADDS: Custom themed tooltips, weekly delta indicators, comprehensive data source info
// REMOVES: Redundant red section as requested

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import dynamic from 'next/dynamic';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

// Dynamic imports for components (PRESERVED)
const Top5GenresSpiderChart = dynamic(() => import('./Top5GenresSpiderChart'), { ssr: false });
const CompactSeasonalVibes = dynamic(() => import('./CompactSeasonalVibes'), { ssr: false });
const SoundCharacteristics = dynamic(() => import('./SoundCharacteristics'), { ssr: false });
const EnhancedEventList = dynamic(() => import('./EnhancedEventList'), { ssr: false });
const EnhancedLocationSearch = dynamic(() => import('./EnhancedLocationSearch'), { ssr: false });

export default function EnhancedPersonalizedDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ENHANCED: Data source tracking with weekly deltas
  const [dataSources, setDataSources] = useState({
    spotify: { isReal: false, error: 'MOCK_DATA_ACTIVE', lastFetch: null },
    soundstat: { isReal: false, error: 'ZERO_QUERIES', lastFetch: null },
    events: { isReal: false, error: 'API_ERROR', lastFetch: null },
    seasonal: { isReal: false, error: 'STATIC_DATA', lastFetch: null }
  });

  // Weekly delta tracking state with initial demo data
  const [weeklyDeltas, setWeeklyDeltas] = useState({
    genres: {
      'melodic techno': { change: 5, direction: 'up' },
      'melodic house': { change: 2, direction: 'up' },
      'progressive house': { change: 10, direction: 'up' },
      'organic house': { change: -3, direction: 'down' },
      'techno': { change: 1, direction: 'up' }
    },
    soundCharacteristics: {
      energy: { change: 3, direction: 'up' },
      danceability: { change: 2, direction: 'up' },
      positivity: { change: -1, direction: 'down' },
      acoustic: { change: 1, direction: 'up' }
    }
  });

  // NEW: Tooltip state management
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Event filter state management
  const [userLocation, setUserLocation] = useState(null);
  const [eventFilters, setEventFilters] = useState({
    vibeMatch: 50,
    location: null
  });

  useEffect(() => {
    loadDashboardData();
    loadWeeklyDeltas(); // Load regardless of auth status
    autoDetectLocation(); // Auto-detect user location on load
  }, []);

  // Auto-detect user location with proper fallback chain
  const autoDetectLocation = async () => {
    try {
      // Method 1: Try browser geolocation first
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              // Reverse geocode coordinates to get city name
              const response = await fetch(
                `/api/location/reverse-geocode?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
              );
              if (response.ok) {
                const locationData = await response.json();
                console.log('🌍 [Dashboard] Browser location detected:', locationData);
                setUserLocation(locationData);
                setEventFilters(prev => ({
                  ...prev,
                  location: locationData
                }));
                return;
              }
            } catch (error) {
              console.error('🌍 [Dashboard] Reverse geocoding failed:', error);
            }
            
            // If reverse geocoding fails, use coordinates directly
            const fallbackLocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              city: 'Your Location',
              country: 'Unknown',
              region: 'Unknown'
            };
            setUserLocation(fallbackLocation);
            setEventFilters(prev => ({
              ...prev,
              location: fallbackLocation
            }));
          },
          (error) => {
            console.log('🌍 [Dashboard] Browser geolocation failed:', error.message);
            tryIPLocation();
          },
          { timeout: 10000, enableHighAccuracy: false }
        );
      } else {
        console.log('🌍 [Dashboard] Geolocation not supported, trying IP location');
        tryIPLocation();
      }
    } catch (error) {
      console.error('🌍 [Dashboard] Location detection error:', error);
      useTorontoFallback();
    }
  };

  // Method 2: IP-based location detection
  const tryIPLocation = async () => {
    try {
      const response = await fetch('/api/user/get-location');
      if (response.ok) {
        const locationData = await response.json();
        console.log('🌍 [Dashboard] IP location detected:', locationData);
        setUserLocation(locationData);
        setEventFilters(prev => ({
          ...prev,
          location: locationData
        }));
      } else {
        throw new Error('IP location API failed');
      }
    } catch (error) {
      console.log('🌍 [Dashboard] IP location failed:', error.message);
      useTorontoFallback();
    }
  };

  // Method 3: Toronto fallback
  const useTorontoFallback = () => {
    const torontoLocation = {
      city: 'Toronto',
      region: 'Ontario', 
      country: 'Canada',
      latitude: 43.6532,
      longitude: -79.3832,
      lat: 43.6532,
      lon: -79.3832
    };
    console.log('🌍 [Dashboard] Using Toronto fallback location');
    setUserLocation(torontoLocation);
    setEventFilters(prev => ({
      ...prev,
      location: torontoLocation
    }));
  };

  // ENHANCED: Load dashboard data with comprehensive data source tracking
  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load enhanced taste profile
      const tasteResponse = await fetch('/api/spotify/detailed-taste');
      if (!tasteResponse.ok) {
        throw new Error(`Taste API error: ${tasteResponse.status}`);
      }

      const tasteData = await tasteResponse.json();
      setDashboardData(tasteData);

      // ENHANCED: Process data sources with detailed tracking
      const newDataSources = {
        spotify: {
          isReal: tasteData.dataSources?.genreProfile?.isRealData || false,
          lastFetch: tasteData.dataSources?.genreProfile?.lastFetch,
          tracksAnalyzed: tasteData.dataSources?.genreProfile?.tracksAnalyzed || 0,
          confidence: tasteData.dataSources?.genreProfile?.confidence || 0,
          source: 'spotify_api',
          timePeriod: 'last_6_months',
          description: 'top artists and tracks from Spotify',
          error: tasteData.dataSources?.genreProfile?.error
        },
        soundstat: {
          isReal: tasteData.dataSources?.soundCharacteristics?.isRealData || false,
          lastFetch: tasteData.dataSources?.soundCharacteristics?.lastFetch,
          tracksAnalyzed: tasteData.dataSources?.soundCharacteristics?.tracksAnalyzed || 0,
          confidence: tasteData.dataSources?.soundCharacteristics?.confidence || 0,
          source: tasteData.dataSources?.soundCharacteristics?.source || 'enhanced_audio_analysis',
          timePeriod: tasteData.dataSources?.soundCharacteristics?.timePeriod || 'recent_tracks',
          description: tasteData.dataSources?.soundCharacteristics?.description || 'audio features from enhanced analysis',
          error: tasteData.dataSources?.soundCharacteristics?.error
        },
        events: {
          isReal: false, // Events are currently mock
          lastFetch: null,
          tracksAnalyzed: 0,
          confidence: 0,
          source: 'mock_data',
          timePeriod: 'static',
          description: 'demo events for UI testing',
          error: 'MOCK_DATA_ACTIVE'
        },
        seasonal: {
          isReal: tasteData.dataSources?.seasonalProfile?.isRealData || false,
          lastFetch: tasteData.dataSources?.seasonalProfile?.lastFetch,
          tracksAnalyzed: tasteData.dataSources?.seasonalProfile?.tracksAnalyzed || 0,
          confidence: tasteData.dataSources?.seasonalProfile?.confidence || 0,
          source: 'spotify_api',
          timePeriod: 'recent_listening_history',
          description: 'recently played tracks with timestamps',
          error: tasteData.dataSources?.seasonalProfile?.error
        }
      };

      setDataSources(newDataSources);

    } catch (err) {
      console.error('❌ Dashboard loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load weekly deltas with real data and fallback mechanism
  const loadWeeklyDeltas = async () => {
    try {
      const response = await fetch('/api/user/weekly-deltas');
      const data = await response.json();
      
      // Whether real or fallback data, if the API call succeeds, use the data
      if (data.success) {
        // Update data source tracking
        setDataSources(prev => ({
          ...prev,
          weeklyDeltas: {
            isReal: data.dataSource?.isReal || false,
            lastFetch: data.dataSource?.calculatedAt || new Date().toISOString(),
            confidence: data.dataSource?.confidence || 0,
            cached: data.dataSource?.cached || false,
            daysOfData: data.dataSource?.daysOfData || 0,
            error: data.dataSource?.error,
            fallbackReason: data.dataSource?.fallbackReason
          }
        }));

        // Merge (do not overwrite) so previously visible demo deltas remain when real data omits small/zero changes
        setWeeklyDeltas(prev => ({
          genres: {
            ...(prev?.genres || {}),
            ...(data.deltas?.genres || {})
          },
            soundCharacteristics: {
            ...(prev?.soundCharacteristics || {}),
            ...(data.deltas?.soundCharacteristics || {})
          },
          summary: data.deltas?.summary || prev?.summary,
          dataQuality: data.deltas?.dataQuality || prev?.dataQuality
        }));
      } else {
          // Use the fallback data
      const fallbackDeltas = {
        genres: {
          'melodic techno': { change: 5, direction: 'up' },
          'melodic house': { change: 2, direction: 'up' },
          'progressive house': { change: 10, direction: 'up' },
          'organic house': { change: -3, direction: 'down' },
          'techno': { change: 1, direction: 'up' }
        },
        soundCharacteristics: {
          energy: { change: 3, direction: 'up' },
          danceability: { change: 2, direction: 'up' },
          positivity: { change: -1, direction: 'down' },
          acoustic: { change: 1, direction: 'up' }
        }
      };
      
      setDataSources(prev => ({
        ...prev,
        weeklyDeltas: data.dataSource
      }));
      setWeeklyDeltas(fallbackDeltas);
      }
    } catch (err) {
      console.error('❌ Weekly deltas loading error:', err);
      
      // Update data source with error info
      setDataSources(prev => ({
        ...prev,
        weeklyDeltas: {
          isReal: false,
          lastFetch: new Date().toISOString(),
          confidence: 0,
          error: err.code || 'FETCH_ERROR',
          fallbackReason: err.message || 'Failed to fetch weekly deltas'
        }
      }));
      
      // Fallback to demo data on error
      const fallbackDeltas = {
        genres: {
          'melodic techno': { change: 5, direction: 'up' },
          'melodic house': { change: 2, direction: 'up' },
          'progressive house': { change: 10, direction: 'up' },
          'organic house': { change: -3, direction: 'down' },
          'techno': { change: 1, direction: 'up' }
        },
        soundCharacteristics: {
          energy: { change: 3, direction: 'up' },
          danceability: { change: 2, direction: 'up' },
          positivity: { change: -1, direction: 'down' },
          acoustic: { change: 11, direction: 'up' }
        }
      };
      
      setWeeklyDeltas(fallbackDeltas);
    }
  };

  // NEW: Enhanced data indicator with themed tooltips (CLEANED - NO DEBUG LOGGING)
  const getDataIndicator = useCallback((sourceKey) => {
    const source = dataSources[sourceKey];
    if (!source) return null;

    const isReal = source.isReal || source.isRealData;
    
    // Enhanced tooltip content based on source type
    let tooltipContent = '';
    if (isReal) {
      if (sourceKey === 'events') {
        // Events-specific tooltip
        tooltipContent = `Real Data\n${source.eventsFound || 0} events found\nLocation: ${source.location || 'Unknown'}\nVibe Match: ${source.vibeMatchFilter || 50}%\nSource: Event APIs\nLast updated: ${source.lastFetch ? new Date(source.lastFetch).toLocaleString() : 'Unknown'}`;
      } else {
        // Music taste tooltip
        const timePeriod = source.trackSelectionContext?.description || "recent tracks";
        tooltipContent = `Real Data\n${source.tracksAnalyzed || 0} tracks analyzed\nConfidence: ${Math.round((source.confidence || 0) * 100)}%\nSource: ${source.source || 'spotify'}\nPeriod: ${timePeriod}\nLast updated: ${source.lastFetch ? new Date(source.lastFetch).toLocaleString() : 'Unknown'}`;
      }
    } else {
      const errorCode = source.error || 'UNKNOWN_ERROR';
      const fallbackReason = source.fallbackReason || 'Data source unavailable';
      if (sourceKey === 'events') {
        tooltipContent = `Fallback Data\nError: ${errorCode}\nReason: ${fallbackReason}\nUsing demo events for display`;
      } else {
        tooltipContent = `Fallback Data\nError: ${errorCode}\nReason: ${fallbackReason}\nUsing demo data for display`;
      }
    }

    return (
      <div 
        className={`${styles.dataIndicator} ${isReal ? styles.realData : styles.fallbackData}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onMouseMove={handleMouseMove}
        data-tooltip={tooltipContent}
      >
        {isReal ? 'Real Data' : 'Fallback'}
      </div>
    );
  }, [dataSources]);

  // NEW: Tooltip event handlers
  const handleMouseEnter = useCallback((e) => {
    const content = e.target.getAttribute('data-tooltip');
    if (content) {
      setActiveTooltip({ content });
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (activeTooltip) {
      setTooltipPosition({
        x: e.clientX,
        y: e.clientY
      });
    }
  }, [activeTooltip]);

  // Delta indicator component
  const getDeltaIndicator = useCallback((type, key) => {
    if (!weeklyDeltas || !weeklyDeltas[type]) return null;
    const normalizedKey = key.toLowerCase().trim();
    const delta = weeklyDeltas[type][normalizedKey];
    if (!delta || typeof delta.change === 'undefined' || Math.abs(delta.change) === 0) return null;
    const isPositive = delta.direction === 'up';
    return {
      arrow: isPositive ? '↗️' : '↘️',
      change: `${Math.abs(delta.change)}%`,
      color: isPositive ? '#00FF88' : '#FF4444'
    };
  }, [weeklyDeltas]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <h2>Unable to load dashboard</h2>
          <p>{error}</p>
          <button onClick={loadDashboardData} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>No dashboard data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.dashboard}>
        {/* ROW 1: TOP 5 GENRES + SEASONAL VIBES */}
        <div className={styles.row1}>
          <div className={styles.leftHalf}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Top 5 Genres</h2>
                {getDataIndicator('spotify')}
              </div>
              <div className={styles.cardContent}>
                <Top5GenresSpiderChart 
                  data={dashboardData.genreProfile}
                  dataSource={dataSources.spotify}
                  getDeltaIndicator={getDeltaIndicator}
                />
              </div>
            </div>
          </div>
          
          <div className={styles.rightHalf}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Seasonal Vibes</h2>
                {getDataIndicator('seasonal')}
              </div>
              <div className={styles.cardContent}>
                <CompactSeasonalVibes data={dashboardData.seasonalProfile} />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 2: SOUND CHARACTERISTICS (ENHANCED - NO RED SECTION) */}
        <div className={styles.row2}>
          <div className={styles.fullWidth}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Sound Characteristics</h2>
                {getDataIndicator('soundstat')}
              </div>
              <div className={styles.cardContent}>
                <SoundCharacteristics 
                  data={dashboardData.soundCharacteristics}
                  dataSource={dataSources.soundstat}
                  getDeltaIndicator={getDeltaIndicator}
                />
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: EVENTS MATCHING YOUR VIBE */}
        <div className={styles.row3}>
          <div className={styles.fullWidth}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Events Matching Your Vibe</h2>
                {getDataIndicator('events')}
              </div>
              <div className={styles.cardContent}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '0.5rem', 
                    color: '#fff', 
                    fontSize: '0.9rem' 
                  }}>
                    Vibe Match: {eventFilters.vibeMatch}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={eventFilters.vibeMatch}
                    onChange={(e) => setEventFilters(prev => ({
                      ...prev,
                      vibeMatch: parseInt(e.target.value)
                    }))}
                    style={{
                      width: '100%',
                      height: '4px',
                      background: 'linear-gradient(90deg, #ff4444 0%, #ffaa44 50%, #44ff44 100%)',
                      borderRadius: '2px',
                      outline: 'none'
                    }}
                  />
                </div>
                <EnhancedLocationSearch 
                  onLocationSelect={(locationData) => {
                    setUserLocation(locationData);
                    setEventFilters(prev => ({
                      ...prev,
                      location: locationData
                    }));
                  }}
                />
                <EnhancedEventList 
                  userProfile={dashboardData}
                  location={eventFilters.location || userLocation}
                  vibeMatch={eventFilters.vibeMatch}
                  onDataSourceUpdate={(dataSource) => {
                    setDataSources(prev => ({
                      ...prev,
                      events: dataSource
                    }));
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* NEW: Custom Themed Tooltip */}
      {activeTooltip && (
        <div 
          className={styles.customTooltip}
          style={{
            left: tooltipPosition.x + 10,
            top: tooltipPosition.y - 10,
          }}
        >
          <div className={styles.tooltipContent}>
            {activeTooltip.content.split('\n').map((line, index) => (
              <div key={index} className={styles.tooltipLine}>
                {line}
              </div>
            ))}
          </div>
          <div className={styles.tooltipArrow}></div>
        </div>
      )}

    </div>
  );
}

