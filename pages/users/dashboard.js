import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import Head from 'next/head';
import styles from '../../styles/Dashboard.module.css';
import Link from 'next/link';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (session?.accessToken) {
      // Fetch user profile from Spotify
      fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${session.accessToken}`
        }
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch user profile');
        }
        return response.json();
      })
      .then(data => {
        setUserProfile(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching user profile:', error);
        setLoading(false);
      });
    } else if (status !== "loading") {
      setLoading(false);
    }
  }, [session, status]);
  
  // If the user is not authenticated, show sign in button
  if (!session && !loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>User Dashboard - Sonar EDM Platform</title>
        </Head>
        
        <div className={styles.authPrompt}>
          <h1 className={styles.title}>Access Your EDM Experience</h1>
          <p className={styles.description}>
            Please sign in with your Spotify account to access your personalized dashboard.
          </p>
          <button 
            onClick={() => signIn('spotify')}
            className={styles.signInButton}
          >
            Sign in with Spotify
          </button>
        </div>
      </div>
    );
  }
  
  // Show loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Loading... - Sonar EDM Platform</title>
        </Head>
        
        <div className={styles.loadingContainer}>
          <div className={styles.loader}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }
  
  // Show dashboard when authenticated
  return (
    <div className={styles.container}>
      <Head>
        <title>User Dashboard - Sonar EDM Platform</title>
      </Head>
      
      <header className={styles.header}>
        <div className={styles.logo}>SONAR</div>
        <nav className={styles.nav}>
          <Link href="/"><a className={styles.navLink}>Home</a></Link>
          <Link href="/users/dashboard"><a className={styles.navLink}>Dashboard</a></Link>
          <Link href="/auth/signout"><a className={styles.navLink}>Sign Out</a></Link>
        </nav>
        {userProfile && (
          <div className={styles.profile}>
            {userProfile.images && userProfile.images[0] && (
              <img 
                src={userProfile.images[0].url} 
                alt={userProfile.display_name} 
                className={styles.avatar}
              />
            )}
            <span className={styles.username}>{userProfile.display_name}</span>
          </div>
        )}
      </header>
      
      <main className={styles.main}>
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Welcome, {userProfile?.display_name || 'Music Fan'}!
          </h1>
          <p className={styles.welcomeText}>
            Your personalized EDM experience awaits. Discover events that match your music taste.
          </p>
        </section>
        
        <div className={styles.dashboardGrid}>
          <section className={styles.dashboardCard}>
            <h2 className={styles.cardTitle}>Your Sonic DNA</h2>
            <p className={styles.cardDescription}>
              Take our interactive Vibe Quiz to discover your unique Sonic DNA and get personalized event recommendations.
            </p>
            <div className={styles.cardAction}>
              <button className={styles.actionButton}>Start Vibe Quiz</button>
            </div>
          </section>
          
          <section className={styles.dashboardCard}>
            <h2 className={styles.cardTitle}>Upcoming Events</h2>
            <p className={styles.cardDescription}>
              Explore EDM events that match your music taste with Spotify preview integration.
            </p>
            <div className={styles.cardAction}>
              <button className={styles.actionButton}>Explore Events</button>
            </div>
          </section>
          
          <section className={styles.dashboardCard}>
            <h2 className={styles.cardTitle}>Subgenre Visualization</h2>
            <p className={styles.cardDescription}>
              See your music preferences visualized across EDM subgenres with dynamic soundwave bars.
            </p>
            <div className={styles.cardAction}>
              <button className={styles.actionButton}>View Visualization</button>
            </div>
          </section>
          
          <section className={styles.dashboardCard}>
            <h2 className={styles.cardTitle}>Underground Map</h2>
            <p className={styles.cardDescription}>
              Discover venues and events on our interactive map filtered by your vibe preferences.
            </p>
            <div className={styles.cardAction}>
              <button className={styles.actionButton}>Open Map</button>
            </div>
          </section>
        </div>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Sonar EDM Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
