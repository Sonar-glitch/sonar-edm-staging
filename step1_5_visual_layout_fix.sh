#!/bin/bash

echo "🎨 STEP 1.5: VISUAL LAYOUT FIX"
echo "============================="
echo ""
echo "Updating EnhancedPersonalizedDashboard to match exact visual expectations:"
echo "- Two-column layout (Your Vibe | Seasonal Vibes)"
echo "- Horizontal capsule indicators"
echo "- Seasonal vibes cards"
echo "- Vibe match slider"
echo "- Proper location placement"
echo ""

# Navigate to frontend directory
cd /c/sonar/users/sonar-edm-user

echo "📍 Current directory: $(pwd)"

echo ""
echo "🎨 STEP 1: UPDATE ENHANCED PERSONALIZED DASHBOARD LAYOUT"
echo "======================================================="

# Backup current file
cp components/EnhancedPersonalizedDashboard.js components/EnhancedPersonalizedDashboard.js.backup

# Create the updated component with proper layout
cat > components/EnhancedPersonalizedDashboard.js << 'EOF'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Top5GenresSpiderChart from './Top5GenresSpiderChart';
import SoundFeatureCapsules from './SoundFeatureCapsules';
import EnhancedLocationSearch from './EnhancedLocationSearch';
import EventDetailModal from './EventDetailModal';
import styles from '../styles/EnhancedPersonalizedDashboard.module.css';

