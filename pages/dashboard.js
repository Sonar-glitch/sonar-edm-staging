// /c/sonar/users/sonar-edm-user/pages/dashboard.js
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Navigation from '@/components/Navigation';
import GenreRadarChart from '@/components/GenreRadarChart';
import SeasonalVibes from '@/components/SeasonalVibes';
import EventFilters from '@/components/EventFilters';
import EventList from '@/components/EventList';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { getFallbackEvents, getFallbackTasteData } from '@/lib/fallbackData';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);
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
  
  // Fetch user data on initial load
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);
  
  // Fetch user data with robust error handling
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
      
      // Process taste data with validation
      let tasteData = getFallbackTasteData();
      
      if (tasteResponse.ok) {
        try {
          const data = await tasteResponse.json();
          if (data && data.genreProfile) {
            tasteData = {
              genreProfile: data.genreProfile || tasteData.genreProfile,
              mood: data.mood || tasteData.mood,
              topArtists: data.artists?.items || tasteData.topArtists,
              topTracks: data.tracks?.items || tasteData.topTracks
            };
          }
        } catch (jsonError) {
          console.error('Error parsing taste data:', jsonError);
        }
      }
      
      // Generate seasonal vibes
      const seasonalVibes = generateSeasonalVibes(tasteData.genreProfile);
      
      // Set initial profile with fallback events
      setUserProfile({
        taste: tasteData,
        seasonalVibes,
        events: getFallbackEvents()
      });
      
      setLoading(false);
      
      // Fetch real events after setting initial data
      fetchFilteredEvents();
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError('Failed to load your profile. Please try again.');
      setLoading(false);
    }
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
  
  // Fetch filtered events
  const fetchFilteredEvents = async () => {
    try {
      setEventsLoading(true);
      setEventsError(null);
      
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      if (filters.genre !== 'all') queryParams.append('genre', filters.genre);
      if (filters.venue !== 'all') queryParams.append('venue', filters.venue);
      if (filters.event !== 'all') queryParams.append('event', filters.event);
      if (filters.price !== 'all') queryParams.append('price', filters.price);
      queryParams.append('minMatch', filters.vibeMatch);
      
      // Fetch events with error handling
      const response = await fetch(`/api/events/recommendations?${queryParams.toString()}`)
        .catch(err => {
          console.error('Network error fetching events:', err);
          return { ok: false };
        });
      
      // Process response with validation
      let eventsData = getFallbackEvents();
      
      if (response.ok) {
        try {
          const data = await response.json();
          
          // Validate data structure
          if (data && Array.isArray(data.events) && data.events.length > 0) {
            eventsData = data.events;
          } else if (data && Array.isArray(data) && data.length > 0) {
            eventsData = data;
          }
        } catch (jsonError) {
          console.error('Error parsing events response:', jsonError);
          setEventsError('Error processing event data');
        }
      }
      
      // Update events in user profile
      setUserProfile(prev => ({
        ...prev,
        events: eventsData
      }));
      
    } catch (error) {
      console.error('Error fetching events:', error);
      setEventsError('Failed to load events. Please try again.');
    } finally {
      setEventsLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Fetch events when filters change
  useEffect(() => {
    if (userProfile && !loading) {
      fetchFilteredEvents();
    }
  }, [filters]);
  
  // Get primary genres for display
  const getPrimaryGenres = () => {
    const genreProfile = userProfile?.taste?.genreProfile;
    if (!genreProfile || Object.keys(genreProfile).length === 0) return '';
    
    // Sort genres by value and take top 2
    const sortedGenres = Object.entries(genreProfile)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre.toLowerCase())
      .slice(0, 2);
      
    return sortedGenres.join(' + ');
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black">
        <LoadingSpinner size="large" text="Analyzing your sonic signature..." />
      </div>
    );
  }
  
  if (error && !userProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
        <h2 className="text-2xl text-fuchsia-500 mb-4">Oops!</h2>
        <p className="mb-6">{error}</p>
        <button 
          className="px-4 py-2 bg-black/30 border border-cyan-500 rounded-full text-cyan-400 hover:bg-cyan-500/20 transition"
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
      
      <div className="min-h-screen bg-black text-white">
        <Navigation />
        
        <main className="max-w-5xl mx-auto px-4 pb-12">
          {/* User Summary Banner */}
          <div className="mb-8 mt-4 p-4 rounded-xl bg-gradient-to-r from-cyan-900/50 to-teal-900/50">
            <p className="text-center text-lg">
              You're all about <span className="text-cyan-400 font-medium">{getPrimaryGenres()}</span> with a vibe shift toward <span className="text-teal-400 font-medium">fresh sounds</span>.
            </p>
          </div>
          
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Genre Radar Chart */}
            <div className="bg-black/20 p-6 rounded-xl border border-cyan-500/20">
              <h2 className="text-xl text-cyan-500 font-semibold mb-4">Your Genre Mix</h2>
              <GenreRadarChart genreData={userProfile?.taste?.genreProfile} />
            </div>
            
            {/* Seasonal Vibes */}
            <SeasonalVibes seasonalData={userProfile?.seasonalVibes} />
          </div>
          
          {/* Events section */}
          <div className="mt-12">
            <h2 className="text-2xl text-fuchsia-400 font-semibold mb-6">Events Matching Your Vibe</h2>
            
            {/* Filters */}
            <EventFilters 
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            
            {/* Events list */}
            <EventList 
              events={userProfile?.events} 
              loading={eventsLoading}
              error={eventsError}
            />
          </div>
        </main>
        
        <footer className="p-4 text-center text-gray-500 border-t border-gray-800">
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}
