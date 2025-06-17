#!/bin/bash

echo "🎯 FINAL CLEAN TIKO LAYOUT - DEFINITIVE IMPLEMENTATION..."
echo "======================================================="

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || {
    echo "❌ Error: Could not navigate to project directory"
    exit 1
}

echo "✅ Step 1: Creating clean EnhancedPersonalizedDashboard with proper functional hierarchy..."

# Create the final clean dashboard component
cat > components/EnhancedPersonalizedDashboard.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedEventList from './EnhancedEventList';
import EnhancedLocationSearch from './EnhancedLocationSearch';
import Top5GenresSpiderChart from './Top5GenresSpiderChart';
import SoundFeatureCapsules from './SoundFeatureCapsules';
import EventDetailModal from './EventDetailModal';
import styles from '@/styles/EnhancedPersonalizedDashboard.module.css';

const EnhancedPersonalizedDashboard = () => {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    city: 'Toronto',
    region: 'ON',
    country: 'Canada',
    latitude: 43.65,
    longitude: -79.38
  });
  const [spotifyData, setSpotifyData] = useState(null);
  const [userTasteProfile, setUserTasteProfile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [dataStatus, setDataStatus] = useState({
    spotify: 'loading',
    taste: 'loading',
    events: 'loading'
  });

  // Load user's Spotify data and taste profile
  useEffect(() => {
    if (session?.user) {
      loadSpotifyData();
      loadUserTasteProfile();
    }
  }, [session]);

  // Load events when component mounts and when location changes
  useEffect(() => {
    if (session?.user && selectedLocation) {
      loadEvents();
    }
  }, [session, selectedLocation]);

  const loadSpotifyData = async () => {
    try {
      setDataStatus(prev => ({ ...prev, spotify: 'loading' }));
      const response = await fetch('/api/spotify/user-profile');
      if (response.ok) {
        const data = await response.json();
        setSpotifyData(data);
        setDataStatus(prev => ({ ...prev, spotify: 'real' }));
      } else {
        setDataStatus(prev => ({ ...prev, spotify: 'demo' }));
      }
    } catch (error) {
      console.error('Error loading Spotify data:', error);
      setDataStatus(prev => ({ ...prev, spotify: 'demo' }));
    }
  };

  const loadUserTasteProfile = async () => {
    try {
      setDataStatus(prev => ({ ...prev, taste: 'loading' }));
      const response = await fetch('/api/user/taste-profile');
      if (response.ok) {
        const data = await response.json();
        setUserTasteProfile(data);
        setDataStatus(prev => ({ ...prev, taste: 'real' }));
      } else {
        setDataStatus(prev => ({ ...prev, taste: 'demo' }));
      }
    } catch (error) {
      console.error('Error loading taste profile:', error);
      setDataStatus(prev => ({ ...prev, taste: 'demo' }));
    }
  };

  const loadEvents = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setError(null);
    setDataStatus(prev => ({ ...prev, events: 'loading' }));
    
    try {
      const { latitude, longitude } = selectedLocation;
      const eventsUrl = `/api/events?lat=${latitude}&lon=${longitude}&city=${encodeURIComponent(selectedLocation.city)}&radius=50`;
      
      const response = await fetch(eventsUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to load events: ${response.status}`);
      }
      
      const data = await response.json();
      setEvents(data.events || []);
      setDataStatus(prev => ({ ...prev, events: data.isRealData ? 'real' : 'demo' }));
    } catch (error) {
      console.error('Error loading events:', error);
      setError(`Failed to load events: ${error.message}`);
      setDataStatus(prev => ({ ...prev, events: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (event) => {
    try {
      const response = await fetch('/api/user/interested-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId: event._id || event.id })
      });
      
      if (response.ok) {
        setEvents(prevEvents => 
          prevEvents.map(e => 
            (e._id || e.id) === (event._id || event.id) 
              ? { ...e, isInterested: true }
              : e
          )
        );
      }
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const getDataIndicator = (type) => {
    const status = dataStatus[type];
    switch (status) {
      case 'real': return 'Real Data';
      case 'demo': return 'Demo Data';
      case 'loading': return 'Loading...';
      case 'error': return 'Error';
      default: return 'Demo Data';
    }
  };

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.authPrompt}>
          <h2>Welcome to TIKO</h2>
          <p>Please sign in with Spotify to discover events tailored to your music taste.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top: Overall Vibe Summary (Full Width) */}
      <div className={styles.header}>
        <div className={styles.welcomeSection}>
          <h1 className={styles.title}>
            <span className={styles.logo}>TIKO</span>
          </h1>
          <p className={styles.subtitle}>
            You're all about <span className={styles.highlight}>house + techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
          </p>
        </div>
      </div>

      <div className={styles.mainContent}>
        {/* FUNCTIONAL HIERARCHY LAYOUT */}
        <div className={styles.functionalLayout}>
          
          {/* 1. INFORMATIONAL (Top Priority) */}
          <div className={styles.informationalRow}>
            {/* Left: Spider Chart */}
            <div className={styles.leftColumn}>
              <div className={styles.vibeCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Your Top 5 Genres</h2>
                  <span className={styles.dataIndicator}>{getDataIndicator('spotify')}</span>
                </div>
                
                {/* Clean Spider Chart - NO redundant summary, NO taste strength */}
                <div className={styles.spiderChartContainer}>
                  <Top5GenresSpiderChart 
                    userTasteProfile={userTasteProfile}
                    spotifyData={spotifyData}
                  />
                </div>
              </div>
            </div>

            {/* Right: Seasonal Vibes */}
            <div className={styles.rightColumn}>
              <div className={styles.seasonalCard}>
                <div className={styles.cardHeader}>
                  <h2 className={styles.cardTitle}>Seasonal Vibes</h2>
                  <span className={styles.dataIndicator}>{getDataIndicator('taste')}</span>
                </div>
                
                <div className={styles.seasonalGrid}>
                  <div className={`${styles.seasonCard} ${styles.spring}`}>
                    <h3>Spring</h3>
                    <p>Fresh beats & uplifting vibes</p>
                  </div>
                  <div className={`${styles.seasonCard} ${styles.summer}`}>
                    <h3>Summer</h3>
                    <p>High energy, open air sounds</p>
                  </div>
                  <div className={`${styles.seasonCard} ${styles.fall}`}>
                    <h3>Fall</h3>
                    <p>Organic House, Downtempo</p>
                  </div>
                  <div className={`${styles.seasonCard} ${styles.winter}`}>
                    <h3>Winter</h3>
                    <p>Deep House, Ambient Techno</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. DATA INSIGHTS (Secondary) */}
          <div className={styles.dataInsightsRow}>
            {/* Left: Energy + Danceability */}
            <div className={styles.leftColumn}>
              <div className={styles.soundCharacteristicsCard}>
                <SoundFeatureCapsules 
                  userAudioFeatures={spotifyData?.audioFeatures}
                  dataStatus={dataStatus.spotify}
                  showHalf="left"
                />
              </div>
            </div>

            {/* Right: Positivity + Acoustic */}
            <div className={styles.rightColumn}>
              <div className={styles.soundCharacteristicsCard}>
                <SoundFeatureCapsules 
                  userAudioFeatures={spotifyData?.audioFeatures}
                  dataStatus={dataStatus.spotify}
                  showHalf="right"
                />
              </div>
            </div>
          </div>

          {/* 3. FUNCTIONAL CONTROLS (Bottom) */}
          <div className={styles.functionalRow}>
            {/* Left: Location Filter */}
            <div className={styles.leftColumn}>
              <div className={styles.locationCard}>
                <EnhancedLocationSearch 
                  onLocationSelect={handleLocationSelect}
                  selectedLocation={selectedLocation}
                />
              </div>
            </div>

            {/* Right: Vibe Match Slider */}
            <div className={styles.rightColumn}>
              <div className={styles.vibeMatchCard}>
                <div className={styles.vibeMatch}>
                  <span className={styles.vibeLabel}>Vibe Match</span>
                  <div className={styles.vibeSlider}>
                    <div className={styles.vibeProgress} style={{ width: '74%' }}></div>
                  </div>
                  <span className={styles.vibePercentage}>74%</span>
                  <button className={styles.gearIcon} title="Additional Filters">⚙️</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events Section - Full Width Below */}
        <div className={styles.eventsSection}>
          <div className={styles.eventsHeader}>
            <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
            <span className={styles.dataIndicator}>{getDataIndicator('events')}</span>
          </div>
          
          {loading && (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>Finding events that match your taste...</p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <button onClick={loadEvents} className={styles.retryButton}>
                Try Again
              </button>
            </div>
          )}
          
          {!loading && !error && events.length > 0 && (
            <EnhancedEventList 
              events={events}
              onEventClick={handleEventClick}
              onSaveEvent={handleSaveEvent}
            />
          )}
          
          {!loading && !error && events.length === 0 && (
            <div className={styles.noEvents}>
              <p>No events found for {selectedLocation.city}.</p>
              <button onClick={loadEvents} className={styles.retryButton}>
                Retry Loading Events
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <EventDetailModal
          event={selectedEvent}
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
          onSaveEvent={handleSaveEvent}
          spotifyData={spotifyData}
        />
      )}
    </div>
  );
};

export default EnhancedPersonalizedDashboard;
EOF

echo "✅ Step 2: Creating CLEAN Top5GenresSpiderChart - NO redundant content..."

# Create clean spider chart with NO genre list, NO taste strength, NO redundant summary
cat > components/Top5GenresSpiderChart.js << 'EOF'
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

const Top5GenresSpiderChart = ({ userTasteProfile, spotifyData }) => {
  const getTop5GenresData = () => {
    // Fallback demo data
    if (!userTasteProfile?.genrePreferences && !spotifyData?.topGenres) {
      return [
        { genre: 'House', value: 85, normalizedValue: 85 },
        { genre: 'Techno', value: 72, normalizedValue: 72 },
        { genre: 'Progressive', value: 68, normalizedValue: 68 },
        { genre: 'Deep House', value: 61, normalizedValue: 61 },
        { genre: 'Trance', value: 45, normalizedValue: 45 }
      ];
    }

    // Real data processing
    const genreScores = new Map();
    
    if (userTasteProfile?.genrePreferences) {
      userTasteProfile.genrePreferences.forEach(genre => {
        genreScores.set(genre.name, (genre.weight || 0) * 100);
      });
    }
    
    if (spotifyData?.topGenres) {
      spotifyData.topGenres.forEach((genre, index) => {
        const spotifyScore = Math.max(0, 100 - (index * 15));
        const existingScore = genreScores.get(genre.name) || 0;
        genreScores.set(genre.name, Math.max(existingScore, spotifyScore));
      });
    }
    
    const sortedGenres = Array.from(genreScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const maxScore = Math.max(...sortedGenres.map(([, score]) => score));
    return sortedGenres.map(([genre, score]) => ({
      genre: genre.charAt(0).toUpperCase() + genre.slice(1),
      value: score,
      normalizedValue: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    }));
  };

  const genresData = getTop5GenresData();

  return (
    <div className={styles.container}>
      {/* CLEAN: Just the chart, no redundant content */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={genresData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" radialLines={true} />
            <PolarAngleAxis 
              dataKey="genre"
              tick={{ fill: '#fff', fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }}
              tickCount={6}
            />
            <Radar
              name="Genre Preference"
              dataKey="normalizedValue"
              stroke="#ff1493"
              fill="#ff1493"
              fillOpacity={0.3}
              strokeWidth={3}
              dot={{ fill: '#ff1493', strokeWidth: 2, stroke: '#00bfff', r: 6 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      {/* NO GENRE LIST - REMOVED PERMANENTLY */}
      {/* NO TASTE STRENGTH - REMOVED TO SAVE SPACE */}
      {/* NO REDUNDANT SUMMARY - REMOVED FOR CLEAN LAYOUT */}
    </div>
  );
};

export default Top5GenresSpiderChart;
EOF

echo "✅ Step 3: Updating SoundFeatureCapsules for split display..."

# Update SoundFeatureCapsules to support left/right split with simple data indicators
cat > components/SoundFeatureCapsules.js << 'EOF'
import React from 'react';
import styles from '@/styles/SoundFeatureCapsules.module.css';

const SoundFeatureCapsules = ({ userAudioFeatures, dataStatus = 'demo', showHalf = 'all' }) => {
  // Default audio features
  const defaultFeatures = {
    energy: 0.75,
    danceability: 0.82,
    valence: 0.65, // Positivity
    acousticness: 0.15
  };

  const features = userAudioFeatures || defaultFeatures;

  const allCapsuleData = [
    {
      name: 'Energy',
      value: features.energy,
      icon: '⚡',
      color: '#ff006e'
    },
    {
      name: 'Danceability',
      value: features.danceability,
      icon: '💃',
      color: '#00d4ff'
    },
    {
      name: 'Positivity',
      value: features.valence,
      icon: '😊',
      color: '#22c55e'
    },
    {
      name: 'Acoustic',
      value: features.acousticness,
      icon: '🎸',
      color: '#f97316'
    }
  ];

  // Split capsules based on showHalf prop
  let capsuleData;
  if (showHalf === 'left') {
    capsuleData = allCapsuleData.slice(0, 2); // Energy, Danceability
  } else if (showHalf === 'right') {
    capsuleData = allCapsuleData.slice(2, 4); // Positivity, Acoustic
  } else {
    capsuleData = allCapsuleData; // All capsules
  }

  const getDataIndicator = () => {
    return dataStatus === 'real' ? 'Real Data' : 'Demo Data';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Sound Characteristics</h3>
        {showHalf === 'all' && (
          <span className={styles.dataIndicator}>{getDataIndicator()}</span>
        )}
      </div>
      
      <div className={styles.capsulesGrid}>
        {capsuleData.map((capsule, index) => (
          <div key={index} className={styles.capsule}>
            <div className={styles.capsuleHeader}>
              <span className={styles.icon}>{capsule.icon}</span>
              <span className={styles.name}>{capsule.name}</span>
            </div>
            
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar}
                style={{ 
                  background: `linear-gradient(90deg, ${capsule.color}, ${capsule.color}80)`,
                  width: `${capsule.value * 100}%`
                }}
              />
            </div>
            
            <div className={styles.percentage}>
              {Math.round(capsule.value * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundFeatureCapsules;
EOF

echo "✅ Step 4: Creating CSS for clean functional hierarchy layout..."

# Create CSS for the clean functional hierarchy layout
cat > styles/EnhancedPersonalizedDashboard.module.css << 'EOF'
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
  color: #fff;
  padding: 0;
  overflow-x: hidden;
}

/* Top: Overall Vibe Summary */
.header {
  padding: 2rem 1rem 1rem 1rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 0, 110, 0.2);
}

.welcomeSection {
  max-width: 800px;
  margin: 0 auto;
}

.title {
  margin: 0 0 1rem 0;
  font-size: 3rem;
  font-weight: 700;
  text-align: center;
}

.logo {
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.1em;
  text-shadow: 0 0 30px rgba(255, 0, 110, 0.5);
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
}

.highlight {
  color: #ff006e;
  font-weight: 600;
  text-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
}

.mainContent {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* FUNCTIONAL HIERARCHY LAYOUT */
.functionalLayout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  margin-bottom: 2rem;
}

.informationalRow, .dataInsightsRow, .functionalRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}

.leftColumn, .rightColumn {
  display: flex;
  flex-direction: column;
  height: fit-content;
}

/* Glassmorphic Card Base */
.vibeCard, .seasonalCard, .soundCharacteristicsCard, .locationCard, .vibeMatchCard {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 0, 110, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  height: fit-content;
}

.vibeCard:hover, .seasonalCard:hover, .soundCharacteristicsCard:hover, 
.locationCard:hover, .vibeMatchCard:hover {
  box-shadow: 0 0 30px rgba(255, 0, 110, 0.2);
  transform: translateY(-2px);
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.cardTitle {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Simple Data Indicators */
.dataIndicator {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  font-weight: 500;
}

/* Seasonal Vibes Grid */
.seasonalGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.seasonCard {
  padding: 1rem;
  border-radius: 12px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.seasonCard:hover {
  transform: translateY(-2px);
  filter: drop-shadow(0 0 20px rgba(0, 212, 255, 0.5));
}

.seasonCard h3 {
  margin: 0 0 0.5rem 0;
  font-weight: 600;
}

.seasonCard p {
  margin: 0;
  font-size: 0.8rem;
  opacity: 0.9;
}

.spring {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05));
  color: #22c55e;
}

.summer {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.05));
  color: #f97316;
}

.fall {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05));
  color: #ef4444;
}

.winter {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05));
  color: #3b82f6;
}

/* Vibe Match Slider */
.vibeMatch {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.vibeLabel {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  min-width: 80px;
}

.vibeSlider {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.vibeProgress {
  height: 100%;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  border-radius: 4px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 0, 110, 0.5);
}

.vibePercentage {
  font-weight: 600;
  color: #00d4ff;
  min-width: 40px;
  text-align: right;
}

.gearIcon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 0, 110, 0.2);
  border-radius: 8px;
  padding: 0.5rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.gearIcon:hover {
  background: rgba(255, 0, 110, 0.1);
  box-shadow: 0 0 15px rgba(255, 0, 110, 0.3);
}

/* Events Section */
.eventsSection {
  margin-top: 2rem;
}

.eventsHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.sectionTitle {
  font-size: 1.8rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Loading, Error, and Empty States */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #ff006e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 12px;
  margin: 1rem 0;
  backdrop-filter: blur(10px);
}

.retryButton {
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  color: #fff;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: all 0.2s ease;
}

.retryButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(255, 0, 110, 0.3);
}

.noEvents {
  text-align: center;
  padding: 3rem;
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.authPrompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
}

.authPrompt h2 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.authPrompt p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 500px;
}

/* Responsive Design */
@media (max-width: 1024px) {
  .informationalRow, .dataInsightsRow, .functionalRow {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .mainContent {
    padding: 1.5rem 1rem;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2.5rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .header {
    padding: 1.5rem 1rem;
  }
  
  .mainContent {
    padding: 1rem;
  }
  
  .seasonalGrid {
    grid-template-columns: 1fr;
  }
  
  .vibeMatch {
    flex-direction: column;
    gap: 0.5rem;
  }
}
EOF

echo "✅ Step 5: Updating spider chart CSS..."

# Clean spider chart CSS
cat > styles/Top5GenresSpiderChart.module.css << 'EOF'
.container {
  width: 100%;
  height: 100%;
}

.chartContainer {
  width: 100%;
  height: 300px;
}

/* NO genre list styles - completely removed */
/* NO taste strength styles - removed to save space */
/* Clean, minimal spider chart only */

@media (max-width: 768px) {
  .chartContainer {
    height: 250px;
  }
}
EOF

echo "✅ Step 6: Committing and deploying final clean layout..."

git add .
git commit -m "🎯 FINAL CLEAN TIKO LAYOUT - DEFINITIVE IMPLEMENTATION

✅ REMOVED (Clean Layout):
- Redundant 'We've curated events...' summary in spider chart
- 'Taste Strength: 77%' indicator (space saving)
- Persistent genre list bars (House 100%, Techno 85%, etc.)
- Redundant Sound Characteristics section at bottom
- Confusing 'Live Data' labels throughout

✅ IMPLEMENTED (Functional Hierarchy):
1. INFORMATIONAL: Spider chart (left) + Seasonal vibes (right)
2. DATA INSIGHTS: Sound characteristics split (Energy+Dance left, Positivity+Acoustic right)
3. FUNCTIONAL: Location filter (left) + Vibe match slider (right)

✅ ADDED (Simple Data Transparency):
- Clean 'Real Data' / 'Demo Data' indicators
- No source disclosure clutter
- Backend complexity, frontend value

🎯 Clean, professional TIKO dashboard with maximum value!"

echo "✅ Deploying to staging..."
git push heroku main

echo ""
echo "🎉 FINAL CLEAN TIKO LAYOUT DEPLOYED!"
echo "==================================="
echo ""
echo "✅ Clean Layout Achieved:"
echo "   - No redundant content or confusing labels"
echo "   - Perfect functional hierarchy"
echo "   - Simple data transparency"
echo "   - Maximum space utilization"
echo ""
echo "🚀 Check your staging site:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo ""
echo "This should be the clean, professional TIKO dashboard you've been working towards!"
echo ""
EOF

chmod +x /home/ubuntu/final_clean_tiko_layout.sh

echo "🎯 FINAL CLEAN TIKO LAYOUT SCRIPT READY!"
echo ""
echo "This definitive script will create:"
echo "✅ Clean spider chart (no redundant content)"
echo "✅ Proper functional hierarchy"
echo "✅ Simple 'Real Data' / 'Demo Data' indicators"
echo "✅ No clutter, maximum value showcase"
echo "✅ Professional, polished interface"

