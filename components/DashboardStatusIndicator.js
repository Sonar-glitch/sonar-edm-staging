// components/DashboardStatusIndicator.js
// 📊 REAL-TIME DASHBOARD STATUS COMPONENT
// Shows current status of music taste profile and event matching

import { useState, useEffect } from 'react';
import styles from '../styles/DashboardStatusIndicator.module.css';

const DashboardStatusIndicator = ({ compact = false }) => {
  const [status, setStatus] = useState({
    musicTaste: 'checking',
    events: 'checking',
    matching: 'pending'
  });
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // Initial status check
    checkStatus();
    
    // Poll for updates every 30 seconds
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkStatus = async () => {
    try {
      // Check music taste status
      const tasteResponse = await fetch('/api/user/taste-collection-progress');
      let tasteStatus = 'error';
      
      if (tasteResponse.ok) {
        const tasteData = await tasteResponse.json();
        tasteStatus = tasteData.status.overall;
      }

      // Check events status (simplified check)
      const eventsResponse = await fetch('/api/user/events-status');
      let eventsStatus = 'pending';
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        eventsStatus = eventsData.status;
      } else {
        // Fallback: assume events are available if taste is complete
        eventsStatus = tasteStatus === 'complete' ? 'available' : 'pending';
      }

      // Determine matching status
      let matchingStatus = 'pending';
      if (tasteStatus === 'complete' && eventsStatus === 'available') {
        matchingStatus = 'active';
      } else if (tasteStatus === 'complete' && eventsStatus === 'loading') {
        matchingStatus = 'calculating';
      }

      setStatus({
        musicTaste: tasteStatus,
        events: eventsStatus,
        matching: matchingStatus
      });
      setLastUpdate(new Date());

    } catch (error) {
      console.error('Error checking dashboard status:', error);
    }
  };

  const getStatusConfig = (type, currentStatus) => {
    const configs = {
      musicTaste: {
        checking: { icon: '🔍', text: 'Checking profile...', color: '#64748b' },
        not_started: { icon: '⏳', text: 'Setting up profile', color: '#f59e0b' },
        loading: { icon: '🎵', text: 'Building taste profile', color: '#06b6d4' },
        complete: { icon: '✅', text: 'Music taste ready', color: '#10b981' },
        error: { icon: '❌', text: 'Profile error', color: '#ef4444' }
      },
      events: {
        checking: { icon: '🔍', text: 'Checking events...', color: '#64748b' },
        pending: { icon: '⏳', text: 'Events pending', color: '#f59e0b' },
        loading: { icon: '🎪', text: 'Fetching events', color: '#8b5cf6' },
        available: { icon: '🎉', text: 'Events ready', color: '#10b981' },
        error: { icon: '❌', text: 'Events error', color: '#ef4444' }
      },
      matching: {
        pending: { icon: '⏳', text: 'Waiting for data', color: '#64748b' },
        calculating: { icon: '🧮', text: 'Calculating matches', color: '#06b6d4' },
        active: { icon: '🎯', text: 'Smart matching active', color: '#10b981' },
        error: { icon: '❌', text: 'Matching error', color: '#ef4444' }
      }
    };

    return configs[type]?.[currentStatus] || { icon: '❓', text: 'Unknown', color: '#64748b' };
  };

  if (compact) {
    // Compact version for dashboard header
    const overallStatus = status.musicTaste === 'complete' && status.events === 'available' && status.matching === 'active' 
      ? 'ready' : 'loading';
    
    return (
      <div className={styles.compactStatus}>
        <div className={`${styles.statusDot} ${styles[overallStatus]}`}></div>
        <span className={styles.statusText}>
          {overallStatus === 'ready' ? 'System Ready' : 'Setting Up...'}
        </span>
      </div>
    );
  }

  // Full status display
  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusHeader}>
        <h3>System Status</h3>
        {lastUpdate && (
          <span className={styles.lastUpdate}>
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className={styles.statusItems}>
        {/* Music Taste Status */}
        <div className={styles.statusItem}>
          <div className={styles.statusIcon}>
            {getStatusConfig('musicTaste', status.musicTaste).icon}
          </div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Music Taste Profile</span>
            <span 
              className={styles.statusValue}
              style={{ color: getStatusConfig('musicTaste', status.musicTaste).color }}
            >
              {getStatusConfig('musicTaste', status.musicTaste).text}
            </span>
          </div>
        </div>

        {/* Events Status */}
        <div className={styles.statusItem}>
          <div className={styles.statusIcon}>
            {getStatusConfig('events', status.events).icon}
          </div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Event Collection</span>
            <span 
              className={styles.statusValue}
              style={{ color: getStatusConfig('events', status.events).color }}
            >
              {getStatusConfig('events', status.events).text}
            </span>
          </div>
        </div>

        {/* Matching Status */}
        <div className={styles.statusItem}>
          <div className={styles.statusIcon}>
            {getStatusConfig('matching', status.matching).icon}
          </div>
          <div className={styles.statusInfo}>
            <span className={styles.statusLabel}>Smart Matching</span>
            <span 
              className={styles.statusValue}
              style={{ color: getStatusConfig('matching', status.matching).color }}
            >
              {getStatusConfig('matching', status.matching).text}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(status.musicTaste === 'error' || status.musicTaste === 'not_started') && (
        <div className={styles.quickActions}>
          <button 
            className={styles.actionButton}
            onClick={async () => {
              await fetch('/api/user/trigger-taste-collection', { method: 'POST' });
              setTimeout(checkStatus, 2000);
            }}
          >
            🚀 Rebuild Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardStatusIndicator;
