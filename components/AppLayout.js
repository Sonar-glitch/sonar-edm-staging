import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import UserProfileButton from './UserProfileButton';
import styles from '../styles/DashboardPage.module.css';

// Unified AppLayout: provides top header + tabs across dashboard, music taste, favourites
const AppLayout = ({ children }) => {
  const router = useRouter();
  const { pathname } = router;

  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>TIKO - Your Music Universe</title>
        <meta name="description" content="Your personalized EDM event discovery platform" />
  {/* Google Maps script removed here to prevent duplicate loads. Now loaded once in _document.js */}
      </Head>

      <header className={styles.mainHeader}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <h1 className={styles.mainLogo}>TIKO</h1>
            <p className={styles.platformSubtitle}>Your personalized EDM event discovery platform</p>
          </div>
          <div className={styles.profileSection}>
            {/* Profile button intentionally outside / above tab group and anchored to right */}
            <UserProfileButton />
          </div>
        </div>
      </header>

  <nav className={styles.tabNavigation} aria-label="Primary">
        <Link href="/users/dashboard" legacyBehavior>
          <a className={`${styles.tabButton} ${pathname === '/users/dashboard' ? styles.activeTabButton : ''}`}>Dashboard</a>
        </Link>
        <Link href="/music-taste" legacyBehavior>
          <a className={`${styles.tabButton} ${pathname === '/music-taste' ? styles.activeTabButton : ''}`}>Music Taste</a>
        </Link>
        <Link href="/my-events" legacyBehavior>
          <a className={`${styles.tabButton} ${pathname === '/my-events' ? styles.activeTabButton : ''}`}>Favourites</a>
        </Link>
      </nav>

      <main className={styles.tabContentArea}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
