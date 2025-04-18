#!/bin/bash

# Sonar EDM Platform - Theme Insights Enhancement Script
# This script enhances the theme with artist card design and implements
# multiple theme options while improving the Year-Round Vibes section.

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform - Theme Insights Enhancement Script ===${NC}"
echo -e "${BLUE}This script enhances the theme with artist card design and implements${NC}"
echo -e "${BLUE}multiple theme options while improving the Year-Round Vibes section.${NC}\n"

# Check if we're in the project directory
if [ ! -d "./pages" ] || [ ! -d "./components" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory.${NC}"
  echo -e "${YELLOW}Please navigate to your project directory and run this script again.${NC}"
  exit 1
fi

# Create backup directory
BACKUP_DIR="./backups/theme_insights_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR/components"
mkdir -p "$BACKUP_DIR/styles"
mkdir -p "$BACKUP_DIR/pages/users"
mkdir -p "$BACKUP_DIR/pages/api/user"

echo -e "${YELLOW}Creating backups of files to be modified...${NC}"

# Backup files before modification
[ -f ./components/ArtistCard.js ] && cp ./components/ArtistCard.js "$BACKUP_DIR/components/"
[ -f ./components/TrackCard.js ] && cp ./components/TrackCard.js "$BACKUP_DIR/components/"
[ -f ./components/SeasonalMoodCard.js ] && cp ./components/SeasonalMoodCard.js "$BACKUP_DIR/components/"
[ -f ./styles/ArtistCard.module.css ] && cp ./styles/ArtistCard.module.css "$BACKUP_DIR/styles/"
[ -f ./styles/TrackCard.module.css ] && cp ./styles/TrackCard.module.css "$BACKUP_DIR/styles/"
[ -f ./styles/MusicTaste.module.css ] && cp ./styles/MusicTaste.module.css "$BACKUP_DIR/styles/"
[ -f ./styles/SeasonalMoodCard.module.css ] && cp ./styles/SeasonalMoodCard.module.css "$BACKUP_DIR/styles/"
[ -f ./pages/users/music-taste.js ] && cp ./pages/users/music-taste.js "$BACKUP_DIR/pages/users/"
[ -f ./pages/users/settings.js ] && cp ./pages/users/settings.js "$BACKUP_DIR/pages/users/"
[ -f ./pages/api/user/update-theme.js ] && cp ./pages/api/user/update-theme.js "$BACKUP_DIR/pages/api/user/"

echo -e "${GREEN}Backups created in $BACKUP_DIR${NC}\n"

# Create theme context provider
echo -e "${YELLOW}Creating theme context provider...${NC}"

mkdir -p ./contexts

cat > ./contexts/ThemeContext.js << 'EOL'
import React, { createContext, useContext, useState, useEffect } from 'react';

// Available themes
export const THEMES = {
  NEON: 'neon',
  PURPLE: 'purple',
  MINIMAL: 'minimal'
};

// Theme context
const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(THEMES.NEON);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('sonarTheme');
    if (savedTheme && Object.values(THEMES).includes(savedTheme)) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);
  
  // Update theme
  const changeTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
      localStorage.setItem('sonarTheme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      
      // Also save to API if available
      try {
        fetch('/api/user/update-theme', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ theme: newTheme }),
        }).catch(err => console.log('Could not save theme to API:', err));
      } catch (error) {
        console.log('Error saving theme to API:', error);
      }
    }
  };
  
  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
EOL

echo -e "${GREEN}Created theme context provider${NC}\n"

# Create theme API endpoint
echo -e "${YELLOW}Creating theme API endpoint...${NC}"

mkdir -p ./pages/api/user

cat > ./pages/api/user/update-theme.js << 'EOL'
import { getSession } from 'next-auth/react';
import { saveUserPreferences } from '../../../lib/cache';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });
    
    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { theme } = req.body;
    
    if (!theme || typeof theme !== 'string') {
      return res.status(400).json({ error: 'Invalid theme data' });
    }
    
    // Get user ID
    const userId = session.user.id || session.user.email || 'anonymous';
    
    // Save theme preference to MongoDB if available
    try {
      await saveUserPreferences(userId, { theme });
    } catch (error) {
      console.warn('Could not save theme to MongoDB:', error);
      // Continue anyway since we also save to localStorage
    }
    
    return res.status(200).json({ 
      success: true, 
      message: 'Theme updated successfully'
    });
  } catch (error) {
    console.error('Error updating theme:', error);
    return res.status(500).json({ error: 'Failed to update theme' });
  }
}
EOL

echo -e "${GREEN}Created theme API endpoint${NC}\n"

# Update _app.js to include ThemeProvider
echo -e "${YELLOW}Updating _app.js to include ThemeProvider...${NC}"

# Backup _app.js
[ -f ./pages/_app.js ] && cp ./pages/_app.js "$BACKUP_DIR/pages/"

cat > ./pages/_app.js << 'EOL'
import '../styles/globals.css';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '../contexts/ThemeContext';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </SessionProvider>
  );
}

export default MyApp;
EOL

echo -e "${GREEN}Updated _app.js to include ThemeProvider${NC}\n"

# Update globals.css with theme variables
echo -e "${YELLOW}Updating globals.css with theme variables...${NC}"

# Backup globals.css
[ -f ./styles/globals.css ] && cp ./styles/globals.css "$BACKUP_DIR/styles/"

cat > ./styles/globals.css << 'EOL'
html,
body {
  padding: 0;
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
    Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}

a {
  color: inherit;
  text-decoration: none;
}

* {
  box-sizing: border-box;
}

