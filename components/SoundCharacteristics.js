import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/SoundCharacteristics.module.css';

export default function SoundCharacteristics() {
  const { data: session } = useSession();
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dataSource, setDataSource] = useState('unknown');

  // PHASE 1: Enhanced sound characteristics loading with proper error tracking
  const loadSoundCharacteristics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎵 Loading sound characteristics...');
      
      // Try SoundStat API first
      try {
        const soundstatResponse = await fetch('/api/soundstat/user-characteristics');
        if (soundstatResponse.ok) {
          const soundstatData = await soundstatResponse.json();
          if (soundstatData.characteristics && Object.keys(soundstatData.characteristics).length > 0) {
            setFeatures(soundstatData.characteristics);
            setDataSource('soundstat');
            console.log('✅ SoundStat data loaded');
            return;
          }
        }
      } catch (soundstatError) {
        console.log('⚠️ SoundStat API not available:', soundstatError.message);
      }
      
      // Try enhanced profile
      try {
        const enhancedResponse = await fetch('/api/user/enhanced-taste-profile');
        if (enhancedResponse.ok) {
          const enhancedData = await enhancedResponse.json();
          if (enhancedData.soundCharacteristics) {
            const characteristics = {
              energy: enhancedData.soundCharacteristics.energy?.value || 0,
              danceability: enhancedData.soundCharacteristics.danceability?.value || 0,
              valence: enhancedData.soundCharacteristics.valence?.value || 0,
              acousticness: enhancedData.soundCharacteristics.acousticness?.value || 0,
              trackCount: enhancedData.soundCharacteristics.trackCount || 0,
              confidence: enhancedData.soundCharacteristics.confidence || 0
            };
            setFeatures(characteristics);
            setDataSource('enhanced_profile');
            console.log('✅ Enhanced profile data loaded');
            return;
          }
        }
      } catch (enhancedError) {
        console.log('⚠️ Enhanced profile not available:', enhancedError.message);
      }
      
      // Try basic Spotify profile
      try {
        const spotifyResponse = await fetch('/api/spotify/user-profile');
        if (spotifyResponse.ok) {
          const spotifyData = await spotifyResponse.json();
          if (spotifyData.audioFeatures) {
            setFeatures(spotifyData.audioFeatures);
            setDataSource(spotifyData.dataSource === 'mock' ? 'mock' : 'spotify');
            console.log('✅ Spotify profile data loaded');
            return;
          }
        }
      } catch (spotifyError) {
        console.log('⚠️ Spotify API not available:', spotifyError.message);
      }
      
      // PHASE 1: Fallback to default characteristics
      console.log('⚠️ All APIs failed, using fallback characteristics');
      setFeatures(getFallbackCharacteristics());
      setDataSource('fallback');
      setError('ALL_APIS_FAILED');
      
    } catch (err) {
      console.error('❌ Error loading sound characteristics:', err);
      setFeatures(getFallbackCharacteristics());
      setDataSource('error');
      setError('LOADING_ERROR');
    } finally {
      setLoading(false);
    }
  };

  // PHASE 1: Enhanced fallback characteristics
  const getFallbackCharacteristics = () => ({
    energy: 0.75,
    danceability: 0.82,
    valence: 0.65,
    acousticness: 0.15,
    trackCount: 20,
    confidence: 0.8
  });

  // PHASE 1: Enhanced characteristic rendering with null safety
  const renderCharacteristic = (name, value, description, gradientColors) => {
    // PHASE 1: Comprehensive null safety
    const safeValue = value != null && !isNaN(value) ? value : 0;
    const percentage = Math.round(safeValue * 100);
    const width = `${percentage}%`;
    
    return (
      <div key={name} className={styles.characteristic}>
        <div className={styles.characteristicHeader}>
          <span 
            className={styles.characteristicName}
            style={{ color: '#DADADA' }} // PHASE 1: TIKO primary text
          >
            {name}
          </span>
          <span 
            className={styles.characteristicValue}
            style={{ color: '#FF00CC' }} // PHASE 1: TIKO action button color
          >
            {percentage}%
          </span>
        </div>
        
        <div className={styles.characteristicDescription}>
          <span style={{ color: '#999999' }}>{description}</span> {/* PHASE 1: TIKO secondary text */}
        </div>
        
        <div className={styles.progressContainer}>
          <div 
            className={styles.progressBar}
            style={{ 
              background: '#15151F', // PHASE 1: TIKO accent section background
              border: '1px solid rgba(0, 255, 255, 0.1)' // PHASE 1: TIKO card border
            }}
          >
            <div
              className={styles.progressFill}
              style={{
                width: width,
                // PHASE 1: TIKO gradient colors
                background: gradientColors,
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (session) {
      loadSoundCharacteristics();
    }
  }, [session]);

  // PHASE 1: Debug logging for data flow
  useEffect(() => {
    console.log('🎵 Sound characteristics data:', features);
    console.log('🎵 Data source:', dataSource);
    if (!features || Object.keys(features).length === 0) {
      console.warn('⚠️ No sound characteristics data received');
    }
  }, [features, dataSource]);

  // PHASE 1: Enhanced loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}></div>
          <p style={{ color: '#999999' }}>Analyzing your sound DNA...</p>
        </div>
      </div>
    );
  }

  // PHASE 1: Enhanced error state
  if (!features) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p style={{ color: '#FF00CC' }}>⚠️ Sound characteristics unavailable</p>
          <p style={{ color: '#999999' }}>Unable to load audio features</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* PHASE 1: Removed duplicate heading - main dashboard handles this */}
      
      <div className={styles.characteristicsInfo}>
        <p style={{ color: '#999999' }}>
          Based on {features.trackCount || 20} tracks
          <span style={{ color: '#00CFFF', marginLeft: '10px' }}>
            Confidence: {Math.round((features.confidence || 0.8) * 100)}%
          </span>
        </p>
      </div>

      <div className={styles.characteristicsGrid}>
        {/* PHASE 1: All characteristics with TIKO gradient colors and null safety */}
        {renderCharacteristic(
          'Energy',
          features.energy,
          'How energetic and intense your music feels',
          'linear-gradient(90deg, #00CFFF, #FF00CC)' // PHASE 1: TIKO gradient
        )}

        {renderCharacteristic(
          'Danceability', 
          features.danceability,
          'How suitable your music is for dancing',
          'linear-gradient(90deg, #00CFFF, #FF00CC)' // PHASE 1: TIKO gradient
        )}

        {renderCharacteristic(
          'Positivity',
          features.valence,
          'The mood of positivity conveyed by your tracks',
          'linear-gradient(90deg, #00CFFF, #FF00CC)' // PHASE 1: TIKO gradient
        )}

        {renderCharacteristic(
          'Acoustic',
          features.acousticness,
          'How acoustic vs electronic your music is',
          'linear-gradient(90deg, #FFD700, #FFA500)' // PHASE 1: TIKO mustard color for special case
        )}
      </div>

      {/* PHASE 1: Data source indicator */}
      <div className={styles.dataSourceInfo}>
        <span style={{ color: '#888888', fontSize: '12px' }}>
          {dataSource === 'soundstat' && '🔴 SoundStat API'}
          {dataSource === 'enhanced_profile' && '🟡 Enhanced Profile'}
          {dataSource === 'spotify' && '🟢 Spotify API'}
          {dataSource === 'mock' && '⚠️ Mock Data'}
          {dataSource === 'fallback' && '⚠️ Fallback Data'}
          {dataSource === 'error' && '❌ Error State'}
        </span>
      </div>

      {/* PHASE 1: Error indicator */}
      {error && (
        <div className={styles.errorIndicator}>
          <span style={{ color: '#999999', fontSize: '12px' }}>
            ⚠️ {error === 'ALL_APIS_FAILED' ? 'All APIs unavailable - using fallback' : 'Data loading error'}
          </span>
        </div>
      )}
    </div>
  );
}

