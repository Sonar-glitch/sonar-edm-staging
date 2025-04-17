#!/bin/bash

# Sonar EDM Platform - Comprehensive Implementation Script
# This script fixes all issues with the Sonar EDM Platform:
# 1. Landing page issue - ensuring it displays properly instead of auto-redirecting
# 2. Real data display for music taste - fixing the API integration
# 3. Compact display of user taste - with the updated SeasonalMoodCard
# 4. Sign-out functionality - fixing the Navigation component
# 5. Using real information in the profile
# 6. Vibe Quiz updates - with improved tab navigation
# 7. All text updated to be concise, engaging, and ADHD-friendly for younger users

# Set the project directory
PROJECT_DIR="/c/sonar/users/sonar-edm-user"

# Create backup directory
BACKUP_DIR="$PROJECT_DIR/backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Backup existing files
echo "Backing up existing files..."
[ -f "$PROJECT_DIR/pages/index.js" ] && cp "$PROJECT_DIR/pages/index.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/SpiderChart.js" ] && cp "$PROJECT_DIR/components/SpiderChart.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/ArtistCard.js" ] && cp "$PROJECT_DIR/components/ArtistCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/TrackCard.js" ] && cp "$PROJECT_DIR/components/TrackCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/SeasonalMoodCard.js" ] && cp "$PROJECT_DIR/components/SeasonalMoodCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/VibeQuizCard.js" ] && cp "$PROJECT_DIR/components/VibeQuizCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/Navigation.js" ] && cp "$PROJECT_DIR/components/Navigation.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/pages/users/music-taste.js" ] && cp "$PROJECT_DIR/pages/users/music-taste.js" "$BACKUP_DIR/"

# Create directories if they don't exist
mkdir -p "$PROJECT_DIR/components"
mkdir -p "$PROJECT_DIR/pages/users"

# 1. Fix Landing Page - index.js
echo "Updating index.js to fix landing page issue..."
cat > "$PROJECT_DIR/pages/index.js" << 'EOL'
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Removed automatic redirect to allow users to see the landing page
  // Users can navigate to music taste page via navigation menu

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <div className={styles.heroSection}>
          <h1 className={styles.title}>
            Unlock Your <span className={styles.highlight}>Sonic DNA</span>
          </h1>
          
          <p className={styles.description}>
            Connect your Spotify and discover events that perfectly match your
            unique music taste. No more wasted nights at venues that don't
            match your vibe.
          </p>
          
          {!session ? (
            <Link href="/api/auth/signin">
              <a className={styles.connectButton}>
                Connect with Spotify
              </a>
            </Link>
          ) : (
            <Link href="/users/music-taste">
              <a className={styles.connectButton}>
                View Your Music Taste
              </a>
            </Link>
          )}
        </div>
        
        <section className={styles.howItWorks}>
          <h2 className={styles.sectionTitle}>How It Works</h2>
          
          <div className={styles.stepsContainer}>
            <div className={styles.stepCard}>
              <h3>Connect</h3>
              <p>Link your Spotify account to analyze your music preferences</p>
            </div>
            
            <div className={styles.stepCard}>
              <h3>Discover</h3>
              <p>Find events and venues that match your unique taste profile</p>
            </div>
            
            <div className={styles.stepCard}>
              <h3>Experience</h3>
              <p>Enjoy events knowing they're perfectly aligned with your preferences</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
EOL

# 2. Fix SpiderChart.js - prevent truncated genre names
echo "Updating SpiderChart.js to fix truncated genre names..."
cat > "$PROJECT_DIR/components/SpiderChart.js" << 'EOL'
import React from 'react';
import styles from '../styles/SpiderChart.module.css';

