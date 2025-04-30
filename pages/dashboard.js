import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/DashboardNewLayout.module.css'; // Use new layout styles
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import SoundCharacteristicsCompact from '../components/SoundCharacteristicsCompact'; // Use compact version
import SeasonalVibes from '../components/SeasonalVibes';
import EventsSectionSorted from '../components/EventsSectionSorted'; // Use sorted version
import LocationDisplay from '../components/LocationDisplay';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  // Default location if none is saved or fetched
  const [location, setLocation] = useState({ lat: '43.65', lon: '-79.38', city: 'Toronto' }); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }

    if (session?.user) {
      fetch('/api/user/profile')
        .then(res => res.json())
        .then(data => {
          setUserProfile(data);
          // Optionally fetch initial location from profile if available
          // if (data.location) setLocation(data.location);
          setIsLoading(false);
        })
        .catch(err => {
          console.error('Error fetching user profile:', err);
          setIsLoading(false);
        });
    }

    // Load location from localStorage if available
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
    // Optionally save location to user profile via API
    // fetch('/api/user/set-location', { method: 'POST', body: JSON.stringify(newLocation), headers: {'Content-Type': 'application/json'} });
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

        {/* Combine Sound Characteristics and Seasonal Vibes vertically */}
        <div className={styles.topSection}>
          <div className={styles.card}> {/* Single card for both */} 
            <SoundCharacteristicsCompact profile={userProfile} />
            <SeasonalVibes profile={userProfile} />
            {/* Consider where LocationDisplay fits best in the new layout */}
            {/* <LocationDisplay location={location} onUpdateLocation={updateLocation} /> */}
          </div>
        </div>

        {/* Events Section below */}
        <div className={styles.eventsSection}>
          <EventsSectionSorted location={location} />
        </div>
      </main>
    </div>
  );
}

