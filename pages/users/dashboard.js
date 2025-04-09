import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import MusicTasteAnalyzer from '../../components/music/MusicTasteAnalyzer';
import styles from '../../styles/Dashboard.module.css';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('musicTaste');

  // Server-side check for authentication
  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  // If not authenticated, show sign-in prompt
  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.authPrompt}>
          <h1>Music Fan Dashboard</h1>
          <p>Please sign in with your Spotify account to access your personalized dashboard.</p>
          <button 
            onClick={() => signIn('spotify', { callbackUrl: '/users/dashboard' })}
            className={styles.spotifyButton}
          >
            <svg viewBox="0 0 24 24" width="24" height="24" className={styles.spotifyIcon}>
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Sign in with Spotify
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Music Fan Dashboard</h1>
        <div className={styles.userInfo}>
          {session.user.image && (
            <img 
              src={session.user.image} 
              alt={session.user.name || 'User'} 
              className={styles.userAvatar}
            />
          )}
          <span className={styles.userName}>
            {session.user.name || session.user.email || 'EDM Fan'}
          </span>
        </div>
      </header>

      <nav className={styles.tabNav}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'musicTaste' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('musicTaste')}
        >
          Music Taste Analysis
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'events' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Upcoming Events
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'artists' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('artists')}
        >
          Favorite Artists
        </button>
      </nav>

      <main className={styles.content}>
        {activeTab === 'musicTaste' && (
          <MusicTasteAnalyzer />
        )}
        
        {activeTab === 'events' && (
          <div className={styles.comingSoon}>
            <h2>Upcoming Events</h2>
            <p>This feature is coming soon! We're working on bringing you personalized event recommendations based on your music taste.</p>
          </div>
        )}
        
        {activeTab === 'artists' && (
          <div className={styles.comingSoon}>
            <h2>Favorite Artists</h2>
            <p>This feature is coming soon! You'll be able to track your favorite EDM artists and get notified about their new releases and events.</p>
          </div>
        )}
      </main>
    </div>
  );
}