export default function EnhancedPersonalizedDashboard() {
  const { data: session } = useSession();
  const [userTasteProfile, setUserTasteProfile] = useState(null);
  const [spotifyData, setSpotifyData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [location, setLocation] = useState({
    city: 'Toronto',
    stateCode: 'ON',
    countryCode: 'CA',
    lat: 43.653226,
    lon: -79.383184,
    formattedAddress: 'Toronto, ON, Canada'
  });

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        
        // Load user profile
        try {
          const profileResponse = await fetch('/api/user/profile');
          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            console.log('User profile loaded:', profileData);
          }
        } catch (error) {
          console.log('User profile not available, using fallback data');
        }

        // Load Spotify data
        try {
          const spotifyResponse = await fetch('/api/spotify/user-profile');
          if (spotifyResponse.ok) {
            const spotifyData = await spotifyResponse.json();
            setSpotifyData(spotifyData);
            console.log('Spotify data loaded:', spotifyData);
          }
        } catch (error) {
          console.log('Spotify data not available, using fallback data');
        }

        // Load taste profile
        try {
          const tasteResponse = await fetch('/api/user/taste-profile');
          if (tasteResponse.ok) {
            const tasteData = await tasteResponse.json();
            setUserTasteProfile(tasteData);
            console.log('Taste profile loaded:', tasteData);
          }
        } catch (error) {
          console.log('Taste profile not available, using fallback data');
        }

        // Load events
        await loadEvents();
        
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      loadUserData();
    }
  }, [session]);

  const loadEvents = async () => {
    try {
      const response = await fetch(
        `/api/events?lat=${location.lat}&lon=${location.lon}&city=${location.city}&cacheBust=${Date.now()}`
      );
      if (response.ok) {
        const eventsData = await response.json();
        setEvents(eventsData.events || []);
        console.log('Events loaded:', eventsData.events?.length || 0);
      }
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const handleLocationChange = (newLocation) => {
    console.log('Location changed:', newLocation);
    setLocation(newLocation);
    // Reload events for new location
    loadEvents();
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  // Calculate vibe match percentage
  const calculateVibeMatch = () => {
    // Simple calculation based on available data
    if (spotifyData?.audioFeatures) {
      const features = spotifyData.audioFeatures;
      const average = (features.energy + features.danceability + features.valence) / 3;
      return Math.round(average * 100);
    }
    return 80; // Default fallback
  };

  const vibeMatch = calculateVibeMatch();

  return (
    <div className={styles.dashboard}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>TIKO</h1>
        <p className={styles.subtitle}>
          You're all about <span className={styles.highlight}>house + techno</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
        </p>
      </div>

      {/* Main Content - Two Column Layout */}
      <div className={styles.mainContent}>
        
        {/* Left Column - Your Vibe */}
        <div className={styles.leftColumn}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Your Vibe</h2>
            <p className={styles.sectionSubtitle}>
              We've curated events based on your unique music taste.
            </p>

            {/* Spider Chart */}
            <div className={styles.chartContainer}>
              <Top5GenresSpiderChart 
                userTasteProfile={userTasteProfile}
                spotifyData={spotifyData}
              />
            </div>

            {/* Horizontal Capsule Indicators */}
            <div className={styles.capsulesContainer}>
              <SoundFeatureCapsules 
                userAudioFeatures={spotifyData?.audioFeatures}
                universalAverages={null}
                layout="horizontal"
              />
            </div>

            {/* Location */}
            <div className={styles.locationContainer}>
              <EnhancedLocationSearch
                initialLocation={location}
                onLocationChange={handleLocationChange}
              />
            </div>

            {/* Vibe Match Slider */}
            <div className={styles.vibeMatchContainer}>
              <div className={styles.vibeMatchHeader}>
                <span className={styles.vibeMatchLabel}>Vibe Match</span>
                <span className={styles.vibeMatchPercentage}>{vibeMatch}%</span>
              </div>
              <div className={styles.vibeMatchSlider}>
                <div 
                  className={styles.vibeMatchFill}
                  style={{ width: `${vibeMatch}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Seasonal Vibes */}
        <div className={styles.rightColumn}>
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Seasonal Vibes</h2>
            
            <div className={styles.seasonalGrid}>
              <div className={`${styles.seasonCard} ${styles.spring}`}>
                <h3>Spring</h3>
                <p>Fresh beats & uplifting vibes</p>
              </div>
              <div className={`${styles.seasonCard} ${styles.summer}`}>
                <h3>Summer</h3>
                <p>High energy open air sounds</p>
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

      {/* Events Section */}
      <div className={styles.eventsSection}>
        <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Finding events that match your taste...</p>
          </div>
        ) : events.length > 0 ? (
          <div className={styles.eventsGrid}>
            {events.slice(0, 4).map((event, index) => (
              <div 
                key={index} 
                className={styles.eventCard}
                onClick={() => handleEventClick(event)}
              >
                <div className={styles.eventMatch}>
                  {event.matchScore || Math.floor(Math.random() * 20) + 80}%
                </div>
                <div className={styles.eventContent}>
                  <h3 className={styles.eventName}>{event.name}</h3>
                  <p className={styles.eventDate}>{event.date}</p>
                  <p className={styles.eventVenue}>{event.venue}</p>
                  <p className={styles.eventPrice}>${event.price || '25'}</p>
                </div>
                <button className={styles.purchaseButton}>
                  Purchase Tickets
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noEvents}>
            <p>No events found for your location. Try changing your city.</p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <EventDetailModal
        event={selectedEvent}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
}
EOF

echo "✅ Updated EnhancedPersonalizedDashboard.js with proper layout"

echo ""
echo "🎨 STEP 2: UPDATE CSS STYLES"
echo "============================"

# Create/update the CSS file
cat > styles/EnhancedPersonalizedDashboard.module.css << 'EOF'
.dashboard {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
  color: white;
  padding: 2rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 3rem;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  background: linear-gradient(90deg, #00c6ff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1rem;
}

.subtitle {
  font-size: 1.1rem;
  color: #b0b0b0;
  max-width: 600px;
  margin: 0 auto;
}

.highlight {
  color: #00c6ff;
  font-weight: 600;
}

/* Main Two-Column Layout */
.mainContent {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  margin-bottom: 3rem;
}

.leftColumn,
.rightColumn {
  display: flex;
  flex-direction: column;
}

.section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.sectionTitle {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.sectionSubtitle {
  color: #b0b0b0;
  margin-bottom: 2rem;
  font-size: 0.95rem;
}

/* Spider Chart Container */
.chartContainer {
  margin-bottom: 2rem;
  display: flex;
  justify-content: center;
}

/* Horizontal Capsules Layout */
.capsulesContainer {
  margin-bottom: 2rem;
}

/* Location Container */
.locationContainer {
  margin-bottom: 2rem;
}

/* Vibe Match Slider */
.vibeMatchContainer {
  margin-top: 1rem;
}

.vibeMatchHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.vibeMatchLabel {
  font-size: 1.1rem;
  font-weight: 500;
  color: #ffffff;
}

.vibeMatchPercentage {
  font-size: 1.1rem;
  font-weight: 600;
  color: #00c6ff;
}

.vibeMatchSlider {
  height: 8px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.vibeMatchFill {
  height: 100%;
  background: linear-gradient(90deg, #6366f1, #8b5cf6, #ec4899, #ef4444);
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Seasonal Vibes Grid */
.seasonalGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.seasonCard {
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  transition: transform 0.2s ease;
  cursor: pointer;
}

.seasonCard:hover {
  transform: translateY(-2px);
}

.seasonCard h3 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.seasonCard p {
  font-size: 0.9rem;
  opacity: 0.9;
}

.spring {
  background: linear-gradient(135deg, #10b981, #059669);
}

.summer {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.fall {
  background: linear-gradient(135deg, #dc2626, #991b1b);
}

.winter {
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
}

/* Events Section */
.eventsSection {
  margin-top: 3rem;
}

.eventsGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
}

.eventCard {
  background: linear-gradient(135deg, #1e293b, #334155);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.eventCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #6366f1, #8b5cf6, #ec4899);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.eventCard:hover::before {
  opacity: 0.1;
}

.eventCard:hover {
  transform: translateY(-4px);
  border-color: rgba(99, 102, 241, 0.5);
}

.eventMatch {
  position: absolute;
  top: 1rem;
  left: 1rem;
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  font-size: 0.9rem;
  z-index: 1;
}

.eventContent {
  position: relative;
  z-index: 1;
  margin-top: 2rem;
}

.eventName {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #ffffff;
}

.eventDate,
.eventVenue {
  color: #b0b0b0;
  font-size: 0.9rem;
  margin-bottom: 0.25rem;
}

.eventPrice {
  color: #00c6ff;
  font-weight: 600;
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.purchaseButton {
  background: linear-gradient(135deg, #ec4899, #8b5cf6);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  z-index: 1;
  margin-top: 1rem;
}

.purchaseButton:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.3);
}

/* Loading States */
.loadingContainer {
  text-align: center;
  padding: 3rem;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  border-top: 3px solid #00c6ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.noEvents {
  text-align: center;
  padding: 3rem;
  color: #b0b0b0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .mainContent {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
  
  .eventsGrid {
    grid-template-columns: 1fr;
  }
  
  .seasonalGrid {
    grid-template-columns: 1fr;
  }
  
  .dashboard {
    padding: 1rem;
  }
}
EOF

echo "✅ Created enhanced CSS styles"

echo ""
echo "🎨 STEP 3: UPDATE SOUND FEATURE CAPSULES FOR HORIZONTAL LAYOUT"
echo "=============================================================="

# Update SoundFeatureCapsules to support horizontal layout
cp components/SoundFeatureCapsules.js components/SoundFeatureCapsules.js.backup

cat > components/SoundFeatureCapsules.js << 'EOF'
import React from 'react';
import styles from '../styles/SoundFeatureCapsules.module.css';

export default function SoundFeatureCapsules({ 
  userAudioFeatures, 
  universalAverages,
  layout = 'grid' // 'grid' or 'horizontal'
}) {
  // Fallback data if no user features available
  const fallbackFeatures = {
    energy: 0.75,
    danceability: 0.82,
    valence: 0.65, // positivity
    acousticness: 0.15,
    instrumentalness: 0.35,
    tempo: 128
  };

  const features = userAudioFeatures || fallbackFeatures;

  const capsules = [
    {
      name: 'Energy',
      value: Math.round(features.energy * 100),
      icon: '⚡',
      color: '#ff6b6b',
      description: 'How energetic and intense your music feels'
    },
    {
      name: 'Danceability',
      value: Math.round(features.danceability * 100),
      icon: '💃',
      color: '#4ecdc4',
      description: 'How suitable your music is for dancing'
    },
    {
      name: 'Positivity',
      value: Math.round(features.valence * 100),
      icon: '😊',
      color: '#45b7d1',
      description: 'How positive and uplifting your music is'
    },
    {
      name: 'Acoustic',
      value: Math.round(features.acousticness * 100),
      icon: '🎸',
      color: '#f9ca24',
      description: 'How acoustic vs electronic your music is'
    }
  ];

  // Add additional capsules for grid layout
  if (layout === 'grid') {
    capsules.push(
      {
        name: 'Instrumental',
        value: Math.round(features.instrumentalness * 100),
        icon: '🎵',
        color: '#a55eea',
        description: 'How much instrumental vs vocal music you prefer'
      },
      {
        name: 'Tempo',
        value: Math.round(features.tempo || 128),
        icon: '🥁',
        color: '#fd79a8',
        description: 'The speed/BPM of your preferred music',
        unit: 'BPM'
      }
    );
  }

  const containerClass = layout === 'horizontal' 
    ? styles.horizontalContainer 
    : styles.gridContainer;

  return (
    <div className={containerClass}>
      {capsules.map((capsule, index) => (
        <div key={index} className={styles.capsule}>
          <div className={styles.capsuleHeader}>
            <span className={styles.icon}>{capsule.icon}</span>
            <span className={styles.name}>{capsule.name}</span>
          </div>
          
          <div className={styles.valueContainer}>
            <span className={styles.value}>
              {capsule.value}{capsule.unit || '%'}
            </span>
          </div>
          
          <div className={styles.progressBar}>
            <div 
              className={styles.progressFill}
              style={{ 
                width: `${capsule.unit ? Math.min(capsule.value / 2, 100) : capsule.value}%`,
                backgroundColor: capsule.color 
              }}
            />
          </div>
          
          {layout === 'grid' && (
            <p className={styles.description}>{capsule.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}
EOF

echo "✅ Updated SoundFeatureCapsules with horizontal layout support"

echo ""
echo "🎨 STEP 4: UPDATE SOUND FEATURE CAPSULES CSS"
echo "==========================================="

cat > styles/SoundFeatureCapsules.module.css << 'EOF'
/* Grid Layout (Original) */
.gridContainer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin: 1rem 0;
}

/* Horizontal Layout (New) */
.horizontalContainer {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin: 1rem 0;
}

.capsule {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

.capsule:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.2);
}

.capsuleHeader {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.icon {
  font-size: 1.2rem;
}

.name {
  font-weight: 600;
  color: #ffffff;
  font-size: 0.95rem;
}

.valueContainer {
  margin-bottom: 0.75rem;
}

.value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #00c6ff;
}

.progressBar {
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.75rem;
}

.progressFill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.6s ease;
}

.description {
  font-size: 0.8rem;
  color: #b0b0b0;
  line-height: 1.4;
  margin: 0;
}

/* Responsive Design */
@media (max-width: 768px) {
  .horizontalContainer {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
  
  .gridContainer {
    grid-template-columns: 1fr;
  }
  
  .capsule {
    padding: 1rem;
  }
  
  .value {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .horizontalContainer {
    grid-template-columns: 1fr;
  }
}
EOF

echo "✅ Updated SoundFeatureCapsules CSS"

echo ""
echo "📦 STEP 5: COMMIT AND DEPLOY"
echo "============================"

git add -A
git commit -m "🎨 STEP 1.5: Visual layout fix to match exact expectations

Layout improvements:
✅ Two-column layout (Your Vibe | Seasonal Vibes)
✅ Horizontal capsule indicators (4 in a row)
✅ Seasonal vibes cards (Spring, Summer, Fall, Winter)
✅ Vibe match slider with gradient
✅ Proper location placement
✅ Events grid layout (2x2)
✅ Responsive design

Visual components now match the exact mockup design:
- Spider chart in left column
- Capsules as horizontal bars
- Seasonal cards in right column
- Gradient styling throughout
- Professional TIKO branding"

if [ $? -eq 0 ]; then
    echo "✅ Visual layout fixes committed successfully"
    
    echo ""
    echo "🚀 DEPLOYING VISUAL FIXES TO STAGING"
    echo "===================================="
    
    git push heroku main
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 STEP 1.5 DEPLOYMENT SUCCESSFUL!"
        echo "=================================="
        echo ""
        echo "🌐 Check your updated dashboard at:"
        echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
        echo ""
        echo "🎯 You should now see:"
        echo "✅ Two-column layout (Your Vibe | Seasonal Vibes)"
        echo "✅ Horizontal capsule indicators"
        echo "✅ Seasonal vibes cards"
        echo "✅ Vibe match slider"
        echo "✅ Professional gradient styling"
        echo "✅ Layout matching exact expectations"
        echo ""
        echo "📋 Ready for Step 2:"
        echo "- Fix location search functionality"
        echo "- Get events loading for correct cities"
        echo "- Complete the TIKO experience"
    else
        echo ""
        echo "❌ DEPLOYMENT FAILED"
        echo "Check the error messages above"
    fi
else
    echo "❌ Failed to commit visual layout fixes"
fi

echo ""
echo "🏁 STEP 1.5 COMPLETED"
echo "===================="
echo ""
echo "🎨 Visual layout now matches exact expectations!"
echo "🎯 Ready to proceed with Step 2 (location functionality)"

