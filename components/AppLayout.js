import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import UserProfileButton from './UserProfileButton';
import styles from '../styles/DashboardPage.module.css';

// Consolidated lightweight top navigation layout for user-facing pages.
export default function AppLayout({ children }) {
  const router = useRouter();
  const { pathname } = router;
  return (
    <div className={styles.pageContainer}>
      <header className={styles.mainHeader}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <h1 className={styles.mainLogo}>TIKO</h1>
            <p className={styles.platformSubtitle}>Your personalized EDM event discovery platform</p>
          </div>
          <div className={styles.profileSection}>
            <UserProfileButton />
          </div>
        </div>
        <nav className={styles.tabNavigation}>
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
      </header>
      <main className={styles.tabContentArea}>{children}</main>
    </div>
  );
}// components/AppLayout.js - A new, shared layout component
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import UserProfileButton from './UserProfileButton';
import styles from '../styles/DashboardPage.module.css'; // Path is relative to components dir

const AppLayout = ({ children }) => {
  const router = useRouter();
  const { pathname } = router;

  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>TIKO - Your Music Universe</title>
        <meta name="description" content="Your personalized EDM event discovery platform" />
        <script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          async
          defer
        />
      </Head>

      <header className={styles.mainHeader}>
        <div className={styles.headerContent}>
          <div className={styles.logoSection}>
            <h1 className={styles.mainLogo}>TIKO</h1>
            <p className={styles.platformSubtitle}>Your personalized EDM event discovery platform</p>
          </div>
          <div className={styles.profileSection}>
            <UserProfileButton />
          </div>
        </div>
      </header>

      <nav className={styles.tabNavigation}>
        <Link href="/users/dashboard" legacyBehavior>
          <a className={`${styles.tabButton} ${pathname === '/users/dashboard' ? styles.activeTabButton : ''}`}>
            Dashboard
          </a>
        </Link>
        <Link href="/music-taste" legacyBehavior>
          <a className={`${styles.tabButton} ${pathname === '/music-taste' ? styles.activeTabButton : ''}`}>
            Music Taste
          </a>
        </Link>
        <Link href="/my-events" legacyBehavior>
          <a className={`${styles.tabButton} ${pathname === '/my-events' ? styles.activeTabButton : ''}`}>
            My Events
          </a>
        </Link>
      </nav>

      <main className={styles.tabContentArea}>
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
