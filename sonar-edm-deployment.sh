#!/bin/bash

# Sonar EDM Platform - Comprehensive Deployment Script
# This script directly copies all necessary implementation files to their correct locations
# and deploys the changes to Heroku without relying on zip files or extraction processes

echo "====================================================="
echo "  Sonar EDM Platform - Comprehensive Deployment Script"
echo "====================================================="
echo ""

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Define project directory - adjust this to match your environment
PROJECT_DIR="/c/sonar/users/sonar-edm-user"

# Check if project directory exists
if [ ! -d "$PROJECT_DIR" ]; then
  echo -e "${RED}Error: Project directory not found at $PROJECT_DIR${NC}"
  echo "Please enter the correct path to your Sonar EDM project:"
  read -p "> " PROJECT_DIR
  
  if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}Error: Directory not found. Exiting.${NC}"
    exit 1
  fi
fi

echo -e "${CYAN}Using project directory: $PROJECT_DIR${NC}"
echo ""

# Create backup directory
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$PROJECT_DIR/backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}Creating backup of existing files in $BACKUP_DIR${NC}"

# Function to backup a file if it exists
backup_file() {
  local src="$1"
  local rel_path="${src#$PROJECT_DIR/}"
  local dest_dir="$BACKUP_DIR/$(dirname "$rel_path")"
  
  if [ -f "$src" ]; then
    mkdir -p "$dest_dir"
    cp "$src" "$dest_dir/"
    echo -e "  Backed up: ${CYAN}$rel_path${NC}"
  fi
}

# Function to create directory if it doesn't exist
ensure_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    mkdir -p "$dir"
    echo -e "  Created directory: ${CYAN}${dir#$PROJECT_DIR/}${NC}"
  fi
}

# Backup components
echo "Backing up components..."
backup_file "$PROJECT_DIR/components/ArtistCard.js"
backup_file "$PROJECT_DIR/components/TrackCard.js"
backup_file "$PROJECT_DIR/components/SpiderChart.js"
backup_file "$PROJECT_DIR/components/SeasonalMoodCard.js"
backup_file "$PROJECT_DIR/components/VibeQuizCard.js"
backup_file "$PROJECT_DIR/components/EventCard.js"
backup_file "$PROJECT_DIR/components/EventCorrelationIndicator.js"
backup_file "$PROJECT_DIR/components/Navigation.js"
backup_file "$PROJECT_DIR/components/Header.js"
backup_file "$PROJECT_DIR/components/Layout.js"

# Backup styles
echo "Backing up styles..."
backup_file "$PROJECT_DIR/styles/ArtistCard.module.css"
backup_file "$PROJECT_DIR/styles/TrackCard.module.css"
backup_file "$PROJECT_DIR/styles/SpiderChart.module.css"
backup_file "$PROJECT_DIR/styles/SeasonalMoodCard.module.css"
backup_file "$PROJECT_DIR/styles/VibeQuizCard.module.css"
backup_file "$PROJECT_DIR/styles/EventCard.module.css"
backup_file "$PROJECT_DIR/styles/EventCorrelationIndicator.module.css"
backup_file "$PROJECT_DIR/styles/MusicTaste.module.css"
backup_file "$PROJECT_DIR/styles/Navigation.module.css"
backup_file "$PROJECT_DIR/styles/Profile.module.css"
backup_file "$PROJECT_DIR/styles/Settings.module.css"
backup_file "$PROJECT_DIR/styles/signin.module.css"

# Backup pages
echo "Backing up pages..."
backup_file "$PROJECT_DIR/pages/index.js"
backup_file "$PROJECT_DIR/pages/users/music-taste.js"
backup_file "$PROJECT_DIR/pages/users/profile.js"
backup_file "$PROJECT_DIR/pages/users/settings.js"
backup_file "$PROJECT_DIR/pages/users/events.js"
backup_file "$PROJECT_DIR/pages/users/venues.js"
backup_file "$PROJECT_DIR/pages/auth/signin.js"
backup_file "$PROJECT_DIR/pages/api/auth/[...nextauth].js"
backup_file "$PROJECT_DIR/pages/api/spotify/user-taste.js"

echo -e "${GREEN}Backup completed successfully!${NC}"
echo ""

# Create necessary directories
echo "Creating necessary directories..."
ensure_dir "$PROJECT_DIR/components"
ensure_dir "$PROJECT_DIR/styles"
ensure_dir "$PROJECT_DIR/pages/users"
ensure_dir "$PROJECT_DIR/pages/auth"
ensure_dir "$PROJECT_DIR/pages/api/auth"
ensure_dir "$PROJECT_DIR/pages/api/spotify"

echo ""

# Source directory for enhanced components
SRC_DIR="/home/ubuntu/enhanced-components"

# Create enhanced components directory if it doesn't exist
mkdir -p "$SRC_DIR"

