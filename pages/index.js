import { useEffect, useState } from 'react';
import Head from 'next/head';
import { signIn } from 'next-auth/react';
import dynamic from 'next/dynamic';
import styles from '../styles/Home.module.css';

// Dynamically import the Spotify icon to reduce initial bundle size
const FaSpotify = dynamic(() => 
  import('react-icons/fa').then(mod => mod.FaSpotify),
  { ssr: false, loading: () => <span className={styles.iconPlaceholder} /> }
);

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
    
    // Use requestIdleCallback for non-critical operations
    if ('requestIdleCallback' in window) {
      requestIdleCallback(prefetchMusicTaste);
    } else {
      // Fallback for browsers that don't support requestIdleCallback
      setTimeout(prefetchMusicTaste, 2000);
    }
    
    return () => {
      // Clean up if component unmounts
      if ('cancelIdleCallback' in window && window._prefetchCallback) {
        cancelIdleCallback(window._prefetchCallback);
      }
    };
  }, []);

  const handleSpotifyConnect = (e) => {
    e.preventDefault();
    signIn('spotify', { callbackUrl: '/users/music-taste' });
  };

  return (
    <div className={`${styles.container} ${isLoaded ? styles.loaded : ''}`}>
      <Head>
        <title>TIKO by Sonar</title>
        <meta name="description" content="EDM events tailored to your vibe" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        
        {/* Preload critical fonts */}
        <link 
          rel="preload" 
          href="/fonts/Inter-Regular.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        
        {/* Preconnect to domains */}
        <link rel="preconnect" href="https://accounts.spotify.com" />
        
        {/* Cache busting meta tags */}
        <meta httpEquiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta httpEquiv="Pragma" content="no-cache" />
        <meta httpEquiv="Expires" content="0" />
        
        {/* Critical CSS inline */}
        <style dangerouslySetInnerHTML={{ __html: `
          .${styles.container} {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background-color: #0a0014;
            color: #fff;
          }
          .${styles.logo} {
            font-size: 8rem;
            color: #ff00ff;
            text-shadow: 0 0 20px rgba(255, 0, 255, 0.8);
          }
        `}} />
      </Head>

      <main className={styles.main}>
        <div className={styles.logoContainer}>
          <h1 className={styles.logo}>TIKO</h1>
        </div>
        
        <div className={styles.taglineContainer}>
          <h2 className={styles.tagline}>
            Find your next night out.<br />
            Powered by your vibe.
          </h2>
        </div>
        
        <div className={styles.buttonContainer}>
          <button 
            onClick={handleSpotifyConnect} 
            className={styles.spotifyButton}
            aria-label="Connect with Spotify"
          >
            <FaSpotify className={styles.spotifyIcon} />
            Connect with Spotify
          </button>
        </div>
        
        <div className={styles.featuresContainer}>
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.purpleBullet}`} aria-hidden="true"></span>
            Real events, matched to your taste
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.pinkBullet}`} aria-hidden="true"></span>
            Your vibe, not just your genre
          </div>
          
          <div className={styles.featureItem}>
            <span className={`${styles.bullet} ${styles.cyanBullet}`} aria-hidden="true"></span>
            No flyers, no fluff – just your scene
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        by sonar
      </footer>
    </div>
  );
}
