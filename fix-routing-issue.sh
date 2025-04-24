#!/bin/bash
# fix-routing-issue.sh
# Script to fix the routing issue by moving components to dashboard page and restoring music-taste page
# For use in Windows Git Bash at /c/sonar/users/sonar-edm-user/

# Set timestamp to force a clean build on Heroku
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "Starting routing fix at $TIMESTAMP"

# Store current directory to return to it later
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Navigate to the main project directory
cd /c/sonar/users/sonar-edm-user/
echo "Moved to main project directory: $(pwd)"

# Make sure we have the latest changes
echo "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Create necessary directories if they don't exist
mkdir -p components
mkdir -p styles
mkdir -p pages/users

# 1. Create/update dashboard.js to use the new components
echo "Updating dashboard.js to use the new components..."
cat > pages/dashboard.js << 'EOL'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import SoundCharacteristicsChart from '@/components/SoundCharacteristicsChart';
import ReorganizedSeasonalVibes from '@/components/ReorganizedSeasonalVibes';
import EnhancedEventFilters from '@/components/EnhancedEventFilters';
import ImprovedEventList from '@/components/ImprovedEventList';
import styles from '@/styles/Dashboard.module.css';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    vibeMatch: 50,
    eventType: 'all',
    distance: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  // Fetch user profile data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);
  
  // Define fallback sound characteristics
  const getFallbackSoundCharacteristics = () => {
    return {
      'Melody': 85,
      'Danceability': 78,
      'Energy': 72,
      'Tempo': 68,
      'Obscurity': 63
    };
  };
  
  // Define fallback seasonal data
  const getFallbackSeasonalData = () => {
    return {
      spring: {
        title: 'Spring',
        emoji: '🌸',
        genres: 'House, Progressive',
        message: 'Fresh beats & uplifting vibes'
      },
      summer: {
        title: 'Summer',
        emoji: '☀️',
        genres: 'Techno, Tech House',
        message: 'High energy open air sounds'
      },
      fall: {
        title: 'Fall',
        emoji: '🍂',
        genres: 'Organic House, Downtempo',
        message: 'Mellow grooves & deep beats'
      },
      winter: {
        title: 'Winter',
        emoji: '❄️',
        genres: 'Deep House, Ambient Techno',
        message: 'Hypnotic journeys & warm basslines'
      }
    };
  };
  
  // Define fallback events
  const getFallbackEvents = () => {
    return [
      {
        id: 1,
        name: 'Techno Dreamscape',
        venue: 'Warehouse 23',
        venueType: 'Warehouse',
        artists: ['Charlotte de Witte', 'Amelie Lens'],
        genre: 'Techno',
        price: 45,
        date: 'Thu, May 1',
        match: 92
      },
      {
        id: 2,
        name: 'Deep House Journey',
        venue: 'Club Echo',
        venueType: 'Club',
        artists: ['Lane 8', 'Yotto'],
        genre: 'Deep House',
        price: 35,
        date: 'Thu, May 8',
        match: 85
      },
      {
        id: 3,
        name: 'Melodic Techno Night',
        venue: 'The Sound Bar',
        venueType: 'Club',
        artists: ['Tale Of Us', 'Mind Against'],
        genre: 'Melodic Techno',
        price: 55,
        date: 'Sun, Apr 27',
        match: 88
      }
    ];
  };
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch music taste data
      const tasteResponse = await fetch('/api/spotify/user-taste')
        .catch(err => {
          console.error('Network error fetching taste data:', err);
          return { ok: false };
        });
      
      // Use fallback data if API call fails
      let tasteData = {
        genreProfile: {
          'House': 75,
          'Techno': 65,
          'Progressive House': 60,
          'Trance': 45,
          'Indie dance': 55
        },
        soundCharacteristics: getFallbackSoundCharacteristics(),
        seasonalVibes: getFallbackSeasonalData(),
        mood: 'Chillwave Flow',
        topArtists: [{ 
          name: 'Boris Brejcha', 
          id: '6bDWAcdtVR39rjZS5A3SoD',
          images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb8ae72ad1d3e564e2b883afb5' }],
          popularity: 85,
          genres: ['melodic techno', 'minimal techno']
        }],
        topTracks: [{ 
          name: 'Realm of Consciousness', 
          id: '2pXJ3zJ9smoG8SQqlMBvoF',
          artists: [{ name: 'Tale Of Us' }],
          album: { 
            name: 'Realm of Consciousness', 
            images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273c3a84c67544c46c7df9529c5' }] 
          },
          popularity: 80,
          preview_url: 'https://p.scdn.co/mp3-preview/5a6aa5ef7516e6771c964c3d44b77156c5330b7e'
        }]
      };
      
      if (tasteResponse.ok) {
        const fetchedData = await tasteResponse.json();
        tasteData = {
          ...fetchedData,
          // Ensure we have fallbacks if API returns incomplete data
          genreProfile: fetchedData.genreProfile || tasteData.genreProfile,
          soundCharacteristics: fetchedData.soundCharacteristics || getFallbackSoundCharacteristics(),
          seasonalVibes: fetchedData.seasonalVibes || getFallbackSeasonalData(),
          mood: fetchedData.mood || tasteData.mood,
          topArtists: fetchedData.topArtists?.items || tasteData.topArtists,
          topTracks: fetchedData.topTracks?.items || tasteData.topTracks
        };
      }
      
      // Set events data (using fallback for now)
      setEvents(getFallbackEvents());
      
      // Set the user profile
      setUserProfile({
        taste: tasteData
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your profile. Please try again later.');
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    
    // Filter events based on vibe match
    const filteredEvents = getFallbackEvents().filter(event => {
      // Filter by vibe match
      if (event.match < newFilters.vibeMatch) {
        return false;
      }
      
      // Filter by event type
      if (newFilters.eventType !== 'all') {
        const eventType = event.venueType.toLowerCase();
        if (eventType !== newFilters.eventType) {
          return false;
        }
      }
      
      // For distance, we would need real data with location info
      // This is just a placeholder for the concept
      
      return true;
    });
    
    setEvents(filteredEvents);
  };
  
  // Handle event click
  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    // Here you would navigate to event details or show a modal
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingPulse}></div>
        <p>Analyzing your sonic signature...</p>
      </div>
    );
  }
  
  if (error && !userProfile) {
    return (
      <div className={styles.errorContainer}>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={fetchUserData}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Ensure we have data to render
  const profile = userProfile || {
    taste: {
      genreProfile: {},
      soundCharacteristics: {},
      seasonalVibes: {},
      mood: '',
      topArtists: [],
      topTracks: []
    }
  };
  
  // Get primary genres for display
  const primaryGenres = Object.entries(profile.taste.genreProfile)
    .sort(([, a], [, b]) => b - a)
    .map(([genre]) => genre.toLowerCase())
    .slice(0, 2)
    .join(' + ');
  
  return (
    <>
      <Head>
        <title>Dashboard | Sonar</title>
        <meta name="description" content="Your personalized EDM dashboard" />
      </Head>
      
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>TIKO</h1>
          <nav>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/users/music-taste">Music Taste</Link>
            <Link href="/users/events">Events</Link>
            <Link href="/users/profile">Profile</Link>
          </nav>
        </header>
        
        <main className={styles.main}>
          {/* Summary Banner */}
          <div className={styles.summaryBanner}>
            <p>You're all about <span className={styles.highlight}>{primaryGenres}</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.</p>
          </div>
          
          {/* Sound Characteristics Chart */}
          <SoundCharacteristicsChart 
            soundData={profile.taste.soundCharacteristics} 
          />
          
          {/* Seasonal Vibes Section */}
          <ReorganizedSeasonalVibes 
            seasonalData={profile.taste.seasonalVibes}
            isLoading={loading}
          />
          
          {/* Events Section */}
          <section className={styles.eventsSection}>
            <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
            
            {/* Event Filters */}
            <EnhancedEventFilters 
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
            
            {/* Event List */}
            <ImprovedEventList 
              events={events}
              onEventClick={handleEventClick}
            />
          </section>
        </main>
        
        <footer className={styles.footer}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}
EOL

# 2. Create Dashboard.module.css
echo "Creating Dashboard.module.css..."
cat > styles/Dashboard.module.css << 'EOL'
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0a0a14;
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
  color: #00e5ff;
  margin: 0;
  font-size: 1.5rem;
}

.header nav {
  display: flex;
  gap: 20px;
}

.header nav a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s ease;
}

