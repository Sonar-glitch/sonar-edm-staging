import { useState } from 'react';
import { useSession, signIn } from 'next-auth/react';
import styles from '../../styles/Dashboard.module.css';

export default function PromoterDashboard() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('analytics');

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
          <h1>Promoter Dashboard</h1>
          <p>Please sign in with your Spotify account to access your dashboard.</p>
          <button 
            onClick={() => signIn('spotify', { callbackUrl: '/promoters/dashboard' })}
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
        <h1>Promoter Dashboard</h1>
        <div className={styles.userInfo}>
          {session.user.image && (
            <img 
              src={session.user.image} 
              alt={session.user.name || 'User'} 
              className={styles.userAvatar}
            />
          )}
          <span className={styles.userName}>
            {session.user.name || session.user.email || 'Promoter'}
          </span>
        </div>
      </header>

      <nav className={styles.tabNav}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'analytics' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          Analytics
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'events' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Events
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'audience' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('audience')}
        >
          Audience Insights
        </button>
      </nav>

      <main className={styles.content}>
        {activeTab === 'analytics' && (
          <div className={styles.analyticsContainer}>
            <h2>EDM Trend Analytics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>Top Genre</h3>
                <p className={styles.statValue}>House</p>
                <p className={styles.statTrend}>+12% from last month</p>
              </div>
              <div className={styles.statCard}>
                <h3>Rising Artist</h3>
                <p className={styles.statValue}>DJ Neon</p>
                <p className={styles.statTrend}>+45% listener growth</p>
              </div>
              <div className={styles.statCard}>
                <h3>Ticket Demand</h3>
                <p className={styles.statValue}>High</p>
                <p className={styles.statTrend}>+8% from last quarter</p>
              </div>
              <div className={styles.statCard}>
                <h3>Optimal Price</h3>
                <p className={styles.statValue}>$85</p>
                <p className={styles.statTrend}>Based on current demand</p>
              </div>
            </div>
            
            <div className={styles.chartContainer}>
              <h3>Genre Popularity Trends</h3>
              <div className={styles.chartPlaceholder}>
                <p>Interactive chart will appear here</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'events' && (
          <div className={styles.eventsContainer}>
            <h2>Event Management</h2>
            <p>Create and manage your EDM events here.</p>
            
            <div className={styles.eventsList}>
              <div className={styles.eventCard}>
                <h3>Summer Bass Festival</h3>
                <p>July 15, 2025 • Miami Beach</p>
                <div className={styles.eventStats}>
                  <span>1,200 tickets sold</span>
                  <span>85% capacity</span>
                </div>
                <button className={styles.actionButton}>Manage Event</button>
              </div>
              
              <div className={styles.eventCard}>
                <h3>Neon Nights Club Event</h3>
                <p>August 22, 2025 • New York City</p>
                <div className={styles.eventStats}>
                  <span>450 tickets sold</span>
                  <span>60% capacity</span>
                </div>
                <button className={styles.actionButton}>Manage Event</button>
              </div>
              
              <div className={styles.addEventCard}>
                <button className={styles.addButton}>+ Create New Event</button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'audience' && (
          <div className={styles.audienceContainer}>
            <h2>Audience Insights</h2>
            <p>Understand your audience demographics and preferences.</p>
            
            <div className={styles.insightCards}>
              <div className={styles.insightCard}>
                <h3>Age Distribution</h3>
                <div className={styles.insightContent}>
                  <div className={styles.chartPlaceholder}>
                    <p>Age distribution chart</p>
                  </div>
                  <div className={styles.insightSummary}>
                    <p>Primary audience: 21-28 years</p>
                    <p>Growing segment: 30-35 years</p>
                  </div>
                </div>
              </div>
              
              <div className={styles.insightCard}>
                <h3>Music Preferences</h3>
                <div className={styles.insightContent}>
                  <div className={styles.chartPlaceholder}>
                    <p>Genre preference chart</p>
                  </div>
                  <div className={styles.insightSummary}>
                    <p>Top genres: House, Techno, Trance</p>
                    <p>Emerging trend: Melodic Techno</p>
                  </div>
                </div>
              </div>
              
              <div className={styles.insightCard}>
                <h3>Geographic Distribution</h3>
                <div className={styles.insightContent}>
                  <div className={styles.chartPlaceholder}>
                    <p>Location map</p>
                  </div>
                  <div className={styles.insightSummary}>
                    <p>Hotspots: Miami, NYC, LA, Chicago</p>
                    <p>Growing market: Austin, Denver</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
