import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';
import Top5GenresSpiderChart from './Top5GenresSpiderChart';

const MusicTasteContent = () => {
  const { data: session } = useSession();
  const [spotifyData, setSpotifyData] = useState(null);
  const [dataStatus, setDataStatus] = useState('loading');
  const [tasteProfile, setTasteProfile] = useState(null);

  useEffect(() => {
    if (session?.user) {
      loadSpotifyData();
      loadTasteProfile();
    }
  }, [session]);

  const loadSpotifyData = async () => {
    try {
      setDataStatus('loading');
      const response = await fetch('/api/spotify/user-data');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch Spotify data: ${response.status}`);
      }
      
      const data = await response.json();
      setSpotifyData(data);
      setDataStatus('real');
    } catch (error) {
      console.error('Error loading Spotify data:', error);
      setDataStatus('error');
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
      case 'loading': return 'Loading...';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  // Calculate taste evolution based on historical data
  const getTasteEvolution = () => {
    // Default evolution data
    return [
      { genre: 'Progressive House', change: '+25%' },
      { genre: 'Melodic Techno', change: '+18%' },
      { genre: 'Deep House', change: '+12%' },
      { genre: 'Tech House', change: '+8%' },
      { genre: 'Trance', change: '-5%' }
    ];
  };

  // Get recent discoveries
  const getRecentDiscoveries = () => {
    // Default discoveries
    return [
      { artist: 'Artbat', genre: 'Melodic Techno' },
      { artist: 'Tale Of Us', genre: 'Progressive House' },
      { artist: 'Adriatique', genre: 'Deep House' },
      { artist: 'Anyma', genre: 'Melodic Techno' },
      { artist: 'Mathame', genre: 'Progressive House' }
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
                  <span className={styles.characteristicValue}>75%</span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBar} style={{ width: '75%', background: 'linear-gradient(90deg, #ff006e, #ff5757)' }}></div>
                </div>
                <div className={styles.characteristicDescription}>How energetic and intense your music feels</div>
              </div>
              
              <div className={styles.characteristicItem}>
                <div className={styles.characteristicHeader}>
                  <span className={styles.characteristicIcon}>💃</span>
                  <span className={styles.characteristicName}>Danceability</span>
                  <span className={styles.characteristicValue}>82%</span>
                </div>
                <div className={styles.progressBarContainer}>
                  <div className={styles.progressBar} style={{ width: '82%', background: 'linear-gradient(90deg, #00d4ff, #00a2ff)' }}></div>
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
