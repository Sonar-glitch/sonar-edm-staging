#!/bin/bash
# STEP 1B: Dashboard Integration - Add components to dashboard
# File: integrate_step1_dashboard.sh
# Target: Integrate spider chart and capsules into EnhancedPersonalizedDashboard

echo "🔧 STEP 1B: DASHBOARD INTEGRATION"
echo "Target: Add spider chart and capsules to main dashboard"
echo "📍 Current directory: $(pwd)"

# Backup existing dashboard
echo "💾 Creating backup of existing dashboard..."
if [[ -f "components/EnhancedPersonalizedDashboard.js" ]]; then
    cp components/EnhancedPersonalizedDashboard.js components/EnhancedPersonalizedDashboard.js.backup
    echo "✅ Backup created: EnhancedPersonalizedDashboard.js.backup"
else
    echo "⚠️  EnhancedPersonalizedDashboard.js not found, will create new one"
fi

# Update the main dashboard component
echo "🔄 Updating EnhancedPersonalizedDashboard component..."
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
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [spotifyData, setSpotifyData] = useState(null);
  const [userTasteProfile, setUserTasteProfile] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Load user's Spotify data and taste profile
  useEffect(() => {
    if (session?.user) {
      loadSpotifyData();
      loadUserTasteProfile();
    }
  }, [session]);

  // Load events when location changes
  useEffect(() => {
    if (selectedLocation) {
      loadEvents();
    }
  }, [selectedLocation]);

  const loadSpotifyData = async () => {
    try {
      const response = await fetch('/api/spotify/user-profile');
      if (response.ok) {
        const data = await response.json();
        setSpotifyData(data);
      }
    } catch (error) {
      console.error('Error loading Spotify data:', error);
    }
  };

  const loadUserTasteProfile = async () => {
    try {
      const response = await fetch('/api/user/taste-profile');
      if (response.ok) {
        const data = await response.json();
        setUserTasteProfile(data);
      }
    } catch (error) {
      console.error('Error loading taste profile:', error);
    }
  };

  const loadEvents = async () => {
    if (!selectedLocation) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { latitude, longitude } = selectedLocation;
      const response = await fetch(
        `/api/events/near?latitude=${latitude}&longitude=${longitude}&radius=50&userId=${session?.user?.id}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to load events');
      }
      
      const data = await response.json();
      setEvents(data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
      setError('Failed to load events. Please try again.');
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
        {/* Location Search */}
        <div className={styles.locationSection}>
          <EnhancedLocationSearch 
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
          />
        </div>

        {/* User Profile Section - NEW COMPONENTS */}
        <div className={styles.profileSection}>
          <div className={styles.profileGrid}>
            {/* Spider Chart for Top 5 Genres */}
            <div className={styles.profileCard}>
              <Top5GenresSpiderChart 
                userTasteProfile={userTasteProfile}
                spotifyData={spotifyData}
              />
            </div>

            {/* Sound Feature Capsules */}
            <div className={styles.profileCard}>
              <SoundFeatureCapsules 
                userAudioFeatures={spotifyData?.audioFeatures}
                universalAverages={null}
              />
            </div>
          </div>
        </div>

        {/* Events Section */}
        <div className={styles.eventsSection}>
          <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
          
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
          
          {!loading && !error && events.length === 0 && selectedLocation && (
            <div className={styles.noEvents}>
              <p>No events found in this area. Try a different location or check back later.</p>
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

# Update dashboard styles
echo "🎨 Updating dashboard styles..."
cat > styles/EnhancedPersonalizedDashboard.module.css << 'EOF'
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
  color: #fff;
  padding: 0;
  overflow-x: hidden;
}

.header {
  padding: 2rem 1rem 1rem 1rem;
  text-align: center;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 20, 147, 0.2);
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
  background: linear-gradient(135deg, #ff1493, #00bfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.1em;
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
  margin: 0;
}

.highlight {
  color: #ff1493;
  font-weight: 600;
}

.mainContent {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.locationSection {
  margin-bottom: 2rem;
}

.profileSection {
  margin-bottom: 3rem;
}

.profileGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.profileCard {
  /* Individual cards styled by their own components */
}

.eventsSection {
  margin-top: 2rem;
}

.sectionTitle {
  font-size: 1.8rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, #ff1493, #00bfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

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
  border-top: 3px solid #ff1493;
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
}

.retryButton {
  background: linear-gradient(135deg, #ff1493, #00bfff);
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
  box-shadow: 0 4px 15px rgba(255, 20, 147, 0.3);
}

.noEvents {
  text-align: center;
  padding: 3rem;
  color: rgba(255, 255, 255, 0.7);
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
  background: linear-gradient(135deg, #ff1493, #00bfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.authPrompt p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 500px;
}

@media (max-width: 1024px) {
  .profileGrid {
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
  
  .profileGrid {
    gap: 1rem;
  }
}
EOF

echo "✅ Dashboard integration completed successfully!"
echo ""
echo "🧪 TESTING INSTRUCTIONS:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Verify: Dashboard shows spider chart and capsules"
echo "4. Verify: Components are in 2-column grid layout"
echo "5. Verify: No console errors"
echo ""
echo "📋 SUCCESS CRITERIA:"
echo "- [ ] Dashboard loads without errors"
echo "- [ ] Spider chart visible in left column"
echo "- [ ] Capsule indicators visible in right column"
echo "- [ ] 2-column responsive grid layout"
echo "- [ ] TIKO theme consistent throughout"
echo ""
echo "If tests pass, ready to deploy to Heroku!"

