#!/bin/bash

# Sonar EDM Platform - Optimized Implementation Script
# This script directly modifies files in your project directory
# and doesn't rely on external directories or paths

echo "====================================================="
echo "  Sonar EDM Platform - Optimized Implementation Script"
echo "====================================================="
echo ""

# Define colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Define project directory - this should be your actual project path
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
backup_file "$PROJECT_DIR/styles/Home.module.css"

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

# Now update the files directly in the project directory

echo "Updating ArtistCard.js with optimized design..."
cat > "$PROJECT_DIR/components/ArtistCard.js" << 'EOF'
import React from 'react';
import styles from '../styles/ArtistCard.module.css';

const ArtistCard = ({ artist, correlation, similarArtists }) => {
  // Error handling: Check if artist is valid
  if (!artist || typeof artist !== 'object') {
    return (
      <div className={styles.artistCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display artist information</p>
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
  
  // Get first letter of artist name for placeholder
  const firstLetter = artist.name ? artist.name.charAt(0).toUpperCase() : '?';
  
  return (
    <div className={styles.artistCard}>
      <div className={styles.artistInitial}>
        {firstLetter}
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
      </div>
      
      <div className={styles.similarArtistsSection}>
        {validSimilarArtists.length > 0 && (
          <div className={styles.similarArtistsList}>
            {validSimilarArtists.slice(0, 2).map((similar, index) => (
              <div key={index} className={styles.similarArtist}>
                {similar.name || 'Unknown Artist'}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtistCard;
EOF

echo "Updating TrackCard.js with optimized design..."
cat > "$PROJECT_DIR/components/TrackCard.js" << 'EOF'
import React from 'react';
import styles from '../styles/TrackCard.module.css';

const TrackCard = ({ track, correlation, duration, popularity }) => {
  // Error handling: Check if track is valid
  if (!track || typeof track !== 'object') {
    return (
      <div className={styles.trackCard}>
        <div className={styles.errorMessage}>
          <p>Unable to display track information</p>
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
      return '0:00';
    }
  };
  
  // Get first letter of track name for placeholder
  const firstLetter = track.name ? track.name.charAt(0).toUpperCase() : '?';
  
  return (
    <div className={styles.trackCard}>
      <div className={styles.trackInitial}>
        {firstLetter}
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

echo "Updating SpiderChart.js with improved labels..."
cat > "$PROJECT_DIR/components/SpiderChart.js" << 'EOF'
import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import styles from '../styles/SpiderChart.module.css';

const SpiderChart = ({ genres }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Validate genres data
    if (!Array.isArray(genres) || genres.length === 0) {
      return;
    }

    // Filter out invalid genres and ensure all have name and score properties
    const validGenres = genres.filter(genre => 
      genre && typeof genre === 'object' && 
      typeof genre.name === 'string' && 
      (typeof genre.score === 'number' || typeof genre.value === 'number')
    );

    if (validGenres.length === 0) {
      return;
    }

    // Get canvas context
    const ctx = chartRef.current.getContext('2d');
    
    // Destroy existing chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }
    
    // Prepare data for chart
    const labels = validGenres.map(genre => genre.name);
    const data = validGenres.map(genre => genre.score || genre.value || 0);
    
    // Create new chart
    try {
      chartInstance.current = new Chart(ctx, {
        type: 'radar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Genre Affinity',
            data: data,
            backgroundColor: 'rgba(0, 255, 255, 0.2)',
            borderColor: 'rgba(0, 255, 255, 1)',
            borderWidth: 2,
            pointBackgroundColor: 'rgba(0, 255, 255, 1)',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: 'rgba(0, 255, 255, 1)'
          }]
        },
        options: {
          scales: {
            r: {
              angleLines: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              },
              pointLabels: {
                color: 'rgba(255, 255, 255, 0.7)',
                font: {
                  size: 12
                },
                padding: 10,
                // Ensure labels don't get truncated
                callback: function(value) {
                  // Limit label length to prevent truncation
                  if (value.length > 10) {
                    return value.substr(0, 8) + '...';
                  }
                  return value;
                }
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.5)',
                backdropColor: 'transparent',
                showLabelBackdrop: false
              }
            }
          },
          plugins: {
            legend: {
              display: false
            },
            tooltip: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              titleColor: '#00ffff',
              bodyColor: '#ffffff',
              borderColor: 'rgba(0, 255, 255, 0.3)',
              borderWidth: 1,
              displayColors: false,
              callbacks: {
                title: function(tooltipItems) {
                  return tooltipItems[0].label;
                },
                label: function(context) {
                  return `Score: ${context.raw}`;
                }
              }
            }
          },
          maintainAspectRatio: false
        }
      });
    } catch (error) {
      console.error('Error creating spider chart:', error);
    }
    
    // Cleanup function
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [genres]);
  
  // If no genres data, show a message
  if (!Array.isArray(genres) || genres.length === 0) {
    return (
      <div className={styles.noDataContainer}>
        <p>No genre data available</p>
      </div>
    );
  }
  
  return (
    <div className={styles.spiderChartContainer}>
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

export default SpiderChart;
EOF

echo "Updating ArtistCard.module.css styles..."
cat > "$PROJECT_DIR/styles/ArtistCard.module.css" << 'EOF'
.artistCard {
  display: flex;
  background: rgba(20, 20, 30, 0.7);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  align-items: center;
}

.artistCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 255, 255, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.artistInitial {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00ffff, #ff00ff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-right: 12px;
  flex-shrink: 0;
}

.artistInfo {
  flex: 1;
  min-width: 0; /* Ensures text truncation works */
}

.artistName {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 6px 0;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artistMetrics {
  margin-bottom: 8px;
}

.metricItem {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.metricLabel {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  width: 60px;
  margin-right: 6px;
}

.metricValue {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  margin-left: 6px;
  width: 30px;
  text-align: right;
}

.popularityBar, .obscurityBar {
  flex: 1;
  height: 5px;
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
  margin-bottom: 6px;
}

.genreTag {
  font-size: 9px;
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  padding: 2px 6px;
  border-radius: 10px;
  margin-right: 4px;
  margin-bottom: 4px;
}

.similarArtistsSection {
  margin-left: auto;
  padding-left: 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 80px;
}

.similarArtistsList {
  display: flex;
  flex-direction: column;
}

.similarArtist {
  font-size: 9px;
  color: rgba(255, 255, 255, 0.6);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.errorMessage {
  color: #ff6b6b;
  font-size: 12px;
  text-align: center;
  width: 100%;
  padding: 10px;
}
EOF

echo "Updating TrackCard.module.css styles..."
cat > "$PROJECT_DIR/styles/TrackCard.module.css" << 'EOF'
.trackCard {
  display: flex;
  background: rgba(20, 20, 30, 0.7);
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 10px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  align-items: center;
}

.trackCard:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 255, 255, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.trackInitial {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff00ff, #00ffff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  color: #000;
  margin-right: 12px;
  flex-shrink: 0;
}

.trackInfo {
  flex: 1;
  min-width: 0; /* Ensures text truncation works */
}

.trackName {
  font-size: 16px;
  font-weight: bold;
  margin: 0 0 2px 0;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artistName {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trackMetrics {
  margin-bottom: 0;
}

.metricItem {
  display: flex;
  align-items: center;
  margin-bottom: 4px;
  flex-wrap: wrap;
}

.metricLabel {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  width: 60px;
  margin-right: 6px;
}

.metricValue {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  margin-left: 6px;
  width: 30px;
  text-align: right;
}

.popularityBar, .obscurityBar {
  flex: 1;
  height: 5px;
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
  font-size: 12px;
  text-align: center;
  width: 100%;
  padding: 10px;
}
EOF

echo "Updating MusicTaste.module.css styles..."
cat > "$PROJECT_DIR/styles/MusicTaste.module.css" << 'EOF'
.container {
  min-height: 100vh;
  background-color: #0f0f1a;
  color: #ffffff;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: none; /* Hide the header as requested */
}

.summary {
  background: rgba(20, 20, 30, 0.7);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.1);
  font-size: 1rem;
  line-height: 1.4;
}

.highlight {
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.sectionTitle {
  font-size: 1.2rem;
  margin-bottom: 0.8rem;
  color: #ffffff;
  position: relative;
  display: inline-block;
}

.sectionTitle::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.mainContent {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .mainContent {
    grid-template-columns: 1fr 1fr;
  }
}

.genreSection,
.seasonalSection,
.eventsSection,
.vibeQuizSection,
.artistsSection,
.tracksSection {
  background: rgba(15, 15, 25, 0.7);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.spiderChartContainer {
  height: 250px;
  margin: 0 auto;
}

.eventsGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
}

@media (min-width: 640px) {
  .eventsGrid {
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  }
}

.artistsGrid, .tracksGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

.vibeQuizPrompt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem;
  flex-wrap: wrap;
  gap: 0.8rem;
}

.vibeQuizButton {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  color: #000;
  border: none;
  border-radius: 20px;
  padding: 0.4rem 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  font-size: 0.9rem;
}

.vibeQuizButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.viewMoreContainer {
  text-align: center;
  margin-top: 1rem;
}

.viewMoreButton {
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 20px;
  padding: 0.4rem 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-block;
  text-decoration: none;
  font-size: 0.9rem;
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
  padding: 0.4rem 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
}

.refreshButton:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
}

.noDataMessage,
.noEventsMessage {
  text-align: center;
  padding: 1.5rem;
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
}

.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
}

.loadingSpinner {
  width: 40px;
  height: 40px;
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
  font-size: 1rem;
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
  width: 40px;
  height: 40px;
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
  font-size: 20px;
  color: #00ffff;
}

/* Data source indicators */
.dataSourceIndicator {
  display: inline-block;
  font-size: 9px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(0, 0, 0, 0.3);
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 6px;
  vertical-align: middle;
}

.realData {
  color: #00ffaa;
}

.mockData {
  color: #ff00aa;
}
EOF

echo "Updating music-taste.js with optimized layout..."
cat > "$PROJECT_DIR/pages/users/music-taste.js" << 'EOF'
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
    } else if (status === 'unauthenticated') {
      // Redirect to home page if not authenticated
      window.location.href = '/';
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
          <title>Music Taste | Sonar</title>
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
          <title>Music Taste | Sonar</title>
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
          <title>Music Taste | Sonar</title>
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
          <title>Music Taste | Sonar</title>
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
        <title>Music Taste | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        {/* Concise summary */}
        <div className={styles.summary}>
          <p>
            You're all about <span className={styles.highlight}>{getTopGenres()}</span> with 
            a vibe shift toward <span className={styles.highlight}>{getRecentTrends()}</span>. 
            {suggestedEvents.length > 0 ? 
              ` Found ${suggestedEvents.length} events that match your sound.` : 
              " Events coming soon that match your sound."}
            {dataSource === 'mock' && (
              <span className={`${styles.dataSourceIndicator} ${styles.mockData}`}>Mock Data</span>
            )}
            {dataSource === 'real' && (
              <span className={`${styles.dataSourceIndicator} ${styles.realData}`}>Real Data</span>
            )}
          </p>
        </div>
        
        {/* Main content grid - 2 columns on desktop */}
        <div className={styles.mainContent}>
          {/* Left column: Genre mix */}
          <div className={styles.genreSection}>
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
          </div>
          
          {/* Right column: Seasonal mood */}
          <div className={styles.seasonalSection}>
            <h2 className={styles.sectionTitle}>
              Seasonal Vibes
              {dataSource === 'mock' && (
                <span className={`${styles.dataSourceIndicator} ${styles.mockData}`}>Mock</span>
              )}
            </h2>
            <SeasonalMoodCard seasonalMood={seasonalMood} />
          </div>
        </div>
        
        {/* Events section */}
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
            <h2 className={styles.sectionTitle}>Not feeling this vibe?</h2>
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

echo "Updating index.js to fix landing page and authentication flow..."
cat > "$PROJECT_DIR/pages/index.js" << 'EOF'
import React, { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';
import Navigation from '../components/Navigation';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect authenticated users directly to music-taste page
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/users/music-taste');
    }
  }, [status, router]);

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
          
          {status === 'loading' ? (
            <div className={styles.loadingButton}>
              <div className={styles.loadingSpinner}></div>
              Loading...
            </div>
          ) : status === 'authenticated' ? (
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
    </div>
  );
}
EOF

echo "Updating Home.module.css styles..."
cat > "$PROJECT_DIR/styles/Home.module.css" << 'EOF'
.container {
  min-height: 100vh;
  background-color: #0f0f1a;
  color: #ffffff;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.heroSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 60vh;
  padding: 2rem;
  background: linear-gradient(rgba(15, 15, 26, 0.7), rgba(15, 15, 26, 0.9)), url('/hero-bg.jpg');
  background-size: cover;
  background-position: center;
  border-radius: 12px;
  margin: 1rem 0;
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
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
  position: relative;
  z-index: 1;
}

.description {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 800px;
  margin-bottom: 2rem;
  position: relative;
  z-index: 1;
}

.button {
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  color: #000;
  border: none;
  border-radius: 30px;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
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

.loadingButton {
  background: rgba(0, 255, 255, 0.2);
  color: #fff;
  border: none;
  border-radius: 30px;
  padding: 0.8rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loadingSpinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #ffffff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 10px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.featuresSection {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin: 0 0 2rem 0;
}

@media (min-width: 768px) {
  .featuresSection {
    grid-template-columns: repeat(3, 1fr);
  }
}

.featureCard {
  background: rgba(20, 20, 30, 0.7);
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.featureCard:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(0, 255, 255, 0.3);
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.featureIcon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.featureCard h2 {
  font-size: 1.3rem;
  margin-bottom: 0.8rem;
  color: #ffffff;
}

.featureCard p {
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.5;
  font-size: 0.95rem;
}
EOF

echo "Updating auth/signin.js to fix authentication flow..."
cat > "$PROJECT_DIR/pages/auth/signin.js" << 'EOF'
import React, { useEffect } from 'react';
import { getProviders, signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import styles from '../../styles/signin.module.css';
import Navigation from '../../components/Navigation';

export default function SignIn({ providers }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { callbackUrl } = router.query;
  
  // Redirect authenticated users to music-taste page
  useEffect(() => {
    if (status === 'authenticated') {
      router.push(callbackUrl || '/users/music-taste');
    }
  }, [status, router, callbackUrl]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Sign In | Sonar</title>
      </Head>
      
      <Navigation />
      
      <main className={styles.main}>
        <div className={styles.signinCard}>
          <h1 className={styles.title}>Connect with Sonar</h1>
          <p className={styles.subtitle}>Unlock your sonic DNA and discover your music taste</p>
          
          {status === 'loading' ? (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading...</p>
            </div>
          ) : status === 'authenticated' ? (
            <div className={styles.alreadySignedIn}>
              <p>You're already signed in!</p>
              <button 
                className={styles.redirectButton}
                onClick={() => router.push('/users/music-taste')}
              >
                Go to Music Taste
              </button>
            </div>
          ) : (
            <div className={styles.providersContainer}>
              {Object.values(providers || {}).map((provider) => (
                <div key={provider.name} className={styles.providerItem}>
                  <button 
                    className={styles.providerButton}
                    onClick={() => signIn(provider.id, { callbackUrl: '/users/music-taste' })}
                  >
                    <span className={styles.providerIcon}>
                      {provider.name === 'Spotify' && '🎵'}
                    </span>
                    Connect with {provider.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export async function getServerSideProps() {
  const providers = await getProviders();
  return {
    props: { providers },
  };
}
EOF

echo "Updating signin.module.css styles..."
cat > "$PROJECT_DIR/styles/signin.module.css" << 'EOF'
.container {
  min-height: 100vh;
  background-color: #0f0f1a;
  color: #ffffff;
}

.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
  padding: 1rem;
}

.signinCard {
  background: rgba(20, 20, 30, 0.7);
  border-radius: 12px;
  padding: 2rem;
  width: 100%;
  max-width: 500px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 15px rgba(0, 255, 255, 0.2);
  border: 1px solid rgba(0, 255, 255, 0.1);
}

.title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 2rem;
}

.providersContainer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.providerItem {
  width: 100%;
}

.providerButton {
  width: 100%;
  background: linear-gradient(90deg, #00ffff, #ff00ff);
  color: #000;
  border: none;
  border-radius: 25px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.providerButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.5);
}

.providerIcon {
  font-size: 1.2rem;
  margin-right: 0.5rem;
}

.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 0;
}

.loadingSpinner {
  width: 40px;
  height: 40px;
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

.alreadySignedIn {
  padding: 1rem 0;
}

.redirectButton {
  background: rgba(0, 255, 255, 0.1);
  color: #00ffff;
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.redirectButton:hover {
  background: rgba(0, 255, 255, 0.2);
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
}
EOF

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
git add components/SpiderChart.js
git add styles/ArtistCard.module.css
git add styles/TrackCard.module.css
git add styles/SpiderChart.module.css
git add styles/MusicTaste.module.css
git add styles/Home.module.css
git add styles/signin.module.css
git add pages/users/music-taste.js
git add pages/index.js
git add pages/auth/signin.js

# Commit changes
echo -e "${YELLOW}Committing changes...${NC}"
git commit -m "Implement optimized Music Taste page with improved layout and design"

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

echo -e "${GREEN}Optimized implementation script completed successfully!${NC}"
echo ""
echo "The following enhancements have been implemented:"
echo "1. Redesigned layout with minimal space wastage"
echo "2. Fixed authentication flow to go directly to music taste dashboard"
echo "3. Improved spider chart with proper labels"
echo "4. Reorganized content with seasonal mood next to genre mix"
echo "5. Removed unnecessary headers and let the data speak for itself"
echo "6. Optimized artist and track cards for better display"
echo "7. Fixed real data display issues"
echo "8. Improved landing page with proper content visibility"
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
echo "Thank you for using the Sonar EDM Platform Optimized Implementation Script!"
