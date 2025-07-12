// pages/dashboard.js - Simplified and Corrected
import React from 'react';
import Head from 'next/head';
import Link from 'next/link'; // Import Link for navigation
import EnhancedPersonalizedDashboard from '@/components/EnhancedPersonalizedDashboard';
import styles from '@/styles/DashboardPage.module.css';

const DashboardPage = () => {
  // This page is now only responsible for the main dashboard content.
  // The tab logic has been removed.

  return (
    <div className={styles.pageContainer}>
      <Head>
        <title>TIKO - Your Dashboard</title>
        <meta name="description" content="Your personalized EDM event discovery platform" />
      </Head>

      <header className={styles.mainHeader}>
        <h1 className={styles.mainLogo}>TIKO</h1>
        <p className={styles.platformSubtitle}>Your personalized EDM event discovery platform</p>
      </header>

      {/* CORRECTED: Navigation now uses proper Link components to navigate to separate pages */}
      <nav className={styles.tabNavigation}>
        <Link href="/dashboard" legacyBehavior>
          <a className={`${styles.tabButton} ${styles.activeTabButton}`}>Dashboard</a>
        </Link>
        <Link href="/music-taste" legacyBehavior>
          <a className={styles.tabButton}>Music Taste</a>
        </Link>
        <Link href="/my-events" legacyBehavior>
          <a className={styles.tabButton}>My Events</a>
        </Link>
      </nav>

      <main className={styles.tabContentArea}>
        {/* The content is now just the main dashboard */}
        <EnhancedPersonalizedDashboard />
      </main>
    </div>
  );
};

// Mark this page as requiring authentication
DashboardPage.auth = { requiredAuth: true };

export default DashboardPage;
