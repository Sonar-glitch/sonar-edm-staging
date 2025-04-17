import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Settings.module.css';
import Navigation from '../../components/Navigation';

export default function Settings() {
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState('appearance');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    events: true,
    artists: true,
    recommendations: true
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    shareListening: true,
    allowRecommendations: true
  });
  const [appearance, setAppearance] = useState({
    theme: 'neon',
    darkMode: true,
    animations: true
  });
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
  const handleThemeChange = (theme) => {
    setAppearance({...appearance, theme});
  };
  
  const handleToggleChange = (section, setting) => {
    if (section === 'notifications') {
      setNotifications({...notifications, [setting]: !notifications[setting]});
    } else if (section === 'privacy') {
      setPrivacy({...privacy, [setting]: !privacy[setting]});
    } else if (section === 'appearance') {
      setAppearance({...appearance, [setting]: !appearance[setting]});
    }
  };
  
  const saveSettings = () => {
    // In a real app, this would save to the backend
    alert('Settings saved successfully!');
  };
  
  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Settings | Sonar</title>
        </Head>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <p>Loading settings...</p>
          </div>
        </main>
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
        <main className={styles.main}>
          <div className={styles.unauthorizedContainer}>
            <h1 className={styles.title}>Sign in required</h1>
            <p className={styles.subtitle}>Please sign in to access your settings</p>
            <Link href="/api/auth/signin">
              <a className={styles.signInButton}>Sign In</a>
            </Link>
          </div>
        </main>
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
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Customize your Sonar experience</p>
        </div>
        
        <div className={styles.settingsGrid}>
          {/* Settings Navigation */}
          <div className={styles.settingsNav}>
            <h2 className={styles.navTitle}>Settings</h2>
            <ul className={styles.navList}>
              <li className={styles.navItem}>
                <a 
                  className={`${styles.navLink} ${activeSection === 'appearance' ? styles.navLinkActive : ''}`}
                  onClick={() => setActiveSection('appearance')}
                >
                  Appearance
                </a>
              </li>
              <li className={styles.navItem}>
                <a 
                  className={`${styles.navLink} ${activeSection === 'notifications' ? styles.navLinkActive : ''}`}
                  onClick={() => setActiveSection('notifications')}
                >
                  Notifications
                </a>
              </li>
              <li className={styles.navItem}>
                <a 
                  className={`${styles.navLink} ${activeSection === 'privacy' ? styles.navLinkActive : ''}`}
                  onClick={() => setActiveSection('privacy')}
                >
                  Privacy
                </a>
              </li>
              <li className={styles.navItem}>
                <a 
                  className={`${styles.navLink} ${activeSection === 'account' ? styles.navLinkActive : ''}`}
                  onClick={() => setActiveSection('account')}
                >
                  Account
                </a>
              </li>
            </ul>
          </div>
          
          {/* Settings Content */}
          <div className={styles.settingsContent}>
            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div>
                <h2 className={styles.sectionTitle}>Appearance</h2>
                
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Theme</h3>
                      <p className={styles.settingDescription}>Choose your preferred visual theme</p>
                      
                      <div className={styles.themeSelector}>
                        <div 
                          className={`${styles.themeOption} ${styles.neonTheme} ${appearance.theme === 'neon' ? styles.active : ''}`}
                          onClick={() => handleThemeChange('neon')}
                        ></div>
                        <div 
                          className={`${styles.themeOption} ${styles.minimalTheme} ${appearance.theme === 'minimal' ? styles.active : ''}`}
                          onClick={() => handleThemeChange('minimal')}
                        ></div>
                        <div 
                          className={`${styles.themeOption} ${styles.cyberpunkTheme} ${appearance.theme === 'cyberpunk' ? styles.active : ''}`}
                          onClick={() => handleThemeChange('cyberpunk')}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Dark Mode</h3>
                      <p className={styles.settingDescription}>Use dark theme throughout the app</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={appearance.darkMode}
                        onChange={() => handleToggleChange('appearance', 'darkMode')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Animations</h3>
                      <p className={styles.settingDescription}>Enable animations and transitions</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={appearance.animations}
                        onChange={() => handleToggleChange('appearance', 'animations')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div>
                <h2 className={styles.sectionTitle}>Notifications</h2>
                
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Email Notifications</h3>
                      <p className={styles.settingDescription}>Receive updates via email</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.email}
                        onChange={() => handleToggleChange('notifications', 'email')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Push Notifications</h3>
                      <p className={styles.settingDescription}>Receive push notifications on your device</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.push}
                        onChange={() => handleToggleChange('notifications', 'push')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Event Notifications</h3>
                      <p className={styles.settingDescription}>Get notified about events matching your taste</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.events}
                        onChange={() => handleToggleChange('notifications', 'events')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Artist Updates</h3>
                      <p className={styles.settingDescription}>Get notified about your favorite artists</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.artists}
                        onChange={() => handleToggleChange('notifications', 'artists')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Recommendations</h3>
                      <p className={styles.settingDescription}>Get notified about personalized recommendations</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.recommendations}
                        onChange={() => handleToggleChange('notifications', 'recommendations')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Privacy Settings */}
            {activeSection === 'privacy' && (
              <div>
                <h2 className={styles.sectionTitle}>Privacy</h2>
                
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Public Profile</h3>
                      <p className={styles.settingDescription}>Allow others to view your profile</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={privacy.publicProfile}
                        onChange={() => handleToggleChange('privacy', 'publicProfile')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Share Listening Activity</h3>
                      <p className={styles.settingDescription}>Share your listening activity with others</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={privacy.shareListening}
                        onChange={() => handleToggleChange('privacy', 'shareListening')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Allow Recommendations</h3>
                      <p className={styles.settingDescription}>Allow us to use your data for recommendations</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={privacy.allowRecommendations}
                        onChange={() => handleToggleChange('privacy', 'allowRecommendations')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Settings */}
            {activeSection === 'account' && (
              <div>
                <h2 className={styles.sectionTitle}>Account</h2>
                
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Connected Accounts</h3>
                      <p className={styles.settingDescription}>Manage your connected accounts</p>
                    </div>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Spotify</h3>
                      <p className={styles.settingDescription}>
                        {session?.user?.name || session?.user?.email || 'Connected'}
                      </p>
                    </div>
                    <button className={styles.reconnectButton}>Reconnect</button>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Data & Privacy</h3>
                      <p className={styles.settingDescription}>Manage your data and privacy settings</p>
                    </div>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Download Your Data</h3>
                      <p className={styles.settingDescription}>Download a copy of your data</p>
                    </div>
                    <button className={styles.downloadButton}>Download</button>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Delete Account</h3>
                      <p className={styles.settingDescription}>Permanently delete your account and data</p>
                    </div>
                    <button className={styles.deleteButton}>Delete</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Save Button */}
            <button className={styles.saveButton} onClick={saveSettings}>
              Save Changes
            </button>
            
            {/* Sign Out Button */}
            <button className={styles.signOutButton} onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
