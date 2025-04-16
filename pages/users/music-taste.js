import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import styles from '../../styles/MusicTaste.module.css';

export default function MusicTaste()  {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [tasteData, setTasteData] = useState(null);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch music taste data
  useEffect(() => {
    const fetchTasteData = async () => {
      if (status !== 'authenticated') return;

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching music taste data...');
        const response = await fetch('/api/spotify/user-taste');
        const data = await response.json();
        
        if (data.success) {
          console.log('Successfully fetched music taste data');
          setTasteData(data.taste);
        } else {
          console.error('Error in API response:', data.error);
          setError(data.error || 'Failed to load music taste data');
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching music taste data:', error);
        setError('Error fetching music taste data');
        setIsLoading(false);
      }
    };
    
    fetchTasteData();
  }, [status]);

  // Loading state
  if (status === 'loading' || isLoading) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your music taste profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.container}>
        <Navigation activePage="music-taste" />
        <div className={styles.errorContainer}>
          <h1>Error loading music taste</h1>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => {
              setIsLoading(true);
              setError(null);
              fetch('/api/spotify/user-taste')
                .then(res => res.json())
                .then(data => {
                  if (data.success) {
                    setTasteData(data.taste);
                  } else {
                    setError(data.error || 'Failed to load music taste data');
                  }
                  setIsLoading(false);
                })
                .catch(err => {
                  console.error('Error fetching music taste data:', err);
                  setError('Error fetching music taste data');
                  setIsLoading(false);
                });
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render placeholder content until we implement the full page
  return (
    <div className={styles.container}>
      <Navigation activePage="music-taste" />
      <h1>Your Music Taste Profile</h1>
      <p>Data loaded successfully! Full implementation coming soon.</p>
      <pre>{JSON.stringify(tasteData, null, 2)}</pre>
    </div>
  );
}
