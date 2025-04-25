import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/Layout';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import styles from '@/styles/MusicTaste.module.css';

// Import the correct components for music taste visualization
import SoundCharacteristicsChart from '@/components/SoundCharacteristicsChart';
import SeasonalVibes from '@/components/SeasonalVibes';
import ArtistTrackSection from '@/components/ArtistTrackSection';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to dashboard if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch user profile data
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchUserProfile();
    }
  }, [session, status]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/user-taste');
      
      if (!response.ok) {
        // If there's an authentication error, redirect to dashboard
        if (response.status === 401) {
          console.log('Authentication error, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setUserProfile(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load your music taste profile. Please try again later.');
      setLoading(false);
      
      // On error, redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
    }
  };

  // If loading
  if (loading || status === 'loading') {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <LoadingSpinner />
          <p>Loading your music taste profile...</p>
        </div>
      </Layout>
    );
  }

  // If error
  if (error) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h2>Oops!</h2>
          <p>{error}</p>
          <p>Redirecting to dashboard...</p>
        </div>
      </Layout>
    );
  }

  // If no user profile data
  if (!userProfile) {
    return (
      <Layout>
        <div className={styles.errorContainer}>
          <h2>No Data Available</h2>
          <p>We couldn't find your music taste profile. Redirecting to dashboard...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>TIKO | Your Music Taste</title>
        <meta name="description" content="Your personalized music taste profile" />
      </Head>

      <div className={styles.container}>
        <h1 className={styles.title}>Your Music Taste</h1>
        
        <div className={styles.summary}>
          You're all about <span className={styles.highlight1}>house</span> + <span className={styles.highlight2}>techno</span> with a vibe shift toward <span className={styles.highlight3}>fresh sounds</span>.
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Sound Characteristics</h2>
          <SoundCharacteristicsChart data={userProfile.soundCharacteristics || userProfile.genreProfile} />
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Seasonal Vibes</h2>
          <SeasonalVibes data={userProfile.seasonalVibes} />
        </div>
        
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Your Top Artists & Tracks</h2>
          <ArtistTrackSection artists={userProfile.artists?.items} tracks={userProfile.tracks?.items} />
        </div>
      </div>
    </Layout>
  );
}
