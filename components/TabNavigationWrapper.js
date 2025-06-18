import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedPersonalizedDashboard from './EnhancedPersonalizedDashboard';
import MyEventsContent from './MyEventsContent';
import MusicTasteContent from './MusicTasteContent';
import styles from '@/styles/TabNavigationWrapper.module.css';

const TabNavigationWrapper = () => {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <EnhancedPersonalizedDashboard />;
      case 'music-taste':
        return <MusicTasteContent />;
      case 'my-events':
        return <MyEventsContent />;
      default:
        return <EnhancedPersonalizedDashboard />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Enhanced Header with Tab Navigation */}
      <div className={styles.header}>
        <div className={styles.logoSection}>
          <h1 className={styles.title}>
            <span className={styles.logo}>TIKO</span>
          </h1>
          <p className={styles.subtitle}>
            Your <span className={styles.highlight}>personalized</span> EDM event discovery platform
          </p>
        </div>
        
        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          <button 
            className={`${styles.tab} ${activeTab === 'dashboard' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'music-taste' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('music-taste')}
          >
            Music Taste
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 'my-events' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('my-events')}
          >
            My Events
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>
    </div>
  );
};

export default TabNavigationWrapper;
