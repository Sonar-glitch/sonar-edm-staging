// components/AppLayout.js - A new, shared layout component
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import styles from '../styles/DashboardPage.module.css'; // Path is relative to components dir

const AppLayout = ({ children }) => {
  const router = useRouter();
  const { pathname } = router;
  const { data: session, status } = useSession();

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
          <div className={styles.branding}>
            <h1 className={styles.mainLogo}>TIKO</h1>
            <p className={styles.platformSubtitle}>Your personalized EDM event discovery platform</p>
          </div>
          
          {/* User Profile Section */}
          <div className={styles.userSection}>
            {session ? (
              <div className={styles.userInfo}>
                <span className={styles.userName}>
                  {session.user.name || session.user.email}
                </span>
                <button 
                  onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                  className={styles.signOutButton}
                  title="Sign Out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link href="/auth/signin" className={styles.signInButton}>
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <nav className={styles.tabNavigation}>
        <Link href="/dashboard" legacyBehavior>
          <a className={`${styles.tabButton} ${pathname === '/dashboard' ? styles.activeTabButton : ''}`}>
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
