import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut } from 'next-auth/react';
import styles from '../styles/Navigation.module.css';

export default function Navigation({ activePage }) {
  const router = useRouter();
  
  // Handle sign out
  const handleSignOut = async (e) => {
    e.preventDefault();
    await signOut({ redirect: false });
    router.push('/');
  };
  
  return (
    <nav className={styles.navigation}>
      <div className={styles.navContainer}>
        <div className={styles.logoContainer}>
          <Link href="/users/music-taste">
            <a className={styles.logo}>
              <span className={styles.logoText}>Sonar</span>
              <span className={styles.logoAccent}>EDM</span>
            </a>
          </Link>
        </div>
        
        <div className={styles.navLinks}>
          <Link href="/users/music-taste">
            <a className={`${styles.navLink} ${activePage === 'music-taste' ? styles.active : ''}`}>
              <span className={styles.navIcon}>🎵</span>
              <span className={styles.navText}>Music Taste</span>
            </a>
          </Link>
          
          <Link href="/users/events">
            <a className={`${styles.navLink} ${activePage === 'events' ? styles.active : ''}`}>
              <span className={styles.navIcon}>🎭</span>
              <span className={styles.navText}>Events</span>
            </a>
          </Link>
          
          <a href="#" onClick={handleSignOut} className={styles.navLink}>
            <span className={styles.navIcon}>🚪</span>
            <span className={styles.navText}>Sign Out</span>
          </a>
        </div>
        
        <div className={styles.userMenu}>
          <div className={styles.userAvatar}>
            <span>S</span>
          </div>
        </div>
      </div>
    </nav>
  );
}
