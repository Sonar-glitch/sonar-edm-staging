import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Layout from '../../components/Layout';
import styles from '../../styles/Settings.module.css';
import Navigation from '../../components/Navigation';

export default function Settings() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState({
    email: true,
    app: true,
    events: true,
    artists: true
  });
  const [privacy, setPrivacy] = useState({
    shareProfile: false,
    shareTaste: true,
    allowRecommendations: true
  });
  const [saved, setSaved] = useState(false);

  const handleNotificationChange = (e) => {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked
    });
    setSaved(false);
  };

  const handlePrivacyChange = (e) => {
    setPrivacy({
      ...privacy,
      [e.target.name]: e.target.checked
    });
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Here you would typically save the settings to your backend
    console.log('Saving settings:', { notifications, privacy });
    
    // Simulate saving
    setTimeout(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your settings...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.title}>Please sign in to view your settings</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Navigation />
      <div className={styles.container}>
        <h1 className={styles.title}>Settings</h1>
        
        <form onSubmit={handleSave}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Notifications</h2>
            <div className={styles.settingGroup}>
              <div className={styles.settingItem}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="email"
                    checked={notifications.email}
                    onChange={handleNotificationChange}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.settingLabel}>Email Notifications</span>
              </div>
              
              <div className={styles.settingItem}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="app"
                    checked={notifications.app}
                    onChange={handleNotificationChange}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.settingLabel}>App Notifications</span>
              </div>
              
              <div className={styles.settingItem}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="events"
                    checked={notifications.events}
                    onChange={handleNotificationChange}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.settingLabel}>Event Alerts</span>
              </div>
              
              <div className={styles.settingItem}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="artists"
                    checked={notifications.artists}
                    onChange={handleNotificationChange}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.settingLabel}>Artist Updates</span>
              </div>
            </div>
          </div>
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Privacy</h2>
            <div className={styles.settingGroup}>
              <div className={styles.settingItem}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="shareProfile"
                    checked={privacy.shareProfile}
                    onChange={handlePrivacyChange}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.settingLabel}>Share My Profile</span>
              </div>
              
              <div className={styles.settingItem}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="shareTaste"
                    checked={privacy.shareTaste}
                    onChange={handlePrivacyChange}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.settingLabel}>Share My Music Taste</span>
              </div>
              
              <div className={styles.settingItem}>
                <label className={styles.switch}>
                  <input
                    type="checkbox"
                    name="allowRecommendations"
                    checked={privacy.allowRecommendations}
                    onChange={handlePrivacyChange}
                  />
                  <span className={styles.slider}></span>
                </label>
                <span className={styles.settingLabel}>Allow Personalized Recommendations</span>
              </div>
            </div>
          </div>
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Account</h2>
            <div className={styles.accountInfo}>
              <div className={styles.infoItem}>
                <span className={styles.label}>Connected Account:</span>
                <span className={styles.value}>Spotify</span>
              </div>
              <div className={styles.infoItem}>
                <span className={styles.label}>Email:</span>
                <span className={styles.value}>{session?.user?.email || 'Not available'}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.buttonContainer}>
            <button type="submit" className={styles.saveButton}>
              Save Settings
            </button>
            {saved && <span className={styles.savedMessage}>Settings saved!</span>}
          </div>
        </form>
      </div>
    </Layout>
  );
}
