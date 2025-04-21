import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import SonicSignature from '@/components/SonicSignature';
import SeasonalVibes from '@/components/SeasonalVibes';
import CompactEventFilters from '@/components/CompactEventFilters';
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
      
      // Use fallback data if API call fails
      let tasteData = {
        genreProfile: {
          'House': 75,
          'Techno': 65,
          'Progressive House': 60,
          'Trance': 45,
          'Melodic': 55
        },
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
          mood: fetchedData.mood || tasteData.mood,
          topArtists: fetchedData.topArtists?.items || tasteData.topArtists,
          topTracks: fetchedData.topTracks?.items || tasteData.topTracks
        };
      }
      
      // Generate seasonal vibes data
      const seasonalVibes = generateSeasonalVibes(tasteData.genreProfile);
      
      // Get recommendations
      const recommendationsResponse = await fetch('/api/spotify/recommendations')
        .catch(err => {
          console.error('Network error fetching recommendations:', err);
          return { ok: false };
        });
      
      let recommendations = {
        artists: [],
        tracks: []
      };
      
      if (recommendationsResponse.ok) {
        const recData = await recommendationsResponse.json();
        recommendations = recData.recommendations || recommendations;
      }
      
      // Set the initial user profile
      setUserProfile({
        taste: tasteData,
        seasonalVibes,
        recommendations,
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
      const eventsResponse = await fetch(`/api/events/recommendations?${queryParams.toString()}`)
        .catch(err => {
          console.error('Network error fetching events:', err);
          return { ok: false };
        });
      
      // Use mock data if API fails
      let eventsData = [
        {
          id: 'event1',
          name: 'Tale of Us',
          venue: 'Output',
          location: 'New York',
          date: '2025-04-25T22:00:00',
          price: 85,
          primaryGenre: 'Melodic Techno',
          matchScore: 92
        },
        {
          id: 'event2',
          name: 'Mathame',
          venue: 'Afterlife',
          location: 'Brooklyn',
          date: '2025-04-28T20:00:00',
          price: 100,
          primaryGenre: 'Techno',
          matchScore: 79
        }
      ];
      
      if (eventsResponse.ok) {
        const response = await eventsResponse.json();
        if (response.events && response.events.length > 0) {
          eventsData = response.events;
        }
      }
      
      // Update events in user profile
      setUserProfile(prev => ({
        ...prev,
        events: eventsData
      }));
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setEventsLoading(false);
    }
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  // Generate seasonal vibes data based on user's taste
  const generateSeasonalVibes = (genreProfile) => {
    if (!genreProfile) return null;
    
    // Extract top genres
    const sortedGenres = Object.entries(genreProfile)
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
        genres: sortedGenres.length >= 4 
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
    seasonalVibes: null,
    events: []
  };
  
  return (
    <>
      <Head>
        <title>TIKO | Your Music Dashboard</title>
        <meta name="description" content="Your personalized EDM dashboard" />
      </Head>
      
      <div className={styles.container}>
        <Header />
        
        <main className={styles.main}>
          {/* Sonic Signature - the radar chart visualization */}
          <SonicSignature 
            genreData={profile.taste.genreProfile} 
            mood={profile.taste.mood}
            topArtist={profile.taste.topArtists[0]}
            topTrack={profile.taste.topTracks[0]}
            recommendations={profile.recommendations}
          />
          
          {/* Seasonal Vibes */}
          <SeasonalVibes 
            seasonalData={profile.seasonalVibes}
            isLoading={loading}
          />
          
          {/* Events section */}
          <div className={styles.eventsSection}>
            <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
            
            {/* Filters */}
            <CompactEventFilters 
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
            
            {/* Events list */}
            <EventList 
              events={profile.events} 
              loading={eventsLoading}
            />
          </div>
        </main>
        
        <footer className={styles.footer}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}