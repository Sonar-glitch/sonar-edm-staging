import { useState } from 'react';
import Head from 'next/head';
import { useSession } from 'next-auth/react';
import styles from '../../styles/Dashboard.module.css';

export default function PromoterDashboard() {
  const { data: session, status } = useSession();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Implement search functionality
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => setIsLoading(false), 1500);
  };

  if (status === 'loading') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Promoter Dashboard | Sonar EDM Platform</title>
          <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Montserrat:wght@400;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        </Head>
        <div className={styles.authRequired}>
          <h1 className={styles.title}>Promoter Dashboard</h1>
          <p className={styles.description}>Please sign in with your Spotify account to access your dashboard.</p>
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
      <Head>
        <title>Promoter Dashboard | Sonar EDM Platform</title>
        <link href="https://fonts.googleapis.com/css2?family=Audiowide&family=Montserrat:wght@400;700&family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.dashboardHeader}>
        <h1 className={styles.title}>Promoter Dashboard</h1>
        
        <form className={styles.searchForm} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search for artists..."
            value={searchQuery}
            onChange={(e)  => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            Search
          </button>
        </form>
      </div>

      <div className={styles.dashboardGrid}>
        <div className={styles.dashboardCard}>
          <h2>Trending EDM Artists</h2>
          {isLoading ? (
            <p>Loading...</p>
          ) : (
            <p>Select an artist to view analytics and insights</p>
          )}
        </div>
        
        <div className={styles.dashboardCard}>
          <h2>Revenue Forecast</h2>
          <div className={styles.chartPlaceholder}>
            <p>Revenue data visualization will appear here</p>
          </div>
        </div>
        
        <div className={styles.dashboardCard}>
          <h2>Upcoming Events</h2>
          <p>No upcoming events found</p>
        </div>
        
        <div className={styles.dashboardCard}>
          <h2>Genre Trends</h2>
          <div className={styles.chartPlaceholder}>
            <p>Genre trend visualization will appear here</p>
          </div>
        </div>
      </div>
    </div>
  );
}
