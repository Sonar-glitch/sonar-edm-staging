import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import LoadingSkeleton from '../../components/music-taste/LoadingSkeleton';
import ArtistSection from '../../components/music-taste/ArtistSection';
import EventSection from '../../components/music-taste/EventSection';

// Safe localStorage access
const safeStorage = {
  get: (key) => {
    try { return JSON.parse(localStorage.getItem(key)); } 
    catch (e) { return null; }
  },
  set: (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } 
    catch (e) { console.error('Storage error:', e); }
  }
};

const MusicTaste = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserTaste();
    } else if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status]);
  
  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/user-taste');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate data
      const validData = {
        topArtists: Array.isArray(data.topArtists) ? data.topArtists : [],
        topTracks: Array.isArray(data.topTracks) ? data.topTracks : [],
        events: Array.isArray(data.events) ? data.events : [],
        location: data.location || { city: 'Unknown', country: 'Unknown' },
        genres: Array.isArray(data.genres) ? data.genres : []
      };
      
      setUserTaste(validData);
      safeStorage.set('userTasteData', validData);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      
      // Try cached data
      const cached = safeStorage.get('userTasteData');
      if (cached) {
        setUserTaste(cached);
        alert('Using cached data due to error.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <>
        <Head><title>Your Sound | Sonar</title></Head>
        <div className="page-container">
          <h1 className="page-title">Your Sound | Sonar</h1>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p className="mt-4 text-xl">Loading your vibe...</p>
          </div>
        </div>
      </>
    );
  }
  
  if (error && !userTaste) {
    return (
      <>
        <Head><title>Your Sound | Sonar</title></Head>
        <div className="page-container">
          <h1 className="page-title">Your Sound | Sonar</h1>
          <div className="error-container">
            <h3 className="font-bold">Error</h3>
            <p>{error}</p>
            <button 
              onClick={fetchUserTaste}
              className="btn-primary mt-2"
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }
  
  if (!userTaste) {
    return (
      <>
        <Head><title>Your Sound | Sonar</title></Head>
        <div className="page-container">
          <h1 className="page-title">Your Sound | Sonar</h1>
          <p>No data available. Please connect your Spotify account.</p>
        </div>
      </>
    );
  }
  
  return (
    <>
      <Head><title>Your Sound | Sonar</title></Head>
      <div className="page-container">
        <h1 className="page-title">Your Sound | Sonar</h1>
        
        <div className="mb-8">
          <h2 className="section-title">Your Location</h2>
          <p className="text-xl">
            {userTaste.location.city || 'Unknown'}, {userTaste.location.country || 'Unknown'}
          </p>
        </div>
        
        <ArtistSection artists={userTaste.topArtists} />
        <EventSection events={userTaste.events} />
      </div>
    </>
  );
};

export default MusicTaste;
