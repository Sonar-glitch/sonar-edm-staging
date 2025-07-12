import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';
import Top5GenresSpiderChart from './Top5GenresSpiderChart';

const MusicTasteContent = () => {
  const { data: session } = useSession();
  const [spotifyData, setSpotifyData] = useState(null);
  const [dataStatus, setDataStatus] = useState('loading');
  const [tasteProfile, setTasteProfile] = useState(null);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationData, setVerificationData] = useState(null);

  useEffect(() => {
    if (session?.user) {
      loadSpotifyData();
      loadTasteProfile();
    }
  }, [session]);

  const loadSpotifyData = async () => {
    try {
      setDataStatus('loading');
      
      // Log the start of verification for transparency
      console.log('SPOTIFY_DATA_SOURCE_VERIFICATION_START');
      
      const response = await fetch('/api/spotify/user-data');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Spotify data: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Log the raw data and verification info
      console.log('SPOTIFY_API_RAW_DATA:', data);
      console.log('SPOTIFY_DATA_SOURCE:', data.source || 'unknown');
      console.log('SPOTIFY_DATA_TIMESTAMP:', data.timestamp || 'unknown');
      
      // Only set Real Data if we have a valid source and timestamp
      const isRealData = data.source === 'spotify_api' && data.timestamp;
      setDataStatus(isRealData ? 'real' : 'demo');
      
      console.log('SPOTIFY_DATA_IS_REAL:', isRealData);
      console.log('SPOTIFY_DATA_SOURCE_VERIFICATION_END');
      
      // Store verification data for UI display
      setVerificationData({
        source: data.source || 'unknown',
        timestamp: data.timestamp || 'unknown',
        status: response.status
      });
      
      setSpotifyData(data);
    } catch (error) {
      console.error('SPOTIFY_DATA_ERROR:', error);
      setDataStatus('error');
      setVerificationData({
        source: 'error',
        error: error.message
      });
    }
  };

  const loadTasteProfile = async () => {
    try {
      const response = await fetch('/api/user/taste-profile');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch taste profile: ${response.status}`);
      }
      
      const data = await response.json();
      setTasteProfile(data);
    } catch (error) {
      console.error('Error loading taste profile:', error);
    }
  };

  const getDataIndicator = () => {
    switch (dataStatus) {
      case 'real': return 'Real Data';
      case 'demo': return 'Demo Data';
      case 'loading': return 'Loading...';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  // Get taste evolution based on data
  const getTasteEvolution = () => {
    if (spotifyData?.tasteEvolution && dataStatus === 'real') {
      return spotifyData.tasteEvolution;
    }
    
    // Clearly marked demo data
    return [
      { genre: 'Progressive House', change: '+25%', source: 'demo' },
      { genre: 'Melodic Techno', change: '+18%', source: 'demo' },
      { genre: 'Deep House', change: '+12%', source: 'demo' },
      { genre: 'Tech House', change: '+8%', source: 'demo' },
      { genre: 'Trance', change: '-5%', source: 'demo' }
    ];
  };

  // Get recent discoveries
  const getRecentDiscoveries = () => {
    if (spotifyData?.recentDiscoveries && dataStatus === 'real') {
      return spotifyData.recentDiscoveries;
    }
    
    // Clearly marked demo data
    return [
      { artist: 'Artbat', genre: 'Melodic Techno', source: 'demo' },
      { artist: 'Tale Of Us', genre: 'Progressive House', source: 'demo' },
      { artist: 'Adriatique', genre: 'Deep House', source: 'demo' },
      { artist: 'Anyma', genre: 'Melodic Techno', source: 'demo' },
      { artist: 'Mathame', genre: 'Progressive House', source: 'demo' }
    ];
  };

  const tasteEvolution = getTasteEvolution();
  const recentDiscoveries = getRecentDiscoveries();

  return (
    <div className={styles.mainContent}>
      <div className={styles.informationalRow}>
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Your Top 5 Genres</h2>
              <span className={styles.dataIndicator}>{getDataIndicator()}</span>
              
              {/* Data Verification UI */}
              {dataStatus === 'real' && (
                <div className={styles.dataVerification} onClick={() => setShowVerification(!showVerification)}>
                  <span className={styles.verifyIcon}>✓</span>
                  <span className={styles.verifyText}>Verified</span>
                  
                  {showVerification && verificationData && (
                    <div className={styles.verificationDetails}>
                      <p>Source: {verificationData.source}</p>
                      <p>Fetched: {new Date(verificationData.timestamp).toLocaleString()}</p>
                      <p>API Status: {verificationData.status}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className={styles.genreChartContainer}>
              <Top5GenresSpiderChart 
                userTasteProfile={tasteProfile} 
                spotifyData={spotifyData} 
              />
            </div>
          </div>
        </div>
        
        <div className={styles.rightColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Taste Evolution</h2>
              <span className={styles.dataIndicator}>{getDataIndicator()}</span>
            </div>
            <div className={styles.tasteEvolution}>
              <p>Your music taste has evolved significantly over the past year:</p>
              <ul className={styles.tasteList}>
                {tasteEvolution.map((item, index) => (
                  <li key={index}>
                    <span className={styles.genreName}>{item.genre}</span>
                    <span className={styles.genreChange} style={{ 
                      color: item.change.startsWith('+') ? '#22c55e' : '#ef4444' 
                    }}>
                      {item.change}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.informationalRow}>
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent Discoveries</h2>
              <span className={styles.dataIndicator}>{getDataIndicator()}</span>
            </div>
            <div className={styles.recentDiscoveries}>
              <p>New artists and genres you've been exploring:</p>
              <ul className={styles.discoveryList}>
                {recentDiscoveries.map((item, index) => (
                  <li key={index}>
                    <span className={styles.artistName}>{item.artist}</span>
                    <span className={styles.artistGenre}>{item.genre}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        
        <div className={styles.rightColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Sound Characteristics</h2>
              <span className={styles.dataIndicator}>{getDataIndicator()}</span>
            </div>
            <div className={styles.soundCharacteristics}>
              <div className={styles.characteristicItem}>
                <div className={styles.characteristicHeader}>
                  <span className={styles.characteristicIcon}>⚡</span>
                  <span className={styles.characteristicName}>Energy</span>
                  <span className={styles.characteristicValue}>
                    {spotifyData?.audioFeatures?.energy ? 
                      `${Math.round(spotifyData.audioFeatures.energy * 100)}%` : 
                      '75%'}
                  </span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ 
                      width: spotifyData?.audioFeatures?.energy ? 
                        `${Math.round(spotifyData.audioFeatures.energy * 100)}%` : 
                        '75%', 
                      background: 'linear-gradient(90deg, #ff006e, #ff5757)' 
                    }}
                  ></div>
                </div>
                <div className={styles.characteristicDescription}>How energetic and intense your music feels</div>
              </div>
              
              <div className={styles.characteristicItem}>
                <div className={styles.characteristicHeader}>
                  <span className={styles.characteristicIcon}>💃</span>
                  <span className={styles.characteristicName}>Danceability</span>
                  <span className={styles.characteristicValue}>
                    {spotifyData?.audioFeatures?.danceability ? 
                      `${Math.round(spotifyData.audioFeatures.danceability * 100)}%` : 
                      '82%'}
                  </span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ 
                      width: spotifyData?.audioFeatures?.danceability ? 
                        `${Math.round(spotifyData.audioFeatures.danceability * 100)}%` : 
                        '82%', 
                      background: 'linear-gradient(90deg, #00d4ff, #00a2ff)' 
                    }}
                  ></div>
                </div>
                <div className={styles.characteristicDescription}>How suitable your music is for dancing</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicTasteContent;
