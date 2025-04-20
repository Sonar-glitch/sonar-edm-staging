import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SonicSignature from '@/components/SonicSignature';
import TopMusicInfo from '@/components/TopMusicInfo';
import EventRecommendation from '@/components/EventRecommendation';
import styles from '@/styles/Dashboard.module.css';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  // Fetch user profile data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch music taste data
      const tasteResponse = await fetch('/api/spotify/user-taste');
      
      if (!tasteResponse.ok) {
        throw new Error('Failed to fetch user taste data');
      }
      
      const tasteData = await tasteResponse.json();
      
      // Fetch event recommendations
      const eventsResponse = await fetch('/api/events/recommendations');
      
      if (!eventsResponse.ok) {
        throw new Error('Failed to fetch event recommendations');
      }
      
      const eventsData = await eventsResponse.json();
      
      // Combine data into user profile
      setUserProfile({
        taste: tasteData,
        events: eventsData.events
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your profile. Please try again later.');
      setLoading(false);
    }
  };
  
  // Mock data for development if needed
  const mockGenreData = {
    'Progressive House': 75,
    'Organic Grooves': 60,
    'Dark Techno': 45,
    'Melodic Techno': 85
  };
  
  const mockEvents = [
    {
      id: 'event1',
      name: 'Mathame',
      venue: 'Afterlife',
      location: 'Brooklyn',
      date: '2025-04-14T20:00:00',
      price: 100,
      primaryGenre: 'Techno',
      matchScore: 79
    },
    {
      id: 'event2',
      name: 'Tale of Us',
      venue: 'Output',
      location: 'New York',
      date: '2025-04-21T22:00:00',
      price: 85,
      primaryGenre: 'Melodic Techno',
      matchScore: 92
    },
    {
      id: 'event3',
      name: 'Adriatique',
      venue: 'Elsewhere',
      location: 'Brooklyn',
      date: '2025-04-28T21:00:00',
      price: 65,
      primaryGenre: 'Progressive House',
      matchScore: 88
    }
  ];

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingPulse}></div>
        <p>Analyzing your sonic signature...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={fetchUserData}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>TIKO | Your Music Dashboard</title>
        <meta name="description" content="Your personalized EDM dashboard" />
      </Head>
      
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.logo}>TIKO</div>
          
          <nav className={styles.nav}>
            <button className={styles.profileButton}>
              {session?.user?.name || 'Profile'}
            </button>
          </nav>
        </header>
        
        <main className={styles.main}>
          <SonicSignature 
            genreData={userProfile?.taste?.currentGenreProfile || mockGenreData} 
            mood={userProfile?.taste?.mood || 'Late-Night Melodic Wave'}
          />
          
          <TopMusicInfo 
            topArtist={userProfile?.taste?.topArtists?.[0] || { name: 'Boris Brejcha', images: [{ url: '/placeholder-artist.jpg' }] }}
            repeatTrack={userProfile?.taste?.topTracks?.[0] || { name: 'Realm of Consciousness' }}
          />
          
          <EventRecommendation 
            events={userProfile?.events || mockEvents}
            userGenres={userProfile?.taste?.currentGenreProfile || mockGenreData}
          />
        </main>
        
        <footer className={styles.footer}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}