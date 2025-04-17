import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import styles from '../../styles/Profile.module.css';
import SpiderChart from '../../components/SpiderChart';
import Navigation from '../../components/Navigation';

export default function Profile() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch user profile data
      fetch('/api/spotify/user-taste')
        .then(res => res.json())
        .then(data => {
          setUserProfile(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching user profile:', err);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your profile...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.title}>Please sign in to view your profile</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.profileImage}>
            {session?.user?.image ? (
              <img src={session.user.image} alt={session.user.name} />
            ) : (
              <div className={styles.profileInitial}>
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.title}>{session?.user?.name || 'User'}'s Profile</h1>
            <p className={styles.email}>{session?.user?.email || ''}</p>
          </div>
        </div>

        {userProfile && (
          <div className={styles.profileContent}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Your Music DNA</h2>
              <div className={styles.chartContainer}>
                <SpiderChart genres={userProfile.genres} />
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Account Information</h2>
              <div className={styles.accountInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Member Since:</span>
                  <span className={styles.value}>
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Spotify Connected:</span>
                  <span className={styles.value}>Yes</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Events Attended:</span>
                  <span className={styles.value}>0</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Preferences</h2>
              <p className={styles.preferencesText}>
                Manage your preferences in the <a href="/users/settings" className={styles.link}>Settings</a> page.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
