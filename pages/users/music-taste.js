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
