// pages/dashboard.js - Update with better error handling

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SonicSignature from '@/components/SonicSignature';
import TopMusicInfo from '@/components/TopMusicInfo';
import EventRecommendation from '@/components/EventRecommendation';
import styles from '@/styles/Dashboard.module.css';

// Fallback data for demonstration
const FALLBACK_DATA = {
  taste: {
    genreProfile: {
      "Melodic Techno": 75,
      "Progressive House": 60, 
      "Dark Techno": 45,
      "Organic Grooves": 55
    },
    mood: "Late-Night Melodic Wave",
    topArtists: [{ 
      name: "Boris Brejcha", 
      images: [{ url: "/placeholder-artist.jpg" }] 
    }],
    topTracks: [{ 
      name: "Realm of Consciousness" 
    }]
  },
  events: [
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
    }
  ]
};

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
      setError(null);
      
      // Fetch music taste data
      const tasteResponse = await fetch('/api/spotify/user-taste')
        .catch(err => {
          console.error('Network error fetching taste data:', err);
          return { ok: false };
        });
      
      let tasteData = FALLBACK_DATA.taste;
      if (tasteResponse.ok) {
        tasteData = await tasteResponse.json();
      }
      
      // Fetch event recommendations
      const eventsResponse = await fetch('/api/events/recommendations')
        .catch(err => {
          console.error('Network error fetching events:', err);
          return { ok: false };
        });
      
      let eventsData = { events: FALLBACK_DATA.events };
      if (eventsResponse.ok) {
        eventsData = await eventsResponse.json();
      }
      
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
      // Use fallback data even on error
      setUserProfile(FALLBACK_DATA);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingPulse}></div>
        <p>Analyzing your sonic signature...</p>
      </div>
    );
  }
  
  if (error && !userProfile) {
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

  // Always render with data (either real or fallback)
  const profile = userProfile || FALLBACK_DATA;

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
            genreData={profile.taste?.genreProfile} 
            mood={profile.taste?.mood}
          />
          
          <TopMusicInfo 
            topArtist={profile.taste?.topArtists?.[0]}
            repeatTrack={profile.taste?.topTracks?.[0]}
          />
          
          <EventRecommendation 
            events={profile.events}
            userGenres={profile.taste?.genreProfile}
          />
        </main>
        
        <footer className={styles.footer}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}