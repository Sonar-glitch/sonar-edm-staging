import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import Navigation from '../components/Navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect authenticated users directly to music-taste page
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/users/music-taste');
    }
  }, [status, router]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Sonar EDM | Unlock Your Sonic DNA</title>
        <meta name="description" content="Discover your music taste, find events that match your vibe, and connect with the EDM community." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h1 className={styles.title}>Unlock Your Sonic DNA</h1>
          <p className={styles.description}>
            Discover your music taste, find events that match your vibe, and connect with the EDM community.
          </p>
          
          {status === 'loading' ? (
            <div className={styles.loadingButton}>
              <div className={styles.loadingSpinner}></div>
              Loading...
            </div>
          ) : status === 'authenticated' ? (
            <Link href="/users/music-taste">
              <a className={styles.button}>View Your Music Taste</a>
            </Link>
          ) : (
            <Link href="/api/auth/signin">
              <a className={styles.button}>Connect with Spotify</a>
            </Link>
          )}
        </div>

        <div className={styles.featuresSection}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎵</div>
            <h2>Music Taste Analysis</h2>
            <p>Get insights into your listening habits and discover your unique sound profile.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎭</div>
            <h2>Event Matching</h2>
            <p>Find events and venues that match your music taste and preferences.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔍</div>
            <h2>Artist Discovery</h2>
            <p>Discover new artists based on your current favorites and listening patterns.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
