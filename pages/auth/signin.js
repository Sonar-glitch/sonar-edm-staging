import { useState } from 'react';
import { getProviders, signIn } from 'next-auth/react';
import styles from '../../styles/SignIn.module.css';

export default function SignIn({ providers }) {
  const [userType, setUserType] = useState('user'); // Default to music fan
  
  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>Welcome to Sonar EDM</h1>
          <p className={styles.subtitle}>Sign in to access your personalized experience</p>
        </div>
        
        <div className={styles.userTypeSelector}>
          <button 
            className={`${styles.userTypeButton} ${userType === 'user' ? styles.active : ''}`}
            onClick={() => setUserType('user')}
          >
            <span className={styles.userTypeIcon}>🎧</span>
            <span className={styles.userTypeLabel}>Music Fan</span>
          </button>
          
          <button 
            className={`${styles.userTypeButton} ${userType === 'promoter' ? styles.active : ''}`}
            onClick={() => setUserType('promoter')}
          >
            <span className={styles.userTypeIcon}>🎪</span>
            <span className={styles.userTypeLabel}>Promoter</span>
          </button>
        </div>
        
        <div className={styles.providerButtons}>
          {userType === 'user' && providers?.spotify && (
            <button 
              onClick={() => signIn('spotify', { callbackUrl: '/users/dashboard' })}
              className={styles.spotifyButton}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className={styles.providerIcon}>
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.48.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
              Sign in with Spotify
            </button>
          )}
          
          {userType === 'promoter' && providers?.google && (
            <button 
              onClick={() => signIn('google', { callbackUrl: '/promoters/dashboard' })}
              className={styles.googleButton}
            >
              <svg viewBox="0 0 24 24" width="24" height="24" className={styles.providerIcon}>
                <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
              </svg>
              Sign in with Google
            </button>
          )}
        </div>
        
        <div className={styles.infoSection}>
          {userType === 'user' ? (
            <div className={styles.infoContent}>
              <h3>Music Fan Features</h3>
              <ul className={styles.featureList}>
                <li>Analyze your music taste based on Spotify history</li>
                <li>Discover EDM events that match your preferences</li>
                <li>Get personalized artist and track recommendations</li>
                <li>Connect with other fans with similar tastes</li>
              </ul>
            </div>
          ) : (
            <div className={styles.infoContent}>
              <h3>Promoter Features</h3>
              <ul className={styles.featureList}>
                <li>Access detailed analytics about your audience</li>
                <li>Track event performance and revenue metrics</li>
                <li>Target promotions to fans based on music taste</li>
                <li>Optimize event planning with data-driven insights</li>
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.background}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
        <div className={styles.circle3}></div>
      </div>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers }
  };
}
