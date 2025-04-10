import { useState, useEffect } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import Link from 'next/link';
import styles from '../styles/Header.module.css';

export default function Header({ type = 'user' }) {
  const { data: session, status } = useSession();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMenuOpen && !event.target.closest(`.${styles.navContainer}`)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <a className={styles.logo}>
            <span className={styles.logoIcon}>🎵</span>
            <span className={styles.logoText}>Sonar EDM</span>
          </a>
        </Link>
      </div>
      
      <button 
        className={styles.menuToggle}
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className={styles.menuIcon}></span>
      </button>
      
      <nav className={`${styles.navContainer} ${isMenuOpen ? styles.menuOpen : ''}`}>
        <ul className={styles.navList}>
          {type === 'user' && (
            <>
              <li className={styles.navItem}>
                <Link href="/users/dashboard">
                  <a className={styles.navLink}>Dashboard</a>
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/users/discover">
                  <a className={styles.navLink}>Discover</a>
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/users/events">
                  <a className={styles.navLink}>Events</a>
                </Link>
              </li>
            </>
          )}
          
          {type === 'promoter' && (
            <>
              <li className={styles.navItem}>
                <Link href="/promoters/dashboard">
                  <a className={styles.navLink}>Dashboard</a>
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/promoters/analytics">
                  <a className={styles.navLink}>Analytics</a>
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/promoters/events">
                  <a className={styles.navLink}>Events</a>
                </Link>
              </li>
            </>
          )}
        </ul>
        
        <div className={styles.authContainer}>
          {status === 'loading' ? (
            <div className={styles.loadingDot}></div>
          ) : session ? (
            <div className={styles.userMenu}>
              {session.user.image && (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'} 
                  className={styles.userAvatar}
                />
              )}
              <span className={styles.userName}>
                {session.user.name || session.user.email || 'User'}
              </span>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className={styles.signOutButton}
                aria-label="Sign out"
              >
                <span className={styles.signOutIcon}>⏻</span>
                <span className={styles.signOutText}>Sign Out</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn(type === 'promoter' ? 'google' : 'spotify')}
              className={`${styles.signInButton} ${type === 'promoter' ? styles.googleButton : styles.spotifyButton}`}
            >
              <span className={styles.signInIcon}>
                {type === 'promoter' ? 'G' : '♫'}
              </span>
              <span className={styles.signInText}>
                Sign In with {type === 'promoter' ? 'Google' : 'Spotify'}
              </span>
            </button>
          )}
        </div>
      </nav>
    </header>
  );
}