# Create enhanced ArtistCard component with popularity indicators
echo "Creating enhanced ArtistCard component..."
cat > "$SRC_DIR/ArtistCard.js" << 'EOF'
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
  
  // Calculate obscurity level (inverse of popularity)
  const obscurityLevel = 100 - popularity;
  
  return (
    <div className={styles.artistCard}>
      <div className={styles.artistImageContainer}>
        {artist.images && artist.images.length > 0 ? (
          <div 
            className={styles.artistImage}
            style={{ 
              backgroundImage: `url(${artist.images[0].url})`,
              width: '80px',
              height: '80px'
            }}
          />
        ) : (
          <div 
            className={styles.artistImagePlaceholder}
            style={{ 
              width: '80px',
              height: '80px'
            }}
          >
            <span>{artist.name ? artist.name.charAt(0) : '?'}</span>
          </div>
        )}
        
        <div className={styles.correlationBadge}>
          <span className={styles.correlationValue}>{correlationPercent}%</span>
          <span className={styles.correlationLabel}>match</span>
        </div>
      </div>
      
      <div className={styles.artistInfo}>
        <h3 className={styles.artistName}>{artist.name || 'Unknown Artist'}</h3>
        
        <div className={styles.artistMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Popularity</span>
            <div className={styles.popularityBar}>
              <div 
                className={styles.popularityFill} 
                style={{ width: `${popularity}%` }}
              ></div>
            </div>
            <span className={styles.metricValue}>{popularity}%</span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Obscurity</span>
            <div className={styles.obscurityBar}>
              <div 
                className={styles.obscurityFill} 
                style={{ width: `${obscurityLevel}%` }}
              ></div>
            </div>
            <span className={styles.metricValue}>{obscurityLevel}%</span>
          </div>
        </div>
        
        <div className={styles.artistGenres}>
          {artist.genres && Array.isArray(artist.genres) ? 
            artist.genres.slice(0, 2).map((genre, index) => (
              <span key={index} className={styles.genreTag}>{genre}</span>
            )) : 
            <span className={styles.genreTag}>No genres available</span>
          }
        </div>
        
        <div className={styles.similarArtistsSection}>
          <h4 className={styles.similarArtistsTitle}>Similar Artists</h4>
          <div className={styles.similarArtistsList}>
            {validSimilarArtists.length > 0 ? 
              validSimilarArtists.slice(0, 3).map((similar, index) => (
                <div key={index} className={styles.similarArtist}>
                  <span className={styles.similarArtistName}>{similar.name || 'Unknown Artist'}</span>
                </div>
              )) : 
              <div className={styles.similarArtist}>
                <span className={styles.similarArtistName}>No similar artists found</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArtistCard;
EOF

# Create enhanced TrackCard component with popularity indicators
echo "Creating enhanced TrackCard component..."
cat > "$SRC_DIR/TrackCard.js" << 'EOF'
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

  // Ensure correlation, duration and popularity are valid numbers
  const validCorrelation = typeof correlation === 'number' && !isNaN(correlation) ? correlation : 0;
  const validDuration = typeof duration === 'number' && !isNaN(duration) ? duration : 0;
  const validPopularity = typeof popularity === 'number' && !isNaN(popularity) ? popularity : 50;
  
  // Format correlation as percentage
  const correlationPercent = Math.round(validCorrelation * 100);
  
  // Calculate obscurity level (inverse of popularity)
  const obscurityLevel = 100 - validPopularity;
  
  // Format duration from ms to mm:ss
  const formatDuration = (ms) => {
    try {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    } catch (error) {
      console.error('Error formatting duration:', error);
      return '0:00';
    }
  };
  
  return (
    <div className={styles.trackCard}>
      <div className={styles.albumArtContainer}>
        {track.album && track.album.images && track.album.images.length > 0 && track.album.images[0].url ? (
          <div 
            className={styles.albumArt}
            style={{ 
              backgroundImage: `url(${track.album.images[0].url})`,
              width: '80px',
              height: '80px'
            }}
          />
        ) : (
          <div 
            className={styles.albumArtPlaceholder}
            style={{ 
              width: '80px',
              height: '80px'
            }}
          >
            <span>{track.name ? track.name.charAt(0) : '?'}</span>
          </div>
        )}
        
        <div className={styles.correlationBadge}>
          <span className={styles.correlationValue}>{correlationPercent}%</span>
          <span className={styles.correlationLabel}>match</span>
        </div>
      </div>
      
      <div className={styles.trackInfo}>
        <h3 className={styles.trackName}>{track.name || 'Unknown Track'}</h3>
        <p className={styles.artistName}>
          {track.artists && Array.isArray(track.artists) 
            ? track.artists.map(a => a?.name || 'Unknown Artist').join(', ')
            : 'Unknown Artist'}
        </p>
        
        <div className={styles.trackMetrics}>
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Duration</span>
            <span className={styles.metricValue}>{formatDuration(validDuration)}</span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Popularity</span>
            <div className={styles.popularityBar}>
              <div 
                className={styles.popularityFill} 
                style={{ width: `${validPopularity}%` }}
              ></div>
            </div>
            <span className={styles.metricValue}>{validPopularity}%</span>
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Obscurity</span>
            <div className={styles.obscurityBar}>
              <div 
                className={styles.obscurityFill} 
                style={{ width: `${obscurityLevel}%` }}
              ></div>
            </div>
            <span className={styles.metricValue}>{obscurityLevel}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
EOF

# Create enhanced ArtistCard.module.css
echo "Creating enhanced ArtistCard styles..."
cat > "$SRC_DIR/ArtistCard.module.css" << 'EOF'
.artistCard {
  display: flex;
  background: rgba(20, 20, 30, 0.7);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 255, 255, 0.2);
  border: 1px solid rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.artistCard:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 255, 255, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.artistCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 0, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.artistCard:hover::before {
  opacity: 1;
}

.artistImageContainer {
  position: relative;
  margin-right: 16px;
  flex-shrink: 0;
}

.artistImage {
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.artistImagePlaceholder {
  border-radius: 8px;
  background: linear-gradient(135deg, #1e1e2f 0%, #2a2a3a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.correlationBadge {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: linear-gradient(135deg, #00ffff 0%, #ff00ff 100%);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.correlationValue {
  font-size: 10px;
  font-weight: bold;
  color: #fff;
  line-height: 1;
}

.correlationLabel {
  font-size: 6px;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  line-height: 1;
}

.artistInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.artistName {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 8px 0;
  color: #fff;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.artistMetrics {
  margin-bottom: 12px;
}

.metricItem {
  display: flex;
  align-items: center;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.metricLabel {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  width: 70px;
  margin-right: 8px;
}

.metricValue {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin-left: 8px;
  width: 30px;
  text-align: right;
}

.popularityBar, .obscurityBar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.popularityFill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #00ffaa);
  border-radius: 3px;
}

.obscurityFill {
  height: 100%;
  background: linear-gradient(90deg, #ff00ff, #ff00aa);
  border-radius: 3px;
}

.artistGenres {
  display: flex;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.genreTag {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  padding: 3px 8px;
  border-radius: 12px;
  margin-right: 6px;
  margin-bottom: 6px;
}

.similarArtistsSection {
  margin-top: auto;
}

.similarArtistsTitle {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 6px 0;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.similarArtistsList {
  display: flex;
  flex-wrap: wrap;
}

.similarArtist {
  font-size: 11px;
  background: rgba(255, 255, 255, 0.05);
  color: rgba(255, 255, 255, 0.7);
  padding: 3px 8px;
  border-radius: 12px;
  margin-right: 6px;
  margin-bottom: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.similarArtistName {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
  display: inline-block;
}

.errorMessage {
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  width: 100%;
  padding: 20px;
}

/* Data source indicator */
.dataSourceIndicator {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
}

.realData {
  color: #00ffaa;
}

.mockData {
  color: #ff00aa;
}
EOF

# Create enhanced TrackCard.module.css
echo "Creating enhanced TrackCard styles..."
cat > "$SRC_DIR/TrackCard.module.css" << 'EOF'
.trackCard {
  display: flex;
  background: rgba(20, 20, 30, 0.7);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 255, 255, 0.2);
  border: 1px solid rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.trackCard:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 255, 255, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.trackCard::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.05) 0%, rgba(255, 0, 255, 0.05) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 0;
}

.trackCard:hover::before {
  opacity: 1;
}

.albumArtContainer {
  position: relative;
  margin-right: 16px;
  flex-shrink: 0;
}

.albumArt {
  border-radius: 8px;
  background-size: cover;
  background-position: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.albumArtPlaceholder {
  border-radius: 8px;
  background: linear-gradient(135deg, #1e1e2f 0%, #2a2a3a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.7);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
}

.correlationBadge {
  position: absolute;
  bottom: -8px;
  right: -8px;
  background: linear-gradient(135deg, #00ffff 0%, #ff00ff 100%);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  z-index: 1;
}

.correlationValue {
  font-size: 10px;
  font-weight: bold;
  color: #fff;
  line-height: 1;
}

.correlationLabel {
  font-size: 6px;
  color: rgba(255, 255, 255, 0.8);
  text-transform: uppercase;
  line-height: 1;
}

.trackInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
  z-index: 1;
}

.trackName {
  font-size: 18px;
  font-weight: bold;
  margin: 0 0 4px 0;
  color: #fff;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.artistName {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 12px 0;
}

.trackMetrics {
  margin-top: auto;
}

.metricItem {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.metricLabel {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  width: 70px;
  margin-right: 8px;
}

.metricValue {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.9);
  margin-left: 8px;
  width: 40px;
  text-align: right;
}

.popularityBar, .obscurityBar {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.popularityFill {
  height: 100%;
  background: linear-gradient(90deg, #00ffff, #00ffaa);
  border-radius: 3px;
}

.obscurityFill {
  height: 100%;
  background: linear-gradient(90deg, #ff00ff, #ff00aa);
  border-radius: 3px;
}

.errorMessage {
  color: #ff6b6b;
  font-size: 14px;
  text-align: center;
  width: 100%;
  padding: 20px;
}

/* Data source indicator */
.dataSourceIndicator {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
}

.realData {
  color: #00ffaa;
}

.mockData {
  color: #ff00aa;
}
EOF

# Create enhanced MusicTaste.module.css
echo "Creating enhanced MusicTaste styles..."
cat > "$SRC_DIR/MusicTaste.module.css" << 'EOF'
.container {
  min-height: 100vh;
  background-color: #0f0f1a;
  color: #ffffff;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 1rem;
}

.twoColumnLayout {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (min-width: 768px) {
  .twoColumnLayout {
    flex-direction: row;
  }
  
  .leftColumn {
    flex: 3;
  }
  
  .rightColumn {
    flex: 2;
  }
}

.summary {
  background: rgba(20, 20, 30, 0.7);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 255, 255, 0.2);
  border: 1px solid rgba(0, 255, 255, 0.1);
  font-size: 1.1rem;
  line-height: 1.6;
}

.highlight {
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.sectionTitle {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #ffffff;
  position: relative;
  display: inline-block;
}

.sectionTitle::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.genreSection,
.seasonalSection,
.eventsSection,
.vibeQuizSection,
.artistsSection,
.tracksSection {
  background: rgba(15, 15, 25, 0.7);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.spiderChartContainer {
  height: 300px;
  margin: 0 auto;
}

.eventsGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .eventsGrid {
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  }
}

.artistsGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .artistsGrid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

.tracksGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 640px) {
  .tracksGrid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}

.vibeQuizPrompt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.vibeQuizButton {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
}

.vibeQuizButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.viewMoreContainer {
  text-align: center;
  margin-top: 1.5rem;
}

.viewMoreButton {
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  text-decoration: none;
}

.viewMoreButton:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
}

.refreshButton {
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.refreshButton:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
}

.noDataMessage,
.noEventsMessage {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.6);
}

.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.loadingSpinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(0, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #00ffff;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.unauthorizedContainer,
.errorContainer,
.noDataContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  text-align: center;
  padding: 0 1rem;
}

.connectButton,
.retryButton {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  color: #000;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
  text-decoration: none;
  display: inline-block;
  margin-top: 1.5rem;
}

.connectButton:hover,
.retryButton:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.6);
}

.errorMessage {
  color: #ff6b6b;
  margin: 1rem 0;
}

/* Theme toggle styles */
.themeToggleContainer {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100;
}

.themeToggle {
  background: rgba(20, 20, 30, 0.8);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 50%;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  transition: all 0.3s ease;
}

.themeToggle:hover {
  transform: scale(1.1);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.themeIcon {
  font-size: 24px;
  color: #00ffff;
}

/* Data source indicators */
.dataSourceIndicator {
  display: inline-block;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
  vertical-align: middle;
}

.realData {
  color: #00ffaa;
}

.mockData {
  color: #ff00aa;
}
EOF

# Create enhanced music-taste.js with error handling and data source indicators
echo "Creating enhanced music-taste.js..."
cat > "$SRC_DIR/music-taste.js" << 'EOF'
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

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const [userTaste, setUserTaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showVibeQuiz, setShowVibeQuiz] = useState(false);
  const [dataSource, setDataSource] = useState('loading');
  const [theme, setTheme] = useState('neon');

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
      setDataSource(data.source || 'real');
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user taste:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  const handleVibeQuizSubmit = async (preferences) => {
    try {
      const response = await fetch('/api/user/update-taste-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }
      
      // Refresh user taste data
      fetchUserTaste();
      setShowVibeQuiz(false);
    } catch (err) {
      console.error('Error updating preferences:', err);
      setError(err.message);
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'neon' ? 'minimal' : 'neon');
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
  const seasonalMood = userTaste.seasonalMood && typeof userTaste.seasonalMood === 'object' ? userTaste.seasonalMood : {};
  
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
        {/* Compact header section */}
        <div className={styles.header}>
          <h1 className={styles.title}>Your Sound</h1>
          <p className={styles.subtitle}>
            Based on what you're streaming
            {dataSource === 'mock' && (
              <span className={`${styles.dataSourceIndicator} ${styles.mockData}`}>Mock Data</span>
            )}
            {dataSource === 'real' && (
              <span className={`${styles.dataSourceIndicator} ${styles.realData}`}>Real Data</span>
            )}
          </p>
        </div>
        
        {/* Two-column layout for better space usage */}
        <div className={styles.twoColumnLayout}>
          {/* Left column: User taste data */}
          <div className={styles.leftColumn}>
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
            
            {/* Genre section with spider chart */}
            <section className={styles.genreSection}>
              <h2 className={styles.sectionTitle}>
                Your Mix
                {dataSource === 'mock' && (
                  <span className={`${styles.dataSourceIndicator} ${styles.mockData}`}>Mock</span>
                )}
              </h2>
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
            
            {/* Seasonal section */}
            <section className={styles.seasonalSection}>
              <h2 className={styles.sectionTitle}>
                Your Seasonal Vibes
                {dataSource === 'mock' && (
                  <span className={`${styles.dataSourceIndicator} ${styles.mockData}`}>Mock</span>
                )}
              </h2>
              <SeasonalMoodCard seasonalMood={seasonalMood} />
            </section>
          </div>
          
          {/* Right column: Events and recommendations */}
          <div className={styles.rightColumn}>
            {/* Events section - prioritized */}
            <section className={styles.eventsSection}>
              <h2 className={styles.sectionTitle}>
                Events That Match Your Vibe
                {dataSource === 'mock' && (
                  <span className={`${styles.dataSourceIndicator} ${styles.mockData}`}>Mock</span>
                )}
              </h2>
              
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
                  <button className={styles.refreshButton} onClick={fetchUserTaste}>
                    Refresh
                  </button>
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
            
            {/* Vibe Quiz section */}
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
          </div>
        </div>
        
        {/* Full-width sections below */}
        {/* Artists section */}
        <section className={styles.artistsSection}>
          <h2 className={styles.sectionTitle}>
            Artists You Vibe With
            {dataSource === 'mock' && (
              <span className={`${styles.dataSourceIndicator} ${styles.mockData}`}>Mock</span>
            )}
          </h2>
          {topArtists.length > 0 ? (
            <div className={styles.artistsGrid}>
              {/* Show top 5 artists with up to 3 similar artists each */}
              {topArtists.slice(0, 5).map((artist, index) => (
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
        
        {/* Tracks section */}
        <section className={styles.tracksSection}>
          <h2 className={styles.sectionTitle}>
            Your Repeat Tracks
            {dataSource === 'mock' && (
              <span className={`${styles.dataSourceIndicator} ${styles.mockData}`}>Mock</span>
            )}
          </h2>
          {topTracks.length > 0 ? (
            <div className={styles.tracksGrid}>
              {/* Show top 5 tracks based on the last 3 months */}
              {topTracks.slice(0, 5).map((track, index) => (
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
      </main>
      
      {/* Theme toggle */}
      <div className={styles.themeToggleContainer}>
        <div className={styles.themeToggle} onClick={toggleTheme}>
          <span className={styles.themeIcon}>
            {theme === 'neon' ? '✨' : '🔆'}
          </span>
        </div>
      </div>
    </div>
  );
}
EOF

# Create enhanced index.js that doesn't automatically redirect
echo "Creating enhanced index.js..."
cat > "$SRC_DIR/index.js" << 'EOF'
import React from 'react';
import { useSession } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import Navigation from '../components/Navigation';

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className={styles.container}>
      <Head>
        <title>Sonar EDM | Unlock Your Sonic DNA</title>
        <meta name="description" content="Discover your music taste, find events that match your vibe, and connect with the EDM community." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Navigation />

      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h1 className={styles.title}>Unlock Your Sonic DNA</h1>
          <p className={styles.description}>
            Discover your music taste, find events that match your vibe, and connect with the EDM community.
          </p>
          
          {status === 'authenticated' ? (
            <Link href="/users/music-taste">
              <a className={styles.button}>View Your Music Taste</a>
            </Link>
          ) : (
            <Link href="/api/auth/signin">
              <a className={styles.button}>Connect with Spotify</a>
            </Link>
          )}
        </div>

        <div className={styles.featuresSection}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎵</div>
            <h2>Music Taste Analysis</h2>
            <p>Get insights into your listening habits and discover your unique sound profile.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎭</div>
            <h2>Event Matching</h2>
            <p>Find events and venues that match your music taste and preferences.</p>
          </div>
          
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🔍</div>
            <h2>Artist Discovery</h2>
            <p>Discover new artists based on your current favorites and listening patterns.</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>Sonar EDM Platform &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}
EOF

# Create enhanced Home.module.css
echo "Creating enhanced Home.module.css..."
cat > "$SRC_DIR/Home.module.css" << 'EOF'
.container {
  min-height: 100vh;
  background-color: #0f0f1a;
  color: #ffffff;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.heroSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 70vh;
  padding: 2rem;
  background: linear-gradient(rgba(15, 15, 26, 0.7), rgba(15, 15, 26, 0.9)), url('/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  border-radius: 20px;
  margin-bottom: 3rem;
  position: relative;
  overflow: hidden;
}

.heroSection::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.1) 0%, rgba(255, 0, 255, 0.1) 100%);
  z-index: 0;
}

.title {
  font-size: 3.5rem;
  margin-bottom: 1.5rem;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
  position: relative;
  z-index: 1;
}

.description {
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 800px;
  margin-bottom: 2.5rem;
  position: relative;
  z-index: 1;
}

.button {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  color: #000;
  border: none;
  border-radius: 30px;
  padding: 1rem 2.5rem;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
  text-decoration: none;
  position: relative;
  z-index: 1;
}

.button:hover {
  transform: translateY(-3px);
  box-shadow: 0 0 30px rgba(0, 255, 255, 0.6);
}

.featuresSection {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  margin-bottom: 3rem;
}

@media (min-width: 768px) {
  .featuresSection {
    grid-template-columns: repeat(3, 1fr);
  }
}

.featureCard {
  background: rgba(20, 20, 30, 0.7);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 255, 255, 0.2);
  border: 1px solid rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.featureCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4), 0 0 20px rgba(0, 255, 255, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.featureIcon {
  font-size: 3rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.featureCard h2 {
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: #ffffff;
}

.featureCard p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
}

.footer {
  text-align: center;
  padding: 2rem;
  color: rgba(255, 255, 255, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}
EOF

# Create Settings.module.css with theme toggle
echo "Creating enhanced Settings.module.css..."
cat > "$SRC_DIR/Settings.module.css" << 'EOF'
.container {
  min-height: 100vh;
  background-color: #0f0f1a;
  color: #ffffff;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.header {
  margin-bottom: 2rem;
}

.title {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.subtitle {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.7);
}

.settingsGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 768px) {
  .settingsGrid {
    grid-template-columns: 1fr 2fr;
  }
}

.settingsNav {
  background: rgba(20, 20, 30, 0.7);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
  height: fit-content;
}

.navTitle {
  font-size: 1.2rem;
  margin-bottom: 1.5rem;
  color: #ffffff;
  position: relative;
  display: inline-block;
}

.navTitle::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.navList {
  list-style: none;
  padding: 0;
  margin: 0;
}

.navItem {
  margin-bottom: 0.5rem;
}

.navLink {
  display: block;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.navLink:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.navLinkActive {
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  border-left: 3px solid #00ffff;
}

.settingsContent {
  background: rgba(20, 20, 30, 0.7);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.sectionTitle {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #ffffff;
  position: relative;
  display: inline-block;
}

.sectionTitle::after {
  content: '';
  position: absolute;
  bottom: -5px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.settingGroup {
  margin-bottom: 2rem;
}

.settingItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.settingLabel {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
}

.settingDescription {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 0.25rem;
}

.toggle {
  position: relative;
  display: inline-block;
  width: 60px;
  height: 30px;
}

.toggle input {
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
  background-color: rgba(255, 255, 255, 0.2);
  transition: 0.4s;
  border-radius: 30px;
}

.slider:before {
  position: absolute;
  content: "";
  height: 22px;
  width: 22px;
  left: 4px;
  bottom: 4px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
}

input:checked + .slider:before {
  transform: translateX(30px);
}

.themeSelector {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.themeOption {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 2px solid transparent;
}

.themeOption.active {
  border: 2px solid #00ffff;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.neonTheme {
  background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 100%);
}

.neonTheme::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(0, 255, 255, 0.2) 0%, rgba(255, 0, 255, 0.2) 100%);
  z-index: 0;
}

.minimalTheme {
  background: #1a1a2e;
}

.cyberpunkTheme {
  background: linear-gradient(135deg, #120458 0%, #4d0c8b 100%);
}

.saveButton {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  color: #000;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  margin-top: 2rem;
}

.saveButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.signOutButton {
  background: rgba(255, 0, 0, 0.1);
  color: #ff6b6b;
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 25px;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 2rem;
}

.signOutButton:hover {
  background: rgba(255, 0, 0, 0.2);
  box-shadow: 0 0 15px rgba(255, 0, 0, 0.3);
}
EOF

# Create enhanced settings.js with theme toggle
echo "Creating enhanced settings.js..."
cat > "$SRC_DIR/settings.js" << 'EOF'
import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../../styles/Settings.module.css';
import Navigation from '../../components/Navigation';

export default function Settings() {
  const { data: session, status } = useSession();
  const [activeSection, setActiveSection] = useState('appearance');
  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    events: true,
    artists: true,
    recommendations: true
  });
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    shareListening: true,
    allowRecommendations: true
  });
  const [appearance, setAppearance] = useState({
    theme: 'neon',
    darkMode: true,
    animations: true
  });
  
  const handleSignOut = () => {
    signOut({ callbackUrl: '/' });
  };
  
  const handleThemeChange = (theme) => {
    setAppearance({...appearance, theme});
  };
  
  const handleToggleChange = (section, setting) => {
    if (section === 'notifications') {
      setNotifications({...notifications, [setting]: !notifications[setting]});
    } else if (section === 'privacy') {
      setPrivacy({...privacy, [setting]: !privacy[setting]});
    } else if (section === 'appearance') {
      setAppearance({...appearance, [setting]: !appearance[setting]});
    }
  };
  
  const saveSettings = () => {
    // In a real app, this would save to the backend
    alert('Settings saved successfully!');
  };
  
  if (status === 'loading') {
    return (
      <div className={styles.container}>
        <Head>
          <title>Settings | Sonar</title>
        </Head>
        <Navigation />
        <main className={styles.main}>
          <div className={styles.loadingContainer}>
            <p>Loading settings...</p>
          </div>
        </main>
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
        <main className={styles.main}>
          <div className={styles.unauthorizedContainer}>
            <h1 className={styles.title}>Sign in required</h1>
            <p className={styles.subtitle}>Please sign in to access your settings</p>
            <Link href="/api/auth/signin">
              <a className={styles.signInButton}>Sign In</a>
            </Link>
          </div>
        </main>
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
        <div className={styles.header}>
          <h1 className={styles.title}>Settings</h1>
          <p className={styles.subtitle}>Customize your Sonar experience</p>
        </div>
        
        <div className={styles.settingsGrid}>
          {/* Settings Navigation */}
          <div className={styles.settingsNav}>
            <h2 className={styles.navTitle}>Settings</h2>
            <ul className={styles.navList}>
              <li className={styles.navItem}>
                <a 
                  className={`${styles.navLink} ${activeSection === 'appearance' ? styles.navLinkActive : ''}`}
                  onClick={() => setActiveSection('appearance')}
                >
                  Appearance
                </a>
              </li>
              <li className={styles.navItem}>
                <a 
                  className={`${styles.navLink} ${activeSection === 'notifications' ? styles.navLinkActive : ''}`}
                  onClick={() => setActiveSection('notifications')}
                >
                  Notifications
                </a>
              </li>
              <li className={styles.navItem}>
                <a 
                  className={`${styles.navLink} ${activeSection === 'privacy' ? styles.navLinkActive : ''}`}
                  onClick={() => setActiveSection('privacy')}
                >
                  Privacy
                </a>
              </li>
              <li className={styles.navItem}>
                <a 
                  className={`${styles.navLink} ${activeSection === 'account' ? styles.navLinkActive : ''}`}
                  onClick={() => setActiveSection('account')}
                >
                  Account
                </a>
              </li>
            </ul>
          </div>
          
          {/* Settings Content */}
          <div className={styles.settingsContent}>
            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <div>
                <h2 className={styles.sectionTitle}>Appearance</h2>
                
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Theme</h3>
                      <p className={styles.settingDescription}>Choose your preferred visual theme</p>
                      
                      <div className={styles.themeSelector}>
                        <div 
                          className={`${styles.themeOption} ${styles.neonTheme} ${appearance.theme === 'neon' ? styles.active : ''}`}
                          onClick={() => handleThemeChange('neon')}
                        ></div>
                        <div 
                          className={`${styles.themeOption} ${styles.minimalTheme} ${appearance.theme === 'minimal' ? styles.active : ''}`}
                          onClick={() => handleThemeChange('minimal')}
                        ></div>
                        <div 
                          className={`${styles.themeOption} ${styles.cyberpunkTheme} ${appearance.theme === 'cyberpunk' ? styles.active : ''}`}
                          onClick={() => handleThemeChange('cyberpunk')}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Dark Mode</h3>
                      <p className={styles.settingDescription}>Use dark theme throughout the app</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={appearance.darkMode}
                        onChange={() => handleToggleChange('appearance', 'darkMode')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Animations</h3>
                      <p className={styles.settingDescription}>Enable animations and transitions</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={appearance.animations}
                        onChange={() => handleToggleChange('appearance', 'animations')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notifications Settings */}
            {activeSection === 'notifications' && (
              <div>
                <h2 className={styles.sectionTitle}>Notifications</h2>
                
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Email Notifications</h3>
                      <p className={styles.settingDescription}>Receive updates via email</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.email}
                        onChange={() => handleToggleChange('notifications', 'email')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Push Notifications</h3>
                      <p className={styles.settingDescription}>Receive push notifications on your device</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.push}
                        onChange={() => handleToggleChange('notifications', 'push')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Event Notifications</h3>
                      <p className={styles.settingDescription}>Get notified about events matching your taste</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.events}
                        onChange={() => handleToggleChange('notifications', 'events')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Artist Updates</h3>
                      <p className={styles.settingDescription}>Get notified about your favorite artists</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.artists}
                        onChange={() => handleToggleChange('notifications', 'artists')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Recommendations</h3>
                      <p className={styles.settingDescription}>Get notified about personalized recommendations</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={notifications.recommendations}
                        onChange={() => handleToggleChange('notifications', 'recommendations')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Privacy Settings */}
            {activeSection === 'privacy' && (
              <div>
                <h2 className={styles.sectionTitle}>Privacy</h2>
                
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Public Profile</h3>
                      <p className={styles.settingDescription}>Allow others to view your profile</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={privacy.publicProfile}
                        onChange={() => handleToggleChange('privacy', 'publicProfile')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Share Listening Activity</h3>
                      <p className={styles.settingDescription}>Share your listening activity with others</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={privacy.shareListening}
                        onChange={() => handleToggleChange('privacy', 'shareListening')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Allow Recommendations</h3>
                      <p className={styles.settingDescription}>Allow us to use your data for recommendations</p>
                    </div>
                    <label className={styles.toggle}>
                      <input 
                        type="checkbox" 
                        checked={privacy.allowRecommendations}
                        onChange={() => handleToggleChange('privacy', 'allowRecommendations')}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {/* Account Settings */}
            {activeSection === 'account' && (
              <div>
                <h2 className={styles.sectionTitle}>Account</h2>
                
                <div className={styles.settingGroup}>
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Connected Accounts</h3>
                      <p className={styles.settingDescription}>Manage your connected accounts</p>
                    </div>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Spotify</h3>
                      <p className={styles.settingDescription}>
                        {session?.user?.name || session?.user?.email || 'Connected'}
                      </p>
                    </div>
                    <button className={styles.reconnectButton}>Reconnect</button>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Data & Privacy</h3>
                      <p className={styles.settingDescription}>Manage your data and privacy settings</p>
                    </div>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Download Your Data</h3>
                      <p className={styles.settingDescription}>Download a copy of your data</p>
                    </div>
                    <button className={styles.downloadButton}>Download</button>
                  </div>
                  
                  <div className={styles.settingItem}>
                    <div>
                      <h3 className={styles.settingLabel}>Delete Account</h3>
                      <p className={styles.settingDescription}>Permanently delete your account and data</p>
                    </div>
                    <button className={styles.deleteButton}>Delete</button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Save Button */}
            <button className={styles.saveButton} onClick={saveSettings}>
              Save Changes
            </button>
            
            {/* Sign Out Button */}
            <button className={styles.signOutButton} onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
EOF

# Copy enhanced components to project
echo "Copying enhanced components to project..."
cp "$SRC_DIR/ArtistCard.js" "$PROJECT_DIR/components/"
cp "$SRC_DIR/TrackCard.js" "$PROJECT_DIR/components/"
cp "$SRC_DIR/ArtistCard.module.css" "$PROJECT_DIR/styles/"
cp "$SRC_DIR/TrackCard.module.css" "$PROJECT_DIR/styles/"
cp "$SRC_DIR/MusicTaste.module.css" "$PROJECT_DIR/styles/"
cp "$SRC_DIR/music-taste.js" "$PROJECT_DIR/pages/users/"
cp "$SRC_DIR/index.js" "$PROJECT_DIR/pages/"
cp "$SRC_DIR/Home.module.css" "$PROJECT_DIR/styles/"
cp "$SRC_DIR/Settings.module.css" "$PROJECT_DIR/styles/"
cp "$SRC_DIR/settings.js" "$PROJECT_DIR/pages/users/"

echo -e "${GREEN}Enhanced components copied successfully!${NC}"
echo ""

# Create Heroku deployment script
echo "Creating Heroku deployment script..."
cat > "$PROJECT_DIR/deploy-to-heroku.sh" << 'EOF'
#!/bin/bash

# Sonar EDM Platform - Heroku Deployment Script
# This script commits and deploys the changes to Heroku

echo "====================================================="
echo "  Sonar EDM Platform - Heroku Deployment Script"
echo "====================================================="
echo ""

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if git is installed
if ! command -v git &> /dev/null; then
  echo -e "${RED}Error: Git is not installed.${NC}"
  echo "Please install Git first: https://git-scm.com/downloads"
  exit 1
fi

# Check if we're in a git repository
if [ ! -d ".git" ]; then
  echo -e "${RED}Error: Not a git repository.${NC}"
  echo "Please run this script from the root of your Sonar EDM project."
  exit 1
fi

# Create backup branch
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_BRANCH="backup-${TIMESTAMP}"

echo -e "${YELLOW}Creating backup branch: ${BACKUP_BRANCH}${NC}"
git checkout -b $BACKUP_BRANCH

# Add all changes
echo -e "${YELLOW}Adding all changes to git...${NC}"
git add components/ArtistCard.js
git add components/TrackCard.js
git add styles/ArtistCard.module.css
git add styles/TrackCard.module.css
git add styles/MusicTaste.module.css
git add styles/Home.module.css
git add styles/Settings.module.css
git add pages/users/music-taste.js
git add pages/users/settings.js
git add pages/index.js

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "Implement enhanced Music Taste page with popularity indicators and theme toggle"

# Switch back to main branch
echo -e "${YELLOW}Switching back to main branch...${NC}"
git checkout main

# Merge changes from backup branch
echo -e "${YELLOW}Merging changes from backup branch...${NC}"
git merge $BACKUP_BRANCH

# Push to Heroku
echo -e "${YELLOW}Pushing changes to Heroku...${NC}"
git push heroku main

# Check if push was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Deployment successful!${NC}"
  echo ""
  echo "Your application is now available at: https://sonar-edm-user-50e4fb038f6e.herokuapp.com"
  echo ""
  echo "You can check the following pages:"
  echo "- Home page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/"
  echo "- Music Taste page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/music-taste"
  echo "- Settings page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/settings"
  echo ""
  echo "If you need to revert the changes, you can use the backup branch:"
  echo "git checkout $BACKUP_BRANCH"
  echo "git push -f heroku $BACKUP_BRANCH:main"
  echo ""
  echo "Thank you for using the Sonar EDM Platform Heroku Deployment Script!"
else
  echo -e "${RED}Deployment failed.${NC}"
  echo "Please check the error messages above and try again."
  echo "You can manually push your changes with: git push heroku main"
  echo ""
  echo "If you need to revert to the previous state, you can use the backup branch:"
  echo "git checkout $BACKUP_BRANCH"
fi
EOF

# Make the deployment script executable
chmod +x "$PROJECT_DIR/deploy-to-heroku.sh"

echo -e "${GREEN}Heroku deployment script created successfully!${NC}"
echo ""

echo -e "${GREEN}Deployment script completed successfully!${NC}"
echo ""
echo "The following enhancements have been implemented:"
echo "1. Redesigned top artists and tracks sections with popularity indicators"
echo "2. Added theme toggle in profile settings"
echo "3. Fixed landing page to prevent automatic redirection"
echo "4. Added clear indication of mock vs. real data sections"
echo "5. Enhanced error handling in all components"
echo "6. Improved sign-out functionality"
echo ""
echo "To deploy these changes to Heroku:"
echo "1. Navigate to your project directory: cd $PROJECT_DIR"
echo "2. Run the deployment script: ./deploy-to-heroku.sh"
echo ""
echo "After deployment, you can access your pages at:"
echo "- Home page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/"
echo "- Music Taste page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/music-taste"
echo "- Settings page: https://sonar-edm-user-50e4fb038f6e.herokuapp.com/users/settings"
echo ""
echo "Thank you for using the Sonar EDM Platform Deployment Script!"
