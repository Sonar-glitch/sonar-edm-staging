import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import SoundCharacteristicsChart from '@/components/SoundCharacteristicsChart';
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
  
  // Define fallback sound characteristics
  const getFallbackSoundCharacteristics = () => {
    return {
      'Danceability': 78,
      'Melody': 85,
      'Energy': 72,
      'Obscurity': 63,
      'Tempo': 68
    };
  };
  
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
      
      // Use fallback data if API call fails
      let tasteData = {
        genreProfile: {
          'House': 75,
          'Techno': 65,
          'Progressive House': 60,
          'Trance': 45,
          'Indie dance': 55
        },
        soundCharacteristics: getFallbackSoundCharacteristics(),
        mood: 'Chillwave Flow',
        topArtists: [{ 
          name: 'Boris Brejcha', 
          id: '6bDWAcdtVR39rjZS5A3SoD',
          images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb8ae72ad1d3e564e2b883afb5' }],
          popularity: 85,
          genres: ['melodic techno', 'minimal techno']
        }],
        topTracks: [{ 
          name: 'Realm of Consciousness', 
          id: '2pXJ3zJ9smoG8SQqlMBvoF',
          artists: [{ name: 'Tale Of Us' }],
          album: { 
            name: 'Realm of Consciousness', 
            images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273c3a84c67544c46c7df9529c5' }] 
          },
          popularity: 80,
          preview_url: 'https://p.scdn.co/mp3-preview/5a6aa5ef7516e6771c964c3d44b77156c5330b7e'
        }]
      };
      
      if (tasteResponse.ok) {
        const fetchedData = await tasteResponse.json();
        tasteData = {
          ...fetchedData,
          // Ensure we have fallbacks if API returns incomplete data
          genreProfile: fetchedData.genreProfile || tasteData.genreProfile,
          soundCharacteristics: fetchedData.soundCharacteristics || getFallbackSoundCharacteristics(),
          mood: fetchedData.mood || tasteData.mood,
          topArtists: fetchedData.topArtists?.items || tasteData.topArtists,
          topTracks: fetchedData.topTracks?.items || tasteData.topTracks
        };
      }
      
      // Set the user profile
      setUserProfile({
        taste: tasteData
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your profile. Please try again later.');
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer || "loadingContainer"}>
        <div className={styles.loadingPulse || "loadingPulse"}></div>
        <p>Analyzing your sonic signature...</p>
      </div>
    );
  }
  
  if (error && !userProfile) {
    return (
      <div className={styles.errorContainer || "errorContainer"}>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton || "retryButton"}
          onClick={fetchUserData}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Ensure we have data to render
  const profile = userProfile || {
    taste: {
      genreProfile: {},
      soundCharacteristics: {},
      mood: '',
      topArtists: [],
      topTracks: []
    }
  };
  
  // Get primary genres for display
  const primaryGenres = Object.entries(profile.taste.genreProfile)
    .sort(([, a], [, b]) => b - a)
    .map(([genre]) => genre.toLowerCase())
    .slice(0, 2)
    .join(' + ');
  
  return (
    <>
      <Head>
        <title>TIKO | Your Music Dashboard</title>
        <meta name="description" content="Your personalized EDM dashboard" />
      </Head>
      
      <div className={styles.container || "container"}>
        <header className={styles.header || "header"}>
          <h1>TIKO</h1>
          <nav>
            <Link href="/users/music-taste">Music Taste</Link>
            <Link href="/users/events">Events</Link>
            <Link href="/users/profile">Profile</Link>
          </nav>
        </header>
        
        <main className={styles.main || "main"}>
          {/* Summary Banner */}
          <div className={styles.summaryBanner || "summaryBanner"}>
            <p>You're all about <span className={styles.highlight || "highlight"}>{primaryGenres}</span> with a vibe shift toward <span className={styles.highlight || "highlight"}>fresh sounds</span>.</p>
          </div>
          
          {/* Sound Characteristics Chart */}
          <SoundCharacteristicsChart 
            soundData={profile.taste.soundCharacteristics} 
          />
          
          {/* Link to full music taste page */}
          <div className={styles.linkContainer || "linkContainer"}>
            <Link href="/users/music-taste" className={styles.viewMoreLink || "viewMoreLink"}>
              View Your Full Music Taste
            </Link>
          </div>
        </main>
        
        <footer className={styles.footer || "footer"}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}
