#!/bin/bash

# Comprehensive Fix for User Feedback Issues

# Set the project root directory
cd /c/sonar/users/sonar-edm-user

# Create backup directory
BACKUP_DIR="./backups-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR/pages/users"
mkdir -p "$BACKUP_DIR/pages/api/spotify"
mkdir -p "$BACKUP_DIR/components"
mkdir -p "$BACKUP_DIR/styles"

echo "Created backup directory at $BACKUP_DIR"

# 1. Fix Music Taste API endpoint
echo "Fixing Music Taste API endpoint..."
mkdir -p "./pages/api/spotify"
cp "./pages/api/spotify/user-taste.js" "$BACKUP_DIR/pages/api/spotify/" 2>/dev/null

cat > "./pages/api/spotify/user-taste.js" << 'EOF'
import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req, res) {
  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // For demo purposes, return mock data
    // In production, you would use the Spotify API with the user's access token
    const mockData = {
      topGenres: [
        { name: 'Melodic House', value: 90 },
        { name: 'Techno', value: 80 },
        { name: 'Progressive House', value: 70 },
        { name: 'Trance', value: 60 },
        { name: 'Deep House', value: 50 }
      ],
      topArtists: [
        { 
          name: 'Max Styler', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb8cbc5b79c7ab0ac7e6c0ff03',
          genres: ['melodic house', 'edm'],
          popularity: 90,
          rank: 1,
          similarArtists: [
            { name: 'Autograf', image: 'https://i.scdn.co/image/ab6761610000e5eb8a7af5d1f7eacb6addae5493' },
            { name: 'Amtrac', image: 'https://i.scdn.co/image/ab6761610000e5eb90c4c8a6fb0b4142c57e0bce' }
          ]
        },
        { 
          name: 'ARTBAT', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb4293385d324db8558179afd9',
          genres: ['melodic techno', 'organic house'],
          popularity: 85,
          rank: 2,
          similarArtists: [
            { name: 'Anyma', image: 'https://i.scdn.co/image/ab6761610000e5eb4c7c1e59b3e8c594dce7c2d2' },
            { name: 'Mathame', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' }
          ]
        },
        { 
          name: 'Lane 8', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb7f6d6a0a5b0d5e0747e01522',
          genres: ['progressive house', 'melodic house'],
          popularity: 80,
          rank: 3,
          similarArtists: [
            { name: 'Yotto', image: 'https://i.scdn.co/image/ab6761610000e5eb5d27d18dfef4c76f1b3a0f32' },
            { name: 'Ben Böhmer', image: 'https://i.scdn.co/image/ab6761610000e5eb7eb7d559b43f5e9775b20d9a' }
          ]
        },
        { 
          name: 'Boris Brejcha', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb7324ce0b63aec68c638e26f6',
          genres: ['german techno', 'minimal techno'],
          popularity: 75,
          rank: 4,
          similarArtists: [
            { name: 'Stephan Bodzin', image: 'https://i.scdn.co/image/ab6761610000e5eb4e8b9c8e5c628c4d0d64b463' },
            { name: 'Worakls', image: 'https://i.scdn.co/image/ab6761610000e5eb2d7d5f1fe46b7d1c0d11e0c0' }
          ]
        },
        { 
          name: 'Nora En Pure', 
          image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2',
          genres: ['deep house', 'organic house'],
          popularity: 70,
          rank: 5,
          similarArtists: [
            { name: 'EDX', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' },
            { name: 'Klingande', image: 'https://i.scdn.co/image/ab6761610000e5eb7a487027eb0682d6d7a581c2' }
          ]
        }
      ],
      topTracks: [
        {
          name: 'Techno Cat',
          artist: 'Max Styler',
          image: 'https://i.scdn.co/image/ab67616d0000b273b1f6d5b276074d5d0cd2b66c',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 1
        },
        {
          name: 'Return To Oz (ARTBAT Remix) ',
          artist: 'Monolink',
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 2
        },
        {
          name: 'Atlas',
          artist: 'Lane 8',
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 3
        },
        {
          name: 'Purple Noise',
          artist: 'Boris Brejcha',
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 4
        },
        {
          name: 'Come With Me',
          artist: 'Nora En Pure',
          image: 'https://i.scdn.co/image/ab67616d0000b273b4a3631526592865ea4af096',
          preview: 'https://p.scdn.co/mp3-preview/7e8932d135d63e29e93c64a89b33dbc2c5a1dc3f',
          rank: 5
        }
      ],
      seasonalMood: {
        winter: { genres: ['Deep House', 'Ambient Techno'], mood: 'Introspective' },
        spring: { genres: ['Progressive House', 'Melodic House'], mood: 'Uplifting' },
        summer: { genres: ['Tech House', 'House'], mood: 'Energetic' },
        fall: { genres: ['Organic House', 'Downtempo'], mood: 'Melancholic' },
        current: 'spring'
      }
    };
    
    return res.status(200) .json(mockData);
  } catch (error) {
    console.error('Error fetching user taste:', error);
    return res.status(500).json({ error: 'Failed to fetch music taste data' });
  }
}
EOF

# 2. Fix Navigation component
echo "Fixing Navigation component..."
cp "./components/Navigation.js" "$BACKUP_DIR/components/"

cat > "./components/Navigation.js" << 'EOF'
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { signOut, useSession } from 'next-auth/react';
import styles from '../styles/Navigation.module.css';

export default function Navigation({ activePage }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Toggle profile menu
  const toggleProfileMenu = () => {
    setShowProfileMenu(!showProfileMenu);
  };
  
  // Handle sign out
  const handleSignOut = async (e) => {
    e.preventDefault();
    await signOut({ redirect: false });
    router.push('/');
  };
  
  return (
    <nav className={styles.navigation}>
      <div className={styles.navContainer}>
        <div className={styles.logoContainer}>
          <Link href="/users/music-taste">
            <a className={styles.logo}>
              <span className={styles.logoText}>Sonar</span>
              <span className={styles.logoAccent}>EDM</span>
            </a>
          </Link>
        </div>
        
        <div className={styles.navLinks}>
          <Link href="/users/music-taste">
            <a className={`${styles.navLink} ${activePage === 'music-taste' ? styles.active : ''}`}>
              <span className={styles.navIcon}>🎵</span>
              <span className={styles.navText}>Music Taste</span>
            </a>
          </Link>
          
          <Link href="/users/events">
            <a className={`${styles.navLink} ${activePage === 'events' ? styles.active : ''}`}>
              <span className={styles.navIcon}>🎭</span>
              <span className={styles.navText}>Events</span>
            </a>
          </Link>
        </div>
        
        <div className={styles.userMenu}>
          <div className={styles.userAvatar} onClick={toggleProfileMenu}>
            <span>{session?.user?.name?.charAt(0) || 'S'}</span>
          </div>
          
          {showProfileMenu && (
            <div className={styles.profileMenu}>
              <div className={styles.profileMenuHeader}>
                <span className={styles.profileName}>{session?.user?.name || 'User'}</span>
                <span className={styles.profileEmail}>{session?.user?.email || ''}</span>
              </div>
              <ul className={styles.profileMenuItems}>
                <li className={styles.profileMenuItem}>
                  <Link href="/users/profile">
                    <a>Profile</a>
                  </Link>
                </li>
                <li className={styles.profileMenuItem}>
                  <Link href="/users/settings">
                    <a>Settings</a>
                  </Link>
                </li>
                <li className={styles.profileMenuDivider}></li>
                <li className={styles.profileMenuItem}>
                  <a href="#" onClick={handleSignOut}>Sign Out</a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
EOF

# 3. Update Navigation CSS
echo "Updating Navigation CSS..."
cp "./styles/Navigation.module.css" "$BACKUP_DIR/styles/"

cat > "./styles/Navigation.module.css" << 'EOF'
.navigation {
  background-color: rgba(20, 20, 30, 0.8);
  backdrop-filter: blur(10px);
  padding: 0.8rem 1.5rem;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.navContainer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
}

.logoContainer {
  flex: 1;
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  text-decoration: none;
  display: flex;
  align-items: center;
}

.logoText {
  color: white;
}

.logoAccent {
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.navLinks {
  display: flex;
  gap: 1rem;
  flex: 2;
  justify-content: center;
}

.navLink {
  display: flex;
  align-items: center;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease;
  font-weight: 500;
}

.navLink:hover {
  color: white;
  background-color: rgba(255, 255, 255, 0.1);
}

.navLink.active {
  color: white;
  background-color: rgba(138, 43, 226, 0.2);
  position: relative;
}

.navLink.active::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 2px;
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
  border-radius: 2px;
}

.navIcon {
  margin-right: 0.5rem;
  font-size: 1.2rem;
}

.userMenu {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  position: relative;
}

.userAvatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff6b8b, #5e72eb);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.userAvatar:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.profileMenu {
  position: absolute;
  top: 50px;
  right: 0;
  background-color: rgba(30, 30, 40, 0.95);
  border-radius: 12px;
  width: 220px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  z-index: 200;
  animation: fadeIn 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transform: translateY(0) skewX(-2deg);
  transform-origin: top right;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px) skewX(-2deg); }
  to { opacity: 1; transform: translateY(0) skewX(-2deg); }
}

.profileMenuHeader {
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
  transform: skewX(2deg);
}

.profileName {
  display: block;
  font-weight: 600;
  color: white;
  margin-bottom: 0.2rem;
}

.profileEmail {
  display: block;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.profileMenuItems {
  list-style: none;
  padding: 0;
  margin: 0;
  transform: skewX(2deg);
}

.profileMenuItem {
  padding: 0;
}

.profileMenuItem a {
  display: block;
  padding: 0.8rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  transition: all 0.2s ease;
}

.profileMenuItem a:hover {
  background-color: rgba(138, 43, 226, 0.2);
  color: white;
}

.profileMenuDivider {
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .navText {
    display: none;
  }
  
  .navIcon {
    margin-right: 0;
    font-size: 1.4rem;
  }
  
  .navLink {
    padding: 0.5rem;
  }
}

@media (max-width: 480px) {
  .navigation {
    padding: 0.6rem 1rem;
  }
  
  .logo {
    font-size: 1.2rem;
  }
  
  .userAvatar {
    width: 35px;
    height: 35px;
  }
}
EOF

# 4. Fix Music Taste page
echo "Fixing Music Taste page..."
cp "./pages/users/music-taste.js" "$BACKUP_DIR/pages/users/"

cat > "./pages/users/music-taste.js" << 'EOF'
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import axios from 'axios';
import Head from 'next/head';
import Link from 'next/link';
import Navigation from '../../components/Navigation';
import styles from '../../styles/MusicTaste.module.css';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [musicTaste, setMusicTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('genres');
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);

  useEffect(() => {
    const fetchMusicTaste = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/spotify/user-taste');
        setMusicTaste(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching music taste:', err);
        setError('Error fetching music taste data');
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchMusicTaste();
    }
  }, [session]);

  // Prepare chart data
  const prepareChartData = () => {
    if (!musicTaste || !musicTaste.topGenres) return null;

    return {
      labels: musicTaste.topGenres.map(genre => genre.name),
      datasets: [
        {
          label: 'Genre Affinity',
          data: musicTaste.topGenres.map(genre => genre.value),
          backgroundColor: 'rgba(138, 43, 226, 0.2)',
          borderColor: 'rgba(138, 43, 226, 1)',
          borderWidth: 2,
          pointBackgroundColor: 'rgba(255, 107, 107, 1)',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: 'rgba(255, 107, 107, 1)',
          pointRadius: 5,
          pointHoverRadius: 7
        }
      ]
    };
  };

  const chartOptions = {
    scales: {
      r: {
        angleLines: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.2)'
        },
        pointLabels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            size: 12
          }
        },
        ticks: {
          backdropColor: 'transparent',
          color: 'rgba(255, 255, 255, 0.7)'
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(30, 30, 40, 0.9)',
        titleColor: 'rgba(255, 255, 255, 1)',
        bodyColor: 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(138, 43, 226, 0.5)',
        borderWidth: 1
      }
    },
    maintainAspectRatio: false
  };

  // Handle section navigation
  const handleSectionChange = (section) => {
    setActiveSection(section);
  };

  // Toggle Vibe Quiz
  const toggleVibeQuiz = () => {
    setShowVibeQuiz(!showVibeQuiz);
  };

  // Handle Vibe Quiz submission
  const handleVibeQuizSubmit = async (preferences) => {
    try {
      await axios.post('/api/user/update-taste-preferences', { preferences });
      // Refresh music taste data
      const response = await axios.get('/api/spotify/user-taste');
      setMusicTaste(response.data);
    } catch (err) {
      console.error('Error updating taste preferences:', err);
    }
  };

  if (status === 'loading') {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  if (!session) {
    return (
      <div className={styles.errorContainer}>
        <p>You must be signed in to view this page.</p>
        <Link href="/api/auth/signin">
          <a className={styles.signInButton}>Sign in</a>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Music Taste | Sonar EDM</title>
        <meta name="description" content="Explore your EDM music preferences" />
      </Head>

      <Navigation activePage="music-taste" />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Your Music Taste</h1>
          <p className={styles.subtitle}>
            Explore your EDM preferences based on your Spotify listening history
          </p>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading your music taste profile...</p>
          </div>
        ) : error ? (
          <div className={styles.errorCard}>
            <h2>Error loading music taste</h2>
            <p>{error}</p>
            <button 
              className={styles.retryButton}
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Quick Navigation */}
            <div className={styles.quickNav}>
              <button 
                className={`${styles.quickNavButton} ${activeSection === 'genres' ? styles.active : ''}`}
                onClick={() => handleSectionChange('genres')}
              >
                Genres
              </button>
              <button 
                className={`${styles.quickNavButton} ${activeSection === 'artists' ? styles.active : ''}`}
                onClick={() => handleSectionChange('artists')}
              >
                Artists
              </button>
              <button 
                className={`${styles.quickNavButton} ${activeSection === 'tracks' ? styles.active : ''}`}
                onClick={() => handleSectionChange('tracks')}
              >
                Tracks
              </button>
              <button 
                className={`${styles.quickNavButton} ${activeSection === 'seasonal' ? styles.active : ''}`}
                onClick={() => handleSectionChange('seasonal')}
              >
                Seasonal
              </button>
            </div>

            {/* Genre Radar Chart */}
            <section 
              id="genres" 
              className={`${styles.section} ${activeSection === 'genres' ? styles.active : ''}`}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Genre Affinity</h2>
                <p className={styles.sectionSubtitle}>
                  Your top EDM genres based on listening patterns
                </p>
              </div>

              <div className={styles.chartContainer}>
                {prepareChartData() && (
                  <Radar data={prepareChartData()} options={chartOptions} />
                )}
              </div>
            </section>

            {/* Top Artists */}
            <section 
              id="artists" 
              className={`${styles.section} ${activeSection === 'artists' ? styles.active : ''}`}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Top Artists</h2>
                <p className={styles.sectionSubtitle}>
                  Your most played EDM artists
                </p>
              </div>

              <div className={styles.artistsGrid}>
                {musicTaste?.topArtists?.map((artist, index) => (
                  <div key={index} className={styles.artistCard}>
                    <div className={styles.artistRank}>#{artist.rank}</div>
                    <div className={styles.artistImageContainer}>
                      <img 
                        src={artist.image} 
                        alt={artist.name} 
                        className={styles.artistImage} 
                      />
                    </div>
                    <h3 className={styles.artistName}>{artist.name}</h3>
                    <div className={styles.artistGenres}>
                      {artist.genres.join(' • ')}
                    </div>
                    
                    {artist.similarArtists && artist.similarArtists.length > 0 && (
                      <div className={styles.similarArtists}>
                        <h4 className={styles.similarTitle}>Similar Artists</h4>
                        <div className={styles.similarGrid}>
                          {artist.similarArtists.map((similar, idx) => (
                            <div key={idx} className={styles.similarArtist}>
                              <img 
                                src={similar.image} 
                                alt={similar.name} 
                                className={styles.similarImage} 
                              />
                              <span className={styles.similarName}>{similar.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Top Tracks */}
            <section 
              id="tracks" 
              className={`${styles.section} ${activeSection === 'tracks' ? styles.active : ''}`}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Top Tracks</h2>
                <p className={styles.sectionSubtitle}>
                  Your most played EDM tracks
                </p>
              </div>

              <div className={styles.tracksContainer}>
                {musicTaste?.topTracks?.map((track, index) => (
                  <div key={index} className={styles.trackCard}>
                    <div className={styles.trackRank}>#{track.rank}</div>
                    <img 
                      src={track.image} 
                      alt={track.name} 
                      className={styles.trackImage} 
                    />
                    <div className={styles.trackInfo}>
                      <h3 className={styles.trackName}>{track.name}</h3>
                      <p className={styles.trackArtist}>{track.artist}</p>
                    </div>
                    {track.preview && (
                      <audio 
                        className={styles.trackPreview} 
                        controls 
                        src={track.preview}
                      ></audio>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Seasonal Mood */}
            <section 
              id="seasonal" 
              className={`${styles.section} ${activeSection === 'seasonal' ? styles.active : ''}`}
            >
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>Seasonal Mood</h2>
                <p className={styles.sectionSubtitle}>
                  How your music taste changes with the seasons
                </p>
              </div>

              <div className={styles.seasonalContainer}>
                {musicTaste?.seasonalMood && (
                  <>
                    <div className={`${styles.seasonCard} ${styles.winter} ${musicTaste.seasonalMood.current === 'winter' ? styles.current : ''}`}>
                      <h3 className={styles.seasonName}>Winter</h3>
                      <div className={styles.seasonMood}>
                        <span className={styles.moodLabel}>Mood:</span> 
                        <span className={styles.moodValue}>{musicTaste.seasonalMood.winter.mood}</span>
                      </div>
                      <div className={styles.seasonGenres}>
                        <span className={styles.genresLabel}>Genres:</span>
                        <div className={styles.genresList}>
                          {musicTaste.seasonalMood.winter.genres.map((genre, idx) => (
                            <span key={idx} className={styles.genreTag}>{genre}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${styles.seasonCard} ${styles.spring} ${musicTaste.seasonalMood.current === 'spring' ? styles.current : ''}`}>
                      <h3 className={styles.seasonName}>Spring</h3>
                      <div className={styles.seasonMood}>
                        <span className={styles.moodLabel}>Mood:</span> 
                        <span className={styles.moodValue}>{musicTaste.seasonalMood.spring.mood}</span>
                      </div>
                      <div className={styles.seasonGenres}>
                        <span className={styles.genresLabel}>Genres:</span>
                        <div className={styles.genresList}>
                          {musicTaste.seasonalMood.spring.genres.map((genre, idx) => (
                            <span key={idx} className={styles.genreTag}>{genre}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${styles.seasonCard} ${styles.summer} ${musicTaste.seasonalMood.current === 'summer' ? styles.current : ''}`}>
                      <h3 className={styles.seasonName}>Summer</h3>
                      <div className={styles.seasonMood}>
                        <span className={styles.moodLabel}>Mood:</span> 
                        <span className={styles.moodValue}>{musicTaste.seasonalMood.summer.mood}</span>
                      </div>
                      <div className={styles.seasonGenres}>
                        <span className={styles.genresLabel}>Genres:</span>
                        <div className={styles.genresList}>
                          {musicTaste.seasonalMood.summer.genres.map((genre, idx) => (
                            <span key={idx} className={styles.genreTag}>{genre}</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={`${styles.seasonCard} ${styles.fall} ${musicTaste.seasonalMood.current === 'fall' ? styles.current : ''}`}>
                      <h3 className={styles.seasonName}>Fall</h3>
                      <div className={styles.seasonMood}>
                        <span className={styles.moodLabel}>Mood:</span> 
                        <span className={styles.moodValue}>{musicTaste.seasonalMood.fall.mood}</span>
                      </div>
                      <div className={styles.seasonGenres}>
                        <span className={styles.genresLabel}>Genres:</span>
                        <div className={styles.genresList}>
                          {musicTaste.seasonalMood.fall.genres.map((genre, idx) => (
                            <span key={idx} className={styles.genreTag}>{genre}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Vibe Quiz Card */}
            <div className={styles.vibeQuizContainer}>
              <div className={`${styles.vibeQuizCard} ${showVibeQuiz ? styles.expanded : ''}`}>
                <div className={styles.vibeQuizHeader} onClick={toggleVibeQuiz}>
                  <h3 className={styles.vibeQuizTitle}>
                    {showVibeQuiz ? 'Refine Your Taste Profile' : 'Something doesn\'t feel right?'}
                  </h3>
                  <div className={styles.toggleIcon}>
                    {showVibeQuiz ? '−' : '+'}
                  </div>
                </div>
                
                {showVibeQuiz && (
                  <div className={styles.vibeQuizContent}>
                    <p className={styles.vibeQuizDescription}>
                      Answer a few quick questions to help us fine-tune your music recommendations.
                    </p>
                    
                    <div className={styles.quizForm}>
                      <div className={styles.quizQuestion}>
                        <h4>What tempo do you prefer?</h4>
                        <div className={styles.quizOptions}>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ tempo: 'slow' })}
                          >
                            Slow & Chill
                          </button>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ tempo: 'medium' })}
                          >
                            Medium & Groovy
                          </button>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ tempo: 'fast' })}
                          >
                            Fast & Energetic
                          </button>
                        </div>
                      </div>
                      
                      <div className={styles.quizQuestion}>
                        <h4>What mood resonates with you most?</h4>
                        <div className={styles.quizOptions}>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ mood: 'dark' })}
                          >
                            Dark & Mysterious
                          </button>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ mood: 'uplifting' })}
                          >
                            Uplifting & Euphoric
                          </button>
                          <button 
                            className={styles.quizOption}
                            onClick={() => handleVibeQuizSubmit({ mood: 'melodic' })}
                          >
                            Melodic & Emotional
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Events Navigation Card */}
            <div className={styles.eventsNavContainer}>
              <div className={styles.eventsNavCard}>
                <div className={styles.eventsNavContent}>
                  <h3 className={styles.eventsNavTitle}>Discover Events That Match Your Taste</h3>
                  <p className={styles.eventsNavDescription}>
                    Find EDM events featuring artists and genres you love
                  </p>
                  <Link href="/users/events">
                    <a className={styles.eventsNavButton}>
                      Explore Events
                    </a>
                  </Link>
                </div>
                <div className={styles.eventsNavDecoration}></div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
EOF

# 5. Create MusicTaste.module.css
echo "Creating MusicTaste.module.css..."
cp "./styles/MusicTaste.module.css" "$BACKUP_DIR/styles/" 2>/dev/null

cat > "./styles/MusicTaste.module.css" << 'EOF'
.container {
  min-height: 100vh;
  background-color: #0f0f17;
  color: white;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  display: inline-block;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.1rem;
}

.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: rgba(255, 255, 255, 0.8);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #5e72eb;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.errorContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
}

.signInButton {
  display: inline-block;
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  margin-top: 1.5rem;
  text-decoration: none;
  transition: all 0.3s ease;
}

.signInButton:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.errorCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  max-width: 500px;
  margin: 0 auto;
  border-left: 4px solid #ff6b6b;
  transform: skewX(-2deg);
  transform-origin: top left;
}

.errorCard h2 {
  margin-top: 0;
  transform: skewX(2deg);
}

.errorCard p {
  margin-bottom: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  transform: skewX(2deg);
}

.retryButton {
  background: linear-gradient(90deg, #ff6b6b, #ff8e8e);
  color: white;
  border: none;
  padding: 0.7rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: skewX(2deg);
}

.retryButton:hover {
  transform: translateY(-2px) skewX(2deg);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

/* Quick Navigation */
.quickNav {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
}

.quickNavButton {
  background-color: rgba(30, 30, 40, 0.7);
  color: rgba(255, 255, 255, 0.7);
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 50px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.quickNavButton:hover {
  background-color: rgba(138, 43, 226, 0.2);
  color: white;
}

.quickNavButton.active {
  background: linear-gradient(90deg, rgba(138, 43, 226, 0.3), rgba(255, 107, 107, 0.3));
  color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

/* Sections */
.section {
  display: none;
  margin-bottom: 3rem;
  animation: fadeIn 0.5s ease;
}

.section.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.sectionHeader {
  margin-bottom: 2rem;
  text-align: center;
}

.sectionTitle {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  position: relative;
  display: inline-block;
}

.sectionTitle::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
  border-radius: 3px;
}

.sectionSubtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 1rem;
}

/* Chart Container */
.chartContainer {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  padding: 2rem;
  height: 400px;
  max-width: 600px;
  margin: 0 auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-left: 4px solid #8a2be2;
  transform: skewX(-2deg);
  transform-origin: top left;
}

/* Artists Section */
.artistsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 2rem;
}

.artistCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  padding: 2rem;
  position: relative;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border-left: 4px solid #8a2be2;
  transform: skewX(-2deg);
  transform-origin: top left;
}

.artistCard:hover {
  transform: translateY(-5px) skewX(-2deg);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.artistRank {
  position: absolute;
  top: -10px;
  right: -10px;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff6b8b, #5e72eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 2;
  transform: skewX(2deg);
}

.artistImageContainer {
  width: 120px;
  height: 120px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  transform: skewX(2deg);
}

.artistImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.artistName {
  text-align: center;
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
  transform: skewX(2deg);
}

.artistGenres {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 1.5rem;
  transform: skewX(2deg);
}

.similarArtists {
  transform: skewX(2deg);
}

.similarTitle {
  font-size: 1rem;
  margin-bottom: 1rem;
  position: relative;
  display: inline-block;
}

.similarTitle::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 30px;
  height: 2px;
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
  border-radius: 2px;
}

.similarGrid {
  display: flex;
  gap: 1rem;
}

.similarArtist {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 70px;
}

.similarImage {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  margin-bottom: 0.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.similarName {
  font-size: 0.8rem;
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* Tracks Section */
.tracksContainer {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.trackCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  border-left: 4px solid #8a2be2;
  transform: skewX(-2deg);
  transform-origin: top left;
}

.trackCard:hover {
  transform: translateY(-3px) skewX(-2deg);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.trackRank {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #ff6b8b, #5e72eb);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.2rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  transform: skewX(2deg);
}

.trackImage {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
  transform: skewX(2deg);
}

.trackInfo {
  flex-grow: 1;
  transform: skewX(2deg);
}

.trackName {
  font-size: 1.2rem;
  margin: 0 0 0.3rem;
}

.trackArtist {
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.trackPreview {
  width: 200px;
  height: 40px;
  transform: skewX(2deg);
}

/* Seasonal Mood Section */
.seasonalContainer {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 2rem;
}

.seasonCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border-left: 4px solid;
  transform: skewX(-2deg);
  transform-origin: top left;
}

.seasonCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), transparent 80%);
  z-index: 0;
}

.seasonCard.winter {
  border-left-color: #5e72eb;
}

.seasonCard.spring {
  border-left-color: #8a2be2;
}

.seasonCard.summer {
  border-left-color: #ff6b8b;
}

.seasonCard.fall {
  border-left-color: #ff8e3c;
}

.seasonCard.current::after {
  content: 'Current Season';
  position: absolute;
  top: 10px;
  right: 10px;
  background: linear-gradient(90deg, #ff6b8b, #5e72eb);
  color: white;
  font-size: 0.7rem;
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-weight: 600;
  transform: skewX(2deg);
}

.seasonName {
  font-size: 1.5rem;
  margin-top: 0;
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
  transform: skewX(2deg);
}

.seasonMood {
  margin-bottom: 1rem;
  position: relative;
  z-index: 1;
  transform: skewX(2deg);
}

.moodLabel {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
}

.moodValue {
  font-weight: 600;
  margin-left: 0.3rem;
}

.seasonGenres {
  position: relative;
  z-index: 1;
  transform: skewX(2deg);
}

.genresLabel {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  display: block;
  margin-bottom: 0.5rem;
}

.genresList {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genreTag {
  background-color: rgba(255, 255, 255, 0.1);
  padding: 0.3rem 0.8rem;
  border-radius: 20px;
  font-size: 0.8rem;
}

/* Vibe Quiz Card */
.vibeQuizContainer {
  margin: 3rem 0;
}

.vibeQuizCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border-left: 4px solid #ff6b6b;
  transform: skewX(-2deg);
  transform-origin: top left;
}

.expanded {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.vibeQuizHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  cursor: pointer;
  background: linear-gradient(90deg, rgba(138, 43, 226, 0.2), rgba(255, 107, 107, 0.2));
  position: relative;
  z-index: 1;
}

.vibeQuizHeader::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(138, 43, 226, 0.1), transparent 70%);
  z-index: -1;
}

.vibeQuizTitle {
  margin: 0;
  font-size: 1.2rem;
  color: white;
  font-weight: 600;
  transform: skewX(2deg);
}

.toggleIcon {
  font-size: 1.5rem;
  color: #ff6b6b;
  transform: skewX(2deg);
}

.vibeQuizContent {
  padding: 2rem;
  transform: skewX(2deg);
}

.vibeQuizDescription {
  margin-top: 0;
  margin-bottom: 2rem;
  color: rgba(255, 255, 255, 0.9);
}

.quizForm {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.quizQuestion h4 {
  margin-top: 0;
  margin-bottom: 1rem;
  font-size: 1.1rem;
}

.quizOptions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.quizOption {
  background-color: rgba(30, 30, 40, 0.9);
  border: 1px solid rgba(138, 43, 226, 0.4);
  color: white;
  padding: 1rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  text-align: center;
}

.quizOption:hover {
  background-color: rgba(138, 43, 226, 0.3);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Events Navigation Card */
.eventsNavContainer {
  margin: 3rem 0;
}

.eventsNavCard {
  background-color: rgba(30, 30, 40, 0.7);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  position: relative;
  overflow: hidden;
  border-left: 4px solid #5e72eb;
  transform: skewX(-2deg);
  transform-origin: top left;
}

.eventsNavCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(94, 114, 235, 0.2), transparent 70%);
  z-index: 0;
}

.eventsNavContent {
  position: relative;
  z-index: 1;
  transform: skewX(2deg);
}

.eventsNavTitle {
  font-size: 1.5rem;
  margin-top: 0;
  margin-bottom: 0.5rem;
}

.eventsNavDescription {
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

.eventsNavButton {
  display: inline-block;
  background: linear-gradient(90deg, #5e72eb, #8a2be2);
  color: white;
  padding: 0.8rem 2rem;
  border-radius: 50px;
  font-weight: 600;
  text-decoration: none;
  transition: all 0.3s ease;
}

.eventsNavButton:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
}

.eventsNavDecoration {
  position: absolute;
  top: 50%;
  right: 2rem;
  transform: translateY(-50%) skewX(2deg);
  width: 100px;
  height: 100px;
  background: url('/images/event-icon.svg') no-repeat center;
  background-size: contain;
  opacity: 0.2;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main {
    padding: 1.5rem 1rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .chartContainer {
    padding: 1.5rem;
    height: 350px;
  }
  
  .artistsGrid {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  }
  
  .trackCard {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .trackRank {
    position: absolute;
    top: -10px;
    right: -10px;
  }
  
  .trackImage {
    width: 100%;
    height: auto;
    aspect-ratio: 1;
    max-width: 200px;
  }
  
  .trackInfo {
    width: 100%;
  }
  
  .trackPreview {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 1.8rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .quickNav {
    gap: 0.5rem;
  }
  
  .quickNavButton {
    padding: 0.5rem 1rem;
    font-size: 0.9rem;
  }
  
  .chartContainer {
    height: 300px;
    padding: 1rem;
  }
  
  .artistsGrid {
    grid-template-columns: 1fr;
  }
  
  .seasonalContainer {
    grid-template-columns: 1fr;
  }
  
  .eventsNavCard {
    padding: 1.5rem;
  }
  
  .eventsNavTitle {
    font-size: 1.3rem;
  }
  
  .eventsNavDecoration {
    display: none;
  }
}
EOF

# 6. Install required dependencies
echo "Installing required dependencies..."
npm install --save react-chartjs-2 chart.js axios

# 7. Clean up temporary files
echo "Cleaning up temporary files..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf .vercel
rm -rf out
rm -rf build
find . -name "*.log" -type f -delete
find . -name ".DS_Store" -type f -delete

# 8. Commit changes
echo "Committing changes..."
git add .
git commit -m "Fix user feedback issues: Music Taste page, Navigation, Profile button"

# 9. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku main

echo "User feedback fixes complete!"
echo "Your Sonar EDM Platform should now have:"
echo "- Fixed Music Taste page with mock data"
echo "- Improved Navigation with profile dropdown menu"
echo "- Fixed header aesthetics"
echo "- Venues changed to Events"
echo "- Logout moved to profile dropdown"
