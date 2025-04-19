import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useInView } from 'react-intersection-observer';
import dynamic from 'next/dynamic';
import LoadingSkeleton from '../../components/music-taste/LoadingSkeleton';
import ArtistSection from '../../components/music-taste/ArtistSection';
import EventSection from '../../components/music-taste/EventSection';
import Navigation from '../../components/Navigation';
import { SkeletonCard, SkeletonSpiderChart } from '../../components/SkeletonLoaders';

// Dynamic imports with loading fallbacks
const SpiderChart = dynamic(() => import('../../components/SpiderChart'), { 
  ssr: false,
  loading: () => <SkeletonSpiderChart />
});

const SeasonalMoodCard = dynamic(() => import('../../components/SeasonalMoodCard'), { 
  ssr: false,
  loading: () => <SkeletonCard height="300px" />
});

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
  
  // Intersection observer for lazy loading sections
  const [genreRef, genreInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  const [seasonalRef, seasonalInView] = useInView({ triggerOnce: true, threshold: 0.1 });
  
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
      
      // Cache configuration
      const cacheKey = 'userTasteData';
      const cacheExpiry = 3600000; // 1 hour in milliseconds
      
      // Try to get from cache first
      const cachedData = safeStorage.get(cacheKey);
      const cacheTimestamp = safeStorage.get(cacheKey + '_timestamp');
      const now = Date.now();
      
      // Use cache if valid and not expired
      if (cachedData && cacheTimestamp && (now - cacheTimestamp < cacheExpiry)) {
        console.log('Using cached data');
        setUserTaste(cachedData);
        setLoading(false);
        
        // Fetch in background to update cache silently
        setTimeout(() => fetchAndUpdateCache(), 100);
        return;
      }
      
      // No valid cache, fetch from API
      const response = await fetch('/api/spotify/user-taste');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate and process data
      const validData = {
        topArtists: Array.isArray(data.topArtists) ? data.topArtists : [],
        topTracks: Array.isArray(data.topTracks) ? data.topTracks : [],
        events: Array.isArray(data.events) ? data.events : [],
        location: data.location || { city: 'Unknown', country: 'Unknown' },
        genres: Array.isArray(data.genres) ? data.genres : [],
        seasonalMood: data.seasonalMood || {
          currentSeason: {
            name: 'Spring',
            topGenres: ['House', 'Techno'],
            mood: 'Energetic',
            energy: 75
          },
          previousSeason: {
            name: 'Winter',
            topGenres: ['Ambient', 'Deep House']
          },
          seasonalShift: {
            intensity: 65,
            changes: [
              'More uptempo tracks',
              'Brighter melodies',
              'Less atmospheric elements'
            ]
          }
        }
      };
      
      // Update state and cache
      setUserTaste(validData);
      safeStorage.set(cacheKey, validData);
      safeStorage.set(cacheKey + '_timestamp', now);
      
    } catch (err) {
      console.error('Error:', err);
      setError(err.message);
      
      // Try cached data as fallback
      const cached = safeStorage.get('userTasteData');
      if (cached) {
        setUserTaste(cached);
        console.log('Using cached data due to error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update cache in background
  const fetchAndUpdateCache = async () => {
    try {
      const response = await fetch('/api/spotify/user-taste');
      if (response.ok) {
        const data = await response.json();
        
        // Validate and process data
        const validData = {
          topArtists: Array.isArray(data.topArtists) ? data.topArtists : [],
          topTracks: Array.isArray(data.topTracks) ? data.topTracks : [],
          events: Array.isArray(data.events) ? data.events : [],
          location: data.location || { city: 'Unknown', country: 'Unknown' },
          genres: Array.isArray(data.genres) ? data.genres : [],
          seasonalMood: data.seasonalMood || {
            currentSeason: {
              name: 'Spring',
              topGenres: ['House', 'Techno'],
              mood: 'Energetic',
              energy: 75
            },
            previousSeason: {
              name: 'Winter',
              topGenres: ['Ambient', 'Deep House']
            },
            seasonalShift: {
              intensity: 65,
              changes: [
                'More uptempo tracks',
                'Brighter melodies',
                'Less atmospheric elements'
              ]
            }
          }
        };
        
        // Update cache silently
        safeStorage.set('userTasteData', validData);
        safeStorage.set('userTasteData_timestamp', Date.now());
        console.log('Cache updated in background');
      }
    } catch (err) {
      console.error('Background fetch error:', err);
    }
  };
  
  if (loading) {
    return (
      <>
        <Head>
          <title>Your Sound | Sonar</title>
          <link rel="preconnect" href="https://i.scdn.co" />
          <link rel="preconnect" href="https://mosaic.scdn.co" />
          <link rel="dns-prefetch" href="https://i.scdn.co" />
          <link rel="dns-prefetch" href="https://mosaic.scdn.co" />
        </Head>
        <Navigation />
        <div className="page-container">
          <h1 className="page-title">Your Sound | Sonar</h1>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p className="mt-4 text-xl">Loading your vibe...</p>
          </div>
        </div>
      </>
    ) ;
  }
  
  if (error && !userTaste) {
    return (
      <>
        <Head>
          <title>Your Sound | Sonar</title>
          <link rel="preconnect" href="https://i.scdn.co" />
          <link rel="preconnect" href="https://mosaic.scdn.co" />
        </Head>
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
    ) ;
  }
  
  if (!userTaste) {
    return (
      <>
        <Head>
          <title>Your Sound | Sonar</title>
          <link rel="preconnect" href="https://i.scdn.co" />
          <link rel="preconnect" href="https://mosaic.scdn.co" />
        </Head>
        <Navigation />
        <div className="page-container">
          <h1 className="page-title">Your Sound | Sonar</h1>
          <p>No data available. Please connect your Spotify account.</p>
        </div>
      </>
    ) ;
  }
  
  return (
    <>
      <Head>
        <title>Your Sound | Sonar</title>
        <link rel="preconnect" href="https://i.scdn.co" />
        <link rel="preconnect" href="https://mosaic.scdn.co" />
        <link rel="dns-prefetch" href="https://i.scdn.co" />
        <link rel="dns-prefetch" href="https://mosaic.scdn.co" />
      </Head>
      <Navigation />
      <div className="page-container">
        <h1 className="page-title">Your Sound | Sonar</h1>
        
        <div className="mb-8">
          <h2 className="section-title">Your Location</h2>
          <p className="text-xl">
            {userTaste.location.city || 'Unknown'}, {userTaste.location.country || 'Unknown'}
          </p>
        </div>
        
        {/* Genre Visualization Section */}
        <div ref={genreRef} className="mb-12">
          <h2 className="section-title">Your Genre Affinity</h2>
          {genreInView && userTaste.genres.length > 0 && (
            <SpiderChart genres={userTaste.genres.map(genre => ({
              name: genre,
              score: Math.floor(Math.random()  * 40) + 60 // Generate random scores between 60-100 if real scores not available
            }))} />
          )}
        </div>
        
        {/* Seasonal Mood Analysis Section */}
        <div ref={seasonalRef} className="mb-12">
          <h2 className="section-title">Seasonal Mood Analysis</h2>
          {seasonalInView && userTaste.seasonalMood && (
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
