#!/bin/bash

echo "🎯 OPTIMAL LAYOUT - FUNCTIONAL HIERARCHY + SPACE UTILIZATION..."
echo "============================================================="

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || {
    echo "❌ Error: Could not navigate to project directory"
    exit 1
}

echo "✅ Creating optimal layout with functional hierarchy..."

# Create the optimal EnhancedPersonalizedDashboard with functional hierarchy
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
      console.log('[Dashboard] Loading Spotify data...');
      setDataStatus(prev => ({ ...prev, spotify: 'loading' }));
      const response = await fetch('/api/spotify/user-profile');
      if (response.ok) {
        const data = await response.json();
        console.log('[Dashboard] Spotify data loaded:', data);
        setSpotifyData(data);
        setDataStatus(prev => ({ ...prev, spotify: 'real' }));
      } else {
        console.log('[Dashboard] Spotify API failed, using mock data');
        setDataStatus(prev => ({ ...prev, spotify: 'mock' }));
      }
    } catch (error) {
      console.error('[Dashboard] Error loading Spotify data:', error);
      setDataStatus(prev => ({ ...prev, spotify: 'mock' }));
    }
  };

  const loadUserTasteProfile = async () => {
    try {
      console.log('[Dashboard] Loading taste profile...');
      setDataStatus(prev => ({ ...prev, taste: 'loading' }));
      const response = await fetch('/api/user/taste-profile');
      if (response.ok) {
        const data = await response.json();
        console.log('[Dashboard] Taste profile loaded:', data);
        setUserTasteProfile(data);
        setDataStatus(prev => ({ ...prev, taste: 'real' }));
      } else {
        console.log('[Dashboard] Taste profile API failed, using mock data');
        setDataStatus(prev => ({ ...prev, taste: 'mock' }));
      }
    } catch (error) {
      console.error('[Dashboard] Error loading taste profile:', error);
      setDataStatus(prev => ({ ...prev, taste: 'mock' }));
    }
  };

  const loadEvents = async () => {
    if (!selectedLocation) return;
    
    console.log('[Dashboard] Loading events for location:', selectedLocation);
    setLoading(true);
    setError(null);
    setDataStatus(prev => ({ ...prev, events: 'loading' }));
    
    try {
      const { latitude, longitude } = selectedLocation;
      const eventsUrl = `/api/events?lat=${latitude}&lon=${longitude}&city=${encodeURIComponent(selectedLocation.city)}&radius=50`;
      console.log('[Dashboard] Events API URL:', eventsUrl);
      
      const response = await fetch(eventsUrl);
      console.log('[Dashboard] Events API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Dashboard] Events API error:', errorText);
        throw new Error(`Failed to load events: ${response.status} ${errorText}`);
      }
      
      const data = await response.json();
      console.log('[Dashboard] Events data received:', data);
      
      setEvents(data.events || []);
      setDataStatus(prev => ({ ...prev, events: data.isRealData ? 'real' : 'mock' }));
      
      if (!data.events || data.events.length === 0) {
        console.warn('[Dashboard] No events returned from API');
      }
    } catch (error) {
      console.error('[Dashboard] Error loading events:', error);
      setError(`Failed to load events: ${error.message}`);
      setDataStatus(prev => ({ ...prev, events: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const handleLocationSelect = (location) => {
    console.log('[Dashboard] Location selected:', location);
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
      case 'loading': return '⏳ Loading...';
      case 'real': return '✅ Live Data';
      case 'mock': return '🎭 Sample Data';
      case 'error': return '❌ Error Loading';
      default: return '';
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
        {/* OPTIMAL LAYOUT: Functional Hierarchy + Space Utilization */}
        <div className={styles.optimalLayout}>
          
          {/* LEFT COLUMN */}
          <div className={styles.leftColumn}>
            {/* 1. INFORMATIONAL: Spider Chart */}
            <div className={styles.vibeCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Vibe</h2>
                <span className={styles.dataIndicator}>{getDataIndicator('spotify')}</span>
              </div>
              <p className={styles.cardSubtitle}>We've curated events based on your unique music taste.</p>
              
              <div className={styles.spiderChartContainer}>
                <Top5GenresSpiderChart 
                  userTasteProfile={userTasteProfile}
                  spotifyData={spotifyData}
                  showGenreList={false}
                />
              </div>
            </div>

            {/* 2. DATA INSIGHTS: Sound Characteristics (Left Half) */}
            <div className={styles.soundCharacteristicsCard}>
              <SoundFeatureCapsules 
                userAudioFeatures={spotifyData?.audioFeatures}
                universalAverages={null}
                dataStatus={dataStatus.spotify}
                showHalf="left"
              />
            </div>

            {/* 3. FUNCTIONAL: Location Filter */}
            <div className={styles.locationCard}>
              <EnhancedLocationSearch 
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.rightColumn}>
            {/* 1. INFORMATIONAL: Seasonal Vibes */}
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

            {/* 2. DATA INSIGHTS: Sound Characteristics (Right Half) */}
            <div className={styles.soundCharacteristicsCard}>
              <SoundFeatureCapsules 
                userAudioFeatures={spotifyData?.audioFeatures}
                universalAverages={null}
                dataStatus={dataStatus.spotify}
                showHalf="right"
              />
            </div>

            {/* 3. FUNCTIONAL: Vibe Match Slider */}
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
              <p className={styles.debugInfo}>
                Location: {selectedLocation.city}, {selectedLocation.region}, {selectedLocation.country}
              </p>
            </div>
          )}
          
          {error && (
            <div className={styles.error}>
              <p>{error}</p>
              <p className={styles.debugInfo}>
                Check browser console for detailed error logs
              </p>
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
              <p>No events found for {selectedLocation.city}. This might indicate an API issue.</p>
              <p className={styles.debugInfo}>
                API Status: {dataStatus.events} | Location: {selectedLocation.latitude}, {selectedLocation.longitude}
              </p>
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

echo "✅ Updating SoundFeatureCapsules to support split display..."

# Update SoundFeatureCapsules to show half on each side
cat > components/SoundFeatureCapsules.js << 'EOF'
import React from 'react';
import styles from '@/styles/SoundFeatureCapsules.module.css';

const SoundFeatureCapsules = ({ userAudioFeatures, universalAverages, dataStatus = 'loading', showHalf = 'all' }) => {
  // Default audio features
  const defaultFeatures = {
    energy: 0.75,
    danceability: 0.82,
    valence: 0.65, // Positivity
    acousticness: 0.15
  };

  const features = userAudioFeatures || defaultFeatures;
  const isUsingMockData = !userAudioFeatures || dataStatus === 'mock';

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

  const titleText = showHalf === 'all' ? 'Your Sound Characteristics' : 
                   showHalf === 'left' ? 'Sound Characteristics' : 'Sound Characteristics';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>{titleText}</h3>
        {showHalf === 'all' && (
          <span className={styles.dataIndicator}>
            {isUsingMockData ? '🎭 Sample Data' : '✅ Spotify Data'}
          </span>
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
      
      {showHalf === 'all' && isUsingMockData && (
        <div className={styles.mockDataNotice}>
          🎭 Using sample audio features - Connect Spotify for personalized results
        </div>
      )}
    </div>
  );
};

export default SoundFeatureCapsules;
EOF

echo "✅ Updating CSS for optimal layout with functional hierarchy..."

# Create CSS for the optimal layout
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

/* OPTIMAL LAYOUT: Functional Hierarchy + Space Utilization */
.optimalLayout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  align-items: start;
}

/* Both columns with equal spacing and functional hierarchy */
.leftColumn, .rightColumn {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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

.cardSubtitle {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 1.5rem 0;
  font-size: 0.9rem;
}

.dataIndicator {
  font-size: 0.8rem;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
}

/* Seasonal Vibes Grid */
.seasonalGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
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

.debugInfo {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.5rem;
  font-family: monospace;
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
  .optimalLayout {
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

echo "✅ Committing and deploying optimal layout..."

git add .
git commit -m "🎯 OPTIMAL LAYOUT - FUNCTIONAL HIERARCHY + SPACE UTILIZATION

✅ Perfect Functional Hierarchy:
1. INFORMATIONAL (Top): Spider chart + Seasonal vibes
2. DATA INSIGHTS (Middle): Sound characteristics split across columns
3. FUNCTIONAL (Bottom): Location filter + Vibe match slider

✅ Maximum Space Utilization:
- Both columns perfectly balanced
- No empty spaces
- Clean aligned layout

✅ Enhanced UX:
- Information first, functionality later
- Logical content flow
- Optimal visual balance

🎯 This creates the perfect balance of function and form!"

echo "✅ Deploying to staging..."
git push heroku main

echo ""
echo "🎉 OPTIMAL LAYOUT DEPLOYED!"
echo "========================="
echo ""
echo "✅ Functional Hierarchy:"
echo "   1. Informational: Spider chart + Seasonal vibes"
echo "   2. Data Insights: Sound characteristics (split)"
echo "   3. Functional: Location + Vibe match"
echo ""
echo "✅ Perfect Space Utilization:"
echo "   - Both columns balanced"
echo "   - No empty spaces"
echo "   - Maximum efficiency"
echo ""
echo "🚀 Check your staging site:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo ""
EOF

chmod +x /home/ubuntu/restore_perfect_layout.sh

echo "🎯 Optimal layout script created!"
echo ""
echo "This creates the perfect balance:"
echo "📊 INFORMATIONAL (Top): Spider chart + Seasonal vibes"
echo "📈 DATA INSIGHTS (Middle): Sound characteristics split across columns"
echo "🔧 FUNCTIONAL (Bottom): Location filter + Vibe match slider"
echo "✅ Maximum space utilization with functional hierarchy"