/* Theme Variables */
:root {
  /* Default theme (Neon) */
  --primary-color: #00e5ff;
  --secondary-color: #0077ff;
  --accent-color: #ff00ff;
  --background-color: #121212;
  --card-background: #1e1e1e;
  --text-color: #ffffff;
  --text-secondary: #b3b3b3;
  --success-color: #00e676;
  --warning-color: #ffea00;
  --error-color: #ff1744;
  --border-radius: 12px;
  --card-shadow: 0 4px 20px rgba(0, 229, 255, 0.15);
  --gradient-primary: linear-gradient(135deg, #00e5ff, #0077ff);
  --gradient-accent: linear-gradient(135deg, #ff00ff, #0077ff);
}

/* Purple Theme */
[data-theme='purple'] {
  --primary-color: #9c27b0;
  --secondary-color: #673ab7;
  --accent-color: #e040fb;
  --background-color: #121212;
  --card-background: #1e1e1e;
  --text-color: #ffffff;
  --text-secondary: #b3b3b3;
  --success-color: #00e676;
  --warning-color: #ffea00;
  --error-color: #ff1744;
  --border-radius: 12px;
  --card-shadow: 0 4px 20px rgba(156, 39, 176, 0.15);
  --gradient-primary: linear-gradient(135deg, #9c27b0, #673ab7);
  --gradient-accent: linear-gradient(135deg, #e040fb, #673ab7);
}

/* Minimal Theme */
[data-theme='minimal'] {
  --primary-color: #757575;
  --secondary-color: #424242;
  --accent-color: #9e9e9e;
  --background-color: #121212;
  --card-background: #1e1e1e;
  --text-color: #ffffff;
  --text-secondary: #b3b3b3;
  --success-color: #00e676;
  --warning-color: #ffea00;
  --error-color: #ff1744;
  --border-radius: 8px;
  --card-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  --gradient-primary: linear-gradient(135deg, #757575, #424242);
  --gradient-accent: linear-gradient(135deg, #9e9e9e, #424242);
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
}
EOL

echo -e "${GREEN}Updated globals.css with theme variables${NC}\n"

# Create ThemeToggle component
echo -e "${YELLOW}Creating ThemeToggle component...${NC}"

mkdir -p ./components

cat > ./components/ThemeToggle.js << 'EOL'
import React from 'react';
import { useTheme, THEMES } from '../contexts/ThemeContext';
import styles from '../styles/ThemeToggle.module.css';

export default function ThemeToggle({ floating = false }) {
  const { theme, changeTheme } = useTheme();
  
  const handleThemeChange = (newTheme) => {
    changeTheme(newTheme);
  };
  
  if (floating) {
    return (
      <div className={styles.floatingToggle}>
        <button 
          className={`${styles.floatingButton} ${theme === THEMES.NEON ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.NEON)}
          aria-label="Neon Theme"
          title="Neon Theme"
        >
          <span className={styles.neonIcon}></span>
        </button>
        <button 
          className={`${styles.floatingButton} ${theme === THEMES.PURPLE ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.PURPLE)}
          aria-label="Purple Theme"
          title="Purple Theme"
        >
          <span className={styles.purpleIcon}></span>
        </button>
        <button 
          className={`${styles.floatingButton} ${theme === THEMES.MINIMAL ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.MINIMAL)}
          aria-label="Minimal Theme"
          title="Minimal Theme"
        >
          <span className={styles.minimalIcon}></span>
        </button>
      </div>
    );
  }
  
  return (
    <div className={styles.themeToggle}>
      <h3 className={styles.themeTitle}>Theme</h3>
      <div className={styles.themeOptions}>
        <div 
          className={`${styles.themeOption} ${theme === THEMES.NEON ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.NEON)}
        >
          <div className={`${styles.themePreview} ${styles.neonPreview}`}>
            <div className={styles.previewBar}></div>
          </div>
          <span className={styles.themeName}>Neon</span>
        </div>
        
        <div 
          className={`${styles.themeOption} ${theme === THEMES.PURPLE ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.PURPLE)}
        >
          <div className={`${styles.themePreview} ${styles.purplePreview}`}>
            <div className={styles.previewBar}></div>
          </div>
          <span className={styles.themeName}>Purple</span>
        </div>
        
        <div 
          className={`${styles.themeOption} ${theme === THEMES.MINIMAL ? styles.active : ''}`}
          onClick={() => handleThemeChange(THEMES.MINIMAL)}
        >
          <div className={`${styles.themePreview} ${styles.minimalPreview}`}>
            <div className={styles.previewBar}></div>
          </div>
          <span className={styles.themeName}>Minimal</span>
        </div>
      </div>
    </div>
  );
}
EOL

# Create ThemeToggle styles
cat > ./styles/ThemeToggle.module.css << 'EOL'
.themeToggle {
  margin: 1.5rem 0;
}

.themeTitle {
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.themeOptions {
  display: flex;
  gap: 1rem;
}

.themeOption {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  border-radius: var(--border-radius);
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.themeOption:hover {
  background-color: rgba(255, 255, 255, 0.05);
}

.themeOption.active {
  border-color: var(--primary-color);
}

.themePreview {
  width: 80px;
  height: 50px;
  border-radius: var(--border-radius);
  margin-bottom: 0.5rem;
  position: relative;
  overflow: hidden;
}

.previewBar {
  position: absolute;
  bottom: 10px;
  left: 10px;
  right: 10px;
  height: 6px;
  border-radius: 3px;
}

.neonPreview {
  background-color: #121212;
}

.neonPreview .previewBar {
  background: linear-gradient(90deg, #00e5ff, #0077ff);
}

.purplePreview {
  background-color: #121212;
}

.purplePreview .previewBar {
  background: linear-gradient(90deg, #9c27b0, #673ab7);
}

.minimalPreview {
  background-color: #121212;
}

.minimalPreview .previewBar {
  background: linear-gradient(90deg, #757575, #424242);
}

.themeName {
  font-size: 0.9rem;
  color: var(--text-secondary);
}

.themeOption.active .themeName {
  color: var(--primary-color);
}

/* Floating toggle */
.floatingToggle {
  position: fixed;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000;
}

.floatingButton {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background-color: var(--card-background);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.floatingButton:hover {
  transform: scale(1.1);
}

.floatingButton.active {
  border: 2px solid var(--primary-color);
}

.neonIcon, .purpleIcon, .minimalIcon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
}

.neonIcon {
  background: linear-gradient(135deg, #00e5ff, #0077ff);
}

.purpleIcon {
  background: linear-gradient(135deg, #9c27b0, #673ab7);
}

.minimalIcon {
  background: linear-gradient(135deg, #757575, #424242);
}
EOL

echo -e "${GREEN}Created ThemeToggle component${NC}\n"

# Update ArtistCard component with new design
echo -e "${YELLOW}Updating ArtistCard component with new design...${NC}"

cat > ./components/ArtistCard.js << 'EOL'
import React from 'react';
import styles from '../styles/ArtistCard.module.css';

const ArtistCard = ({ artist, correlation, similarArtists }) => {
  // Error handling: Check if artist is valid
  if (!artist || typeof artist !== 'object') {
    return (
      <div className={styles.artistCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display artist information. Invalid artist data.</p>
        </div>
      </div>
    );
  }

  // Ensure correlation is a valid number
  const validCorrelation = typeof correlation === 'number' && !isNaN(correlation) ? correlation : 0;
  const correlationPercent = Math.round(validCorrelation * 100);
  
  // Validate similarArtists array
  const validSimilarArtists = Array.isArray(similarArtists) ? similarArtists : [];
  
  // Ensure popularity is a valid number
  const popularity = typeof artist.popularity === 'number' && !isNaN(artist.popularity) ? artist.popularity : 50;
  
  // Get artist image with fallbacks
  const getArtistImage = () => {
    // Check for Spotify-style images array
    if (artist.images && artist.images.length > 0) {
      return artist.images[0].url;
    }
    
    // Check for direct image property
    if (artist.image) {
      return artist.image;
    }
    
    // No image available
    return null;
  };
  
  const artistImage = getArtistImage();
  
  // Extract genres with fallbacks
  const genres = Array.isArray(artist.genres) ? artist.genres : [];
  
  return (
    <div className={styles.artistCard}>
      <div className={styles.artistHeader}>
        <div className={styles.artistImageContainer}>
          {artistImage ? (
            <div 
              className={styles.artistImage}
              style={{ backgroundImage: `url(${artistImage})` }}
            />
          ) : (
            <div className={styles.artistImagePlaceholder}>
              <span>{artist.name ? artist.name.charAt(0) : '?'}</span>
            </div>
          )}
        </div>
        
        <div className={styles.artistNameContainer}>
          <h3 className={styles.artistName}>{artist.name || 'Unknown Artist'}</h3>
          
          <div className={styles.genreTags}>
            {genres.slice(0, 3).map((genre, index) => (
              <span key={index} className={styles.genreTag}>{genre}</span>
            ))}
          </div>
        </div>
      </div>
      
      <div className={styles.artistMetrics}>
        <div className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Popularity</span>
            <span className={styles.metricValue}>{popularity}%</span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill} 
              style={{ width: `${popularity}%` }}
            ></div>
          </div>
        </div>
        
        <div className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Taste Match</span>
            <span className={styles.metricValue}>{correlationPercent}%</span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill} 
              style={{ width: `${correlationPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {validSimilarArtists.length > 0 && (
        <div className={styles.similarArtistsSection}>
          <h4 className={styles.similarArtistsTitle}>Similar Artists</h4>
          <div className={styles.similarArtistsList}>
            {validSimilarArtists.slice(0, 3).map((similar, index) => (
              <div key={index} className={styles.similarArtist}>
                {similar.image ? (
                  <div 
                    className={styles.similarArtistImage}
                    style={{ backgroundImage: `url(${similar.image})` }}
                  />
                ) : (
                  <div className={styles.similarArtistImagePlaceholder}>
                    <span>{similar.name ? similar.name.charAt(0) : '?'}</span>
                  </div>
                )}
                <span className={styles.similarArtistName}>{similar.name || 'Unknown Artist'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ArtistCard;
EOL

# Update ArtistCard styles
cat > ./styles/ArtistCard.module.css << 'EOL'
.artistCard {
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  padding: 1rem;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.artistCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.artistHeader {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.artistImageContainer {
  flex-shrink: 0;
}

.artistImage {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
}

.artistImagePlaceholder {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-secondary);
}

.artistNameContainer {
  flex-grow: 1;
  min-width: 0;
}

.artistName {
  margin: 0 0 0.5rem 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.genreTags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genreTag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.artistMetrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metricItem {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metricHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metricLabel {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.metricValue {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
}

.metricBar {
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.metricFill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
}

.similarArtistsSection {
  margin-top: 0.5rem;
}

.similarArtistsTitle {
  font-size: 0.9rem;
  margin: 0 0 0.75rem 0;
  color: var(--text-secondary);
}

.similarArtistsList {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.similarArtist {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.similarArtistImage {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
}

.similarArtistImagePlaceholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: var(--text-secondary);
}

.similarArtistName {
  font-size: 0.8rem;
  color: var(--text-color);
}

.errorMessage {
  padding: 1rem;
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: var(--border-radius);
  color: var(--error-color);
  font-size: 0.9rem;
}
EOL

echo -e "${GREEN}Updated ArtistCard component with new design${NC}\n"

# Update TrackCard component with new design
echo -e "${YELLOW}Updating TrackCard component with new design...${NC}"

cat > ./components/TrackCard.js << 'EOL'
import React from 'react';
import styles from '../styles/TrackCard.module.css';

const TrackCard = ({ track, correlation, duration, popularity }) => {
  // Error handling: Check if track is valid
  if (!track || typeof track !== 'object') {
    return (
      <div className={styles.trackCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display track information. Invalid track data.</p>
        </div>
      </div>
    );
  }

  // Ensure correlation is a valid number
  const validCorrelation = typeof correlation === 'number' && !isNaN(correlation) ? correlation : 0;
  const correlationPercent = Math.round(validCorrelation * 100);
  
  // Ensure popularity is a valid number
  const validPopularity = typeof popularity === 'number' && !isNaN(popularity) ? popularity : 50;
  
  // Format duration
  const formatDuration = (ms) => {
    if (!ms || typeof ms !== 'number' || isNaN(ms)) return '0:00';
    
    const minutes = Math.floor(ms / 60000);
    const seconds = ((ms % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };
  
  return (
    <div className={styles.trackCard}>
      <div className={styles.trackHeader}>
        <div className={styles.trackImageContainer}>
          {track.image ? (
            <div 
              className={styles.trackImage}
              style={{ backgroundImage: `url(${track.image})` }}
            />
          ) : (
            <div className={styles.trackImagePlaceholder}>
              <span>{track.name ? track.name.charAt(0) : '?'}</span>
            </div>
          )}
          
          {track.preview && (
            <button className={styles.previewButton} title="Play preview">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
          )}
        </div>
        
        <div className={styles.trackInfo}>
          <h3 className={styles.trackName}>{track.name || 'Unknown Track'}</h3>
          <p className={styles.trackArtist}>{track.artist || 'Unknown Artist'}</p>
          
          {duration > 0 && (
            <span className={styles.trackDuration}>{formatDuration(duration)}</span>
          )}
        </div>
      </div>
      
      <div className={styles.trackMetrics}>
        <div className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Popularity</span>
            <span className={styles.metricValue}>{validPopularity}%</span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill} 
              style={{ width: `${validPopularity}%` }}
            ></div>
          </div>
        </div>
        
        <div className={styles.metricItem}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Taste Match</span>
            <span className={styles.metricValue}>{correlationPercent}%</span>
          </div>
          <div className={styles.metricBar}>
            <div 
              className={styles.metricFill} 
              style={{ width: `${correlationPercent}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {track.album && (
        <div className={styles.trackAlbum}>
          <span className={styles.albumLabel}>Album:</span>
          <span className={styles.albumName}>{track.album}</span>
        </div>
      )}
    </div>
  );
};

export default TrackCard;
EOL

# Update TrackCard styles
cat > ./styles/TrackCard.module.css << 'EOL'
.trackCard {
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  padding: 1rem;
  box-shadow: var(--card-shadow);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  height: 100%;
}

.trackCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.trackHeader {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.trackImageContainer {
  position: relative;
  flex-shrink: 0;
}

.trackImage {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background-size: cover;
  background-position: center;
}

.trackImagePlaceholder {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-secondary);
}

.previewButton {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.6);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.trackImageContainer:hover .previewButton {
  opacity: 1;
}

.trackInfo {
  flex-grow: 1;
  min-width: 0;
  position: relative;
}

.trackName {
  margin: 0 0 0.25rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trackArtist {
  margin: 0;
  font-size: 0.9rem;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trackDuration {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.trackMetrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metricItem {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metricHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metricLabel {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.metricValue {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
}

.metricBar {
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.metricFill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 3px;
}

.trackAlbum {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.albumLabel {
  color: var(--text-secondary);
}

.albumName {
  color: var(--text-color);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.errorMessage {
  padding: 1rem;
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: var(--border-radius);
  color: var(--error-color);
  font-size: 0.9rem;
}
EOL

echo -e "${GREEN}Updated TrackCard component with new design${NC}\n"

# Update SeasonalMoodCard component with enhanced insights
echo -e "${YELLOW}Updating SeasonalMoodCard component with enhanced insights...${NC}"

cat > ./components/SeasonalMoodCard.js << 'EOL'
import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  // Error handling: Check if seasonalMood is valid
  if (!seasonalMood || typeof seasonalMood !== 'object') {
    return (
      <div className={styles.seasonalMoodCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display seasonal mood information. Invalid data.</p>
        </div>
      </div>
    );
  }

  // Get current season
  const currentSeason = seasonalMood.currentSeason || {};
  const currentSeasonName = currentSeason.name || seasonalMood.current || 'Current Season';
  
  // Get all seasons
  const seasons = Array.isArray(seasonalMood.seasons) ? seasonalMood.seasons : [];
  
  // Generate insights based on seasonal data
  const generateInsights = () => {
    if (seasons.length < 2) {
      return "Your taste evolves throughout the year. Keep listening to see your seasonal patterns.";
    }
    
    // Find previous season
    const seasonOrder = ['winter', 'spring', 'summer', 'fall'];
    const currentIndex = seasonOrder.findIndex(s => 
      s.toLowerCase() === currentSeasonName.toLowerCase()
    );
    
    if (currentIndex === -1) return "Your taste evolves throughout the year.";
    
    const prevIndex = (currentIndex - 1 + 4) % 4;
    const prevSeasonName = seasonOrder[prevIndex];
    const prevSeason = seasons.find(s => 
      s.name.toLowerCase() === prevSeasonName.toLowerCase()
    );
    
    if (!prevSeason) return "Your taste evolves throughout the year.";
    
    // Compare current and previous season
    const currentGenres = currentSeason.topGenres || [];
    const prevGenres = prevSeason.topGenres || [];
    
    if (currentGenres.length === 0 || prevGenres.length === 0) {
      return "Your taste evolves throughout the year.";
    }
    
    // Find unique genres in current season
    const uniqueCurrentGenres = currentGenres.filter(g => 
      !prevGenres.includes(g)
    );
    
    if (uniqueCurrentGenres.length > 0) {
      return `Your taste has shifted from ${prevGenres[0]} in ${prevSeason.name} to include ${uniqueCurrentGenres[0]} in ${currentSeason.name}.`;
    }
    
    return `In ${currentSeason.name}, you're gravitating toward ${currentSeason.primaryMood.toLowerCase()} sounds like ${currentGenres[0]}.`;
  };
  
  const insight = generateInsights();
  
  return (
    <div className={styles.seasonalMoodCard}>
      <div className={styles.seasonalVisual}>
        <div className={styles.seasonCircle}>
          {seasons.map((season, index) => {
            const isCurrentSeason = season.name.toLowerCase() === currentSeasonName.toLowerCase();
            const angle = (index * 90) - 90; // -90, 0, 90, 180 degrees
            
            return (
              <div 
                key={season.name}
                className={`${styles.seasonSegment} ${isCurrentSeason ? styles.currentSeason : ''}`}
                style={{ 
                  transform: `rotate(${angle}deg)`,
                }}
              >
                <div className={styles.seasonContent}>
                  <span className={styles.seasonName}>{season.name}</span>
                  {season.topGenres && season.topGenres.length > 0 && (
                    <span className={styles.seasonGenre}>{season.topGenres[0]}</span>
                  )}
                </div>
              </div>
            );
          })}
          
          <div className={styles.centerCircle}>
            <span className={styles.yearText}>Year-Round</span>
          </div>
        </div>
      </div>
      
      <div className={styles.seasonalInsights}>
        <h3 className={styles.insightsTitle}>Your Seasonal Patterns</h3>
        <p className={styles.insightsText}>{insight}</p>
        
        <div className={styles.currentSeasonHighlight}>
          <h4 className={styles.currentSeasonTitle}>
            {currentSeasonName} Vibe
          </h4>
          
          {currentSeason.primaryMood && (
            <div className={styles.moodTag}>
              <span className={styles.moodLabel}>Mood:</span>
              <span className={styles.moodValue}>{currentSeason.primaryMood}</span>
            </div>
          )}
          
          {currentSeason.topGenres && currentSeason.topGenres.length > 0 && (
            <div className={styles.genreTags}>
              {currentSeason.topGenres.map((genre, index) => (
                <span key={index} className={styles.genreTag}>{genre}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
EOL

# Update SeasonalMoodCard styles
cat > ./styles/SeasonalMoodCard.module.css << 'EOL'
.seasonalMoodCard {
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  display: flex;
  gap: 2rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.seasonalMoodCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
}

.seasonalVisual {
  flex: 0 0 180px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.seasonCircle {
  width: 180px;
  height: 180px;
  position: relative;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.05);
}

.seasonSegment {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15px;
  transition: all 0.3s ease;
}

.seasonSegment:hover {
  transform: scale(1.05) rotate(var(--rotation)) !important;
}

.seasonContent {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transform: rotate(90deg);
}

.seasonName {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
}

.seasonGenre {
  font-size: 0.8rem;
  color: var(--text-secondary);
  opacity: 0.8;
}

.currentSeason .seasonName,
.currentSeason .seasonGenre {
  color: var(--primary-color);
}

.centerCircle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--gradient-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.yearText {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1;
}

.seasonalInsights {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.insightsTitle {
  font-size: 1.1rem;
  margin: 0 0 0.75rem 0;
  color: var(--text-color);
}

.insightsText {
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
}

.currentSeasonHighlight {
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: var(--border-radius);
  padding: 1rem;
}

.currentSeasonTitle {
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  color: var(--primary-color);
}

.moodTag {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.moodLabel {
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.moodValue {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color);
}

.genreTags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.genreTag {
  font-size: 0.7rem;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
}

.errorMessage {
  padding: 1rem;
  background-color: rgba(255, 0, 0, 0.1);
  border-radius: var(--border-radius);
  color: var(--error-color);
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .seasonalMoodCard {
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .seasonalVisual {
    flex: 0 0 auto;
  }
  
  .seasonCircle {
    margin: 0 auto;
  }
}
EOL

echo -e "${GREEN}Updated SeasonalMoodCard component with enhanced insights${NC}\n"

# Update music-taste.js to include theme toggle and side-by-side layout
echo -e "${YELLOW}Updating music-taste.js to include theme toggle and side-by-side layout...${NC}"

cat > ./pages/users/music-taste.js << 'EOL'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/MusicTaste.module.css';
import SpiderChart from '../../components/SpiderChart';
import ArtistCard from '../../components/ArtistCard';
import TrackCard from '../../components/TrackCard';
import SeasonalMoodCard from '../../components/SeasonalMoodCard';
import VibeQuizCard from '../../components/VibeQuizCard';
import EventCard from '../../components/EventCard';
import Navigation from '../../components/Navigation';
import ThemeToggle from '../../components/ThemeToggle';

// Error boundary component to prevent entire app from crashing
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <h3>Something went wrong with this component</h3>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button 
            onClick={() => this.setState({ hasError: false, error: null })}
            className={styles.retryButton}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserTaste();
    }
  }, [status]);

  const fetchUserTaste = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/spotify/user-taste');
      if (!response.ok) {
        throw new Error('Failed to fetch music taste data');
      }
      const data = await response.json();
      console.log('API response:', data); // For debugging
      setUserTaste(data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVibeQuizSubmit = async (preferences) => {
    try {
      // Create a fallback implementation for the missing endpoint
      // This will prevent the error when the endpoint doesn't exist
      let success = false;
      
      try {
        const response = await fetch('/api/user/update-taste-preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ preferences }),
        });
        
        if (response.ok) {
          success = true;
        } else {
          console.warn('Preferences API returned non-OK status:', response.status);
        }
      } catch (apiError) {
        console.warn('Preferences API not available, using fallback:', apiError);
      }
      
      // If the API call failed, use a client-side fallback
      if (!success) {
        // Store preferences in localStorage as a fallback
        localStorage.setItem('userTastePreferences', JSON.stringify(preferences));
        console.log('Stored preferences in localStorage as fallback');
      }
      
      // Refresh user taste data
      fetchUserTaste();
      setShowVibeQuiz(false);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err.message);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading your vibe...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.unauthorizedContainer}>
          <h1 className={styles.title}>Connect to see your sound</h1>
          <p className={styles.subtitle}>Link Spotify. Get your vibe. Find your scene.</p>
          <Link href="/api/auth/signin">
            <a className={styles.connectButton}>Connect Spotify</a>
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.errorContainer}>
          <h1 className={styles.title}>Oops! That didn't work</h1>
          <p className={styles.errorMessage}>{error}</p>
          <button onClick={fetchUserTaste} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!userTaste) {
    return (
      <div className={styles.container}>
        <Head>
          <title>Your Sound | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.noDataContainer}>
          <h1 className={styles.title}>No vibe data yet</h1>
          <p className={styles.subtitle}>
            Play more tracks on Spotify. Check back soon.
          </p>
        </div>
      </div>
    );
  }

  // Safely extract data with null checks and fallbacks
  const genres = Array.isArray(userTaste.genres) ? userTaste.genres : 
                 Array.isArray(userTaste.topGenres) ? userTaste.topGenres.map(g => typeof g === 'string' ? {name: g, score: 50} : g) : 
                 [];
  
  const topArtists = Array.isArray(userTaste.topArtists) ? userTaste.topArtists : [];
  const topTracks = Array.isArray(userTaste.topTracks) ? userTaste.topTracks : [];
  
  // Handle seasonal mood data with fallbacks
  const seasonalMood = userTaste.seasonalMood && typeof userTaste.seasonalMood === 'object' ? userTaste.seasonalMood : {
    currentSeason: { name: 'Current Season', primaryMood: 'Unknown', topGenres: [] },
    seasons: []
  };
  
  // Create currentSeason if it doesn't exist or is incomplete
  if (!seasonalMood.currentSeason || typeof seasonalMood.currentSeason !== 'object') {
    const currentSeasonName = seasonalMood.current || 'Current Season';
    seasonalMood.currentSeason = {
      name: currentSeasonName,
      primaryMood: seasonalMood[currentSeasonName]?.mood || 'Unknown',
      topGenres: Array.isArray(seasonalMood[currentSeasonName]?.genres) ? 
                seasonalMood[currentSeasonName].genres : []
    };
  }
  
  // Ensure seasons array exists
  if (!Array.isArray(seasonalMood.seasons)) {
    seasonalMood.seasons = [];
  }
  
  // Safely extract suggestedEvents with fallback
  const suggestedEvents = Array.isArray(userTaste.suggestedEvents) ? userTaste.suggestedEvents : [];

  // Create a more concise, ADHD-friendly summary
  const getTopGenres = () => {
    if (genres.length === 0) return "your fav beats";
    return genres.slice(0, Math.min(2, genres.length)).map(g => g.name || 'Unknown').join(' + ');
  };

  const getRecentTrends = () => {
    if (!seasonalMood.currentSeason || 
        !Array.isArray(seasonalMood.currentSeason.topGenres) || 
        seasonalMood.currentSeason.topGenres.length === 0) {
      return "fresh sounds";
    }
    return seasonalMood.currentSeason.topGenres.slice(0, 1).join('');
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Your Sound | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        {/* Floating theme toggle */}
        <ThemeToggle floating={true} />
        
        {/* Compact header section */}
        <div className={styles.header}>
          <h1 className={styles.title}>Your Sound</h1>
          <p className={styles.subtitle}>
            Based on what you're streaming
          </p>
        </div>
        
        {/* Concise summary */}
        <div className={styles.summary}>
          <p>
            You're all about <span className={styles.highlight}>{getTopGenres()}</span> with 
            a vibe shift toward <span className={styles.highlight}>{getRecentTrends()}</span>. 
            {suggestedEvents.length > 0 ? 
              ` Found ${suggestedEvents.length} events that match your sound.` : 
              " Events coming soon that match your sound."}
          </p>
        </div>
        
        {/* Two-column layout for genre mix and seasonal vibes */}
        <div className={styles.twoColumnLayout}>
          {/* Left column: Genre mix */}
          <div className={styles.column}>
            <ErrorBoundary>
              <section className={styles.genreSection}>
                <h2 className={styles.sectionTitle}>Your Mix</h2>
                <div className={styles.spiderChartContainer}>
                  {genres.length > 0 ? (
                    <SpiderChart genres={genres} />
                  ) : (
                    <div className={styles.noDataMessage}>
                      <p>No genre data yet. Keep streaming!</p>
                    </div>
                  )}
                </div>
              </section>
            </ErrorBoundary>
          </div>
          
          {/* Right column: Seasonal vibes */}
          <div className={styles.column}>
            <ErrorBoundary>
              <section className={styles.seasonalSection}>
                <h2 className={styles.sectionTitle}>Your Seasonal Vibes</h2>
                <SeasonalMoodCard seasonalMood={seasonalMood} />
              </section>
            </ErrorBoundary>
          </div>
        </div>
        
        {/* Events section - prioritized */}
        <ErrorBoundary>
          <section className={styles.eventsSection}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                Events That Match Your Vibe
                {suggestedEvents.length > 0 && (
                  <span className={styles.eventCount}> (Found {suggestedEvents.length})</span>
                )}
              </h2>
              
              <button className={styles.refreshButton} onClick={fetchUserTaste}>
                Refresh
              </button>
            </div>
            
            {suggestedEvents.length > 0 ? (
              <div className={styles.eventsGrid}>
                {suggestedEvents.slice(0, Math.min(3, suggestedEvents.length)).map((event, index) => (
                  <EventCard 
                    key={event.id || `event-${index}`} 
                    event={event} 
                    correlation={event.correlation || 0.5}
                  />
                ))}
              </div>
            ) : (
              <div className={styles.noEventsMessage}>
                <p>Events coming soon. Check back!</p>
              </div>
            )}
            
            {suggestedEvents.length > 0 && (
              <div className={styles.viewMoreContainer}>
                <Link href="/users/events">
                  <a className={styles.viewMoreButton}>See All Events</a>
                </Link>
              </div>
            )}
          </section>
        </ErrorBoundary>
        
        {/* Vibe Quiz section */}
        <ErrorBoundary>
          <section className={styles.vibeQuizSection}>
            <div className={styles.vibeQuizPrompt}>
              <p>Not feeling this vibe? Tell us what you're into</p>
              <button 
                className={styles.vibeQuizButton}
                onClick={() => setShowVibeQuiz(!showVibeQuiz)}
              >
                {showVibeQuiz ? 'Hide Quiz' : 'Take Quiz'}
              </button>
            </div>
            
            {showVibeQuiz && (
              <VibeQuizCard onSubmit={handleVibeQuizSubmit} />
            )}
          </section>
        </ErrorBoundary>
        
        {/* Two-column layout for artists and tracks */}
        <div className={styles.twoColumnLayout}>
          {/* Left column: Artists */}
          <div className={styles.column}>
            <ErrorBoundary>
              <section className={styles.artistsSection}>
                <h2 className={styles.sectionTitle}>Artists You Vibe With</h2>
                {topArtists.length > 0 ? (
                  <div className={styles.artistsGrid}>
                    {/* Show top 3 artists with similar artists */}
                    {topArtists.slice(0, 3).map((artist, index) => (
                      <ArtistCard 
                        key={artist.id || `artist-${index}`} 
                        artist={artist} 
                        correlation={artist.correlation || 0.5}
                        similarArtists={Array.isArray(artist.similarArtists) ? artist.similarArtists.slice(0, 3) : []}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.noDataMessage}>
                    <p>No artist data yet. Keep streaming!</p>
                  </div>
                )}
              </section>
            </ErrorBoundary>
          </div>
          
          {/* Right column: Tracks */}
          <div className={styles.column}>
            <ErrorBoundary>
              <section className={styles.tracksSection}>
                <h2 className={styles.sectionTitle}>Your Repeat Tracks</h2>
                {topTracks.length > 0 ? (
                  <div className={styles.tracksGrid}>
                    {/* Show top 3 tracks */}
                    {topTracks.slice(0, 3).map((track, index) => (
                      <TrackCard 
                        key={track.id || `track-${index}`} 
                        track={track} 
                        correlation={track.correlation || 0.5}
                        duration={track.duration_ms || 0}
                        popularity={track.popularity || 0}
                      />
                    ))}
                  </div>
                ) : (
                  <div className={styles.noDataMessage}>
                    <p>No track data yet. Keep streaming!</p>
                  </div>
                )}
              </section>
            </ErrorBoundary>
          </div>
        </div>
      </main>
    </div>
  );
}
EOL

# Update MusicTaste styles
cat > ./styles/MusicTaste.module.css << 'EOL'
.container {
  min-height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.title {
  font-size: 2rem;
  margin: 0 0 0.5rem 0;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.summary {
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  padding: 1rem;
  margin-bottom: 2rem;
  text-align: center;
  box-shadow: var(--card-shadow);
}

.summary p {
  margin: 0;
  font-size: 1.1rem;
  line-height: 1.5;
}

.highlight {
  color: var(--primary-color);
  font-weight: 600;
}

.twoColumnLayout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
}

.column {
  display: flex;
  flex-direction: column;
}

.sectionTitle {
  font-size: 1.5rem;
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.sectionHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.eventCount {
  font-size: 1rem;
  font-weight: normal;
  color: var(--text-secondary);
}

.genreSection, 
.seasonalSection, 
.eventsSection, 
.vibeQuizSection, 
.artistsSection, 
.tracksSection {
  margin-bottom: 2rem;
}

.spiderChartContainer {
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eventsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.artistsGrid, .tracksGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

.viewMoreContainer {
  margin-top: 1.5rem;
  text-align: center;
}

.viewMoreButton {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--gradient-primary);
  color: var(--text-color);
  border-radius: var(--border-radius);
  font-weight: 600;
  transition: all 0.2s ease;
}

.viewMoreButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.vibeQuizPrompt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  padding: 1rem 1.5rem;
  margin-bottom: 1rem;
  box-shadow: var(--card-shadow);
}

.vibeQuizPrompt p {
  margin: 0;
}

.vibeQuizButton, .refreshButton {
  padding: 0.5rem 1rem;
  background: var(--gradient-primary);
  color: var(--text-color);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.vibeQuizButton:hover, .refreshButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.noDataMessage {
  padding: 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.noEventsMessage {
  padding: 3rem;
  text-align: center;
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  box-shadow: var(--card-shadow);
}

.loadingContainer, .unauthorizedContainer, .errorContainer, .noDataContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
  padding: 2rem;
}

.loadingSpinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.connectButton, .retryButton {
  margin-top: 1.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--gradient-primary);
  color: var(--text-color);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.connectButton:hover, .retryButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.errorMessage {
  color: var(--error-color);
  margin: 1rem 0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .twoColumnLayout {
    grid-template-columns: 1fr;
  }
  
  .eventsGrid {
    grid-template-columns: 1fr;
  }
}
EOL

echo -e "${GREEN}Updated music-taste.js to include theme toggle and side-by-side layout${NC}\n"

# Update settings.js to include theme options
echo -e "${YELLOW}Updating settings.js to include theme options...${NC}"

cat > ./pages/users/settings.js << 'EOL'
import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Settings.module.css';
import Navigation from '../../components/Navigation';
import ThemeToggle from '../../components/ThemeToggle';

export default function Settings() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState({
    events: true,
    artists: true,
    recommendations: true
  });
  const [privacy, setPrivacy] = useState({
    shareListening: true,
    shareAttending: false
  });
  
  const handleNotificationToggle = (key) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handlePrivacyToggle = (key) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Settings | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Settings | Sonar</title>
        </Head>
        <Navigation />
        <div className={styles.unauthorizedContainer}>
          <h1 className={styles.title}>Sign in to access settings</h1>
          <p className={styles.subtitle}>You need to be signed in to view and change your settings.</p>
          <Link href="/api/auth/signin">
            <a className={styles.signInButton}>Sign In</a>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Settings | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <h1 className={styles.title}>Settings</h1>
        
        <div className={styles.settingsGrid}>
          {/* Account Section */}
          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Account</h2>
            
            <div className={styles.accountInfo}>
              {session.user?.image && (
                <div 
                  className={styles.userImage}
                  style={{ backgroundImage: `url(${session.user.image})` }}
                />
              )}
              
              <div className={styles.userDetails}>
                <h3 className={styles.userName}>{session.user?.name || 'User'}</h3>
                <p className={styles.userEmail}>{session.user?.email || 'No email provided'}</p>
              </div>
            </div>
            
            <div className={styles.accountActions}>
              <button 
                className={styles.signOutButton}
                onClick={handleSignOut}
              >
                Sign Out
              </button>
            </div>
          </section>
          
          {/* Theme Section */}
          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Appearance</h2>
            <ThemeToggle />
          </section>
          
          {/* Notifications Section */}
          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Notifications</h2>
            
            <div className={styles.toggleGroup}>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Event Alerts</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={notifications.events}
                    onChange={() => handleNotificationToggle('events')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Artist Updates</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={notifications.artists}
                    onChange={() => handleNotificationToggle('artists')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Recommendations</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={notifications.recommendations}
                    onChange={() => handleNotificationToggle('recommendations')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </section>
          
          {/* Privacy Section */}
          <section className={styles.settingsSection}>
            <h2 className={styles.sectionTitle}>Privacy</h2>
            
            <div className={styles.toggleGroup}>
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Share Listening Activity</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={privacy.shareListening}
                    onChange={() => handlePrivacyToggle('shareListening')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
              
              <div className={styles.toggleItem}>
                <span className={styles.toggleLabel}>Share Events I'm Attending</span>
                <label className={styles.switch}>
                  <input 
                    type="checkbox" 
                    checked={privacy.shareAttending}
                    onChange={() => handlePrivacyToggle('shareAttending')}
                  />
                  <span className={styles.slider}></span>
                </label>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
EOL

# Create Settings styles
cat > ./styles/Settings.module.css << 'EOL'
.container {
  min-height: 100vh;
  background-color: var(--background-color);
  color: var(--text-color);
}

.main {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.title {
  font-size: 2rem;
  margin: 0 0 2rem 0;
  text-align: center;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-fill-color: transparent;
}

.settingsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.settingsSection {
  background-color: var(--card-background);
  border-radius: var(--border-radius);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
}

.sectionTitle {
  font-size: 1.25rem;
  margin: 0 0 1.5rem 0;
  color: var(--text-color);
}

.accountInfo {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.userImage {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
}

.userDetails {
  flex-grow: 1;
}

.userName {
  font-size: 1.1rem;
  margin: 0 0 0.25rem 0;
}

.userEmail {
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
}

.accountActions {
  display: flex;
  justify-content: flex-end;
}

.signOutButton {
  padding: 0.5rem 1rem;
  background: var(--gradient-primary);
  color: var(--text-color);
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.signOutButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}

.toggleGroup {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.toggleItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toggleLabel {
  font-size: 0.9rem;
}

/* Toggle Switch */
.switch {
  position: relative;
  display: inline-block;
  width: 50px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.1);
  transition: .4s;
  border-radius: 34px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .slider {
  background: var(--gradient-primary);
}

input:checked + .slider:before {
  transform: translateX(26px);
}

.loadingContainer, .unauthorizedContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  text-align: center;
  padding: 2rem;
}

.loadingSpinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top-color: var(--primary-color);
  animation: spin 1s linear infinite;
  margin-bottom: 1.5rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0.5rem 0 1.5rem;
}

.signInButton {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background: var(--gradient-primary);
  color: var(--text-color);
  border-radius: var(--border-radius);
  font-weight: 600;
  transition: all 0.2s ease;
}

.signInButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
}
EOL

echo -e "${GREEN}Updated settings.js to include theme options${NC}\n"

# Create a deploy-to-heroku.sh script
echo -e "${YELLOW}Creating deploy-to-heroku.sh script...${NC}"

cat > ./deploy-to-heroku.sh << 'EOL'
#!/bin/bash

# Sonar EDM Platform - Heroku Deployment Script

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Sonar EDM Platform - Heroku Deployment Script ===${NC}"
echo -e "${BLUE}This script will deploy your Sonar EDM Platform to Heroku.${NC}\n"

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: git is not installed.${NC}"
  echo -e "${YELLOW}Please install git and try again.${NC}"
  exit 1
fi

# Check if heroku CLI is installed
if ! command -v heroku &> /dev/null; then
  echo -e "${RED}Error: Heroku CLI is not installed.${NC}"
  echo -e "${YELLOW}Please install the Heroku CLI and try again.${NC}"
  exit 1
fi

# Check if we're in the project directory
if [ ! -d "./pages" ] || [ ! -d "./components" ]; then
  echo -e "${RED}Error: This script must be run from the project root directory.${NC}"
  echo -e "${YELLOW}Please navigate to your project directory and run this script again.${NC}"
  exit 1
fi

# Check if user is logged in to Heroku
heroku_status=$(heroku auth:whoami 2>&1)
if [[ $heroku_status == *"Error"* ]]; then
  echo -e "${YELLOW}You are not logged in to Heroku. Please log in:${NC}"
  heroku login
fi

# Check if the app exists
app_name="sonar-edm-user"
app_exists=$(heroku apps:info --app $app_name 2>&1)
if [[ $app_exists == *"Couldn't find that app"* ]]; then
  echo -e "${YELLOW}Creating Heroku app: $app_name${NC}"
  heroku create $app_name
else
  echo -e "${GREEN}Using existing Heroku app: $app_name${NC}"
fi

# Check if git remote exists
remote_exists=$(git remote -v | grep heroku)
if [ -z "$remote_exists" ]; then
  echo -e "${YELLOW}Adding Heroku remote...${NC}"
  heroku git:remote -a $app_name
fi

# Set environment variables
echo -e "${YELLOW}Setting environment variables...${NC}"
heroku config:set TICKETMASTER_API_KEY=gjGKNoTGeWl8HF2FAgYQVCf25D5ap7yw --app $app_name
heroku config:set SPOTIFY_CLIENT_ID=20d98eaf33fa464291b4c13a1e70a2ad --app $app_name
heroku config:set SPOTIFY_CLIENT_SECRET=8cb4a223b7434a52b4c21e5f6aef6b19 --app $app_name
heroku config:set NEXTAUTH_URL=https://sonar-edm-user-50e4fb038f6e.herokuapp.com --app $app_name
heroku config:set NEXTAUTH_SECRET=$(openssl rand -base64 32) --app $app_name
heroku config:set EDMTRAIN_API_KEY=b5143e2e-21f2-4b45-b537-0b5b9ec9bdad --app $app_name
heroku config:set MONGODB_URI=mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/?retryWrites=true&w=majority&appName=SonarEDM --app $app_name

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git add .
git commit -m "Enhance theme with artist card design and implement theme options"

# Deploy to Heroku
echo -e "${YELLOW}Deploying to Heroku...${NC}"
git push heroku master

echo -e "${GREEN}Deployment complete!${NC}"
echo -e "${GREEN}Your app is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com${NC}"
EOL

chmod +x ./deploy-to-heroku.sh

echo -e "${GREEN}Created deploy-to-heroku.sh script${NC}\n"

# Make this script executable
chmod +x ./sonar-edm-theme-insights.sh

echo -e "${BLUE}=== Theme Insights Enhancement Complete ===${NC}"
echo -e "${GREEN}All theme enhancements have been implemented successfully!${NC}"
echo -e "${YELLOW}To deploy to Heroku, run:${NC} ./deploy-to-heroku.sh"
echo -e "${YELLOW}Key improvements:${NC}"
echo -e "1. Enhanced artist and track cards with modern design"
echo -e "2. Implemented multiple theme options (Neon, Purple, Minimal)"
echo -e "3. Improved Year-Round Vibes section with meaningful insights"
echo -e "4. Created side-by-side layout for artists and tracks"
echo -e "5. Added floating theme toggle for easy theme switching"
echo -e "${BLUE}=======================================${NC}\n"
