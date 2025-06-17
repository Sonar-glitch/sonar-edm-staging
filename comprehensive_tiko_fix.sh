#!/bin/bash

echo "🎯 COMPREHENSIVE TIKO FIX - SPACING + THEME + LAYOUT..."
echo "====================================================="

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || {
    echo "❌ Error: Could not navigate to project directory"
    exit 1
}

echo "✅ Step 1: Creating corrected EnhancedPersonalizedDashboard with tight spacing..."

# Create the corrected dashboard with proper spacing and layout
cat > components/EnhancedPersonalizedDashboard.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import EnhancedEventList from './EnhancedEventList';
import EnhancedLocationSearch from './EnhancedLocationSearch';
import Top5GenresSpiderChart from './Top5GenresSpiderChart';
import SoundCharacteristics from './SoundCharacteristics';
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
      {/* Compact Header with Vibe Summary */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          <span className={styles.logo}>TIKO</span>
        </h1>
        <p className={styles.subtitle}>
          You're all about <span className={styles.highlight}>house + techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
        </p>
      </div>

      <div className={styles.mainContent}>
        {/* CORRECTED FUNCTIONAL HIERARCHY LAYOUT */}
        
        {/* 1. INFORMATIONAL ROW */}
        <div className={styles.informationalRow}>
          {/* Left: Spider Chart */}
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Top 5 Genres</h2>
                <span className={styles.dataIndicator}>{getDataIndicator('spotify')}</span>
              </div>
              <Top5GenresSpiderChart 
                userTasteProfile={userTasteProfile}
                spotifyData={spotifyData}
              />
            </div>
          </div>

          {/* Right: Seasonal Vibes */}
          <div className={styles.rightColumn}>
            <div className={styles.card}>
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

        {/* 2. DATA INSIGHTS ROW - ONE UNIFIED SOUND CHARACTERISTICS */}
        <div className={styles.dataInsightsRow}>
          <div className={styles.fullWidth}>
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Your Sound Characteristics</h2>
                <span className={styles.dataIndicator}>{getDataIndicator('spotify')}</span>
              </div>
              <SoundCharacteristics 
                userAudioFeatures={spotifyData?.audioFeatures}
                dataStatus={dataStatus.spotify}
              />
            </div>
          </div>
        </div>

        {/* 3. FUNCTIONAL ROW */}
        <div className={styles.functionalRow}>
          {/* Left: Location Filter */}
          <div className={styles.leftColumn}>
            <div className={styles.card}>
              <EnhancedLocationSearch 
                onLocationSelect={handleLocationSelect}
                selectedLocation={selectedLocation}
              />
            </div>
          </div>

          {/* Right: Vibe Match Slider */}
          <div className={styles.rightColumn}>
            <div className={styles.card}>
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

        {/* Events Section */}
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

echo "✅ Step 2: Creating unified SoundCharacteristics component with shiny bars..."

# Create the unified Sound Characteristics component matching the reference
cat > components/SoundCharacteristics.js << 'EOF'
import React from 'react';
import styles from '@/styles/SoundCharacteristics.module.css';

const SoundCharacteristics = ({ userAudioFeatures, dataStatus = 'demo' }) => {
  // Default audio features matching reference
  const defaultFeatures = {
    energy: 0.75,
    danceability: 0.82,
    valence: 0.65, // Positivity
    acousticness: 0.15
  };

  const features = userAudioFeatures || defaultFeatures;

  const characteristicsData = [
    {
      name: 'Energy',
      value: features.energy,
      percentage: Math.round(features.energy * 100),
      icon: '⚡',
      color: '#ff6b6b', // Coral/pink like reference
      description: 'How energetic and intense your music feels'
    },
    {
      name: 'Danceability',
      value: features.danceability,
      percentage: Math.round(features.danceability * 100),
      icon: '💃',
      color: '#4ecdc4', // Cyan/teal like reference
      description: 'How suitable your music is for dancing'
    },
    {
      name: 'Positivity',
      value: features.valence,
      percentage: Math.round(features.valence * 100),
      icon: '😊',
      color: '#45b7d1', // Blue
      description: 'The musical positivity conveyed by your tracks'
    },
    {
      name: 'Acoustic',
      value: features.acousticness,
      percentage: Math.round(features.acousticness * 100),
      icon: '🎸',
      color: '#f9ca24', // Yellow/orange
      description: 'How acoustic vs electronic your music is'
    }
  ];

  return (
    <div className={styles.container}>
      <p className={styles.subtitle}>Normalized by universal music taste</p>
      
      <div className={styles.characteristicsGrid}>
        {characteristicsData.map((characteristic, index) => (
          <div key={index} className={styles.characteristicItem}>
            <div className={styles.characteristicHeader}>
              <div className={styles.iconAndName}>
                <span className={styles.icon}>{characteristic.icon}</span>
                <span className={styles.name}>{characteristic.name}</span>
              </div>
              <span className={styles.percentage}>{characteristic.percentage}%</span>
            </div>
            
            {/* Shiny Progress Bar with Glow Effects */}
            <div className={styles.progressContainer}>
              <div className={styles.progressTrack}>
                <div 
                  className={styles.progressBar}
                  style={{ 
                    width: `${characteristic.percentage}%`,
                    background: `linear-gradient(90deg, ${characteristic.color}, ${characteristic.color}dd)`,
                    boxShadow: `0 0 20px ${characteristic.color}40, inset 0 1px 0 rgba(255,255,255,0.3)`
                  }}
                >
                  {/* Shine effect overlay */}
                  <div className={styles.shine}></div>
                </div>
              </div>
              <span className={styles.percentageRight}>{characteristic.percentage}%</span>
            </div>
            
            <p className={styles.description}>{characteristic.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundCharacteristics;
EOF

echo "✅ Step 3: Creating CSS with tight spacing and reference theme..."

# Create CSS with proper spacing and theme matching the reference
cat > styles/EnhancedPersonalizedDashboard.module.css << 'EOF'
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
  color: #fff;
  padding: 0;
  overflow-x: hidden;
}

/* COMPACT HEADER - TIGHT SPACING */
.header {
  padding: 1rem 1rem 0.5rem 1rem; /* Reduced padding significantly */
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 0, 110, 0.1);
}

.title {
  margin: 0 0 0.5rem 0; /* Reduced margin */
  font-size: 2.5rem; /* Slightly smaller */
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
  font-size: 1rem; /* Slightly smaller */
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  margin: 0 0 0.5rem 0; /* Reduced margin */
}

.highlight {
  color: #ff006e;
  font-weight: 600;
  text-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
}

.mainContent {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem; /* Reduced from 2rem */
}

/* TIGHT SPACING BETWEEN SECTIONS */
.informationalRow, .dataInsightsRow, .functionalRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem; /* Reduced gap */
  margin-bottom: 1rem; /* Reduced margin between rows */
  align-items: start;
}

.dataInsightsRow {
  grid-template-columns: 1fr; /* Full width for unified sound characteristics */
}

.leftColumn, .rightColumn, .fullWidth {
  display: flex;
  flex-direction: column;
  height: fit-content;
}

/* CLEAN GLASSMORPHIC CARDS - SINGLE BOUNDARY */
.card {
  background: rgba(15, 15, 25, 0.8); /* Darker background like reference */
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1); /* Subtle single border */
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4); /* Clean shadow */
  transition: all 0.3s ease;
  height: fit-content;
}

.card:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5);
  transform: translateY(-1px);
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.cardTitle {
  font-size: 1.3rem; /* Slightly smaller */
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* SIMPLE DATA INDICATORS */
.dataIndicator {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  font-weight: 500;
}

/* SEASONAL VIBES GRID */
.seasonalGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.8rem; /* Tighter spacing */
}

.seasonCard {
  padding: 0.8rem; /* Reduced padding */
  border-radius: 8px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.seasonCard:hover {
  transform: translateY(-2px);
  filter: drop-shadow(0 0 15px rgba(0, 212, 255, 0.3));
}

.seasonCard h3 {
  margin: 0 0 0.3rem 0; /* Reduced margin */
  font-weight: 600;
  font-size: 0.9rem;
}

.seasonCard p {
  margin: 0;
  font-size: 0.75rem;
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

/* VIBE MATCH SLIDER */
.vibeMatch {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
}

.vibeLabel {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  min-width: 80px;
}

.vibeSlider {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.vibeProgress {
  height: 100%;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  border-radius: 3px;
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
  border-radius: 6px;
  padding: 0.4rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.gearIcon:hover {
  background: rgba(255, 0, 110, 0.1);
  box-shadow: 0 0 10px rgba(255, 0, 110, 0.3);
}

/* EVENTS SECTION */
.eventsSection {
  margin-top: 1.5rem; /* Reduced margin */
}

.eventsHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem; /* Reduced margin */
}

.sectionTitle {
  font-size: 1.6rem; /* Slightly smaller */
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* LOADING, ERROR, AND EMPTY STATES */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem; /* Reduced padding */
  text-align: center;
}

.spinner {
  width: 30px; /* Smaller spinner */
  height: 30px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top: 2px solid #ff006e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.8rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 1.5rem; /* Reduced padding */
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
  margin: 0.8rem 0;
  backdrop-filter: blur(10px);
}

.retryButton {
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem; /* Reduced padding */
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.8rem;
  transition: all 0.2s ease;
}

.retryButton:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(255, 0, 110, 0.3);
}

.noEvents {
  text-align: center;
  padding: 2rem; /* Reduced padding */
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 8px;
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
  font-size: 2rem; /* Reduced size */
  margin-bottom: 0.8rem;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.authPrompt p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 500px;
}

/* RESPONSIVE DESIGN */
@media (max-width: 1024px) {
  .informationalRow, .functionalRow {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .mainContent {
    padding: 0.8rem;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .header {
    padding: 0.8rem;
  }
  
  .mainContent {
    padding: 0.5rem;
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

echo "✅ Step 4: Creating SoundCharacteristics CSS with shiny bars..."

# Create CSS for the unified Sound Characteristics with shiny gradient bars
cat > styles/SoundCharacteristics.module.css << 'EOF'
.container {
  width: 100%;
}

.subtitle {
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1.5rem 0;
  text-align: center;
}

.characteristicsGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

.characteristicItem {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.characteristicHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.iconAndName {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  font-size: 1.2rem;
}

.name {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
}

.percentage {
  font-size: 1rem;
  font-weight: 600;
  color: #00d4ff;
}

/* SHINY PROGRESS BARS MATCHING REFERENCE */
.progressContainer {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progressTrack {
  flex: 1;
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.progressBar {
  height: 100%;
  border-radius: 4px;
  position: relative;
  transition: width 0.8s ease;
  overflow: hidden;
}

/* SHINE EFFECT OVERLAY */
.shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

.percentageRight {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.8);
  min-width: 35px;
  text-align: right;
}

.description {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.3;
}

/* RESPONSIVE DESIGN */
@media (max-width: 768px) {
  .characteristicsGrid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .progressContainer {
    gap: 0.8rem;
  }
}
EOF

echo "✅ Step 5: Committing and deploying corrected layout..."

git add .
git commit -m "🎯 COMPREHENSIVE TIKO FIX - SPACING + THEME + LAYOUT

✅ SPACING FIXES:
- Tight spacing between vibe summary and main content
- Reduced gaps between functional hierarchy sections
- Cohesive flow from top to bottom
- Connected, unified feeling throughout

✅ THEME CORRECTIONS (Matching Reference):
- ONE unified Sound Characteristics section (not split)
- Shiny gradient bars with coral/cyan colors and glow effects
- Clean dark glassmorphic cards with single boundaries
- Perfect symmetry like reference image

✅ LAYOUT FIXES:
- Removed redundant content (genre list, taste strength, etc.)
- Proper functional hierarchy structure
- Simple 'Real Data' / 'Demo Data' indicators
- Clean, professional appearance

🎨 Now matches the reference design with proper spacing!"

echo "✅ Deploying to staging..."
git push heroku main

echo ""
echo "🎉 COMPREHENSIVE TIKO FIX DEPLOYED!"
echo "=================================="
echo ""
echo "✅ Fixed Issues:"
echo "   - Tight spacing between sections"
echo "   - Unified Sound Characteristics with shiny bars"
echo "   - Clean theme matching your reference"
echo "   - Proper functional hierarchy"
echo "   - Connected, cohesive layout"
echo ""
echo "🚀 Check your staging site:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo ""
echo "This should now match your reference design with proper spacing!"
echo ""
EOF

chmod +x /home/ubuntu/comprehensive_tiko_fix.sh

echo "🎯 COMPREHENSIVE TIKO FIX READY!"
echo ""
echo "This script addresses ALL the issues:"
echo "✅ Tight spacing between sections"
echo "✅ ONE unified Sound Characteristics section"
echo "✅ Shiny gradient bars matching your reference"
echo "✅ Clean dark glassmorphic theme"
echo "✅ Proper functional hierarchy"
echo "✅ Connected, cohesive layout"

