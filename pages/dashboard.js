import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import EnhancedPersonalizedDashboard from '@/components/EnhancedPersonalizedDashboard';
import MyEventsContent from '@/components/MyEventsContent';
import MusicTasteContent from '@/components/MusicTasteContent';
import styles from '@/styles/DashboardPage.module.css'; // New CSS module for page layout

const DashboardPage = () => {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Fetch user-specific data for the header (e.g., vibe summary)
      // This is a placeholder, replace with actual API call
      setUserData({
        vibeSummary: "You're all about house + techno with a vibe shift toward fresh sounds."
      });
    }
  }, [session, status]);

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

  if (status === 'loading') {
    return <div className={styles.loadingPage}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    // Redirect to signin or show appropriate message
    return <div className={styles.unauthenticatedPage}>Please sign in to view your dashboard.</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>TIKO - Your Dashboard</title>
        <meta name="description" content="Your personalized EDM event discovery platform" />
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
      </Head>

      {/* Main Header Section - TIKO Logo and Platform Subtitle */}
      <header className={styles.mainHeader}>
        <h1 className={styles.mainLogo}>TIKO</h1>
        <p className={styles.platformSubtitle}>Your personalized EDM event discovery platform</p>
      </header>

      {/* Tab Navigation */}
      <nav className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === 'dashboard' ? styles.activeTabButton : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'music-taste' ? styles.activeTabButton : ''}`}
          onClick={() => setActiveTab('music-taste')}
        >
          Music Taste
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === 'my-events' ? styles.activeTabButton : ''}`}
          onClick={() => setActiveTab('my-events')}
        >
          My Events
        </button>
      </nav>

      {/* Vibe Summary - Displayed BELOW Tab Navigation */}
      {userData && (
        <div className={styles.vibeSummaryContainer}>
          <p className={styles.vibeSummaryText}>{userData.vibeSummary}</p>
        </div>
      )}

      {/* Tab Content Area */}
      <main className={styles.tabContentArea}>
        {renderTabContent()}
      </main>

      {/* Verification Tool - For technical data source verification */}
      <script dangerouslySetInnerHTML={{ __html: `
        window.verifyTikoData = function() {
          console.log('🔍 TIKO DATA VERIFICATION TOOL');
          console.log('------------------------------');
          
          console.log('Checking Spotify data...');
          fetch('/api/spotify/user-data')
            .then(r => r.json())
            .then(data => {
              console.log('📊 SPOTIFY DATA SOURCE:', data.source);
              console.log('⏰ SPOTIFY DATA TIMESTAMP:', data.timestamp);
              console.log('🎵 TOP ARTISTS:', data.topArtists?.map(a => a.name).join(', '));
              console.log('🎧 TOP GENRES:', data.topGenres?.map(g => g.name).join(', '));
              console.log('📱 RAW DATA:', data);
            })
            .catch(err => console.error('Error fetching Spotify data:', err));
          
          console.log('Checking events data...');
          fetch('/api/events')
            .then(r => r.json())
            .then(data => {
              console.log('🎫 EVENTS SOURCE:', data.source);
              console.log('🎫 EVENTS COUNT:', data.events?.length);
              console.log('🎫 REAL EVENTS COUNT:', data.realCount);
              console.log('🎫 EVENTS SAMPLE:', data.events?.[0]);
            })
            .catch(err => console.error('Error fetching events data:', err));
          
          console.log('Checking user data...');
          fetch('/api/user/taste-profile')
            .then(r => r.json())
            .then(data => {
              console.log('👤 USER TASTE PROFILE SOURCE:', data.source || 'unknown');
              console.log('👤 USER TASTE LAST UPDATED:', data.lastUpdated);
              console.log('👤 USER TASTE DATA:', data);
            })
            .catch(err => console.error('Error fetching user data:', err));
        };
        
        console.log('TIKO: Type verifyTikoData() in console to check data sources');
      `}} />
    </div>
  );
};

export default DashboardPage;
