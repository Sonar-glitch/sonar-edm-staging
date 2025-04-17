#!/bin/bash

# Comprehensive solution for Sonar EDM Platform deployment
# This script creates a direct implementation package with all necessary files
# and ensures consistent import paths

echo "=====================================================
  Sonar EDM Platform - Comprehensive Deployment Solution
====================================================="

# Create a temporary directory for our implementation
TEMP_DIR="/tmp/sonar-edm-direct-implementation"
mkdir -p "$TEMP_DIR/pages/users"
mkdir -p "$TEMP_DIR/pages/auth"
mkdir -p "$TEMP_DIR/pages/api/auth"
mkdir -p "$TEMP_DIR/styles"
mkdir -p "$TEMP_DIR/components"

echo "Creating direct implementation package..."

# Create signin.module.css (lowercase)
cat > "$TEMP_DIR/styles/signin.module.css" << 'EOF'
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  color: white;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
  text-align: center;
  background: linear-gradient(90deg, #0ff, #f0f);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(255, 0, 255, 0.5);
}

.description {
  font-size: 1.2rem;
  margin-bottom: 2rem;
  text-align: center;
  color: #ccc;
  max-width: 600px;
}

.spotifyButton {
  padding: 1rem 2rem;
  background: #1DB954;
  border: none;
  border-radius: 50px;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(29, 185, 84, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.spotifyButton:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 20px rgba(29, 185, 84, 0.7);
}

.spotifyButton:active {
  transform: translateY(1px);
}

.button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(90deg, #0ff, #f0f);
  border: none;
  border-radius: 50px;
  color: white;
  font-weight: bold;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
  display: inline-block;
  text-align: center;
}

.button:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.7);
}

.button:active {
  transform: translateY(1px);
}
EOF

# Also create Signin.module.css (uppercase) for safety
cp "$TEMP_DIR/styles/signin.module.css" "$TEMP_DIR/styles/Signin.module.css"

# Create signin.js with correct import path
cat > "$TEMP_DIR/pages/auth/signin.js" << 'EOF'
import { useSession, signIn } from 'next-auth/react';
import styles from '../../styles/signin.module.css';
import Layout from '../../components/Layout';

export default function SignIn() {
  const { data: session } = useSession();

  if (session) {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.title}>Already signed in</h1>
          <p className={styles.description}>
            You are already signed in as {session.user.name || session.user.email}
          </p>
          <a href="/users/music-taste" className={styles.button}>
            Go to Music Taste
          </a>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.title}>Sign in to Sonar EDM</h1>
        <p className={styles.description}>
          Connect with Spotify to unlock your sonic DNA
        </p>
        <button
          onClick={() => signIn('spotify', { callbackUrl: '/users/music-taste' })}
          className={styles.spotifyButton}
        >
          Connect with Spotify
        </button>
      </div>
    </Layout>
  );
}
EOF

