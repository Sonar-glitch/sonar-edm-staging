import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '@/components/Header';
import SoundCharacteristicsChart from '@/components/SoundCharacteristicsChart';
import ReorganizedSeasonalVibes from '@/components/ReorganizedSeasonalVibes';
import UserFeedbackGrid from '@/components/UserFeedbackGrid';
import EnhancedEventFilters from '@/components/EnhancedEventFilters';
import ImprovedEventList from '@/components/ImprovedEventList';
import styles from '@/styles/Dashboard.module.css';

// VERSION: Improved dashboard with better space usage - April 24, 2025

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [eventsError, setEventsError] = useState(null);
  const [error, setError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [filters, setFilters] = useState({
    vibeMatch: 50,
    eventType: 'all',
    distance: 'all'
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
  
  // Define fallback events to use when API fails
  const getFallbackEvents = () => {
    const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    
    return [
      {
        id: 'fb-1',
        name: 'Tale of Us',
        venue: 'Output',
        venueType: 'Club',
        location: 'New York',
        date: daysFromNow(7),
        headliners: 'Tale of Us, Mind Against, Mathame',
        primaryGenre: 'Melodic Techno',
        matchScore: 92
      },
      {
        id: 'fb-2',
        name: 'Afterlife NYC',
        venue: 'Brooklyn Mirage',
        venueType: 'Open Air',
        location: 'Brooklyn',
        date: daysFromNow(14),
        headliners: 'Anyma, Colyn, Kevin de Vries',
        primaryGenre: 'Deep House',
        matchScore: 85
      },
      {
        id: 'fb-3',
        name: 'Time Warp US',
        venue: 'Avant Gardner',
        venueType: 'Warehouse',
        location: 'Manhattan',
        date: daysFromNow(3),
        headliners: 'Boris Brejcha, Amelie Lens, Charlotte de Witte',
        primaryGenre: 'Minimal Techno',
        matchScore: 95
      }
    ];
  };
  
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
        try {
          const recData = await recommendationsResponse.json();
          recommendations.artists = recData.artists || [];
          recommendations.tracks = recData.tracks || [];
          console.log("Loaded recommendations successfully:", recommendations);
        } catch (recError) {
          console.error("Error parsing recommendations:", recError);
        }
      }
      
      // Set the initial user profile with fallback events
      setUserProfile({
        taste: tasteData,
        seasonalVibes,
        recommendations,
        events: getFallbackEvents() // Use fallback events initially
      });
      
      setLoading(false);
      
      // After setting initial data, fetch real events
      fetchFilteredEvents();
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your profile. Please try again later.');
      setLoading(false);
    }
  };
  
  // Fetch filtered events when filters change
  useEffect(() => {
    if (userProfile && !loading) {
      fetchFilteredEvents();
    }
  }, [filters, userProfile, loading]);
  
  const fetchFilteredEvents = async () => {
    // Skip if we don't need to fetch
    if (!userProfile) return;
    
    try {
      setEventsLoading(true);
      setEventsError(null);
      
      // Prepare query parameters
      const queryParams = new URLSearchParams();
      if (filters.eventType !== 'all') queryParams.append('eventType', filters.eventType);
      if (filters.distance !== 'all') queryParams.append('distance', filters.distance);
      queryParams.append('minMatch', filters.vibeMatch);
      
      console.log("Events API request:", queryParams.toString());
      
      // Fetch events with filters
      const eventsResponse = await fetch(`/api/events/recommendations?${queryParams.toString()}`)
        .catch(err => {
          console.error('Network error fetching events:', err);
          return { ok: false };
        });
      
      console.log("Events API response status:", eventsResponse.status);
      
      // Fall back to predefined events if API call fails
      let eventsData = getFallbackEvents();
      
      if (eventsResponse.ok) {
        try {
          const response = await eventsResponse.json();
          console.log("Events API response data:", response);
          
          // Ensure we have an array of events, even if API returns an empty array
          if (response && response.events && Array.isArray(response.events)) {
            if (response.events.length > 0) {
              console.log("Using events from API:", response.events.length);
              eventsData = response.events;
            } else {
              console.log("API returned empty events array, using fallbacks");
            }
          } else {
            console.log("Invalid events format from API, using fallbacks:", response);
          }
        } catch (jsonError) {
          console.error("Error parsing events response:", jsonError);
          setEventsError("Error parsing event data");
        }
      } else {
        console.log("Using fallback event data due to API error");
      }
      
      // Force array type and handle nulls
      if (!Array.isArray(eventsData)) {
        console.log("eventsData is not an array, fixing:", eventsData);
        eventsData = Array.isArray(eventsData?.events) ? eventsData.events : getFallbackEvents();
      }
      
      console.log("Final events data to set:", eventsData.length);
      
      // Update events in user profile
      setUserProfile(prev => {
        const updated = {
          ...prev,
          events: eventsData
        };
        console.log("Updated profile with events:", updated.events.length);
        return updated;
      });
      
    } catch (error) {
      console.error('Error fetching events:', error);
      // Use fallback events on error
      setUserProfile(prev => ({
        ...prev,
        events: getFallbackEvents()
      }));
    } finally {
      setEventsLoading(false);
    }
  };
  
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };
  
  // Handle user feedback submission
  const handleFeedbackSubmit = (preferences) => {
    console.log("User submitted preferences:", preferences);
    // Here you would typically send this data to your API
    // to update the user's profile with higher weightage
    
    // For now, just close the feedback form
    setShowFeedback(false);
    
    // Show a success message
    alert("Thank you for your feedback! Your profile has been updated.");
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
      soundCharacteristics: {},
      mood: '',
      topArtists: [],
      topTracks: []
    },
    seasonalVibes: null,
    events: []
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
      
      <div className={styles.container}>
        <Header />
        
        <main className={styles.main}>
          {/* Summary Banner */}
          <div className={styles.summaryBanner}>
            <p>You're all about <span className={styles.highlight}>{primaryGenres}</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.</p>
          </div>
          
          {/* Sound Characteristics Chart - Replacing the radar chart */}
          <SoundCharacteristicsChart 
            soundData={profile.taste.soundCharacteristics} 
          />
          
          {/* Reorganized Seasonal Vibes */}
          <ReorganizedSeasonalVibes 
            seasonalData={profile.seasonalVibes}
            isLoading={loading}
          />
          
          {/* User Feedback Grid - Shown when feedback button is clicked */}
          {showFeedback && (
            <div className={styles.feedbackOverlay}>
              <div className={styles.feedbackContainer}>
                <button 
                  className={styles.closeButton}
                  onClick={() => setShowFeedback(false)}
                >
                  ×
                </button>
                <UserFeedbackGrid onSubmit={handleFeedbackSubmit} />
              </div>
            </div>
          )}
          
          {/* Events section */}
          <div className={styles.eventsSection}>
            <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
            
            {/* Enhanced Event Filters */}
            <EnhancedEventFilters 
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
            
            {/* Improved Event List */}
            <ImprovedEventList 
              events={profile.events} 
              loading={eventsLoading}
              error={eventsError}
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
