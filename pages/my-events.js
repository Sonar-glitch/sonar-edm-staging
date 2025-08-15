import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/MyEvents.module.css';
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from '@/styles/MyEvents.module.css';

const MyEventsPage = () => {
  const [likedEvents, setLikedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLikedEvents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/interested-events');
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();
        setLikedEvents(data.events || []);
      } catch (error) {
        console.error('Error loading liked events:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLikedEvents();
  }, []);

  return (
    <Layout>
      <div className={styles.container}>
        <div className={styles.mainContent}>
          <div className={styles.eventsHeader}>
            <h2 className={styles.sectionTitle}>My Saved Events</h2>
            <span className={styles.dataIndicator}>{likedEvents.length} saved</span>
          </div>
            {loading ? (
              <div className={styles.loading}><div className={styles.spinner}></div></div>
            ) : likedEvents.length === 0 ? (
              <div className={styles.noEvents}>
                <div className={styles.emptyIcon}>💖</div>
                <h3>No saved events yet</h3>
                <p>Events you save will appear here.</p>
                <Link href="/users/dashboard" className={styles.exploreButton}>Explore Events</Link>
              </div>
            ) : (
              <div className={styles.eventsGrid}>
                {/* Event mapping logic remains the same */}
              </div>
            )}
          </div>
        </div>
    </Layout>
  );
};

MyEventsPage.auth = { requiredAuth: true };
export default MyEventsPage;
