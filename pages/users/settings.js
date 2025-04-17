import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Settings.module.css';
import Navigation from '../../components/Navigation';

export default function Settings() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      eventReminders: true,
      newEvents: true
    },
    privacy: {
      shareListeningHistory: true,
      showAttendedEvents: true,
      locationSharing: 'events-only' // 'always', 'events-only', 'never'
    },
    appearance: {
      darkMode: true,
      highContrast: false,
      fontSize: 'medium' // 'small', 'medium', 'large'
    },
    account: {
      email: 'user@example.com',
      displayName: 'Music Lover'
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setError] = useState(null);

  const handleSettingChange = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
    
    // Reset status messages
    setSaveSuccess(false);
    setError(null);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate success
      setSaveSuccess(true);
      setLoading(false);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings. Please try again.');
      setLoading(false);
    }
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
          <p>Loading your settings...</p>
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
          <h1 className={styles.title}>Sign In to Access Settings</h1>
          <p className={styles.subtitle}>Connect with Spotify to manage your settings</p>
          <Link href="/api/auth/signin" className={styles.connectButton}>
            Connect with Spotify
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
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>
            Customize your Sonar experience
          </p>
        </div>
        
        <div className={styles.settingsContainer}>
          <div className={styles.settingsSidebar}>
            <div className={styles.sidebarLinks}>
              <a href="#notifications" className={styles.sidebarLink}>Notifications</a>
              <a href="#privacy" className={styles.sidebarLink}>Privacy</a>
              <a href="#appearance" className={styles.sidebarLink}>Appearance</a>
              <a href="#account" className={styles.sidebarLink}>Account</a>
            </div>
          </div>
          
          <div className={styles.settingsContent}>
            {saveSuccess && (
              <div className={styles.successMessage}>
                Settings saved successfully!
              </div>
            )}
            
            {saveError && (
              <div className={styles.errorMessage}>
                {saveError}
              </div>
            )}
            
            <section id="notifications" className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Notifications</h2>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Email Notifications</h3>
                  <p className={styles.settingDescription}>
                    Receive updates and recommendations via email
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.email}
                      onChange={(e) => handleSettingChange('notifications', 'email', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Push Notifications</h3>
                  <p className={styles.settingDescription}>
                    Receive notifications in your browser
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.push}
                      onChange={(e) => handleSettingChange('notifications', 'push', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Event Reminders</h3>
                  <p className={styles.settingDescription}>
                    Get reminded about upcoming events you're interested in
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.eventReminders}
                      onChange={(e) => handleSettingChange('notifications', 'eventReminders', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>New Event Alerts</h3>
                  <p className={styles.settingDescription}>
                    Get notified when new events match your music taste
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={settings.notifications.newEvents}
                      onChange={(e) => handleSettingChange('notifications', 'newEvents', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
            </section>
            
            <section id="privacy" className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Privacy</h2>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Share Listening History</h3>
                  <p className={styles.settingDescription}>
                    Allow Sonar to analyze your Spotify listening history
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.shareListeningHistory}
                      onChange={(e) => handleSettingChange('privacy', 'shareListeningHistory', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Show Attended Events</h3>
                  <p className={styles.settingDescription}>
                    Display events you've attended on your profile
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={settings.privacy.showAttendedEvents}
                      onChange={(e) => handleSettingChange('privacy', 'showAttendedEvents', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Location Sharing</h3>
                  <p className={styles.settingDescription}>
                    Control when your location is used for event recommendations
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <select 
                    className={styles.select}
                    value={settings.privacy.locationSharing}
                    onChange={(e) => handleSettingChange('privacy', 'locationSharing', e.target.value)}
                  >
                    <option value="always">Always</option>
                    <option value="events-only">Events Only</option>
                    <option value="never">Never</option>
                  </select>
                </div>
              </div>
            </section>
            
            <section id="appearance" className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Appearance</h2>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Dark Mode</h3>
                  <p className={styles.settingDescription}>
                    Use dark theme for the application
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={settings.appearance.darkMode}
                      onChange={(e) => handleSettingChange('appearance', 'darkMode', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>High Contrast</h3>
                  <p className={styles.settingDescription}>
                    Increase contrast for better readability
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <label className={styles.toggle}>
                    <input 
                      type="checkbox" 
                      checked={settings.appearance.highContrast}
                      onChange={(e) => handleSettingChange('appearance', 'highContrast', e.target.checked)}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Font Size</h3>
                  <p className={styles.settingDescription}>
                    Adjust text size throughout the application
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <select 
                    className={styles.select}
                    value={settings.appearance.fontSize}
                    onChange={(e) => handleSettingChange('appearance', 'fontSize', e.target.value)}
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                  </select>
                </div>
              </div>
            </section>
            
            <section id="account" className={styles.settingsSection}>
              <h2 className={styles.sectionTitle}>Account</h2>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Email Address</h3>
                  <p className={styles.settingDescription}>
                    Update your email address
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <input 
                    type="email" 
                    className={styles.input}
                    value={settings.account.email}
                    onChange={(e) => handleSettingChange('account', 'email', e.target.value)}
                  />
                </div>
              </div>
              
              <div className={styles.settingItem}>
                <div className={styles.settingInfo}>
                  <h3 className={styles.settingTitle}>Display Name</h3>
                  <p className={styles.settingDescription}>
                    Change how your name appears
                  </p>
                </div>
                <div className={styles.settingControl}>
                  <input 
                    type="text" 
                    className={styles.input}
                    value={settings.account.displayName}
                    onChange={(e) => handleSettingChange('account', 'displayName', e.target.value)}
                  />
                </div>
              </div>
              
              <div className={styles.accountActions}>
                <button 
                  className={styles.signOutButton}
                  onClick={() => signOut({ callbackUrl: '/' })}
                >
                  Sign Out
                </button>
                
                <button className={styles.deleteAccountButton}>
                  Delete Account
                </button>
              </div>
            </section>
            
            <div className={styles.saveButtonContainer}>
              <button 
                className={styles.saveButton}
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
