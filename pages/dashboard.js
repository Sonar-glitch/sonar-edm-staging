import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import SoundCharacteristics from '../components/SoundCharacteristics';
import SeasonalVibes from '../components/SeasonalVibes';
import EventsSection from '../components/EventsSection';
import LocationDisplay from '../components/LocationDisplay';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [location, setLocation] = useState({ lat: '43.65', lon: '-79.38', city: 'Toronto' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (status === 'unauthenticated') {
      router.push('/');
    }

    // Load user profile
    if (session?.user) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          setUserProfile(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching user profile:', err);
          setIsLoading(false);
        });
    }

    // Initialize location
    try {
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const parsedLocation = JSON.parse(savedLocation);
        if (parsedLocation && parsedLocation.lat && parsedLocation.lon) {
          setLocation(parsedLocation);
        }
      }
    } catch (error) {
      console.error('Error handling location:', error);
    }
  }, [session, status, router]);

  const updateLocation = (newLocation) => {
    setLocation(newLocation);
    try {
      localStorage.setItem('userLocation', JSON.stringify(newLocation));
    } catch (error) {
      console.error('Error saving location:', error);
    }
  };

  if (status === 'loading' || isLoading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>TIKO - Your Dashboard</title>
        <meta name="description" content="Your personalized EDM dashboard" />
        <link rel="icon" href="/favicon.ico" />
        <script src="/js/service-worker-bypass.js" defer></script>
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>TIKO</h1>
        
        <p className={styles.description}>
          You're all about <span className={styles.house}>house</span> + <span className={styles.techno}>techno</span> with a vibe shift toward <span className={styles.fresh}>fresh sounds</span>.
        </p>

        <div className={styles.grid}>
          <div className={styles.card}>
            <SoundCharacteristics profile={userProfile} />
            <LocationDisplay location={location} onUpdateLocation={updateLocation} />
          </div>

          <div className={styles.card}>
            <SeasonalVibes profile={userProfile} />
          </div>
        </div>

        <div className={styles.eventsSection}>
          <EventsSection location={location} />
        </div>
      </main>
    </div>
  );
}
