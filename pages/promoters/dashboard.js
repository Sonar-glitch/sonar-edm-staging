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
            onClick={()  => signIn('spotify', { callbackUrl: '/promoters/dashboard' })}
            className={styles.spotifyButton}
          >
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
