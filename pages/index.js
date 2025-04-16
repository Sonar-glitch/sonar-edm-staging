import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect to music taste page if already logged in
  useEffect(() => {
    if (session) {
      router.push('/users/music-taste');
    }
  }, [session, router]);

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h1 className={styles.title}>
            Unlock Your <span className={styles.highlight}>Sonic DNA</span>
          </h1>
          
          <p className={styles.description}>
            Connect your Spotify and discover events that perfectly match your
            unique music taste. No more wasted nights at venues that don't
            match your vibe.
          </p>
          
          <Link href="/api/auth/signin">
            <a className={styles.connectButton}>
              Connect with Spotify
            </a>
          </Link>
        </div>
        
        <section className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          
          <div className={styles.stepsContainer}>
            <div className={styles.stepCard}>
              <h3>Connect</h3>
              <p>Link your Spotify account to analyze your music preferences</p>
            </div>
            
            <div className={styles.stepCard}>
              <h3>Discover</h3>
              <p>Find events and venues that match your unique taste profile</p>
            </div>
            
            <div className={styles.stepCard}>
              <h3>Experience</h3>
              <p>Enjoy events knowing they're perfectly aligned with your preferences</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
