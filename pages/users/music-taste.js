import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import GenreRadarChart from '@/components/GenreRadarChart';
import VibeSummary from '@/components/VibeSummary';
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
        setEventCount(data.count);
      }
    } catch (err) {
      console.error('Error fetching event count:', err);
    }
  };

  // Generate seasonal vibes data based on user's taste
  const generateSeasonalVibes = () => {
    if (!tasteData || !tasteData.genreProfile) return null;
    
    // For a real implementation, you'd use historical data or more sophisticated analysis
    // This is a simplified example
    const genres = Object.keys(tasteData.genreProfile);
    
    return {
      spring: {
        emoji: '🌸',
        title: 'Spring',
        genres: genres.length >= 2 ? `${genres[0]}, ${genres[1]}` : 'Progressive House, Melodic House',
        message: 'Keep listening!'
      },
      summer: {
        emoji: '☀️',
        title: 'Summer',
        genres: genres.length >= 4 ? `${genres[2]}, ${genres[3]}` : 'Tech House, House',
        message: 'Keep listening!'
      },
      fall: {
        emoji: '🍂',
        title: 'Fall',
        genres: 'Organic House, Downtempo',
        message: 'Keep listening!'
      },
      winter: {
        emoji: '❄️',
        title: 'Winter',
        genres: 'Deep House, Ambient Techno',
        message: 'Keep listening!'
      }
    };
  };

  // Get the current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
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
  
  return (
    <>
      <Head>
        <title>Your Music Taste | SONAR</title>
        <meta name="description" content="Explore your music taste profile" />
      </Head>
      
      <div className={styles.container}>
        <VibeSummary 
          primaryGenres={genreProfile}
          vibeShift={vibeShift}
          eventCount={eventCount}
        />
        
        <div className={styles.grid}>
          <div className={styles.genreSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Your Genre Mix</h2>
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
        
        <div className={styles.eventsSection}>
          <h2 className={styles.sectionTitle}>Events That Match Your Vibe</h2>
          <div className={styles.filterContainer}>
            {/* Event filters go here */}
          </div>
        </div>
      </div>
    </>
  );
}