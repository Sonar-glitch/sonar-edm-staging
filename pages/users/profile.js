import React from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Profile.module.css';
import Navigation from '../../components/Navigation';

export default function Profile() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      // In a real implementation, this would fetch from your API
      // For now, we'll use mock data
      const mockProfile = {
        name: 'Music Lover',
        email: 'user@example.com',
        image: 'https://example.com/profile.jpg',
        spotifyConnected: true,
        joinDate: '2024-12-15',
        stats: {
          eventsAttended: 12,
          favoriteGenres: ['Techno', 'House', 'Trance'],
          topArtist: 'DJ Quantum',
          listenTime: '320 hours'
        },
        preferences: {
          notificationsEnabled: true,
          eventRecommendationsEnabled: true,
          locationSharing: 'events-only',
          darkMode: true
        }
      };
      
      // Simulate API delay
      setTimeout(() => {
        setProfile(mockProfile);
        setLoading(false);
      }, 1000);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Profile | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Profile | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.unauthorizedContainer}>
          <h1 className={styles.title}>Sign In to View Your Profile</h1>
          <p className={styles.subtitle}>Connect with Spotify to access your profile</p>
          <Link href="/api/auth/signin" className={styles.connectButton}>
            Connect with Spotify
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Profile | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.errorContainer}>
          <h1 className={styles.title}>Oops! Something went wrong</h1>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchProfile} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Profile | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.noDataContainer}>
          <h1 className={styles.title}>No Profile Data Available</h1>
          <p className={styles.subtitle}>
            We couldn't find your profile data. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Profile | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Profile</h1>
        </div>
        
        <div className={styles.profileContainer}>
          <div className={styles.profileHeader}>
            <div className={styles.profileImageContainer}>
              {profile.image ? (
                <img 
                  src={profile.image} 
                  alt={profile.name} 
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profileImagePlaceholder}>
                  {profile.name.charAt(0)}
                </div>
              )}
            </div>
            
            <div className={styles.profileInfo}>
              <h2 className={styles.profileName}>{profile.name}</h2>
              <p className={styles.profileEmail}>{profile.email}</p>
              
              <div className={styles.connectionStatus}>
                <div className={`${styles.connectionIndicator} ${profile.spotifyConnected ? styles.connected : ''}`}></div>
                <span className={styles.connectionText}>
                  {profile.spotifyConnected ? 'Connected to Spotify' : 'Not connected to Spotify'}
                </span>
              </div>
              
              <p className={styles.joinDate}>
                Member since {new Date(profile.joinDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          
          <div className={styles.profileContent}>
            <div className={styles.statsSection}>
              <h3 className={styles.sectionTitle}>Your Stats</h3>
              
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>🎵</span>
                  <span className={styles.statValue}>{profile.stats.listenTime}</span>
                  <span className={styles.statLabel}>Total Listen Time</span>
                </div>
                
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>🎭</span>
                  <span className={styles.statValue}>{profile.stats.eventsAttended}</span>
                  <span className={styles.statLabel}>Events Attended</span>
                </div>
                
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>👑</span>
                  <span className={styles.statValue}>{profile.stats.topArtist}</span>
                  <span className={styles.statLabel}>Top Artist</span>
                </div>
                
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>🎧</span>
                  <div className={styles.genreTags}>
                    {profile.stats.favoriteGenres.map((genre, index) => (
                      <span key={index} className={styles.genreTag}>{genre}</span>
                    ))}
                  </div>
                  <span className={styles.statLabel}>Favorite Genres</span>
                </div>
              </div>
            </div>
            
            <div className={styles.actionsSection}>
              <Link href="/users/music-taste" className={styles.actionButton}>
                View Music Taste
              </Link>
              
              <Link href="/users/settings" className={styles.actionButton}>
                Edit Settings
              </Link>
              
              <Link href="/users/events" className={styles.actionButton}>
                Find Events
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