# Create music-taste.js with correct import paths
cat > "$TEMP_DIR/pages/users/music-taste.js" << 'EOF'
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import SpiderChart from '../../components/SpiderChart';
import ArtistCard from '../../components/ArtistCard';
import TrackCard from '../../components/TrackCard';
import SeasonalMoodCard from '../../components/SeasonalMoodCard';
import VibeQuizCard from '../../components/VibeQuizCard';
import EventCard from '../../components/EventCard';
import EventCorrelationIndicator from '../../components/EventCorrelationIndicator';
import Navigation from '../../components/Navigation';
import styles from '../../styles/MusicTaste.module.css';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch user taste data
      fetch('/api/spotify/user-taste')
        .then(res => res.json())
        .then(data => {
          setUserTaste(data);
          setLoading(false);
          
          // After getting user taste, fetch correlated events
          return fetch('/api/events/correlated-events');
        })
        .then(res => res.json())
        .then(data => {
          setEvents(data.slice(0, 3)); // Show top 3 events
        })
        .catch(err => {
          console.error('Error fetching data:', err);
          setLoading(false);
        });
    }
  }, [status]);

  const handleVibeQuizSubmit = (preferences) => {
    fetch('/api/user/update-taste-preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(preferences),
    })
      .then(res => res.json())
      .then(data => {
        // Update user taste with the new blended preferences
        setUserTaste(prev => ({
          ...prev,
          ...data
        }));
      })
      .catch(err => {
        console.error('Error updating preferences:', err);
      });
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Analyzing your music taste...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.title}>Please sign in to view your music taste</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Navigation />
      <div className={styles.container}>
        <h1 className={styles.title}>Your Music Taste Profile</h1>
        
        <div className={styles.genreList}>
          {userTaste?.topGenres?.map((genre, index) => (
            <div key={index} className={styles.genreTag}>{genre}</div>
          ))}
        </div>
        
        {/* Spider Chart Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Your Genre Affinity
          </h2>
          <div className={styles.spiderChartContainer}>
            <SpiderChart genres={userTaste?.genres || {}} />
          </div>
        </section>
        
        {/* Favorite Artists Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Your Favorite Artists
          </h2>
          <div className={styles.artistsGrid}>
            {userTaste?.topArtists?.map((artist, index) => (
              <ArtistCard 
                key={index}
                artist={artist}
                correlation={artist.correlation || 0.85}
                similarArtists={artist.similarArtists || []}
              />
            ))}
          </div>
        </section>
        
        {/* Top Tracks Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Your Top Tracks
          </h2>
          <div className={styles.tracksGrid}>
            {userTaste?.topTracks?.map((track, index) => (
              <TrackCard 
                key={index}
                track={track}
                correlation={track.correlation || 0.9}
              />
            ))}
          </div>
        </section>
        
        {/* Seasonal Mood Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Your Seasonal Music Mood
          </h2>
          <div className={styles.seasonalGrid}>
            <SeasonalMoodCard season="Winter" mood="Introspective" genres={['Deep House', 'Ambient Techno']} />
            <SeasonalMoodCard season="Spring" mood="Uplifting" genres={['Progressive House', 'Melodic House']} current />
            <SeasonalMoodCard season="Summer" mood="Energetic" genres={['Tech House', 'House']} />
            <SeasonalMoodCard season="Fall" mood="Melancholic" genres={['Organic House', 'Downtempo']} />
          </div>
        </section>
        
        {/* Vibe Quiz Card */}
        <section className={styles.section}>
          <div className={styles.vibeQuizContainer}>
            <VibeQuizCard onSubmit={handleVibeQuizSubmit} />
          </div>
        </section>
        
        {/* Events Section */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>
            Events Based on Your Taste
          </h2>
          
          {events.length > 0 ? (
            <div className={styles.eventsContainer}>
              {events.map((event, index) => (
                <div key={index} className={styles.eventWithCorrelation}>
                  <EventCorrelationIndicator correlation={event.correlation || 0.75} />
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.eventsPlaceholder}>
              <p>Discover events that match your unique music taste profile</p>
              <a href="/users/events" className={styles.exploreButton}>
                Explore All Events
              </a>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
EOF

# Create profile.js
cat > "$TEMP_DIR/pages/users/profile.js" << 'EOF'
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import styles from '../../styles/Profile.module.css';
import SpiderChart from '../../components/SpiderChart';
import Navigation from '../../components/Navigation';

export default function Profile() {
  const { data: session, status } = useSession();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'authenticated') {
      // Fetch user profile data
      fetch('/api/spotify/user-taste')
        .then(res => res.json())
        .then(data => {
          setUserProfile(data);
          setLoading(false);
        })
        .catch(err => {
          console.error('Error fetching user profile:', err);
          setLoading(false);
        });
    }
  }, [status]);

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your profile...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.title}>Please sign in to view your profile</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.profileHeader}>
          <div className={styles.profileImage}>
            {session?.user?.image ? (
              <img src={session.user.image} alt={session.user.name} />
            ) : (
              <div className={styles.profileInitial}>
                {session?.user?.name?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className={styles.profileInfo}>
            <h1 className={styles.title}>{session?.user?.name || 'User'}'s Profile</h1>
            <p className={styles.email}>{session?.user?.email || ''}</p>
          </div>
        </div>

        {userProfile && (
          <div className={styles.profileContent}>
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Your Music DNA</h2>
              <div className={styles.chartContainer}>
                <SpiderChart genres={userProfile.genres} />
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Account Information</h2>
              <div className={styles.accountInfo}>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Member Since:</span>
                  <span className={styles.value}>
                    {new Date().toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Spotify Connected:</span>
                  <span className={styles.value}>Yes</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.label}>Events Attended:</span>
                  <span className={styles.value}>0</span>
                </div>
              </div>
            </div>

            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Preferences</h2>
              <p className={styles.preferencesText}>
                Manage your preferences in the <a href="/users/settings" className={styles.link}>Settings</a> page.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
EOF

# Create settings.js
cat > "$TEMP_DIR/pages/users/settings.js" << 'EOF'
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Layout from '../../components/Layout';
import styles from '../../styles/Settings.module.css';
import Navigation from '../../components/Navigation';

export default function Settings() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState({
    email: true,
    app: true,
    events: true,
    artists: true
  });
  const [privacy, setPrivacy] = useState({
    shareProfile: false,
    shareTaste: true,
    allowRecommendations: true
  });
  const [saved, setSaved] = useState(false);

  const handleNotificationChange = (e) => {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked
    });
    setSaved(false);
  };

  const handlePrivacyChange = (e) => {
    setPrivacy({
      ...privacy,
      [e.target.name]: e.target.checked
    });
    setSaved(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Here you would typically save the settings to your backend
    console.log('Saving settings:', { notifications, privacy });
    
    // Simulate saving
    setTimeout(() => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 500);
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your settings...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <Layout>
        <div className={styles.container}>
          <h1 className={styles.title}>Please sign in to view your settings</h1>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Navigation />
      <div className={styles.container}>
        <h1 className={styles.title}>Settings</h1>
        
   
(Content truncated due to size limit. Use line ranges to read in chunks)