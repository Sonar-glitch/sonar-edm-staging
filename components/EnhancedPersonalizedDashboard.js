// PRESERVES: All existing functionality and UI theme
// ADDS: Custom themed tooltips, weekly delta indicators, comprehensive data source info
// REMOVES: Redundant red section as requested

import { useState, useEffect, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import dynamic from 'next/dynamic';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

// Dynamic imports for components (PRESERVED)
const Top5GenresSpiderChart = dynamic(() => import('./Top5GenresSpiderChart'), { ssr: false });
const CompactSeasonalVibes = dynamic(() => import('./CompactSeasonalVibes'), { ssr: false });
const SoundCharacteristics = dynamic(() => import('./SoundCharacteristics'), { ssr: false });
const EnhancedEventList = dynamic(() => import('./EnhancedEventList'), { ssr: false });
const EnhancedLocationSearch = dynamic(() => import('./EnhancedLocationSearch'), { ssr: false });
const TasteCollectionProgress = dynamic(() => import('./TasteCollectionProgress'), { ssr: false });
const ConfidenceIndicator = dynamic(() => import('./ConfidenceIndicator'), { ssr: false });

export default function EnhancedPersonalizedDashboard() {
  const { data: session, status } = useSession();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 🎵 NEW: Taste collection and events loading states
  const [tasteCollectionStatus, setTasteCollectionStatus] = useState('checking');
  const [eventsLoadingStatus, setEventsLoadingStatus] = useState('pending');
  const [isDemoMode, setIsDemoMode] = useState(false); // Track if using demo data

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
    // 🔐 SIMPLIFIED: Only check onboarding for authenticated users
    if (session) {
      console.log('🔐 User is authenticated:', session.user.email);
      checkTasteCollectionStatus();
    } else {
      console.log('🔐 User is NOT authenticated - showing sign-in prompt');
      // For unauthenticated users, don't load any data - just show sign-in
      setLoading(false);
      setTasteCollectionStatus('completed'); // Skip onboarding entirely
    }
  }, [session]);

  // 🎵 FIXED: Check taste collection status without redirect loop
  const checkTasteCollectionStatus = async () => {
    try {
      const response = await fetch('/api/user/dashboard-status');
      if (response.ok) {
        const data = await response.json();
        const status = data.status;
        
        console.log('🎵 Dashboard status:', status);
        
        // 🎯 FIXED: Only redirect if user explicitly needs onboarding AND doesn't have any profile data
        // Prevent redirect loop by checking if we're already in demo mode or have shown onboarding
        if (status.showTasteLoader && status.isFirstLogin && !isDemoMode && !localStorage.getItem('onboarding_attempted')) {
          console.log('🔄 Redirecting first-time user to onboarding page');
          localStorage.setItem('onboarding_attempted', 'true');
          window.location.href = '/onboarding';
          return;
        }
        
        // For returning users or users who have attempted onboarding, set status to completed
        setTasteCollectionStatus('completed');
        
        // If no real profile data exists, enable demo mode
        if (!status.userHasProfile || status.userType === 'guest') {
          console.log('🎭 No real profile data found, enabling demo mode');
          setIsDemoMode(true);
        }
        
        if (status.showEventsLoader) {
          setEventsLoadingStatus('loading');
        } else {
          setEventsLoadingStatus('loaded');
        }
        
        // Load dashboard data for returning users and unauthenticated users
        await loadDashboardData();
        loadWeeklyDeltas();
        autoDetectLocation();
        
      } else {
        // Fallback: load dashboard normally and set status to completed
        setTasteCollectionStatus('completed');
        setIsDemoMode(true); // Enable demo mode on API failure
        await loadDashboardData();
        loadWeeklyDeltas();
        autoDetectLocation();
      }
    } catch (error) {
      console.error('Error checking dashboard status:', error);
      // Fallback: load dashboard normally and set status to completed
      setTasteCollectionStatus('completed');
      setIsDemoMode(true); // Enable demo mode on error
      await loadDashboardData();
      loadWeeklyDeltas();
      autoDetectLocation();
    }
  };

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

      // 🎯 FIXED: Properly check for real vs demo data based on API response
      const isRealSpotifyData = tasteData.dataSources?.genreProfile?.isRealData === true;
      const isRealSoundData = tasteData.dataSources?.soundCharacteristics?.isRealData === true;
      const isRealSeasonalData = tasteData.dataSources?.seasonalProfile?.isRealData === true;

      // If any critical data is not real, enable demo mode
      if (!isRealSpotifyData || !isRealSoundData || !isRealSeasonalData) {
        console.log('🎭 API returned demo/fallback data, enabling demo mode');
        setIsDemoMode(true);
      }

      // Load enhanced events data to get real integration stats
      let eventsData = null;
      let eventsSource = {
        isReal: false,
        lastFetch: null,
        eventsFound: 0,
        confidence: 0,
        source: 'mock_data',
        timePeriod: 'static',
        description: 'demo events for UI testing',
        error: 'MOCK_DATA_ACTIVE',
        enhanced: false,
        enhancementStats: null
      };

      try {
        const eventsResponse = await fetch('/api/events/enhanced?limit=20');
        if (eventsResponse.ok) {
          eventsData = await eventsResponse.json();
          
          // 🎯 FIXED: Only mark as real if we actually have valid events data
          const hasRealEvents = eventsData.events && eventsData.events.length > 0 && !eventsData.error;
          
          eventsSource = {
            isReal: hasRealEvents,
            lastFetch: eventsData.timestamp || new Date().toISOString(),
            eventsFound: eventsData.events?.length || 0,
            confidence: eventsData.enhancementStats?.enhancedEvents > 0 ? 0.9 : 0.5,
            source: hasRealEvents ? 'enhanced_events_api' : 'demo_data',
            timePeriod: hasRealEvents ? 'live_data' : 'static',
            description: hasRealEvents ? 'real events with Spotify/Apple Music + Essentia analysis' : 'demo events for UI testing',
            enhanced: eventsData.enhanced || false,
            enhancementStats: eventsData.enhancementStats,
            musicApiIntegration: eventsData.enhancementStats?.enhancedEvents > 0,
            essentiaIntegration: true, // Essentia is integrated
            location: userLocation?.city || 'Auto-detected',
            vibeMatchFilter: eventFilters.vibeMatch || 50,
            error: hasRealEvents ? null : 'DEMO_DATA'
          };
          console.log('✅ [Dashboard] Enhanced events data loaded:', eventsData.enhancementStats);
        }
      } catch (eventsError) {
        console.warn('⚠️ [Dashboard] Events loading failed, using fallback:', eventsError.message);
        eventsSource.error = `API_ERROR: ${eventsError.message}`;
      }

      // ENHANCED: Process data sources with detailed tracking - preserve API response flags
      const newDataSources = {
        spotify: {
          isReal: tasteData.dataSources?.genreProfile?.isRealData || false,
          lastFetch: tasteData.dataSources?.genreProfile?.lastFetch,
          tracksAnalyzed: tasteData.dataSources?.genreProfile?.tracksAnalyzed || 0,
          confidence: tasteData.dataSources?.genreProfile?.confidence || 0,
          source: tasteData.dataSources?.genreProfile?.source || 'demo_data',
          timePeriod: tasteData.dataSources?.genreProfile?.timePeriod || 'none',
          description: tasteData.dataSources?.genreProfile?.description || 'demo data',
          error: tasteData.dataSources?.genreProfile?.error
        },
        soundstat: {
          isReal: tasteData.dataSources?.soundCharacteristics?.isRealData || false,
          lastFetch: tasteData.dataSources?.soundCharacteristics?.lastFetch,
          tracksAnalyzed: tasteData.dataSources?.soundCharacteristics?.tracksAnalyzed || 0,
          confidence: tasteData.dataSources?.soundCharacteristics?.confidence || 0,
          source: tasteData.dataSources?.soundCharacteristics?.source || 'demo_data',
          timePeriod: tasteData.dataSources?.soundCharacteristics?.timePeriod || 'none',
          description: tasteData.dataSources?.soundCharacteristics?.description || 'demo data',
          error: tasteData.dataSources?.soundCharacteristics?.error
        },
        events: eventsSource,
        seasonal: {
          isReal: tasteData.dataSources?.seasonalProfile?.isRealData || false,
          lastFetch: tasteData.dataSources?.seasonalProfile?.lastFetch,
          tracksAnalyzed: tasteData.dataSources?.seasonalProfile?.tracksAnalyzed || 0,
          confidence: tasteData.dataSources?.seasonalProfile?.confidence || 0,
          source: tasteData.dataSources?.seasonalProfile?.source || 'demo_data',
          timePeriod: tasteData.dataSources?.seasonalProfile?.timePeriod || 'none',
          description: tasteData.dataSources?.seasonalProfile?.description || 'demo data',
          error: tasteData.dataSources?.seasonalProfile?.error
        }
      };

      setDataSources(newDataSources);

    } catch (err) {
      console.error('❌ Dashboard loading error:', err);
      setError(err.message);
      // On error, definitely enable demo mode
      setIsDemoMode(true);
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

  // NEW: Enhanced data indicator with themed tooltips (COMPREHENSIVE COMPLETION TRACKING)
  const getDataIndicator = useCallback((sourceKey) => {
    const source = dataSources[sourceKey];
    if (!source) return null;

    // 🎯 FIXED: Check demo mode first - if demo mode is active, everything is demo data
    if (isDemoMode) {
      const tooltipContent = `⚠️ Demo Data\nReason: Demo mode active\nUsing sample data for demonstration\nNote: Refresh page to complete real taste analysis`;
      
      return (
        <div 
          className={`${styles.dataIndicator} ${styles.fallbackData}`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onMouseMove={handleMouseMove}
          data-tooltip={tooltipContent}
        >
          ⚠️ Demo Data
        </div>
      );
    }

    // 🎯 COMPREHENSIVE DATA QUALITY ASSESSMENT
    let isReal = false;
    let confidence = 0;
    let label = '⚠️ Demo Data';
    let tracksAnalyzed = source.tracksAnalyzed || 0;
    
    // For real data assessment, check source.isReal flag first
    if (!source.isReal) {
      isReal = false;
      label = '⚠️ Demo Data';
    } else if (sourceKey === 'spotify') {
      // Spotify section: Based on actual artists/tracks analyzed
      const artistsAnalyzed = source.tracksAnalyzed || 0;
      confidence = source.confidence || 0;
      
      if (artistsAnalyzed >= 10 && confidence >= 0.8) {
        isReal = true;
        label = '✅ Real Data';
      } else if (artistsAnalyzed >= 5) {
        isReal = true;
        label = `✅ Partial Data (${artistsAnalyzed} tracks)`;
      } else if (artistsAnalyzed > 0) {
        isReal = false;
        label = `⚠️ Limited Data (${artistsAnalyzed} tracks)`;
      } else {
        isReal = false;
        label = '⚠️ Fallback Data';
      }
      
    } else if (sourceKey === 'soundstat') {
      // Sound characteristics: Based on Essentia analysis
      confidence = source.confidence || 0;
      
      if (tracksAnalyzed >= 10 && confidence >= 0.8) {
        isReal = true;
        label = '✅ Real Data';
      } else if (tracksAnalyzed >= 5) {
        isReal = true;
        label = `✅ Partial Data (${tracksAnalyzed} tracks)`;
      } else if (tracksAnalyzed > 0) {
        isReal = false;
        label = `⚠️ Limited Data (${tracksAnalyzed} tracks)`;
      } else {
        isReal = false;
        label = '⚠️ Fallback Data';
      }
      
    } else if (sourceKey === 'seasonal') {
      // Seasonal vibes: Based on listening history analysis
      confidence = source.confidence || 0;
      
      if (tracksAnalyzed >= 20 && confidence >= 0.7) {
        isReal = true;
        label = '✅ Real Data';
      } else if (tracksAnalyzed >= 10) {
        isReal = true;
        label = `✅ Partial Data (${tracksAnalyzed} tracks)`;
      } else if (tracksAnalyzed > 0) {
        isReal = false;
        label = `⚠️ Limited Data (${tracksAnalyzed} tracks)`;
      } else {
        isReal = false;
        label = '⚠️ Fallback Data';
      }
      
    } else if (sourceKey === 'events') {
      // Events: Based on actual events found
      const eventsFound = source.eventsFound || 0;
      isReal = eventsFound > 0 && !source.error && source.location !== 'Unknown';
      confidence = source.confidence || 0;
      label = isReal ? '✅ Real Data' : '⚠️ Demo Data';
    }
    
    // 🎯 ENHANCED TOOLTIP with completion percentage and confidence
    let tooltipContent = '';
    if (isReal) {
      if (sourceKey === 'events') {
        // Events tooltip (preserved)
        const integrationDetails = [];
        if (source.musicApiIntegration) integrationDetails.push('Spotify/Apple Music');
        if (source.essentiaIntegration) integrationDetails.push('Essentia Audio Analysis');
        const integrations = integrationDetails.length > 0 ? `\nIntegrations: ${integrationDetails.join(', ')}` : '';
        
        let statsText = '';
        if (source.enhancementStats) {
          const stats = source.enhancementStats;
          statsText = `\nEnhanced: ${stats.enhancedEvents}/${stats.totalEvents} events`;
          if (stats.averageBoost > 0) {
            statsText += `\nAvg Score Boost: +${stats.averageBoost.toFixed(1)} pts`;
          }
        }
        
        tooltipContent = `${label}${integrations}\n${source.eventsFound || 0} events found\nLocation: ${source.location || 'Unknown'}\nVibe Match: ${source.vibeMatchFilter || 50}%${statsText}\nLast updated: ${source.lastFetch ? new Date(source.lastFetch).toLocaleString() : 'Unknown'}`;
      } else {
        // Music data sections with detailed completion info
        const completionPercent = tracksAnalyzed >= 10 ? 100 : Math.round((tracksAnalyzed / 10) * 100);
        const confidencePercent = Math.round(confidence * 100);
        
        tooltipContent = `${label}\n${tracksAnalyzed} tracks analyzed\nCompletion: ${completionPercent}%\nConfidence: ${confidencePercent}%\nSource: ${source.source || 'spotify'}\nPeriod: ${source.timePeriod || 'recent'}\nLast updated: ${source.lastFetch ? new Date(source.lastFetch).toLocaleString() : 'Unknown'}`;
        
        // Add analysis method if available
        const analysisMethod = [];
        if (source.spotifyData) analysisMethod.push('Spotify API');
        if (source.essentiaAnalysis) analysisMethod.push('Essentia Audio Features');
        if (analysisMethod.length > 0) {
          tooltipContent += `\nAnalysis: ${analysisMethod.join(', ')}`;
        }
      }
    } else {
      // Fallback/demo data tooltip
      const errorCode = source.error || 'INSUFFICIENT_DATA';
      const fallbackReason = source.fallbackReason || 'Not enough tracks for reliable analysis';
      
      if (sourceKey === 'events') {
        tooltipContent = `${label}\nReason: ${fallbackReason}\nUsing demonstration events\nNote: Real events require valid location and API access`;
      } else {
        const completionPercent = tracksAnalyzed > 0 ? Math.round((tracksAnalyzed / 10) * 100) : 0;
        const confidencePercent = Math.round(confidence * 100);
        
        tooltipContent = `${label}\nReason: ${fallbackReason}\nTracks analyzed: ${tracksAnalyzed}\nCompletion: ${completionPercent}%\nConfidence: ${confidencePercent}%\nUsing genre-based estimates\nNote: Need 10+ tracks for reliable analysis`;
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
        {label}
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

  // 🎵 NEW: Enhanced taste collection progress with detailed steps
  const handleTasteCollectionComplete = (status) => {
    console.log('🎵 Taste collection completed:', status);
    
    // If user clicked "Continue with Basic Profile", immediately show dashboard
    if (status?.fastMode) {
      console.log('🎵 Fast mode activated - showing dashboard with demo data');
      console.log('🎵 Note: Values shown are demo data, not your real taste profile');
      setTasteCollectionStatus('completed');
      setIsDemoMode(true); // Mark as demo mode
      
      // Clear any stale progress by calling a progress reset endpoint
      fetch('/api/user/reset-taste-progress', { method: 'POST' })
        .then(() => console.log('🎵 Progress reset for future sessions'))
        .catch(err => console.warn('🎵 Progress reset failed:', err.message));
      
      // Load dashboard data immediately for fast mode
      loadDashboardData();
      loadWeeklyDeltas();
      autoDetectLocation();
      return;
    }
    
    // Normal completion flow
    setTasteCollectionStatus('completed');
    
    // Load dashboard data after taste collection
    loadDashboardData();
    loadWeeklyDeltas();
    autoDetectLocation();
  };

  // 🎵 NEW: Events loading component for when dashboard is ready but events are loading
  const EventsLoadingIndicator = () => (
    <div className={styles.eventsLoadingContainer}>
      <div className={styles.eventsLoader}>
        <div className={styles.searchAnimation}>🔍</div>
        <span className={styles.eventsLoadingText}>Fetching your events</span>
        <div className={styles.loadingDots}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );

  // 🔐 CLEAR AUTHENTICATION GATE - No onboarding for unauthenticated users
  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.authenticationPrompt}>
          <div className={styles.authContent}>
            <h1 style={{ 
              fontSize: '2.5rem',
              background: 'linear-gradient(135deg, #00CFFF 0%, #FF00CC 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '1rem'
            }}>
              Welcome to TIKO
            </h1>
            <p style={{ 
              color: '#888', 
              marginBottom: '2rem',
              fontSize: '1.1rem',
              lineHeight: '1.5'
            }}>
              Discover EDM events that match your unique music taste.<br/>
              Connect your Spotify account to get personalized recommendations.
            </p>
            <button 
              onClick={() => window.location.href = '/api/auth/signin'}
              className={styles.spotifySignInButton}
              style={{
                background: 'linear-gradient(135deg, #1db954 0%, #1ed760 100%)',
                color: 'white',
                padding: '16px 32px',
                borderRadius: '50px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '0 auto',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: '0 4px 15px rgba(29, 185, 84, 0.3)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(29, 185, 84, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(29, 185, 84, 0.3)';
              }}
            >
              <span style={{ fontSize: '20px' }}>🎵</span>
              Connect with Spotify
            </button>
            <p style={{ 
              color: '#666', 
              marginTop: '1.5rem',
              fontSize: '0.9rem'
            }}>
              We'll analyze your music taste to find events you'll love
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 🎵 ENHANCED: First login - show detailed taste collection progress
  if (session && tasteCollectionStatus === 'collecting') {
    return (
      <TasteCollectionProgress 
        onComplete={handleTasteCollectionComplete}
        onTimeout={() => {
          console.log('🎵 Progress timeout - showing dashboard with demo data');
          setTasteCollectionStatus('completed');
          loadDashboardData();
          loadWeeklyDeltas();
          autoDetectLocation();
        }}
      />
    );
  }

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
      {/* 🎵 NEW: Demo Mode Notice */}
      {isDemoMode && (
        <div className={styles.demoModeNotice}>
          <div className={styles.demoModeContent}>
            <span className={styles.demoIcon}>⚠️</span>
            <div className={styles.demoText}>
              <strong>Demo Mode Active</strong>
              <p>You're viewing sample data. For personalized results, refresh the page to complete your music taste analysis.</p>
            </div>
            <button 
              className={styles.refreshButton}
              onClick={() => window.location.reload()}
            >
              Refresh & Try Again
            </button>
          </div>
        </div>
      )}
      
      {/* Profile Confidence Indicator */}
      {dashboardData?.profile?.confidence && !isDemoMode && (
        <ConfidenceIndicator 
          confidence={dashboardData.profile.confidence}
          profileType={dashboardData.profile.profileType}
          compact={true}
        />
      )}
      
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
                  <div style={{ position: 'relative', width: '100%' }}>
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
                        height: '6px',
                        background: `linear-gradient(to right, 
                          #00CFFF 0%, 
                          #FF00CC ${eventFilters.vibeMatch}%, 
                          rgba(255, 255, 255, 0.1) ${eventFilters.vibeMatch}%, 
                          rgba(255, 255, 255, 0.1) 100%)`,
                        borderRadius: '3px',
                        outline: 'none',
                        WebkitAppearance: 'none',
                        cursor: 'pointer',
                        transition: 'background 0.2s ease'
                      }}
                    />
                  </div>
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
                
                {/* 🎵 NEW: Show events loading or actual events */}
                {eventsLoadingStatus === 'loading' ? (
                  <EventsLoadingIndicator />
                ) : (
                  <EnhancedEventList 
                    userProfile={dashboardData}
                    location={eventFilters.location || userLocation}
                    vibeMatch={eventFilters.vibeMatch}
                    onDataSourceUpdate={(dataSource) => {
                      setDataSources(prev => ({
                        ...prev,
                        events: dataSource
                      }));
                      // Mark events as loaded when we get data
                      setEventsLoadingStatus('loaded');
                    }}
                  />
                )}
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

