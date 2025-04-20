import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import UserProfile from '@/components/UserProfile';
import VibeSummary from '@/components/VibeSummary';
import SonicSignature from '@/components/SonicSignature';
import EventFilters from '@/components/EventFilters';
import EventList from '@/components/EventList';
import styles from '@/styles/Dashboard.module.css';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    genre: 'all',
    venue: 'all',
    event: 'all',
    price: 'all',
    vibeMatch: 50
  });
  
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
  
  // Fetch filtered events when filters change
  useEffect(() => {
    if (userProfile) {
      fetchFilteredEvents();
    }
  }, [filters, userProfile]);
  
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
      
      let tasteData = {
        genreProfile: {
          'Melodic House': 75,
          'Techno': 65,
          'Progressive House': 60,
          'Dark Techno': 45,
          'Organic Grooves': 55
        },
        mood: 'Late-Night Melodic Wave',
        topArtists: [{ name: 'Boris Brejcha', images: [{ url: '/placeholder-artist.jpg' }] }],
        topTracks: [{ name: 'Realm of Consciousness' }]
      };
      
      if (tasteResponse.ok) {
        const fetchedData = await tasteResponse.json();
        tasteData = {
          ...fetchedData,
          // Ensure we have fallbacks if API returns incomplete data
          genreProfile: fetchedData.genreProfile || tasteData.genreProfile,
          mood: fetchedData.mood || tasteData.mood,
          topArtists: fetchedData.topArtists?.items || tasteData.topArtists,
          topTracks: fetchedData.topTracks?.items || tasteData.topTracks
        };
      }
      
      // Set the initial user profile
      setUserProfile({
        taste: tasteData,
        events: []
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your profile. Please try again later.');
      setLoading(false);
    }
  };
  
  const fetchFilteredEvents = async () => {
    try {
      setEventsLoading(true);
      
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      if (filters.genre !== 'all') queryParams.append('genre', filters.genre);
      if (filters.venue !== 'all') queryParams.append('venue', filters.venue);
      if (filters.event !== 'all') queryParams.append('event', filters.event);
      if (filters.price !== 'all') queryParams.append('price', filters.price);
      queryParams.append('minMatch', filters.vibeMatch);
      
      // Fetch events with filters
      const eventsResponse = await fetch(`/api/events/recommendations?${queryParams.toString()}`);
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        
        // Update events in user profile
        setUserProfile(prev => ({
          ...prev,
          events: eventsData.events || []
        }));
      } else {
        // If API fails, use fallback mock data
        const mockEvents = [
          {
            id: 'event1',
            name: 'Tale of Us',
            venue: 'Output',
            location: 'New York',
            date: '2025-04-21T22:00:00',
            price: 85,
            primaryGenre: 'Melodic Techno',
            matchScore: 92
          },
          {
            id: 'event2',
            name: 'Mathame',
            venue: 'Afterlife',
            location: 'Brooklyn',
            date: '2025-04-14T20:00:00',
            price: 100,
            primaryGenre: 'Techno',
            matchScore: 79
          }
        ];
        
        setUserProfile(prev => ({
          ...prev,
          events: mockEvents
        }));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  const handleFeedback = () => {
    // Open feedback dialog or navigate to feedback page
    router.push('/feedback');
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
      mood: '',
      topArtists: [],
      topTracks: []
    },
    events: []
  };
  
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
            <UserProfile 
              tasteSnapshot={profile.taste.genreProfile} 
            />
          </nav>
        </header>
        
        <main className={styles.main}>
          {/* Vibe Summary - shows at top what music the user is about */}
          <VibeSummary 
            primaryGenres={profile.taste.genreProfile}
            vibeShift="fresh sounds"
            eventCount={profile.events.length}
          />
          
          {/* Sonic Signature - the radar chart visualization */}
          <SonicSignature 
            genreData={profile.taste.genreProfile} 
            mood={profile.taste.mood}
            topArtist={profile.taste.topArtists[0]}
            topTrack={profile.taste.topTracks[0]}
          />
          
          {/* Events section */}
          <div className={styles.eventsSection}>
            <h2 className={styles.sectionTitle}>Events You'll Like</h2>
            
            {/* Filters */}
            <EventFilters 
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
            
            {/* Events list */}
            <EventList 
              events={profile.events} 
              loading={eventsLoading}
            />
            
            {/* Feedback question */}
            <div className={styles.feedbackContainer}>
              <p>Did we get it right? <button onClick={handleFeedback} className={styles.feedbackButton}>no</button></p>
            </div>
          </div>
        </main>
        
        <footer className={styles.footer}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}