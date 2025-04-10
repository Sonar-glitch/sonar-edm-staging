import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from '../styles/UserDashboard.module.css';
import MusicTasteAnalyzer from '../components/music/MusicTasteAnalyzer';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  
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
            {session.user.name || session.user.email || 'Music Fan'}
          </span>
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className={styles.signOutButton}
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className={styles.content}>
        <section className={styles.welcomeSection}>
          <h2>Welcome, {session.user.name?.split(' ')[0] || 'Music Fan'}!</h2>
          <p>Discover new EDM artists, analyze your music taste, and find events that match your preferences.</p>
        </section>
        
        <section className={styles.musicTasteSection}>
          <h2>Your Music Taste Analysis</h2>
          <MusicTasteAnalyzer />
        </section>
        
        <section className={styles.recommendedSection}>
          <h2>Recommended Events</h2>
          <div className={styles.eventGrid}>
            <div className={styles.eventCard}>
              <div className={styles.eventImage}></div>
              <div className={styles.eventInfo}>
                <h3>Summer Bass Festival</h3>
                <p>July 15, 2025 • Miami Beach</p>
                <span className={styles.matchBadge}>98% Match</span>
              </div>
            </div>
            
            <div className={styles.eventCard}>
              <div className={styles.eventImage}></div>
              <div className={styles.eventInfo}>
                <h3>Neon Nights Club Event</h3>
                <p>August 22, 2025 • New York City</p>
                <span className={styles.matchBadge}>85% Match</span>
              </div>
            </div>
            
            <div className={styles.eventCard}>
              <div className={styles.eventImage}></div>
              <div className={styles.eventInfo}>
                <h3>Techno Underground</h3>
                <p>September 5, 2025 • Berlin</p>
                <span className={styles.matchBadge}>78% Match</span>
              </div>
            </div>
          </div>
          
          <div className={styles.viewMoreContainer}>
            <Link href="/users/events">
              <a className={styles.viewMoreButton}>View All Events</a>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
