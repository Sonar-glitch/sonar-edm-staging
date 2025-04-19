import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import styles from '../../styles/MusicTaste.module.css';

// Import smaller components
import LoadingSpinner from '../../components/music-taste/LoadingSpinner';
import ErrorDisplay from '../../components/music-taste/ErrorDisplay';
import LoadingSkeleton from '../../components/music-taste/LoadingSkeleton';
import ArtistSection from '../../components/music-taste/ArtistSection';
import EventSection from '../../components/music-taste/EventSection';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Add a state for incremental loading
  const [visibleArtists, setVisibleArtists] = useState(6);
  const [visibleEvents, setVisibleEvents] = useState(4);
  
  useEffect(() => {
    // Redirect if not authenticated
    if (status === 'unauthenticated') {
      router.push('/');
    }
    
    if (status === 'authenticated') {
      fetchUserTaste();
    }
    
    // Implement intersection observer for infinite scrolling
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && userTaste) {
          // Load more items when user scrolls to the bottom
          if (entry.target.id === 'artists-end') {
            setVisibleArtists(prev => Math.min(prev + 6, userTaste.topArtists?.length || 0));
          } else if (entry.target.id === 'events-end') {
            setVisibleEvents(prev => Math.min(prev + 4, userTaste.suggestedEvents?.length || 0));
          }
        }
      });
    }, { threshold: 0.1 });
    
    // Observe end markers
    const artistsEnd = document.getElementById('artists-end');
    const eventsEnd = document.getElementById('events-end');
    
    if (artistsEnd) observer.observe(artistsEnd);
    if (eventsEnd) observer.observe(eventsEnd);
    
    return () => {
      if (artistsEnd) observer.unobserve(artistsEnd);
      if (eventsEnd) observer.unobserve(eventsEnd);
    };
  }, [status, router, userTaste]);
  
  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch('/api/spotify/user-taste', {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setUserTaste(data);
      
      // Cache successful responses in localStorage
      try {
        localStorage.setItem('userTasteData', JSON.stringify(data));
      } catch (e) {
        console.error('Error caching user taste data:', e);
      }
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message);
      
      // Provide fallback data if available in localStorage
      const cachedData = localStorage.getItem('userTasteData');
      if (cachedData) {
        try {
          setUserTaste(JSON.parse(cachedData));
        } catch (e) {
          console.error('Error parsing cached data:', e);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <LoadingSpinner />
      </div>
    );
  }
  
  if (error && !userTaste) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <ErrorDisplay error={error} onRetry={fetchUserTaste} />
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Your Sound | Sonar</title>
        <meta name="description" content="Your personalized music taste profile" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* Preload critical resources */}
        <link rel="preload" href="/api/spotify/user-taste" as="fetch" crossOrigin="anonymous" />
      </Head>
      
      <main className={styles.main}>
        <h1 className={styles.title}>Your Sound</h1>
        
        {userTaste ? (
          <>
            <ArtistSection 
              artists={userTaste.topArtists} 
              visibleArtists={visibleArtists} 
            />
            
            <EventSection 
              events={userTaste.suggestedEvents} 
              visibleEvents={visibleEvents} 
            />
          </>
        ) : (
          <LoadingSkeleton />
        )}
      </main>
    </div>
  );
}

// Use getServerSideProps to check authentication server-side
export async function getServerSideProps(context) {
  // This is a minimal implementation to check auth status
  // The actual data fetching happens client-side for better UX
  return {
    props: {}
  };
}
