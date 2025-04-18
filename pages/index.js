import { useEffect, useState } from 'react';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Mark as loaded after component mounts
    setIsLoaded(true);
    
    // Preload the music-taste page
    const prefetchMusicTaste = () => {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = '/users/music-taste';
      document.head.appendChild(link);
    };
    
    // Delay prefetch to prioritize current page rendering
    const timer = setTimeout(prefetchMusicTaste, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSpotifyConnect = (e) => {
    e.preventDefault();
    signIn('spotify', { callbackUrl: '/users/music-taste' });
  };

  return (
    <div className={`${styles.container} ${isLoaded ? styles.loaded : ''}`}>
      <Head>
        <title>TIKO | Find your next night out</title>
        <meta name="description" content="Find your next night out. Powered by your vibe." />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Inter:wght@400;500;600;700&family=Roboto:wght@400;500&display=swap" rel="stylesheet" />
        
        {/* Open Graph tags for social sharing */}
        <meta property="og:title" content="TIKO | Find your next night out" />
        <meta property="og:description" content="Find your next night out. Powered by your vibe." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://sonar-edm-user-50e4fb038f6e.herokuapp.com/" />
      </Head>

      <main className={styles.main}>
        <div className={styles.logoContainer}>
          <h1 className={styles.logo}>TIKO</h1>
        </div>
        
        <div className={styles.taglineContainer}>
          <p className={styles.tagline}>
            Find your next night out.<br />
            Powered by your vibe.
          </p>
        </div>
        
        <button 
          onClick={handleSpotifyConnect} 
          className={styles.spotifyButton}
          aria-label="Connect with Spotify"
        >
          <span className={styles.spotifyIcon}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" fill="currentColor"/>
            </svg>
          </span>
          Connect with Spotify
        </button>
        
        <div className={styles.featuresContainer}>
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.purpleBullet}`} aria-hidden="true"></span>
            <p>Real events, matched to your taste</p>
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.pinkBullet}`} aria-hidden="true"></span>
            <p>Your vibe, not just your genre</p>
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.blueBullet}`} aria-hidden="true"></span>
            <p>No flyers, no fluff – just your scene</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>by sonar</p>
      </footer>
    </div>
  );
}
