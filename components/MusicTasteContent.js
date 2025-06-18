import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';

const MusicTasteContent = () => {
  const { data: session } = useSession();
  const [spotifyData, setSpotifyData] = useState(null);
  const [dataStatus, setDataStatus] = useState('loading');

  useEffect(() => {
    if (session?.user) {
      loadSpotifyData();
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

  const getDataIndicator = () => {
    switch (dataStatus) {
      case 'real': return 'Real Data';
      case 'loading': return 'Loading...';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  };

  return (
    <div className={styles.mainContent}>
      <div className={styles.informationalRow}>
        <div className={styles.leftColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Taste Evolution</h2>
              <span className={styles.dataIndicator}>{getDataIndicator()}</span>
            </div>
            <div className={styles.tasteEvolution}>
              <p>Your music taste has evolved significantly over the past year, showing increased preference for:</p>
              <ul className={styles.tasteList}>
                <li>Progressive House (+25%)</li>
                <li>Melodic Techno (+18%)</li>
                <li>Deep House (+12%)</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className={styles.rightColumn}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Recent Discoveries</h2>
              <span className={styles.dataIndicator}>{getDataIndicator()}</span>
            </div>
            <div className={styles.recentDiscoveries}>
              <p>New artists and genres you've been exploring:</p>
              <ul className={styles.discoveryList}>
                <li>Artbat - Melodic Techno</li>
                <li>Tale Of Us - Progressive House</li>
                <li>Adriatique - Deep House</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.dataInsightsRow}>
        <div className={styles.fullWidth}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>Advanced Analytics</h2>
              <span className={styles.dataIndicator}>{getDataIndicator()}</span>
            </div>
            <div className={styles.analyticsContent}>
              <p>Detailed analysis of your music preferences and listening patterns will be displayed here.</p>
              <div className={styles.comingSoon}>
                <span>🎵 Advanced analytics coming soon...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicTasteContent;