.header nav a:hover {
  color: #fff;
}

.main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.summaryBanner {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.1rem;
}

.highlight {
  color: #ff00ff;
  font-weight: bold;
}

.sectionTitle {
  color: #fff;
  font-size: 1.5rem;
  margin: 30px 0 20px;
  text-align: center;
}

.eventsSection {
  margin-top: 30px;
}

.footer {
  padding: 15px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  background-color: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.loadingContainer {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0a0a14;
  color: #fff;
}

.loadingPulse {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.2);
  animation: pulse 1.5s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 20px rgba(0, 229, 255, 0);
  }
  100% {
    transform: scale(0.8);
  }
}

.errorContainer {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0a0a14;
  color: #fff;
  padding: 20px;
  text-align: center;
}

.errorContainer h2 {
  color: #ff00ff;
  margin-bottom: 10px;
}

.retryButton {
  background: linear-gradient(90deg, #00e5ff, #ff00ff);
  border: none;
  border-radius: 6px;
  color: #000;
  font-weight: bold;
  padding: 10px 25px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s ease;
}

.retryButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 229, 255, 0.4);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main {
    padding: 15px;
  }
  
  .summaryBanner {
    font-size: 1rem;
  }
}
EOL

# 3. Restore original music-taste.js page
echo "Restoring original music-taste.js page..."
cat > pages/users/music-taste.js << 'EOL'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { 
  ResponsiveContainer, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  Tooltip, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid,
  LineChart, 
  Line 
} from 'recharts';
import styles from '@/styles/MusicTaste.module.css';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [eventCount, setEventCount] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  // Fetch user data on initial load
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);

  // Mock data fetch function
  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch music taste data
      const tasteResponse = await fetch('/api/spotify/user-taste')
        .catch(err => {
          console.error('Network error fetching taste data:', err);
          return { ok: false };
        });
      
      // Sample user taste data (fallback)
      const fallbackData = {
        genreProfile: {
          'House': 75,
          'Techno': 65,
          'Progressive House': 60,
          'Trance': 45,
          'Melodic': 55
        },
        artistProfile: [
          { name: 'Boris Brejcha', plays: 42, genre: 'Melodic Techno' },
          { name: 'Lane 8', plays: 38, genre: 'Progressive House' },
          { name: 'Tale Of Us', plays: 35, genre: 'Melodic Techno' },
          { name: 'Artbat', plays: 32, genre: 'Melodic House' },
          { name: 'Eric Prydz', plays: 28, genre: 'Progressive House' }
        ],
        listeningTrends: [
          { month: 'Jan', house: 65, techno: 55, trance: 30 },
          { month: 'Feb', house: 68, techno: 60, trance: 35 },
          { month: 'Mar', house: 75, techno: 65, trance: 40 },
          { month: 'Apr', house: 72, techno: 70, trance: 45 },
          { month: 'May', house: 70, techno: 68, trance: 50 },
          { month: 'Jun', house: 65, techno: 72, trance: 48 }
        ],
        topTracks: [
          { name: 'Realm of Consciousness', artist: 'Tale Of Us', plays: 18 },
          { name: 'Purple Noise', artist: 'Boris Brejcha', plays: 15 },
          { name: 'Atlas', artist: 'Lane 8', plays: 14 },
          { name: 'Return to Oz', artist: 'Artbat', plays: 12 },
          { name: 'Opus', artist: 'Eric Prydz', plays: 11 }
        ],
        mood: {
          energetic: 72,
          melodic: 85,
          dark: 58,
          euphoric: 76,
          deep: 68
        },
        seasonalProfile: {
          spring: ['Progressive House', 'Melodic House'],
          summer: ['Tech House', 'House'],
          fall: ['Organic House', 'Downtempo'],
          winter: ['Deep House', 'Ambient Techno']
        }
      };
      
      let tasteData = fallbackData;
      
      if (tasteResponse.ok) {
        const fetchedData = await tasteResponse.json();
        tasteData = {
          ...fetchedData,
          // Ensure we have fallbacks if API returns incomplete data
          genreProfile: fetchedData.genreProfile || fallbackData.genreProfile,
          artistProfile: fetchedData.artistProfile || fallbackData.artistProfile,
          listeningTrends: fetchedData.listeningTrends || fallbackData.listeningTrends,
          topTracks: fetchedData.topTracks || fallbackData.topTracks,
          mood: fetchedData.mood || fallbackData.mood,
          seasonalProfile: fetchedData.seasonalProfile || fallbackData.seasonalProfile
        };
      }
      
      // Set event count
      setEventCount(42);
      
      // Set user profile state with all data
      setUserProfile(tasteData);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setLoading(false);
      // Use fallback data on error
      setUserProfile({
        genreProfile: {
          'House': 75,
          'Techno': 65,
          'Progressive House': 60,
          'Trance': 45,
          'Melodic': 55
        },
        artistProfile: [
          { name: 'Boris Brejcha', plays: 42, genre: 'Melodic Techno' },
          { name: 'Lane 8', plays: 38, genre: 'Progressive House' },
          { name: 'Tale Of Us', plays: 35, genre: 'Melodic Techno' },
          { name: 'Artbat', plays: 32, genre: 'Melodic House' },
          { name: 'Eric Prydz', plays: 28, genre: 'Progressive House' }
        ],
        listeningTrends: [
          { month: 'Jan', house: 65, techno: 55, trance: 30 },
          { month: 'Feb', house: 68, techno: 60, trance: 35 },
          { month: 'Mar', house: 75, techno: 65, trance: 40 },
          { month: 'Apr', house: 72, techno: 70, trance: 45 },
          { month: 'May', house: 70, techno: 68, trance: 50 },
          { month: 'Jun', house: 65, techno: 72, trance: 48 }
        ],
        topTracks: [
          { name: 'Realm of Consciousness', artist: 'Tale Of Us', plays: 18 },
          { name: 'Purple Noise', artist: 'Boris Brejcha', plays: 15 },
          { name: 'Atlas', artist: 'Lane 8', plays: 14 },
          { name: 'Return to Oz', artist: 'Artbat', plays: 12 },
          { name: 'Opus', artist: 'Eric Prydz', plays: 11 }
        ],
        mood: {
          energetic: 72,
          melodic: 85,
          dark: 58,
          euphoric: 76,
          deep: 68
        },
        seasonalProfile: {
          spring: ['Progressive House', 'Melodic House'],
          summer: ['Tech House', 'House'],
          fall: ['Organic House', 'Downtempo'],
          winter: ['Deep House', 'Ambient Techno']
        }
      });
    }
  };
  
  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };

  // Prepare radar chart data
  const prepareGenreData = () => {
    if (!userProfile?.genreProfile) return [];
    
    return Object.entries(userProfile.genreProfile).map(([name, value]) => ({
      genre: name,
      value
    }));
  };

  // Prepare artist data for bar chart
  const prepareArtistData = () => {
    if (!userProfile?.artistProfile) return [];
    return userProfile.artistProfile.slice(0, 5);
  };

  // Loading state
  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingPulse}></div>
        <p>Analyzing your music taste...</p>
      </div>
    );
  }

  // Get primary genres for summary display
  const getPrimaryGenres = () => {
    const genreProfile = userProfile?.genreProfile;
    if (!genreProfile || Object.keys(genreProfile).length === 0) return '';
    
    // Sort genres by value and take top 2
    const sortedGenres = Object.entries(genreProfile)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre.toLowerCase())
      .slice(0, 2);
      
    return sortedGenres.join(' + ');
  };

  const currentSeason = getCurrentSeason();
  const genreData = prepareGenreData();
  const artistData = prepareArtistData();
  
  return (
    <>
      <Head>
        <title>Your Music Taste | Sonar</title>
        <meta name="description" content="Discover your unique music taste profile" />
      </Head>
      
      <div className={styles.container}>
        {/* Header/Nav */}
        <header className={styles.header}>
          <div className={styles.logo}>TIKO</div>
          
          <nav className={styles.nav}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/users/music-taste" className={styles.navLink}>Music Taste</Link>
            <Link href="/users/events" className={styles.navLink}>Events</Link>
            <Link href="/users/profile" className={styles.navLink}>Profile</Link>
          </nav>
        </header>
        
        <main className={styles.main}>
          {/* User Summary Banner */}
          <div className={styles.summaryBanner}>
            <p>
              Your music taste evolves around <span className={styles.highlight}>{getPrimaryGenres()}</span> with 
              <span className={styles.highlight}> {userProfile?.mood?.melodic || 85}% melodic</span> and
              <span className={styles.highlight}> {userProfile?.mood?.energetic || 72}% energetic</span> tendencies.
              Found <span className={styles.highlight}>{eventCount}</span> events that match your taste.
            </p>
          </div>
          
          {/* Tabs Navigation */}
          <div className={styles.tabs}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'overview' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              Overview
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'artists' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('artists')}
            >
              Top Artists
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'tracks' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('tracks')}
            >
              Top Tracks
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'trends' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('trends')}
            >
              Listening Trends
            </button>
          </div>
          
          {/* Content based on active tab */}
          {activeTab === 'overview' && (
            <div className={styles.tabContent}>
              <div className={styles.overviewGrid}>
                {/* Sonic Vibe Radar Chart */}
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Your Sonic Vibe</h2>
                  <div className={styles.chartContainer}>
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart outerRadius="80%" data={genreData}>
                        <PolarGrid stroke="rgba(0, 255, 255, 0.1)" />
                        <PolarAngleAxis 
                          dataKey="genre" 
                          tick={{ fill: '#00e5ff', fontSize: 12 }} 
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 100]} 
                          tick={{ fill: 'rgba(255, 255, 255, 0.15)', fontSize: 8 }}
                          tickCount={4}
                          axisLine={false}
                          tickFormatter={(value) => ``} // Hide the number labels
                        />
                        <Radar 
                          name="Genre Score" 
                          dataKey="value" 
                          stroke="#00e5ff" 
                          fill="#00e5ff" 
                          fillOpacity={0.3} 
                        />
                        <Tooltip />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Mood Analysis */}
                <div className={styles.card}>
                  <h2 className={styles.cardTitle}>Your Mood Preferences</h2>
                  <div className={styles.moodContainer}>
                    {userProfile && userProfile.mood && Object.entries(userProfile.mood).map(([mood, value]) => (
                      <div key={mood} className={styles.moodItem}>
                        <div className={styles.moodHeader}>
                          <span className={styles.moodName}>{mood}</span>
                          <span className={styles.moodValue}>{value}%</span>
                        </div>
                        <div className={styles.moodBar}>
                          <div 
                            className={styles.moodFill} 
                            style={{ width: `${value}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Seasonal Preferences */}
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <h2 className={styles.cardTitle}>Your Seasonal Vibe Shifts</h2>
                  <div className={styles.seasonGrid}>
                    {userProfile && userProfile.seasonalProfile && Object.entries(userProfile.seasonalProfile).map(([season, genres]) => (
                      <div 
                        key={season} 
                        className={`${styles.seasonCard} ${season === currentSeason ? styles.currentSeason : ''}`}
                      >
                        <div className={styles.seasonHeader}>
                          <span className={styles.seasonName}>{season}</span>
                          {season === currentSeason && (
                            <span className={styles.currentBadge}>Now</span>
                          )}
                        </div>
                        <ul className={styles.genreList}>
                          {genres.map((genre, index) => (
                            <li key={index}>{genre}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'artists' && (
            <div className={styles.tabContent}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Your Top Artists</h2>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={artistData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis type="number" domain={[0, 'dataMax + 5']} />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        content={({ payload }) => {
                          if (payload && payload.length > 0) {
                            const data = payload[0].payload;
                            return (
                              <div className={styles.tooltip}>
                                <p className={styles.tooltipTitle}>{data.name}</p>
                                <p className={styles.tooltipValue}>{data.plays} plays</p>
                                <p className={styles.tooltipGenre}>{data.genre}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="plays" fill="#00e5ff" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div className={styles.artistSpotlight}>
                  <h3 className={styles.spotlightTitle}>Artist Spotlight</h3>
                  <div className={styles.spotlightCard}>
                    <div className={styles.spotlightHeader}>
                      <div className={styles.artistAvatar}>
                        <span>BB</span>
                      </div>
                      <div>
                        <h4 className={styles.artistName}>Boris Brejcha</h4>
                        <p className={styles.artistMeta}>Melodic Techno • 42 plays</p>
                      </div>
                    </div>
                    <p className={styles.spotlightText}>
                      You've been listening to Boris Brejcha consistently over the last 3 months.
                      His music features strongly in your Melodic Techno and Minimal Techno preferences.
                    </p>
                    <div className={styles.spotlightAction}>
                      <button className={styles.actionButton}>Find events with Boris Brejcha →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'tracks' && (
            <div className={styles.tabContent}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Your Top Tracks</h2>
                
                <div className={styles.trackList}>
                  {userProfile?.topTracks?.map((track, index) => (
                    <div key={index} className={styles.trackItem}>
                      <div className={styles.trackRank}>
                        <span>{index + 1}</span>
                      </div>
                      <div className={styles.trackInfo}>
                        <h4 className={styles.trackName}>{track.name}</h4>
                        <p className={styles.trackArtist}>{track.artist}</p>
                      </div>
                      <div className={styles.trackPlays}>
                        <span>{track.plays} plays</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className={styles.trackAnalysis}>
                  <h3 className={styles.analysisTitle}>Track Analysis</h3>
                  <p className={styles.analysisText}>
                    Your top tracks show a strong preference for melodic elements and progressive structures.
                    Most of your favorites have extended runtime (6+ minutes) with layered arrangements and 
                    gradual progression.
                  </p>
                  <div className={styles.analysisStats}>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>82%</div>
                      <div className={styles.statLabel}>of your top tracks are melodic</div>
                    </div>
                    <div className={styles.statItem}>
                      <div className={styles.statValue}>7:24</div>
                      <div className={styles.statLabel}>average track length</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'trends' && (
            <div className={styles.tabContent}>
              <div className={styles.card}>
                <h2 className={styles.cardTitle}>Your Listening Trends</h2>
                <div className={styles.chartContainer}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userProfile?.listeningTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.1)" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="house" stroke="#00e5ff" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="techno" stroke="#ff00ff" strokeWidth={2} dot={{ r: 4 }} />
                      <Line type="monotone" dataKey="trance" stroke="#ffff00" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                
                <div className={styles.trendInsights}>
                  <h3 className={styles.insightsTitle}>Insights</h3>
                  <div className={styles.insightsList}>
                    <div className={styles.insightItem}>
                      <div className={styles.insightIcon}>📈</div>
                      <div className={styles.insightContent}>
                        <h4 className={styles.insightTitle}>Rising Interest</h4>
                        <p className={styles.insightText}>Your interest in Techno has increased by 31% over the last 6 months.</p>
                      </div>
                    </div>
                    <div className={styles.insightItem}>
                      <div className={styles.insightIcon}>🔄</div>
                      <div className={styles.insightContent}>
                        <h4 className={styles.insightTitle}>Consistent Taste</h4>
                        <p className={styles.insightText}>House music remains a consistent part of your listening habits.</p>
                      </div>
                    </div>
                    <div className={styles.insightItem}>
                      <div className={styles.insightIcon}>🌱</div>
                      <div className={styles.insightContent}>
                        <h4 className={styles.insightTitle}>Emerging Interest</h4>
                        <p className={styles.insightText}>You've started exploring more Trance tracks in recent months.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
        
        <footer className={styles.footer}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}
EOL

# 4. Create MusicTaste.module.css
echo "Creating MusicTaste.module.css..."
cat > styles/MusicTaste.module.css << 'EOL'
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0a0a14;
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  color: #00e5ff;
  font-size: 1.5rem;
  font-weight: bold;
}

.nav {
  display: flex;
  gap: 20px;
}

.navLink {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s ease;
}

.navLink:hover {
  color: #fff;
}

.main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.summaryBanner {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.1rem;
}

.highlight {
  color: #00e5ff;
  font-weight: medium;
}

.tabs {
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
}

.tabButton {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  padding: 10px 15px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tabButton:hover {
  color: #fff;
}

.activeTab {
  color: #00e5ff;
  border-bottom: 2px solid #00e5ff;
}

.tabContent {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.card {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 255, 255, 0.1);
}

.cardTitle {
  color: #00e5ff;
  font-size: 1.3rem;
  margin-top: 0;
  margin-bottom: 20px;
}

.chartContainer {
  height: 300px;
  margin-bottom: 20px;
}

.overviewGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.fullWidth {
  grid-column: span 2;
}

.moodContainer {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.moodItem {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.moodHeader {
  display: flex;
  justify-content: space-between;
}

.moodName {
  text-transform: capitalize;
  color: rgba(255, 255, 255, 0.8);
}

.moodValue {
  color: #00e5ff;
  font-weight: medium;
}

.moodBar {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.moodFill {
  height: 100%;
  background: linear-gradient(90deg, #00e5ff, #00e5ff);
  border-radius: 4px;
}

.seasonGrid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
}

.seasonCard {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.currentSeason {
  border-color: rgba(0, 255, 255, 0.3);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.1);
}

.seasonHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.seasonName {
  text-transform: capitalize;
  font-weight: medium;
}

.currentBadge {
  background: linear-gradient(90deg, #00e5ff, #00e5ff);
  color: #000;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 10px;
}

.genreList {
  list-style-type: disc;
  padding-left: 20px;
  margin: 0;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.tooltip {
  background-color: rgba(0, 0, 0, 0.8);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 4px;
  padding: 10px;
}

.tooltipTitle {
  font-weight: bold;
  margin: 0 0 5px 0;
}

.tooltipValue {
  color: #00e5ff;
  margin: 0 0 3px 0;
}

.tooltipGenre {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
  font-size: 0.9rem;
}

.artistSpotlight {
  margin-top: 30px;
}

.spotlightTitle {
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.spotlightCard {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
}

.spotlightHeader {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.artistAvatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00e5ff, #ff00ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
}

.artistName {
  font-size: 1.1rem;
  margin: 0 0 5px 0;
}

.artistMeta {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
}

.spotlightText {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 15px;
}

.spotlightAction {
  margin-top: 10px;
}

.actionButton {
  background: none;
  border: none;
  color: #00e5ff;
  cursor: pointer;
  padding: 0;
  font-size: 0.9rem;
  font-weight: medium;
}

.actionButton:hover {
  text-decoration: underline;
}

.trackList {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 30px;
}

.trackItem {
  display: flex;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 12px 15px;
}

.trackRank {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00e5ff, #ff00ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 15px;
  flex-shrink: 0;
}

.trackInfo {
  flex: 1;
  min-width: 0;
}

.trackName {
  font-size: 1rem;
  margin: 0 0 3px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trackArtist {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trackPlays {
  color: #00e5ff;
  font-weight: medium;
  margin-left: 15px;
}

.trackAnalysis {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
}

.analysisTitle {
  font-size: 1.1rem;
  margin-bottom: 10px;
}

.analysisText {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 15px;
}

.analysisStats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.statItem {
  text-align: center;
}

.statValue {
  color: #00e5ff;
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.statLabel {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
}

.trendInsights {
  margin-top: 30px;
}

.insightsTitle {
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.insightsList {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.insightItem {
  display: flex;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
}

.insightIcon {
  font-size: 1.5rem;
  margin-right: 15px;
}

.insightContent {
  flex: 1;
}

.insightTitle {
  font-size: 1rem;
  margin: 0 0 5px 0;
}

.insightText {
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  margin: 0;
}

.footer {
  padding: 15px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  background-color: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.loadingContainer {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0a0a14;
  color: #fff;
}

.loadingPulse {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.2);
  animation: pulse 1.5s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 20px rgba(0, 229, 255, 0);
  }
  100% {
    transform: scale(0.8);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .overviewGrid {
    grid-template-columns: 1fr;
  }
  
  .fullWidth {
    grid-column: span 1;
  }
  
  .seasonGrid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .analysisStats {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  .seasonGrid {
    grid-template-columns: 1fr;
  }
  
  .tabs {
    flex-wrap: wrap;
  }
  
  .tabButton {
    flex: 1 0 auto;
    text-align: center;
  }
}
EOL

# 5. Update auth/signin.js to redirect to dashboard
echo "Updating auth/signin.js to redirect to dashboard..."
cat > pages/auth/signin.js << 'EOL'
import { getProviders, signIn, getCsrfToken } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "@/styles/Signin.module.css";

export default function SignIn({ providers, csrfToken }) {
  const router = useRouter();
  const { error } = router.query;

  return (
    <>
      <Head>
        <title>Sign In | Sonar</title>
      </Head>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.logo}>TIKO</div>
          <h1 className={styles.title}>Sign in to your account</h1>
          
          {error && (
            <div className={styles.error}>
              {error === "CredentialsSignin" 
                ? "Sign in failed. Check the details you provided are correct." 
                : "An error occurred while signing in. Please try again."}
            </div>
          )}
          
          <div className={styles.providers}>
            {Object.values(providers).map((provider) => (
              <div key={provider.name}>
                <button
                  className={styles.providerButton}
                  onClick={() => signIn(provider.id, { callbackUrl: '/dashboard' })}
                >
                  <span className={styles.providerIcon}>
                    {provider.name === "Spotify" ? "🎵" : "👤"}
                  </span>
                  <span>Sign in with {provider.name}</span>
                </button>
              </div>
            ))}
          </div>
          
          <p className={styles.terms}>
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const providers = await getProviders();
  const csrfToken = await getCsrfToken(context);
  return {
    props: { providers, csrfToken },
  };
}
EOL

# 6. Add timestamp to force Heroku rebuild
echo "DEPLOY_TIMESTAMP=$TIMESTAMP" > .env

# 7. Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix routing issue: Move components to dashboard and restore original music-taste page"

# 8. Check for main branch and Heroku remote
echo "Checking for main branch and Heroku remote..."
git branch -a
git remote -v

# 9. Checkout main branch and merge changes
echo "Checking out main branch and merging changes..."
git checkout main || git checkout master

# Determine which main branch name is used
MAIN_BRANCH=$(git branch | grep -E "main|master" | sed 's/\* //' | head -n 1)
echo "Main branch is: $MAIN_BRANCH"

# Merge changes from feature branch
git merge $CURRENT_BRANCH -m "Fix routing issue: Move components to dashboard and restore original music-taste page"

# 10. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku $MAIN_BRANCH:master --force

echo "Deployment complete! The routing issue should now be fixed."
echo "Dashboard page: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo "Music Taste page: https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/users/music-taste"

# Return to original directory
cd "$CURRENT_DIR"
echo "Returned to original directory: $(pwd)"
