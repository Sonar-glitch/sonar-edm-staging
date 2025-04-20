import React from 'react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '@/styles/Landing.module.css';

export default function LandingPage() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Redirect to dashboard if already authenticated
  React.useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSpotifyLogin = (e) => {
    e.preventDefault();
    signIn('spotify', { callbackUrl: '/dashboard' });
  };

  return (
    <>
      <Head>
        <title>TIKO | Find your next night out</title>
        <meta name="description" content="Discover EDM events matched to your taste" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <div className={styles.container}>
        <main className={styles.main}>
          <div className={styles.logo}>TIKO</div>
          
          <div className={styles.tagline}>
            <p>Find your next night out.</p>
            <p>Powered by your vibe.</p>
          </div>
          
          <button 
            className={styles.spotifyButton}
            onClick={handleSpotifyLogin}
          >
            <div className={styles.spotifyIcon}>
              <svg viewBox="0 0 24 24" width="24" height="24">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="currentColor"/>
              </svg>
            </div>
            Connect with Spotify
          </button>
          
          <div className={styles.features}>
            <div className={styles.featureItem}>
              <span className={styles.bulletPurple}></span>
              <p>Real events, matched to your taste</p>
            </div>
            
            <div className={styles.featureItem}>
              <span className={styles.bulletPink}></span>
              <p>Your vibe, not just your genre</p>
            </div>
            
            <div className={styles.featureItem}>
              <span className={styles.bulletCyan}></span>
              <p>No flyers, no fluff – just your scene</p>
            </div>
          </div>
          
          <div className={styles.footer}>
            <p>by sonar</p>
          </div>
        </main>
      </div>
    </>
  );
}