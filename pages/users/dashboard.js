import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import Navigation from '../../components/Navigation';
import styles from '../../styles/Dashboard.module.css';
import Link from 'next/link';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Protect route - redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
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
  
  // Show loading state
  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <p>Loading your profile...</p>
      </div>
    );
  }
  
  // Show dashboard when authenticated
  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard - Sonar EDM Platform</title>
        <meta name="description" content="Your personalized EDM dashboard" />
      </Head>
      
      {/* Add consistent navigation */}
      <Navigation activePage="dashboard" />
      
      <main className={styles.main}>
        <section className={styles.welcomeSection}>
          <h1 className={styles.welcomeTitle}>
            Welcome, {userProfile?.display_name || session?.user?.name || 'Music Fan'}!
          </h1>
          <p className={styles.welcomeText}>
            Your personalized EDM experience awaits. Discover events that match your music taste.
          </p>
        </section>
        
        <div className={styles.dashboardGrid}>
          <Link href="/users/music-taste">
            <a className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>Your Music Taste</h2>
              <p className={styles.cardDescription}>
                Explore your music preferences and discover new artists based on your Spotify listening history.
              </p>
              <div className={styles.cardAction}>
                <span className={styles.actionButton}>View Music Taste</span>
              </div>
            </a>
          </Link>
          
          <Link href="/users/vibe-quiz">
            <a className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>Vibe Quiz</h2>
              <p className={styles.cardDescription}>
                Take our interactive Vibe Quiz to discover your unique Sonic DNA and get personalized event recommendations.
              </p>
              <div className={styles.cardAction}>
                <span className={styles.actionButton}>Start Vibe Quiz</span>
              </div>
            </a>
          </Link>
          
          <Link href="/users/events">
            <a className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>Discover Events</h2>
              <p className={styles.cardDescription}>
                Find events that match your music taste with location-based recommendations and Spotify preview integration.
              </p>
              <div className={styles.cardAction}>
                <span className={styles.actionButton}>Explore Events</span>
              </div>
            </a>
          </Link>
          
          <Link href="/users/venues">
            <a className={styles.dashboardCard}>
              <h2 className={styles.cardTitle}>Discover Venues</h2>
              <p className={styles.cardDescription}>
                Find venues that match your music preferences on our interactive map filtered by your taste profile.
              </p>
              <div className={styles.cardAction}>
                <span className={styles.actionButton}>Explore Venues</span>
              </div>
            </a>
          </Link>
        </div>
      </main>
      
      <footer className={styles.footer}>
        <p>&copy; {new Date().getFullYear()} Sonar EDM Platform. All rights reserved.</p>
      </footer>
    </div>
  );
}
