import React from 'react';
import styles from '../styles/Navigation.module.css';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const Navigation = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isActive = (path) => {
    return router.pathname === path ? styles.active : '';
  };
  
  // Fixed sign-out functionality
  const handleSignOut = async () => {
    try {
      // Use callbackUrl to ensure proper redirection after sign-out
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback manual redirect if signOut fails
      window.location.href = '/';
    }
  };
  
  return (
    <nav className={styles.navigation}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <a className={styles.logo}>SONAR</a>
        </Link>
        <span className={styles.tagline}>Connect with your sound</span>
      </div>
      
      <div className={styles.navLinks}>
        {status === 'authenticated' && (
          <>
            <Link href="/users/music-taste">
              <a className={`${styles.navLink} ${isActive('/users/music-taste')}`}>
                Music Taste
              </a>
            </Link>
            <Link href="/users/events">
              <a className={`${styles.navLink} ${isActive('/users/events')}`}>
                Events
              </a>
            </Link>
            <Link href="/users/profile">
              <a className={`${styles.navLink} ${isActive('/users/profile')}`}>
                Profile
              </a>
            </Link>
            <Link href="/users/settings">
              <a className={`${styles.navLink} ${isActive('/users/settings')}`}>
                Settings
              </a>
            </Link>
          </>
        )}
      </div>
      
      <div className={styles.authContainer}>
        {status === 'loading' ? (
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : status === 'authenticated' ? (
          <button 
            onClick={handleSignOut}
            className={styles.authButton}
          >
            Sign Out
          </button>
        ) : (
          <button 
            onClick={() => signIn('spotify')}
            className={styles.authButton}
          >
            Connect
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