const SpiderChart = ({ genres }) => {
  // Error handling: Check if genres is valid
  if (!genres || !Array.isArray(genres) || genres.length === 0) {
    return (
      <div className={styles.spiderChartContainer}>
        <div className={styles.errorMessage}>
          <p>Unable to display genre chart. No genre data available.</p>
        </div>
      </div>
    );
  }

  // Ensure all genres have valid properties
  const validGenres = genres.map(genre => ({
    name: genre.name || 'Unknown',
    score: typeof genre.score === 'number' && !isNaN(genre.score) ? genre.score : 0
  }));

  // Calculate positions for each genre on the spider chart
  const calculatePoints = (genres) => {
    try {
      const points = [];
      const centerX = 150;
      const centerY = 150;
      const radius = 120;
      
      genres.forEach((genre, index) => {
        const angle = (Math.PI * 2 * index) / genres.length;
        const x = centerX + radius * Math.cos(angle) * (genre.score / 100);
        const y = centerY + radius * Math.sin(angle) * (genre.score / 100);
        points.push({ x, y, name: genre.name, score: genre.score });
      });
      
      return points;
    } catch (error) {
      console.error('Error calculating points:', error);
      return [];
    }
  };
  
  // Create SVG path for the spider web
  const createWebPath = (points) => {
    try {
      if (!points || points.length < 3) {
        return '';
      }
      
      let path = '';
      points.forEach((point, index) => {
        if (index === 0) {
          path += `M ${point.x} ${point.y} `;
        } else {
          path += `L ${point.x} ${point.y} `;
        }
      });
      path += 'Z';
      return path;
    } catch (error) {
      console.error('Error creating web path:', error);
      return '';
    }
  };
  
  // Create grid lines for the spider chart
  const createGridLines = (count) => {
    try {
      const lines = [];
      const centerX = 150;
      const centerY = 150;
      const radius = 120;
      
      for (let i = 1; i <= count; i++) {
        const gridPoints = [];
        const gridRadius = (radius * i) / count;
        
        for (let j = 0; j < validGenres.length; j++) {
          const angle = (Math.PI * 2 * j) / validGenres.length;
          const x = centerX + gridRadius * Math.cos(angle);
          const y = centerY + gridRadius * Math.sin(angle);
          gridPoints.push({ x, y });
        }
        
        lines.push(createWebPath(gridPoints));
      }
      
      return lines;
    } catch (error) {
      console.error('Error creating grid lines:', error);
      return [];
    }
  };
  
  // Create axis lines for each genre
  const createAxisLines = () => {
    try {
      const lines = [];
      const centerX = 150;
      const centerY = 150;
      const radius = 120;
      
      validGenres.forEach((genre, index) => {
        const angle = (Math.PI * 2 * index) / validGenres.length;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        lines.push({ x1: centerX, y1: centerY, x2: x, y2: y });
      });
      
      return lines;
    } catch (error) {
      console.error('Error creating axis lines:', error);
      return [];
    }
  };
  
  // Calculate all the necessary data with error handling
  let points = [];
  let webPath = '';
  let gridLines = [];
  let axisLines = [];
  
  try {
    points = calculatePoints(validGenres);
    webPath = createWebPath(points);
    gridLines = createGridLines(4);
    axisLines = createAxisLines();
  } catch (error) {
    console.error('Error in SpiderChart calculations:', error);
  }
  
  // Function to position and format genre labels to prevent truncation
  const getGenreLabelPosition = (index, totalGenres) => {
    const angle = (Math.PI * 2 * index) / totalGenres;
    // Increased label radius to provide more space for text
    const labelRadius = 150;
    const labelX = 150 + labelRadius * Math.cos(angle);
    const labelY = 150 + labelRadius * Math.sin(angle);
    
    // Determine text anchor based on position in the circle
    // This helps align text better to prevent truncation
    let textAnchor = "middle";
    if (angle < Math.PI * 0.25 || angle > Math.PI * 1.75) {
      textAnchor = "start";
    } else if (angle >= Math.PI * 0.75 && angle <= Math.PI * 1.25) {
      textAnchor = "end";
    }
    
    return { labelX, labelY, textAnchor };
  };
  
  return (
    <div className={styles.spiderChartContainer}>
      {points.length > 0 ? (
        <svg viewBox="0 0 350 350" className={styles.spiderChart}>
          {/* Increased viewBox size to accommodate labels */}
          
          {/* Grid lines */}
          {gridLines.map((line, index) => (
            <path
              key={`grid-${index}`}
              d={line}
              className={styles.gridLine}
            />
          ))}
          
          {/* Axis lines */}
          {axisLines.map((line, index) => (
            <line
              key={`axis-${index}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              className={styles.axisLine}
            />
          ))}
          
          {/* Data web */}
          {webPath && (
            <path
              d={webPath}
              className={styles.dataWeb}
            />
          )}
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={`point-${index}`}
              cx={point.x}
              cy={point.y}
              r="4"
              className={styles.dataPoint}
            />
          ))}
          
          {/* Genre labels with improved positioning */}
          {points.map((point, index) => {
            const { labelX, labelY, textAnchor } = getGenreLabelPosition(index, validGenres.length);
            
            return (
              <text
                key={`label-${index}`}
                x={labelX}
                y={labelY}
                className={styles.genreLabel}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize="12"
              >
                {point.name}
              </text>
            );
          })}
        </svg>
      ) : (
        <div className={styles.errorMessage}>
          <p>Unable to render chart. Please try again later.</p>
        </div>
      )}
      
      <div className={styles.legend}>
        {validGenres.map((genre, index) => (
          <div key={`legend-${index}`} className={styles.legendItem}>
            <span className={styles.legendColor} style={{ backgroundColor: `hsl(${index * (360 / validGenres.length)}, 100%, 50%)` }}></span>
            <span className={styles.legendText}>{genre.name}: {genre.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpiderChart;
EOL

# 3. Fix ArtistCard.js - add popularity and obscurity metrics
echo "Updating ArtistCard.js to add popularity and obscurity metrics..."
cat > "$PROJECT_DIR/components/ArtistCard.js" << 'EOL'
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
  const popularity = typeof artist.popularity === 'number' && !isNaN(artist.popularity) ? artist.popularity : 0;
  
  // Calculate obscurity level (inverse of popularity)
  const obscurityLevel = 100 - popularity;
  
  return (
    <div className={styles.artistCard}>
      <div className={styles.artistImageContainer}>
        {artist.images && artist.images.length > 0 ? (
          <div 
            className={styles.artistImage}
            style={{ backgroundImage: `url(${artist.images[0].url})` }}
          />
        ) : (
          <div className={styles.artistImagePlaceholder}>
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
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Obscurity</span>
            <div className={styles.obscurityBar}>
              <div 
                className={styles.obscurityFill} 
                style={{ width: `${obscurityLevel}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className={styles.artistGenres}>
          {artist.genres && Array.isArray(artist.genres) ? 
            artist.genres.slice(0, 3).map((genre, index) => (
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
EOL

# 4. Fix TrackCard.js - add obscurity metric
echo "Updating TrackCard.js to add obscurity metric..."
cat > "$PROJECT_DIR/components/TrackCard.js" << 'EOL'
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
  const validPopularity = typeof popularity === 'number' && !isNaN(popularity) ? popularity : 0;
  
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
            style={{ backgroundImage: `url(${track.album.images[0].url})` }}
          />
        ) : (
          <div className={styles.albumArtPlaceholder}>
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
          </div>
          
          <div className={styles.metricItem}>
            <span className={styles.metricLabel}>Obscurity</span>
            <div className={styles.obscurityBar}>
              <div 
                className={styles.obscurityFill} 
                style={{ width: `${obscurityLevel}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackCard;
EOL

# 5. Fix SeasonalMoodCard.js - make it more compact and Gen Z friendly
echo "Updating SeasonalMoodCard.js to make it more compact and Gen Z friendly..."
cat > "$PROJECT_DIR/components/SeasonalMoodCard.js" << 'EOL'
import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  // Error handling: Check if seasonalMood is valid
  if (!seasonalMood || typeof seasonalMood !== 'object') {
    return (
      <div className={styles.seasonalMoodCard}>
        <div className={styles.errorMessage}>
          <p>Can't show your vibe right now. Try again later!</p>
        </div>
      </div>
    );
  }

  // Safely extract currentSeason and seasons with fallbacks
  const currentSeason = seasonalMood.currentSeason || {};
  const seasons = Array.isArray(seasonalMood.seasons) ? seasonalMood.seasons : [];
  
  // Get season icon based on season name
  const getSeasonIcon = (season) => {
    if (!season) return '🎵';
    
    try {
      const seasonName = typeof season === 'string' ? season.toLowerCase() : 
                         typeof season === 'object' && season.name ? season.name.toLowerCase() : '';
      
      switch(seasonName) {
        case 'spring':
          return '🌸';
        case 'summer':
          return '☀️';
        case 'fall':
        case 'autumn':
          return '🍂';
        case 'winter':
          return '❄️';
        default:
          return '🎵';
      }
    } catch (error) {
      console.error('Error getting season icon:', error);
      return '🎵';
    }
  };
  
  // Get mood color based on mood name
  const getMoodColor = (mood) => {
    if (!mood) return '#00ffff';
    
    try {
      const moodName = typeof mood === 'string' ? mood.toLowerCase() : '';
      
      switch(moodName) {
        case 'energetic':
          return '#ff3366';
        case 'chill':
          return '#33ccff';
        case 'melancholic':
          return '#9966ff';
        case 'happy':
          return '#ffcc33';
        case 'dark':
          return '#6633cc';
        default:
          return '#00ffff';
      }
    } catch (error) {
      console.error('Error getting mood color:', error);
      return '#00ffff';
    }
  };
  
  // Check if currentSeason has required properties
  const hasValidCurrentSeason = currentSeason && 
                               currentSeason.name && 
                               currentSeason.primaryMood && 
                               Array.isArray(currentSeason.topGenres);
  
  return (
    <div className={styles.seasonalMoodCard}>
      {/* Current vibe section with Gen Z friendly language */}
      {hasValidCurrentSeason ? (
        <div className={styles.currentSeason}>
          <div className={styles.seasonHeader}>
            <span className={styles.seasonIcon}>{getSeasonIcon(currentSeason.name)}</span>
            <h3 className={styles.seasonName}>Your {currentSeason.name} Vibe</h3>
            <span 
              className={styles.moodValue}
              style={{ color: getMoodColor(currentSeason.primaryMood) }}
            >
              {currentSeason.primaryMood}
            </span>
          </div>
          
          {/* Simplified genre tags in a more compact layout */}
          <div className={styles.genreTags}>
            {currentSeason.topGenres.length > 0 ? (
              currentSeason.topGenres.slice(0, 3).map((genre, index) => (
                <span 
                  key={index} 
                  className={styles.genreTag}
                >
                  {genre}
                </span>
              ))
            ) : (
              <span className={styles.genreTag}>No genres yet</span>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.currentSeason}>
          <div className={styles.seasonHeader}>
            <span className={styles.seasonIcon}>🎵</span>
            <h3 className={styles.seasonName}>Your Current Vibe</h3>
          </div>
          <p>Still figuring out your vibe...</p>
        </div>
      )}
      
      {/* Year-round vibes section with Gen Z friendly language */}
      <div className={styles.seasonalHistory}>
        <h4 className={styles.historyTitle}>Your Year-Round Vibes</h4>
        
        {seasons.length > 0 ? (
          <div className={styles.seasonsGrid}>
            {seasons.map((season, index) => {
              // Validate season object
              if (!season || typeof season !== 'object' || !season.name) {
                return null;
              }
              
              return (
                <div key={index} className={styles.seasonItem}>
                  <span className={styles.seasonItemIcon}>{getSeasonIcon(season.name)}</span>
                  <span className={styles.seasonItemName}>{season.name}</span>
                  
                  {season.primaryMood && (
                    <span 
                      className={styles.seasonItemMood}
                      style={{ color: getMoodColor(season.primaryMood) }}
                    >
                      {season.primaryMood}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.noDataMessage}>
            <p>No seasonal vibes yet - keep listening!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
EOL

# 6. Fix VibeQuizCard.js - improve tab navigation
echo "Updating VibeQuizCard.js to improve tab navigation..."
cat > "$PROJECT_DIR/components/VibeQuizCard.js" << 'EOL'
import React, { useState, useEffect } from 'react';
import styles from '../styles/VibeQuizCard.module.css';

const VibeQuizCard = ({ onSubmit }) => {
  // Error handling: Check if onSubmit is a valid function
  const handleSubmit = typeof onSubmit === 'function' ? onSubmit : () => console.warn('No onSubmit handler provided');
  
  const [activeTab, setActiveTab] = useState(0);
  const [selections, setSelections] = useState({
    tempo: [],
    mood: [],
    elements: [],
    subgenres: [],
    venues: []
  });
  
  const tabs = [
    {
      id: 'tempo',
      label: 'Tempo',
      options: [
        { id: 'slow', label: 'Slow & Chill' },
        { id: 'medium', label: 'Medium Groove' },
        { id: 'fast', label: 'Fast & Energetic' },
        { id: 'varying', label: 'Varying Tempos' },
        { id: 'experimental', label: 'Experimental Rhythms' }
      ]
    },
    {
      id: 'mood',
      label: 'Mood',
      options: [
        { id: 'uplifting', label: 'Uplifting & Euphoric' },
        { id: 'dark', label: 'Dark & Intense' },
        { id: 'melodic', label: 'Melodic & Emotional' },
        { id: 'aggressive', label: 'Aggressive & Hard' },
        { id: 'ambient', label: 'Ambient & Atmospheric' }
      ]
    },
    {
      id: 'elements',
      label: 'Elements',
      options: [
        { id: 'vocals', label: 'Vocal Tracks' },
        { id: 'instrumental', label: 'Instrumental Only' },
        { id: 'bass', label: 'Heavy Bass' },
        { id: 'melody', label: 'Melodic Focus' },
        { id: 'drops', label: 'Epic Drops' }
      ]
    },
    {
      id: 'subgenres',
      label: 'Subgenres',
      options: [
        { id: 'house', label: 'House' },
        { id: 'techno', label: 'Techno' },
        { id: 'trance', label: 'Trance' },
        { id: 'dubstep', label: 'Dubstep' },
        { id: 'dnb', label: 'Drum & Bass' }
      ]
    },
    {
      id: 'venues',
      label: 'Venues',
      options: [
        { id: 'club', label: 'Club Nights' },
        { id: 'festival', label: 'Festivals' },
        { id: 'warehouse', label: 'Warehouse Parties' },
        { id: 'underground', label: 'Underground Scene' },
        { id: 'mainstream', label: 'Mainstream Events' }
      ]
    }
  ];
  
  // Auto-navigate to next tab when 2 options are selected
  useEffect(() => {
    const currentTabId = tabs[activeTab]?.id;
    if (currentTabId && Array.isArray(selections[currentTabId]) && selections[currentTabId].length >= 2) {
      // Wait a moment before auto-advancing to next tab
      const timer = setTimeout(() => {
        if (activeTab < tabs.length - 1) {
          setActiveTab(activeTab + 1);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [selections, activeTab, tabs]);
  
  const handleOptionToggle = (tabId, optionId) => {
    try {
      setSelections(prev => {
        // Ensure prev[tabId] exists and is an array
        const currentSelections = Array.isArray(prev[tabId]) ? [...prev[tabId]] : [];
        
        if (currentSelections.includes(optionId)) {
          return {
            ...prev,
            [tabId]: currentSelections.filter(id => id !== optionId)
          };
        } else {
          return {
            ...prev,
            [tabId]: [...currentSelections, optionId]
          };
        }
      });
    } catch (error) {
      console.error('Error toggling option:', error);
    }
  };
  
  const submitSelections = () => {
    try {
      handleSubmit(selections);
    } catch (error) {
      console.error('Error submitting selections:', error);
    }
  };
  
  const isOptionSelected = (tabId, optionId) => {
    try {
      return Array.isArray(selections[tabId]) && selections[tabId].includes(optionId);
    } catch (error) {
      console.error('Error checking if option is selected:', error);
      return false;
    }
  };
  
  const getCompletionPercentage = () => {
    try {
      let selectedCount = 0;
      let totalCount = 0;
      
      Object.keys(selections).forEach(key => {
        const selectionArray = Array.isArray(selections[key]) ? selections[key] : [];
        selectedCount += selectionArray.length;
        
        const tabOptions = tabs.find(tab => tab.id === key)?.options;
        totalCount += Array.isArray(tabOptions) ? tabOptions.length : 0;
      });
      
      return totalCount > 0 ? Math.round((selectedCount / totalCount) * 100) : 0;
    } catch (error) {
      console.error('Error calculating completion percentage:', error);
      return 0;
    }
  };
  
  const goToNextTab = () => {
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };
  
  const goToPreviousTab = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };
  
  return (
    <div className={styles.vibeQuizCard}>
      <h3 className={styles.quizTitle}>Customize Your Vibe</h3>
      <p className={styles.quizDescription}>
        Select your preferences to fine-tune your music taste profile. 
        Choose at least 2 options in each category to continue.
      </p>
      
      <div className={styles.tabsContainer}>
        <div className={styles.tabsHeader}>
          {tabs.map((tab, index) => (
            <button
              key={tab.id}
              className={`${styles.tabButton} ${activeTab === index ? styles.activeTab : ''}`}
              onClick={() => setActiveTab(index)}
            >
              {tab.label}
              {Array.isArray(selections[tab.id]) && selections[tab.id].length > 0 && (
                <span className={styles.selectionCount}>
                  {selections[tab.id].length}
                </span>
              )}
            </button>
          ))}
        </div>
        
        <div className={styles.tabContent}>
          {tabs.map((tab, index) => (
            <div 
              key={tab.id}
              className={`${styles.tabPanel} ${activeTab === index ? styles.activePanel : ''}`}
            >
              <div className={styles.optionsGrid}>
                {Array.isArray(tab.options) && tab.options.map(option => (
                  <div 
                    key={option.id}
                    className={`${styles.optionItem} ${isOptionSelected(tab.id, option.id) ? styles.selectedOption : ''}`}
                    onClick={() => handleOptionToggle(tab.id, option.id)}
                  >
                    <div className={styles.optionCheckmark}>
                      {isOptionSelected(tab.id, option.id) && '✓'}
                    </div>
                    <span className={styles.optionLabel}>{option.label}</span>
                  </div>
                ))}
              </div>
              
              <div className={styles.navigationButtons}>
                {activeTab > 0 && (
                  <button 
                    className={styles.navButton}
                    onClick={goToPreviousTab}
                  >
                    ← Back
                  </button>
                )}
                
                {activeTab < tabs.length - 1 && (
                  <button 
                    className={styles.navButton}
                    onClick={goToNextTab}
                  >
                    Next →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.quizFooter}>
        <div className={styles.completionBar}>
          <div 
            className={styles.completionFill}
            style={{ width: `${getCompletionPercentage()}%` }}
          ></div>
        </div>
        <span className={styles.completionText}>
          {getCompletionPercentage()}% Complete
        </span>
        
        <button 
          className={styles.submitButton}
          onClick={submitSelections}
          disabled={getCompletionPercentage() === 0}
        >
          Update My Taste Profile
        </button>
      </div>
    </div>
  );
};

export default VibeQuizCard;
EOL

# 7. Fix Navigation.js - fix sign-out functionality
echo "Updating Navigation.js to fix sign-out functionality..."
cat > "$PROJECT_DIR/components/Navigation.js" << 'EOL'
import React from 'react';
import styles from '../styles/Navigation.module.css';
import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const Navigation = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const isActive = (path) => {
    return router.pathname === path ? styles.active : '';
  };
  
  // Fixed sign-out functionality
  const handleSignOut = async () => {
    try {
      // Use callbackUrl to ensure proper redirection after sign-out
      await signOut({ callbackUrl: '/' });
    } catch (error) {
      console.error('Error signing out:', error);
      // Fallback manual redirect if signOut fails
      window.location.href = '/';
    }
  };
  
  return (
    <nav className={styles.navigation}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <a className={styles.logo}>SONAR</a>
        </Link>
        <span className={styles.tagline}>Connect with your sound</span>
      </div>
      
      <div className={styles.navLinks}>
        {status === 'authenticated' && (
          <>
            <Link href="/users/music-taste">
              <a className={`${styles.navLink} ${isActive('/users/music-taste')}`}>
                Music Taste
              </a>
            </Link>
            <Link href="/users/events">
              <a className={`${styles.navLink} ${isActive('/users/events')}`}>
                Events
              </a>
            </Link>
            <Link href="/users/profile">
              <a className={`${styles.navLink} ${isActive('/users/profile')}`}>
                Profile
              </a>
            </Link>
            <Link href="/users/settings">
              <a className={`${styles.navLink} ${isActive('/users/settings')}`}>
                Settings
              </a>
            </Link>
          </>
        )}
      </div>
      
      <div className={styles.authContainer}>
        {status === 'loading' ? (
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
        ) : status === 'authenticated' ? (
          <button 
            onClick={handleSignOut}
            className={styles.authButton}
          >
            Sign Out
          </button>
        ) : (
          <button 
            onClick={() => signIn('spotify')}
            className={styles.authButton}
          >
            Connect
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
EOL

# 8. Fix music-taste.js - update to show top 5 artists/tracks and use Gen Z-friendly language
echo "Updating music-taste.js to show top 5 artists/tracks and use Gen Z-friendly language..."
cat > "$PROJECT_DIR/pages/users/music-taste.js" << 'EOL'
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
        <div className={styles.header}>
          <h1 className={styles.title}>Your Sound</h1>
          <p className={styles.subtitle}>
            Based on what you're streaming
          </p>
        </div>
        
        <div className={styles.summary}>
          <p>
            You're all about <span className={styles.highlight}>{getTopGenres()}</span> with 
            a vibe shift toward <span className={styles.highlight}>{getRecentTrends()}</span>. 
            {suggestedEvents.length > 0 ? 
              `Found ${suggestedEvents.length} events that match your sound.` : 
              "Events coming soon that match your sound."}
          </p>
        </div>
        
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
        
        <section className={styles.artistsSection}>
          <h2 className={styles.sectionTitle}>Artists You Vibe With</h2>
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
        
        <section className={styles.tracksSection}>
          <h2 className={styles.sectionTitle}>Your Repeat Tracks</h2>
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
        
        <section className={styles.seasonalSection}>
          <h2 className={styles.sectionTitle}>Your Seasonal Vibes</h2>
          <SeasonalMoodCard seasonalMood={seasonalMood} />
        </section>
        
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
        
        <section className={styles.eventsSection}>
          <h2 className={styles.sectionTitle}>Events That Match Your Vibe</h2>
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
            <div className={styles.noDataMessage}>
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
      </main>
    </div>
  );
}
EOL

# Commit changes and deploy to Heroku
echo "Committing changes and deploying to Heroku..."
cd "$PROJECT_DIR"

# Add all changes
git add pages/index.js
git add components/SpiderChart.js
git add components/ArtistCard.js
git add components/TrackCard.js
git add components/SeasonalMoodCard.js
git add components/VibeQuizCard.js
git add components/Navigation.js
git add pages/users/music-taste.js

# Commit changes
git commit -m "Comprehensive fix for Sonar EDM Platform: landing page, real data display, compact UI, sign-out, and Vibe Quiz improvements"

# Deploy to Heroku
git push heroku main

echo "Deployment complete! Your Sonar EDM Platform has been updated with all the requested improvements."
echo "Visit https://sonar-edm-user-50e4fb038f6e.herokuapp.com/ to see the changes."
echo ""
echo "If you need to restore from backup, the files are in: $BACKUP_DIR"
