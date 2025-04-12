import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import styles from '../styles/Home.module.css';

export default function Home() {
  const { data: session, status } = useSession();
  const [isPromoter, setIsPromoter] = useState(false);
  
  // Determine if user is a promoter based on sign-in provider
  useEffect(() => {
    if (session) {
      setIsPromoter(session.provider === 'google');
    }
  }, [session]);

  return (
    <div className={styles.container}>
      <div className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Discover Your <span className={styles.highlight}>EDM</span> Experience
          </h1>
          <p className={styles.subtitle}>
            Connect your music taste with the perfect events and discover new artists
          </p>
          
          <div className={styles.ctaButtons}>
            {!session ? (
              <Link href="/auth/signin">
                <a className={styles.primaryButton}>Get Started</a>
              </Link>
            ) : isPromoter ? (
              <Link href="/promoters/dashboard">
                <a className={styles.primaryButton}>Promoter Dashboard</a>
              </Link>
            ) : (
              <Link href="/users/dashboard">
                <a className={styles.primaryButton}>Music Dashboard</a>
              </Link>
            )}
            
            <Link href="#features">
              <a className={styles.secondaryButton}>Learn More</a>
            </Link>
          </div>
        </div>
        
        <div className={styles.heroVisual}>
          <div className={styles.visualElement}></div>
        </div>
      </div>
      
      <div id="features" className={styles.featuresSection}>
        <h2 className={styles.sectionTitle}>Platform Features</h2>
        
        <div className={styles.featureCards}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎧</div>
            <h3>Music Taste Analysis</h3>
            <p>Connect your Spotify account to analyze your music preferences and get personalized event recommendations.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎪</div>
            <h3>Event Discovery</h3>
            <p>Find EDM events that match your music taste, featuring your favorite artists and genres.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📊</div>
            <h3>Promoter Analytics</h3>
            <p>Event promoters can access detailed analytics about audience preferences and event performance.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔍</div>
            <h3>Artist Recommendations</h3>
            <p>Discover new artists based on your listening history and preferences.</p>
          </div>
        </div>
      </div>
      
      <div className={styles.audienceSection}>
        <div className={styles.audienceContent}>
          <h2 className={styles.sectionTitle}>For Music Fans</h2>
          <p className={styles.sectionDescription}>
            Connect your Spotify account to analyze your music taste and discover events that match your preferences.
          </p>
          <ul className={styles.featureList}>
            <li>Personalized event recommendations</li>
            <li>Discover new artists and tracks</li>
            <li>Connect with fans with similar tastes</li>
            <li>Track your favorite events</li>
          </ul>
          
          {!session && (
            <Link href="/auth/signin">
              <a className={`${styles.primaryButton} ${styles.audienceButton}`}>Sign in as Music Fan</a>
            </Link>
          )}
        </div>
        
        <div className={styles.audienceVisual}>
          <div className={styles.visualElement}></div>
        </div>
      </div>
      
      <div className={styles.promoterSection}>
        <div className={styles.promoterVisual}>
          <div className={styles.visualElement}></div>
        </div>
        
        <div className={styles.promoterContent}>
          <h2 className={styles.sectionTitle}>For Promoters</h2>
          <p className={styles.sectionDescription}>
            Access powerful analytics and insights to understand your audience and optimize your events.
          </p>
          <ul className={styles.featureList}>
            <li>Audience demographics and preferences</li>
            <li>Event performance metrics</li>
            <li>Revenue analytics</li>
            <li>Targeted promotion opportunities</li>
          </ul>
          
          {!session && (
            <Link href="/auth/signin">
              <a className={`${styles.primaryButton} ${styles.promoterButton}`}>Sign in as Promoter</a>
            </Link>
          )}
        </div>
      </div>
      
      <div className={styles.ctaSection}>
        <h2 className={styles.ctaTitle}>Ready to transform your EDM experience?</h2>
        <p className={styles.ctaDescription}>
          Join Sonar EDM Platform today and connect with the perfect events for your music taste.
        </p>
        
        {!session ? (
          <Link href="/auth/signin">
            <a className={styles.primaryButton}>Get Started Now</a>
          </Link>
        ) : isPromoter ? (
          <Link href="/promoters/dashboard">
            <a className={styles.primaryButton}>Go to Dashboard</a>
          </Link>
        ) : (
          <Link href="/users/dashboard">
            <a className={styles.primaryButton}>Go to Dashboard</a>
          </Link>
        )}
      </div>
    </div>
  );
}
