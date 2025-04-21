import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import GenreRadarChart from '@/components/GenreRadarChart';
import SeasonalVibes from '@/components/SeasonalVibes';
import styles from '@/styles/MusicTaste.module.css';

export default function MusicTastePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tasteData, setTasteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventCount, setEventCount] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);
  
  // Fetch user taste data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserTaste();
      fetchEventCount();
    }
  }, [status]);
  
  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/spotify/user-taste');
      if (!response.ok) {
        throw new Error('Failed to fetch user taste data');
      }
      
      const data = await response.json();
      setTasteData(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError('Failed to load your music taste profile.');
      setLoading(false);
    }
  };
  
  const fetchEventCount = async () => {
    try {
      const response = await fetch('/api/events/count');
      if (response.ok) {
        const data = await response.json();
        setEventCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching event count:', err);
    }
  };

  // Generate seasonal vibes data based on user's taste
  const generateSeasonalVibes = () => {
    if (!tasteData || !tasteData.genreProfile) return null;
    
    // Extract top genres
    const sortedGenres = Object.entries(tasteData.genreProfile)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre);
    
    return {
      spring: {
        emoji: '🌸',
        title: 'Spring',
        genres: sortedGenres.length >= 2 
          ? `${sortedGenres[0]}, Progressive`
          : 'Progressive House, Melodic House',
        message: 'Fresh beats & uplifting vibes'
      },
      summer: {
        emoji: '☀️',
        title: 'Summer',
        genres: sortedGenres.length >= 3 
          ? `${sortedGenres[1]}, Tech House`
          : 'Tech House, House',
        message: 'High energy open-air sounds'
      },
      fall: {
        emoji: '🍂',
        title: 'Fall',
        genres: 'Organic House, Downtempo',
        message: 'Mellow grooves & deep beats'
      },
      winter: {
        emoji: '❄️',
        title: 'Winter',
        genres: 'Deep House, Ambient Techno',
        message: 'Hypnotic journeys & warm basslines'
      }
    };
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingAnimation}></div>
        <p>Analyzing your sonic profile...</p>
      </div>
    );
  }

  if (error && !tasteData) {
    return (
      <div className={styles.errorContainer}>
        <h2>Couldn't load your music taste</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={fetchUserTaste}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Use real data or fallbacks
  const genreProfile = tasteData?.genreProfile || {
    'Melodic House': 85,
    'Techno': 72,
    'Progressive House': 65,
    'Trance': 45,
    'Deep House': 58
  };
  
  const vibeShift = tasteData?.vibeShift || 'fresh sounds';
  const seasonalVibes = generateSeasonalVibes();
  
  // Format primary genres for summary display
  const getPrimaryGenres = () => {
    if (!genreProfile || Object.keys(genreProfile).length === 0) return '';
    
    // Sort genres by value (highest first) and take top 2
    const sortedGenres = Object.entries(genreProfile)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre)
      .slice(0, 2);
      
    return sortedGenres.join(' + ').toLowerCase();
  };
  
  return (
    <>
      <Head>
        <title>Your Music Taste | TIKO</title>
        <meta name="description" content="Explore your music taste profile" />
      </Head>
      
      <Header />
      
      <div className={styles.container}>
        {/* Summary Banner */}
        <div className={styles.summaryBanner}>
          <p className={styles.summaryText}>
            You're all about <span className={styles.highlight}>{getPrimaryGenres()}</span> with a vibe shift toward <span className={styles.highlight}>{vibeShift}</span>. Found <span className={styles.highlight}>{eventCount}</span> events that match your sound.
          </p>
        </div>
        
        <div className={styles.grid}>
          <div className={styles.genreSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Your Sonic Signature</h2>
              <button className={styles.dataButton}>
                {tasteData ? 'Real Data' : 'Sample Data'}
              </button>
            </div>
            <div className={styles.chartContainer}>
              <GenreRadarChart genreData={genreProfile} />
            </div>
          </div>
          
          <div className={styles.seasonalSection}>
            <SeasonalVibes 
              seasonalData={seasonalVibes} 
              isLoading={loading} 
            />
          </div>
        </div>
        
        <div className={styles.actionContainer}>
          <Link href="/dashboard" legacyBehavior>
            <a className={styles.backButton}>
              Back to Dashboard
            </a>
          </Link>
        </div>
      </div>
    </>
  );
}