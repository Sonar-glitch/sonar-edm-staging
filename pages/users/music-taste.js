import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import SoundCharacteristicsChart from '@/components/SoundCharacteristicsChart';
import ReorganizedSeasonalVibes from '@/components/ReorganizedSeasonalVibes';
import EnhancedEventFilters from '@/components/EnhancedEventFilters';
import ImprovedEventList from '@/components/ImprovedEventList';
import styles from '@/styles/MusicTaste.module.css';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    vibeMatch: 50,
    eventType: 'all',
    distance: 'all'
  });
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
      'Melody': 85,
      'Danceability': 78,
      'Energy': 72,
      'Tempo': 68,
      'Obscurity': 63
    };
  };
  
  // Define fallback seasonal data
  const getFallbackSeasonalData = () => {
    return {
      spring: {
        title: 'Spring',
        emoji: '🌸',
        genres: 'House, Progressive',
        message: 'Fresh beats & uplifting vibes'
      },
      summer: {
        title: 'Summer',
        emoji: '☀️',
        genres: 'Techno, Tech House',
        message: 'High energy open air sounds'
      },
      fall: {
        title: 'Fall',
        emoji: '🍂',
        genres: 'Organic House, Downtempo',
        message: 'Mellow grooves & deep beats'
      },
      winter: {
        title: 'Winter',
        emoji: '❄️',
        genres: 'Deep House, Ambient Techno',
        message: 'Hypnotic journeys & warm basslines'
      }
    };
  };
  
  // Define fallback events
  const getFallbackEvents = () => {
    return [
      {
        id: 1,
        name: 'Techno Dreamscape',
        venue: 'Warehouse 23',
        venueType: 'Warehouse',
        artists: ['Charlotte de Witte', 'Amelie Lens'],
        genre: 'Techno',
        price: 45,
        date: 'Thu, May 1',
        match: 92
      },
      {
        id: 2,
        name: 'Deep House Journey',
        venue: 'Club Echo',
        venueType: 'Club',
        artists: ['Lane 8', 'Yotto'],
        genre: 'Deep House',
        price: 35,
        date: 'Thu, May 8',
        match: 85
      },
      {
        id: 3,
        name: 'Melodic Techno Night',
        venue: 'The Sound Bar',
        venueType: 'Club',
        artists: ['Tale Of Us', 'Mind Against'],
        genre: 'Melodic Techno',
        price: 55,
        date: 'Sun, Apr 27',
        match: 88
      }
    ];
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
        seasonalVibes: getFallbackSeasonalData(),
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
          seasonalVibes: fetchedData.seasonalVibes || getFallbackSeasonalData(),
          mood: fetchedData.mood || tasteData.mood,
          topArtists: fetchedData.topArtists?.items || tasteData.topArtists,
          topTracks: fetchedData.topTracks?.items || tasteData.topTracks
        };
      }
      
      // Set events data (using fallback for now)
      setEvents(getFallbackEvents());
      
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
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    
    // Filter events based on vibe match
    const filteredEvents = getFallbackEvents().filter(event => {
      // Filter by vibe match
      if (event.match < newFilters.vibeMatch) {
        return false;
      }
      
      // Filter by event type
      if (newFilters.eventType !== 'all') {
        const eventType = event.venueType.toLowerCase();
        if (eventType !== newFilters.eventType) {
          return false;
        }
      }
      
      // For distance, we would need real data with location info
      // This is just a placeholder for the concept
      
      return true;
    });
    
    setEvents(filteredEvents);
  };
  
  // Handle event click
  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    // Here you would navigate to event details or show a modal
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

  // Ensure we have data to render
  const profile = userProfile || {
    taste: {
      genreProfile: {},
      soundCharacteristics: {},
      seasonalVibes: {},
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
        <title>Your Music Taste | Sonar</title>
        <meta name="description" content="Discover your unique music taste profile" />
      </Head>
      
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>TIKO</h1>
          <nav>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/users/events">Events</Link>
            <Link href="/users/profile">Profile</Link>
          </nav>
        </header>
        
        <main className={styles.main}>
          {/* Summary Banner */}
          <div className={styles.summaryBanner}>
            <p>You're all about <span className={styles.highlight}>{primaryGenres}</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.</p>
          </div>
          
          {/* Sound Characteristics Chart */}
          <SoundCharacteristicsChart 
            soundData={profile.taste.soundCharacteristics} 
          />
          
          {/* Seasonal Vibes Section */}
          <ReorganizedSeasonalVibes 
            seasonalData={profile.taste.seasonalVibes}
            isLoading={loading}
          />
          
          {/* Events Section */}
          <section className={styles.eventsSection}>
            <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
            
            {/* Event Filters */}
            <EnhancedEventFilters 
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
            
            {/* Event List */}
            <ImprovedEventList 
              events={events}
              onEventClick={handleEventClick}
            />
          </section>
        </main>
        
        <footer className={styles.footer}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}
