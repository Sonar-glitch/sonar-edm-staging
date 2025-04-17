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
  
  return (
    <nav className={styles.navigation}>
      <div className={styles.logoContainer}>
        <Link href="/" className={styles.logo}>
          SONAR
        </Link>
        <span className={styles.tagline}>Connect with your sound</span>
      </div>
      
      <div className={styles.navLinks}>
        {status === 'authenticated' && (
          <>
            <Link href="/users/music-taste" className={`${styles.navLink} ${isActive('/users/music-taste')}`}>
              Music Taste
            </Link>
            <Link href="/users/events" className={`${styles.navLink} ${isActive('/users/events')}`}>
              Events
            </Link>
            <Link href="/users/profile" className={`${styles.navLink} ${isActive('/users/profile')}`}>
              Profile
            </Link>
            <Link href="/users/settings" className={`${styles.navLink} ${isActive('/users/settings')}`}>
              Settings
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
            onClick={() => signOut({ callbackUrl: '/' })}
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
