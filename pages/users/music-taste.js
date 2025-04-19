import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import LoadingSkeleton from '../../components/music-taste/LoadingSkeleton';
import ArtistSection from '../../components/music-taste/ArtistSection';
import EventSection from '../../components/music-taste/EventSection';
import Navigation from '../../components/Navigation';
import SpiderChart from '../../components/SpiderChart';
import SeasonalMoodCard from '../../components/SeasonalMoodCard';

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
      
      // Try cache first (simple caching)
      const cached = safeStorage.get('userTasteData');
      const cacheTime = safeStorage.get('userTasteData_timestamp');
      const now = Date.now();
      
      // Use cache if less than 1 hour old
      if (cached && cacheTime && (now - cacheTime < 3600000)) {
        console.log('Using cached data');
        setUserTaste(cached);
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/spotify/user-taste');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setUserTaste(data);
      
      // Cache the result
      safeStorage.set('userTasteData', data);
      safeStorage.set('userTasteData_timestamp', now);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      
      // Try cached data
      const cached = safeStorage.get('userTasteData');
      if (cached) {
        setUserTaste(cached);
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <>
        <Head><title>Your Sound | Sonar</title></Head>
        <Navigation />
        <div className="page-container">
          <h1 className="page-title">Your Sound | Sonar</h1>
          <LoadingSkeleton />
        </div>
      </>
    );
  }
  
  if (error && !userTaste) {
    return (
      <>
        <Head><title>Your Sound | Sonar</title></Head>
        <Navigation />
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
        <Navigation />
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
      <Navigation />
      <div className="page-container">
        <h1 className="page-title">Your Sound | Sonar</h1>
        
        <div className="mb-8">
          <h2 className="section-title">Your Location</h2>
          <p className="text-xl">
            {userTaste.location?.city || 'Unknown'}, {userTaste.location?.country || 'Unknown'}
          </p>
        </div>
        
        {/* Genre Visualization Section */}
        <div className="mb-12">
          <h2 className="section-title">Your Genre Affinity</h2>
          {userTaste.genres && userTaste.genres.length > 0 && (
            <SpiderChart genres={userTaste.genres.map(genre => ({
              name: genre,
              score: Math.floor(Math.random() * 40) + 60
            }))} />
          )}
        </div>
        
        {/* Seasonal Mood Analysis Section */}
        <div className="mb-12">
          <h2 className="section-title">Seasonal Mood Analysis</h2>
          {userTaste.seasonalMood && (
            <SeasonalMoodCard seasonalMood={userTaste.seasonalMood} />
          )}
        </div>
        
        <ArtistSection artists={userTaste.topArtists} />
        <EventSection events={userTaste.events} />
      </div>
    </>
  );
};

export default MusicTaste;
