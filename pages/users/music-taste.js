import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import Head from 'next/head';
import ErrorBoundary from '../../components/common/ErrorBoundary';
import LoadingSkeleton from '../../components/music-taste/LoadingSkeleton';
import ErrorDisplay from '../../components/music-taste/ErrorDisplay';
import ArtistSection from '../../components/music-taste/ArtistSection';
import EventSection from '../../components/music-taste/EventSection';
import LoadingSpinner from '../../components/music-taste/LoadingSpinner';

// Safely access localStorage with try/catch
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.error('Error accessing localStorage:', e);
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Error setting localStorage:', e);
    }
  }
};

const MusicTaste = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add timeout state to handle API timeouts
  const [isTimedOut, setIsTimedOut] = useState(false);
  
  useEffect(() => {
    // Set a timeout for API calls
    const timeoutId = setTimeout(() => {
      if (loading) {
        setIsTimedOut(true);
        // Try to use cached data if available
        const cachedData = safeLocalStorage.getItem('userTasteData');
        if (cachedData) {
          try {
            setUserTaste(JSON.parse(cachedData));
            setLoading(false);
          } catch (e) {
            console.error('Error parsing cached data:', e);
          }
        }
      }
    }, 15000); // 15 second timeout
    
    return () => clearTimeout(timeoutId);
  }, [loading]);
  
  useEffect(() => {
    // Only fetch if authenticated
    if (status === 'authenticated') {
      fetchUserTaste();
    } else if (status === 'unauthenticated') {
      // Redirect to home if not authenticated
      router.push('/');
    }
    
    // Cleanup function
    return () => {
      // Any cleanup needed
    };
  }, [status]);
  
  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/spotify/user-taste');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate data structure to prevent null reference errors
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received');
      }
      
      // Ensure required properties exist
      const validatedData = {
        topArtists: Array.isArray(data.topArtists) ? data.topArtists : [],
        topTracks: Array.isArray(data.topTracks) ? data.topTracks : [],
        events: Array.isArray(data.events) ? data.events : [],
        location: data.location || { city: 'Unknown', country: 'Unknown' },
        genres: Array.isArray(data.genres) ? data.genres : []
      };
      
      setUserTaste(validatedData);
      
      // Cache the validated data
      safeLocalStorage.setItem('userTasteData', JSON.stringify(validatedData));
      
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message || 'Failed to load your music taste data');
      
      // Try to use cached data if available
      const cachedData = safeLocalStorage.getItem('userTasteData');
      if (cachedData) {
        try {
          setUserTaste(JSON.parse(cachedData));
          // Show toast notification
          alert('Using cached data. We encountered an error but loaded your previous data.');
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <div className="container-xl py-8">
          <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
          {isTimedOut ? (
            <ErrorDisplay 
              message="Taking longer than expected. Please wait or refresh the page." 
              retry={fetchUserTaste} 
            />
          ) : (
            <LoadingSpinner message="Loading your vibe..." />
          )}
        </div>
      </>
    );
  }
  
  // Render error state
  if (error && !userTaste) {
    return (
      <>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <div className="container-xl py-8">
          <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
          <ErrorDisplay message={error} retry={fetchUserTaste} />
        </div>
      </>
    );
  }
  
  // Safely check if userTaste exists before rendering
  if (!userTaste) {
    return (
      <>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <div className="container-xl py-8">
          <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
          <p>No music taste data available. Please connect your Spotify account.</p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Head>
        <title>Your Sound | Sonar</title>
      </Head>
      <div className="container-xl py-8">
        <h1 className="text-3xl font-bold mb-6">Your Sound | Sonar</h1>
        
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">
            Your Location
          </h2>
          <p className="text-xl">
            {userTaste.location && (
              <>
                {userTaste.location.city || 'Unknown City'}, {userTaste.location.country || 'Unknown Country'}
              </>
            )}
          </p>
        </div>
        
        <ErrorBoundary>
          <ArtistSection artists={userTaste.topArtists || []} />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <EventSection events={userTaste.events || []} />
        </ErrorBoundary>
      </div>
    </>
  );
};

export default MusicTaste;
