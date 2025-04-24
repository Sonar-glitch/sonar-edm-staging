import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import SideBySideLayout from '@/components/SideBySideLayout';
import EnhancedEventList from '@/components/EnhancedEventList';
import MobileOptimizedVibeQuiz from '@/components/MobileOptimizedVibeQuiz';
import styles from '@/styles/Dashboard.module.css';

// Import your existing components
// Note: These imports should match your actual component names
import SoundCharacteristics from '@/components/SoundCharacteristics';
import SeasonalVibes from '@/components/SeasonalVibes';

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

  // Fetch user profile and events when session is available
  useEffect(() => {
    if (status === 'authenticated' && session) {
      fetchUserProfile();
      fetchEvents();
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  // Your existing fetchUserProfile function
  const fetchUserProfile = async () => {
    try {
      // In a real app, this would be an API call
      // For now, we'll use mock data
      const mockProfile = {
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
              current: true,
              vibe: 'House, Progressive',
              description: 'Fresh beats & uplifting vibes',
              icon: '🌸'
            },
            {
              name: 'Summer',
              current: false,
              vibe: 'Techno, Tech House',
              description: 'High energy open air sounds',
              icon: '☀️'
            },
            {
              name: 'Fall',
              current: false,
              vibe: 'Organic House, Downtempo',
              description: 'Mellow grooves & deep beats',
              icon: '🍂'
            },
            {
              name: 'Winter',
              current: false,
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
      };
      
      setUserProfile(mockProfile);
    } catch (err) {
      console.error('Error fetching user profile:', err);
      setError('Failed to load your profile. Please try again later.');
    }
  };

  // Your existing fetchEvents function with enhanced mock data
  const fetchEvents = async () => {
    setLoading(true);
    try {
      // In a real app, this would be an API call with filters
      // For now, we'll use mock data
      const mockEvents = [
        {
          id: 'event1',
          name: 'Techno Warehouse Night',
          venue: 'The Underground',
          venueType: 'Warehouse',
          address: '123 Industrial Ave, Brooklyn, NY',
          headliners: ['Charlotte de Witte', 'Amelie Lens', 'FJAAK', 'I Hate Models', 'SNTS', 'Dax J'],
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          matchScore: 92,
          source: 'ticketmaster'
        },
        {
          id: 'event2',
          name: 'Summer House Festival',
          venue: 'Sunset Park',
          venueType: 'Festival',
          address: '456 Parkway Dr, Miami, FL',
          headliners: ['Disclosure', 'Kaytranada', 'The Blessed Madonna', 'Honey Dijon', 'Jayda G'],
          date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          matchScore: 85,
          source: 'edmtrain'
        },
        {
          id: 'event3',
          name: 'Progressive Dreams',
          venue: 'Club Horizon',
          venueType: 'Club',
          address: '789 Downtown Blvd, Los Angeles, CA',
          headliners: ['Hernan Cattaneo', 'Nick Warren', 'Guy J'],
          date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          matchScore: 78,
          source: 'ticketmaster'
        },
        {
          id: 'event4',
          name: 'Melodic Techno Night',
          venue: 'The Loft',
          venueType: 'Rooftop',
          address: '101 Skyline Ave, Chicago, IL',
          headliners: ['Tale Of Us', 'Mind Against', 'Mathame', 'Kevin de Vries'],
          date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          matchScore: 88,
          source: null // Sample data
        }
      ];
      
      // Filter events based on user preferences
      const filteredEvents = mockEvents
        .filter(event => event.matchScore >= vibeMatchFilter)
        .filter(event => eventTypeFilter === 'all' || event.venueType.toLowerCase() === eventTypeFilter.toLowerCase())
        .sort((a, b) => b.matchScore - a.matchScore); // Sort by match score descending
      
      setEvents(filteredEvents);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
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
  }, [vibeMatchFilter, eventTypeFilter, distanceFilter]);

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
            <span className={styles.navItem}>Music Taste</span>
            <span className={styles.navItem}>Events</span>
            <span className={styles.navItem}>Profile</span>
          </div>
        </div>
        
        <div className={styles.summary}>
          You're all about <span className={styles.highlight1}>house</span> + <span className={styles.highlight2}>techno</span> with a vibe shift toward <span className={styles.highlight3}>fresh sounds</span>.
        </div>
        
        {/* Side-by-side layout for sound characteristics and seasonal vibes */}
        <SideBySideLayout>
          {/* Use your existing SoundCharacteristics component */}
          <SoundCharacteristics data={userProfile.soundCharacteristics} />
          
          {/* Use your existing SeasonalVibes component */}
          <SeasonalVibes 
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
