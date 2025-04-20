import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import GenreRadarChart from '@/components/GenreRadarChart';
import styles from '@/styles/Profile.module.css';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Fetch user profile data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserProfile();
    }
  }, [status]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch taste data
      const tasteResponse = await fetch('/api/spotify/user-taste');
      
      // Fetch user events
      const eventsResponse = await fetch('/api/user/events');
      
      // Fetch user stats
      const statsResponse = await fetch('/api/user/stats');

      if (!tasteResponse.ok) {
        throw new Error('Failed to load user taste data');
      }

      const tasteData = await tasteResponse.json();
      let eventsData = { past: [], upcoming: [] };
      let statsData = { 
        eventCount: 0, 
        genreCount: 0,
        artistCount: 0,
        firstJoined: new Date().toISOString()
      };

      // Try to get events data if available
      if (eventsResponse.ok) {
        eventsData = await eventsResponse.json();
      }

      // Try to get stats data if available
      if (statsResponse.ok) {
        statsData = await statsResponse.json();
      }

      // Construct profile object
      setProfile({
        user: {
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
          firstJoined: statsData.firstJoined,
          location: statsData.location || 'Not set'
        },
        taste: {
          genreProfile: tasteData.genreProfile || {},
          topArtists: tasteData.topArtists?.items || [],
          topTracks: tasteData.topTracks?.items || [],
          mood: tasteData.mood
        },
        events: {
          past: eventsData.past || [],
          upcoming: eventsData.upcoming || [],
          saved: eventsData.saved || []
        },
        stats: {
          eventCount: statsData.eventCount || 0,
          genreCount: statsData.genreCount || 0,
          artistCount: statsData.artistCount || 0
        }
      });

      setLoading(false);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to load your profile data.');
      setLoading(false);
    }
  };

  // Format date string
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  // Use fallback data if error or no profile
  const userData = profile?.user || {
    name: session?.user?.name || 'User',
    email: session?.user?.email || 'user@example.com',
    image: session?.user?.image,
    firstJoined: new Date().toISOString(),
    location: 'Not set'
  };

  const tasteData = profile?.taste || {
    genreProfile: {
      'Melodic House': 75,
      'Techno': 65,
      'Progressive House': 60,
      'Deep House': 55,
      'Trance': 45
    },
    topArtists: [],
    topTracks: [],
    mood: 'Chillwave Flow'
  };

  const statsData = profile?.stats || {
    eventCount: 0,
    genreCount: 0,
    artistCount: 0
  };

  const upcomingEvents = profile?.events?.upcoming || [];
  const pastEvents = profile?.events?.past || [];

  return (
    <>
      <Head>
        <title>Your Profile | TIKO</title>
        <meta name="description" content="Your TIKO profile and music taste" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Profile</h1>
          <Link href="/users/dashboard" className={styles.backLink}>
            Back to Dashboard
          </Link>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
            <button onClick={fetchUserProfile} className={styles.retryButton}>
              Try Again
            </button>
          </div>
        )}

        <div className={styles.profileGrid}>
          <div className={styles.userCard}>
            <div className={styles.userHeader}>
              {userData.image ? (
                <Image
                  src={userData.image}
                  alt={userData.name}
                  width={100}
                  height={100}
                  className={styles.userImage}
                />
              ) : (
                <div className={styles.userImagePlaceholder}>
                  {userData.name.charAt(0)}
                </div>
              )}
              <div className={styles.userInfo}>
                <h2 className={styles.userName}>{userData.name}</h2>
                <p className={styles.userEmail}>{userData.email}</p>
                <p className={styles.userLocation}>
                  <svg className={styles.locationIcon} width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor" />
                  </svg>
                  {userData.location}
                </p>
              </div>
            </div>
            <div className={styles.userDetails}>
              <div className={styles.userStat}>
                <span className={styles.statValue}>{statsData.eventCount}</span>
                <span className={styles.statLabel}>Events</span>
              </div>
              <div className={styles.userStat}>
                <span className={styles.statValue}>{statsData.genreCount}</span>
                <span className={styles.statLabel}>Genres</span>
              </div>
              <div className={styles.userStat}>
                <span className={styles.statValue}>{statsData.artistCount}</span>
                <span className={styles.statLabel}>Artists</span>
              </div>
            </div>
            <div className={styles.userFooter}>
              <p className={styles.joinDate}>
                Member since: {formatDate(userData.firstJoined)}
              </p>
              <Link href="/users/settings" className={styles.settingsLink}>
                Edit Profile
              </Link>
            </div>
          </div>

          <div className={styles.tasteCard}>
            <h2 className={styles.cardTitle}>Your Sonic Signature</h2>
            <p className={styles.moodLine}>
              Current Vibe: <span className={styles.moodValue}>{tasteData.mood}</span>
            </p>
            <div className={styles.chartContainer}>
              <GenreRadarChart genreData={tasteData.genreProfile} />
            </div>
            <div className={styles.cardFooter}>
              <Link href="/users/music-taste" className={styles.viewMoreLink}>
                View Detailed Analysis
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.eventSection}>
          <h2 className={styles.sectionTitle}>Your Upcoming Events</h2>
          
          {upcomingEvents.length > 0 ? (
            <div className={styles.eventGrid}>
              {upcomingEvents.slice(0, 3).map((event) => (
                <div key={event.id} className={styles.eventCard}>
                  <div className={styles.eventHeader}>
                    <span className={styles.eventDate}>{formatDate(event.date)}</span>
                    <span className={styles.eventMatch}>{event.matchScore}% Match</span>
                  </div>
                  <h3 className={styles.eventTitle}>{event.name}</h3>
                  <p className={styles.eventVenue}>{event.venue}</p>
                  <p className={styles.eventLocation}>
                    <svg className={styles.locationIconSmall} width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM12 11.5C10.62 11.5 9.5 10.38 9.5 9C9.5 7.62 10.62 6.5 12 6.5C13.38 6.5 14.5 7.62 14.5 9C14.5 10.38 13.38 11.5 12 11.5Z" fill="currentColor" />
                    </svg>
                    {event.location}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>You don't have any upcoming events yet.</p>
              <Link href="/events" className={styles.findEventsLink}>
                Find Events
              </Link>
            </div>
          )}
          
          {upcomingEvents.length > 3 && (
            <div className={styles.viewAllContainer}>
              <Link href="/users/events" className={styles.viewAllLink}>
                View All Events
              </Link>
            </div>
          )}
        </div>

        {pastEvents.length > 0 && (
          <div className={styles.eventSection}>
            <h2 className={styles.sectionTitle}>Events You've Attended</h2>
            
            <div className={styles.eventGrid}>
              {pastEvents.slice(0, 3).map((event) => (
                <div key={event.id} className={styles.eventCard}>
                  <div className={styles.eventHeader}>
                    <span className={styles.eventDate}>{formatDate(event.date)}</span>
                    <span className={styles.pastEvent}>Attended</span>
                  </div>
                  <h3 className={styles.eventTitle}>{event.name}</h3>
                  <p className={styles.eventVenue}>{event.venue}</p>