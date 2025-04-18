import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Settings.module.css';
import Navigation from '../../components/Navigation';
import ThemeToggle from '../../components/ThemeToggle';

export default function Settings() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState({
    events: true,
    artists: true,
    recommendations: true
  });
  const [privacy, setPrivacy] = useState({
    shareListening: true,
    shareAttending: false
  });
  
  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handlePrivacyToggle = (key) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Settings | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Settings | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.unauthorizedContainer}>
          <h1 className={styles.title}>Sign in to access settings</h1>
          <p className={styles.subtitle}>You need to be signed in to view and change your settings.</p>
          <Link href="/api/auth/signin">
            <a className={styles.signInButton}>Sign In</a>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Settings | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <h1 className={styles.title}>Settings</h1>
        
        <div className={styles.settingsGrid}>
          {/* Account Section */}
          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Account</h2>
            
            <div className={styles.accountInfo}>
              {session.user?.image && (
                <div 
                  className={styles.userImage}
                  style={{ backgroundImage: `url(${session.user.image})` }}
                />
              )}
              
              <div className={styles.userDetails}>
                <h3 className={styles.userName}>{session.user?.name || 'User'}</h3>
                <p className={styles.userEmail}>{session.user?.email || 'No email provided'}</p>
              </div>
            </div>
            
            <div className={styles.accountActions}>
              <button 
                className={styles.signOutButton}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </section>
          
          {/* Theme Section */}
          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            <ThemeToggle />
          </section>
          
          {/* Notifications Section */}
          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Notifications</h2>
            
            <div className={styles.toggleGroup}>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Event Alerts</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={notifications.events}
                    onChange={() => handleNotificationToggle('events')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Artist Updates</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={notifications.artists}
                    onChange={() => handleNotificationToggle('artists')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Recommendations</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={notifications.recommendations}
                    onChange={() => handleNotificationToggle('recommendations')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </section>
          
          {/* Privacy Section */}
          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Privacy</h2>
            
            <div className={styles.toggleGroup}>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Share Listening Activity</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={privacy.shareListening}
                    onChange={() => handlePrivacyToggle('shareListening')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Share Events I'm Attending</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={privacy.shareAttending}
                    onChange={() => handlePrivacyToggle('shareAttending')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
