import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SideBySideLayout from '@/components/SideBySideLayout';
import CompactSoundCharacteristics from '@/components/CompactSoundCharacteristics';
import CompactSeasonalVibes from '@/components/CompactSeasonalVibes';
import EnhancedEventList from '@/components/EnhancedEventList';
import MobileOptimizedVibeQuiz from '@/components/MobileOptimizedVibeQuiz';
import LocationDisplay from '@/components/LocationDisplay';
import styles from '@/styles/Dashboard.module.css';

// Set auth requirement for this page
Dashboard.auth = {
  requiredAuth: true
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userProfile, setUserProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);
  const [vibeMatchFilter, setVibeMatchFilter] = useState(70);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [distanceFilter, setDistanceFilter] = useState('all');
  const [userLocation, setUserLocation] = useState(null);

  // Fetch user profile and events when session is available
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchUserProfile();
      fetchUserLocation();
      fetchEvents();
    } else if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [session, status, router]);

  // Fetch user location
  const fetchUserLocation = async () => {
    try {
      const response = await fetch('/api/user/get-location');
      if (response.ok) {
        const data = await response.json();
        setUserLocation(data);
      } else {
        // If API fails, try browser geolocation
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                city: 'Your Location',
                region: '',
                country: ''
              });
            },
            (error) => {
              console.error('Geolocation error:', error);
              // Default to Toronto
              setUserLocation({
                latitude: 43.6532,
                longitude: -79.3832,
                city: 'Toronto',
                region: 'ON',
                country: 'Canada'
              });
            }
          );
        } else {
          // Default to Toronto if geolocation not available
          setUserLocation({
            latitude: 43.6532,
            longitude: -79.3832,
            city: 'Toronto',
            region: 'ON',
            country: 'Canada'
          });
        }
      }
    } catch (err) {
      console.error('Error fetching user location:', err);
      // Default to Toronto
      setUserLocation({
        latitude: 43.6532,
        longitude: -79.3832,
        city: 'Toronto',
        region: 'ON',
        country: 'Canada'
      });
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/spotify/user-taste');
      if (response.ok) {
        const data = await response.json();
        
        // Transform data into the format expected by the components
        const transformedProfile = {
          name: session?.user?.name || 'EDM Enthusiast',
          soundCharacteristics: [
            { name: 'Melody', value: calculateCharacteristic(data, 'melody', 85) },
            { name: 'Danceability', value: calculateCharacteristic(data, 'danceability', 75) },
            { name: 'Energy', value: calculateCharacteristic(data, 'energy', 65) },
            { name: 'Tempo', value: calculateCharacteristic(data, 'tempo', 60) },
            { name: 'Obscurity', value: calculateCharacteristic(data, 'obscurity', 55) }
          ],
          seasonalVibes: {
            yearRound: {
              text: 'Your taste evolves from deep house vibes in winter to high-energy techno in summer, with a consistent appreciation for melodic elements year-round.'
            },
            seasons: [
              {
                name: 'Spring',
                current: getCurrentSeason() === 'spring',
                vibe: 'House, Progressive',
                description: 'Fresh beats & uplifting vibes',
                icon: '🌸'
              },
              {
                name: 'Summer',
                current: getCurrentSeason() === 'summer',
                vibe: 'Techno, Tech House',
                description: 'High energy open air sounds',
                icon: '☀️'
              },
              {
                name: 'Fall',
                current: getCurrentSeason() === 'fall',
                vibe: 'Organic House, Downtempo',
                description: 'Mellow grooves & deep beats',
                icon: '🍂'
              },
              {
                name: 'Winter',
                current: getCurrentSeason() === 'winter',
                vibe: 'Deep House, Ambient Techno',
                description: 'Hypnotic journeys & warm basslines',
                icon: '❄️'
              }
            ]
          },
          preferences: {
            genres: Object.keys(data.genreProfile || {}).slice(0, 3),
            mood: ['Melodic', 'Energetic'],
            tempo: ['Medium', 'Building'],
            discovery: ['Underground', 'Emerging'],
            venues: ['Clubs', 'Festivals']
          }
        };
        
        setUserProfile(transformedProfile);
      } else {
        // Use mock data if API fails
        setUserProfile({
          name: session?.user?.name || 'EDM Enthusiast',
          soundCharacteristics: [
            { name: 'Melody', value: 85 },
            { name: 'Danceability', value: 75 },
            { name: 'Energy', value: 65 },
            { name: 'Tempo', value: 60 },
            { name: 'Obscurity', value: 55 }
          ],
          seasonalVibes: {
            yearRound: {
              text: 'Your taste evolves from deep house vibes in winter to high-energy techno in summer, with a consistent appreciation for melodic elements year-round.'
            },
            seasons: [
              {
                name: 'Spring',
                current: getCurrentSeason() === 'spring',
                vibe: 'House, Progressive',
                description: 'Fresh beats & uplifting vibes',
                icon: '🌸'
              },
              {
                name: 'Summer',
                current: getCurrentSeason() === 'summer',
                vibe: 'Techno, Tech House',
                description: 'High energy open air sounds',
                icon: '☀️'
              },
              {
                name: 'Fall',
                current: getCurrentSeason() === 'fall',
                vibe: 'Organic House, Downtempo',
                description: 'Mellow grooves & deep beats',
                icon: '🍂'
              },
              {
                name: 'Winter',
                current: getCurrentSeason() === 'winter',
                vibe: 'Deep House, Ambient Techno',
                description: 'Hypnotic journeys & warm basslines',
                icon: '❄️'
              }
            ]
          },
          preferences: {
            genres: ['House', 'Techno', 'Progressive'],
            mood: ['Melodic', 'Energetic'],
            tempo: ['Medium', 'Building'],
            discovery: ['Underground', 'Emerging'],
            venues: ['Clubs', 'Festivals']
          }
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load your profile. Please try again later.');
    }
  };

  // Calculate sound characteristic value from user taste data
  const calculateCharacteristic = (data, characteristic, defaultValue) => {
    if (!data) return defaultValue;
    
    switch (characteristic) {
      case 'melody':
        // Calculate from audio features if available
        if (data.audioFeatures && data.audioFeatures.length > 0) {
          const avgAcousticness = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.acousticness || 0), 0) / data.audioFeatures.length;
          const avgInstrumentalness = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.instrumentalness || 0), 0) / data.audioFeatures.length;
          return Math.round((avgAcousticness * 50 + avgInstrumentalness * 50) * 100);
        }
        return defaultValue;
        
      case 'danceability':
        // Direct from audio features
        if (data.audioFeatures && data.audioFeatures.length > 0) {
          const avgDanceability = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.danceability || 0), 0) / data.audioFeatures.length;
          return Math.round(avgDanceability * 100);
        }
        return defaultValue;
        
      case 'energy':
        // Direct from audio features
        if (data.audioFeatures && data.audioFeatures.length > 0) {
          const avgEnergy = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.energy || 0), 0) / data.audioFeatures.length;
          return Math.round(avgEnergy * 100);
        }
        return defaultValue;
        
      case 'tempo':
        // Normalize tempo from BPM to 0-100 scale
        if (data.audioFeatures && data.audioFeatures.length > 0) {
          const avgTempo = data.audioFeatures.reduce((sum, feature) => 
            sum + (feature.tempo || 120), 0) / data.audioFeatures.length;
          // Map typical EDM tempo range (90-150 BPM) to 0-100
          return Math.round(Math.min(100, Math.max(0, (avgTempo - 90) / (150 - 90) * 100)));
        }
        return defaultValue;
        
      case 'obscurity':
        // Inverse of artist popularity
        if (data.artists && data.artists.items && data.artists.items.length > 0) {
          const avgPopularity = data.artists.items.reduce((sum, artist) => 
            sum + (artist.popularity || 50), 0) / data.artists.items.length;
          // Invert popularity (100 - popularity) to get obscurity
          return Math.round(100 - avgPopularity);
        }
        return defaultValue;
        
      default:
        return defaultValue;
    }
  };

  // Get current season
  function getCurrentSeason() {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  }

  // Fetch events
  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Prepare query parameters
      const params = new URLSearchParams();
      
      // Add location if available
      if (userLocation) {
        params.append('lat', userLocation.latitude);
        params.append('lon', userLocation.longitude);
      }
      
      // Fetch events from API
      const response = await fetch(`/api/events/correlated-events?${params.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success && Array.isArray(data.events)) {
          // Filter events based on user preferences
          const filteredEvents = data.events
            .filter(event => event.correlationScore >= vibeMatchFilter)
            .filter(event => eventTypeFilter === 'all' || 
                   (event.venueType && event.venueType.toLowerCase() === eventTypeFilter.toLowerCase()))
            .filter(event => {
              if (distanceFilter === 'all') return true;
              if (!event.distance) return true;
              
              switch (distanceFilter) {
                case 'local':
                  return event.distance <= 25; // Within 25 km
                case 'national':
                  return event.distance > 25 && event.distance <= 500; // 25-500 km
                case 'international':
                  return event.distance > 500; // Over 500 km
                default:
                  return true;
              }
            })
            .sort((a, b) => b.correlationScore - a.correlationScore); // Sort by match score descending
          
          setEvents(filteredEvents);
        } else {
          setError('No events found. Please try again later.');
        }
      } else {
        setError('Failed to load events. Please try again later.');
      }
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Handle vibe quiz submission
  const handleVibeQuizSave = async (selections) => {
    try {
      // In a real app, this would be an API call to update the user profile
      console.log('Saving user preferences with higher weightage:', selections);
      
      // Update local state to reflect changes
      setUserProfile(prev => ({
        ...prev,
        preferences: selections
      }));
      
      // Close the quiz
      setShowVibeQuiz(false);
      
      // Refetch events with updated preferences
      fetchEvents();
    } catch (err) {
      console.error('Error saving preferences:', err);
      alert('Failed to save your preferences. Please try again.');
    }
  };

  // Handle filter changes
  useEffect(() => {
    if (userProfile) {
      fetchEvents();
    }
  }, [vibeMatchFilter, eventTypeFilter, distanceFilter, userLocation]);

  // If loading
  if (status === 'loading' || !userProfile) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.pulseLoader}></div>
        <p>Loading your personalized dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>TIKO | Your Dashboard</title>
        <meta name="description" content="Your personalized electronic music dashboard" />
      </Head>

      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>TIKO</h1>
          <div className={styles.nav}>
            <span className={styles.activeNavItem}>Dashboard</span>
            <span className={styles.navItem} onClick={() => router.push('/users/music-taste')}>Music Taste</span>
            <span className={styles.navItem}>Events</span>
            <span className={styles.navItem}>Profile</span>
          </div>
        </div>
        
        <div className={styles.summary}>
          You're all about <span className={styles.highlight1}>house</span> + <span className={styles.highlight2}>techno</span> with a vibe shift toward <span className={styles.highlight3}>fresh sounds</span>.
        </div>
        
        {/* Location display */}
        {userLocation && <LocationDisplay location={userLocation} />}
        
        {/* Side-by-side layout for sound characteristics and seasonal vibes */}
        <SideBySideLayout>
          <CompactSoundCharacteristics data={userProfile.soundCharacteristics} />
          <CompactSeasonalVibes 
            data={userProfile.seasonalVibes} 
            onFeedbackClick={() => setShowVibeQuiz(true)}
          />
        </SideBySideLayout>
        
        {/* Event filters */}
        <div className={styles.filtersSection}>
          <h3 className={styles.filtersTitle}>Events Matching Your Vibe</h3>
          
          <div className={styles.vibeMatchFilter}>
            <label htmlFor="vibeMatch">Vibe Match: {vibeMatchFilter}%+</label>
            <input
              type="range"
              id="vibeMatch"
              min="0"
              max="100"
              value={vibeMatchFilter}
              onChange={(e) => setVibeMatchFilter(parseInt(e.target.value))}
              className={styles.slider}
            />
          </div>
          
          <div className={styles.moreFiltersToggle}>
            <button 
              className={styles.moreFiltersButton}
              onClick={() => setShowMoreFilters(!showMoreFilters)}
            >
              {showMoreFilters ? 'Hide Filters' : 'More Filters'}
            </button>
          </div>
          
          {showMoreFilters && (
            <div className={styles.additionalFilters}>
              <div className={styles.filterGroup}>
                <label>Event Type:</label>
                <div className={styles.filterOptions}>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'all' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'club' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('club')}
                  >
                    Club
                  </button>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'warehouse' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('warehouse')}
                  >
                    Warehouse
                  </button>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'festival' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('festival')}
                  >
                    Festival
                  </button>
                  <button 
                    className={`${styles.filterOption} ${eventTypeFilter === 'rooftop' ? styles.activeFilter : ''}`}
                    onClick={() => setEventTypeFilter('rooftop')}
                  >
                    Rooftop
                  </button>
                </div>
              </div>
              
              <div className={styles.filterGroup}>
                <label>Distance:</label>
                <div className={styles.filterOptions}>
                  <button 
                    className={`${styles.filterOption} ${distanceFilter === 'all' ? styles.activeFilter : ''}`}
                    onClick={() => setDistanceFilter('all')}
                  >
                    All
                  </button>
                  <button 
                    className={`${styles.filterOption} ${distanceFilter === 'local' ? styles.activeFilter : ''}`}
                    onClick={() => setDistanceFilter('local')}
                  >
                    Local
                  </button>
                  <button 
                    className={`${styles.filterOption} ${distanceFilter === 'national' ? styles.activeFilter : ''}`}
                    onClick={() => setDistanceFilter('national')}
                  >
                    National
                  </button>
                  <button 
                    className={`${styles.filterOption} ${distanceFilter === 'international' ? styles.activeFilter : ''}`}
                    onClick={() => setDistanceFilter('international')}
                  >
                    International
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Enhanced event list */}
        <EnhancedEventList 
          events={events} 
          loading={loading} 
          error={error} 
        />
        
        {/* Mobile-optimized vibe quiz (shown when user clicks "No" on "Did we get it right?") */}
        {showVibeQuiz && (
          <div className={styles.modalOverlay}>
            <MobileOptimizedVibeQuiz 
              onSave={handleVibeQuizSave}
              onClose={() => setShowVibeQuiz(false)}
              initialSelections={userProfile.preferences}
            />
          </div>
        )}
      </div>
    </>
  );
}
