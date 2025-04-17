import { useSession, signIn } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // If user is authenticated, redirect to music-taste page
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/users/music-taste');
    }
  }, [status, router]);

  // Function to handle Spotify sign in directly
  const handleSpotifySignIn = () => {
    signIn('spotify', { callbackUrl: '/users/music-taste' });
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Sonar EDM | Connect with your sound</title>
        <meta name="description" content="Discover your music taste, find events that match your vibe, and connect with the EDM community." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.logoContainer}>
            <h1 className={styles.logo}>SONAR</h1>
            <p className={styles.tagline}>Connect with your sound</p>
          </div>
          
          <div className={styles.heroContent}>
            <h2 className={styles.title}>
              Unlock Your Sonic DNA
            </h2>
            
            <p className={styles.description}>
              Discover your music taste, find events that match your vibe, and connect with the EDM community.
            </p>
            
            <button onClick={handleSpotifySignIn} className={styles.spotifyButton}>
              Connect with Spotify
            </button>
          </div>
        </div>
        
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎵</div>
            <h3>Music Taste Analysis</h3>
            <p>Get insights into your listening habits and discover your unique sound profile.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎭</div>
            <h3>Event Matching</h3>
            <p>Find events and venues that match your music taste and preferences.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔍</div>
            <h3>Artist Discovery</h3>
            <p>Discover new artists based on your current favorites and listening patterns.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
