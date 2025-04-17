#!/bin/bash

# Sonar EDM Platform - Final Design-Focused Implementation
# This script addresses all remaining issues with the Sonar EDM Platform:
# 1. Fixes layout problems and overlapping elements
# 2. Restores the previous darker color theme
# 3. Reorganizes content to focus on valuable user data
# 4. Fixes sign-out functionality
# 5. Improves vibe quiz button and completion percentage
# 6. Ensures all seasonal data is properly displayed

# Set the project directory
PROJECT_DIR="/c/sonar/users/sonar-edm-user"

# Create backup directory
BACKUP_DIR="$PROJECT_DIR/backup-$(date +%Y%m%d%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "Created backup directory: $BACKUP_DIR"

# Backup existing files
echo "Backing up existing files..."
[ -f "$PROJECT_DIR/components/Navigation.js" ] && cp "$PROJECT_DIR/components/Navigation.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/SpiderChart.js" ] && cp "$PROJECT_DIR/components/SpiderChart.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/ArtistCard.js" ] && cp "$PROJECT_DIR/components/ArtistCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/TrackCard.js" ] && cp "$PROJECT_DIR/components/TrackCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/SeasonalMoodCard.js" ] && cp "$PROJECT_DIR/components/SeasonalMoodCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/components/VibeQuizCard.js" ] && cp "$PROJECT_DIR/components/VibeQuizCard.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/pages/users/music-taste.js" ] && cp "$PROJECT_DIR/pages/users/music-taste.js" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/styles/MusicTaste.module.css" ] && cp "$PROJECT_DIR/styles/MusicTaste.module.css" "$BACKUP_DIR/"
[ -f "$PROJECT_DIR/styles/Navigation.module.css" ] && cp "$PROJECT_DIR/styles/Navigation.module.css" "$BACKUP_DIR/"

# Create directories if they don't exist
mkdir -p "$PROJECT_DIR/components"
mkdir -p "$PROJECT_DIR/pages/users"
mkdir -p "$PROJECT_DIR/styles"

# 1. Fix Navigation.js with working sign-out functionality
echo "Updating Navigation.js with working sign-out functionality..."
cat > "$PROJECT_DIR/components/Navigation.js" << 'EOL'
import React, { useState, useRef, useEffect } from 'react';
import styles from '../styles/Navigation.module.css';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/router';

const Navigation = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  const isActive = (path) => {
    return router.pathname === path ? styles.active : '';
  };
  
  // Fixed sign-out functionality with direct window.location approach
  const handleSignOut = async (e) => {
    e.preventDefault();
    try {
      // First try the NextAuth signOut
      await signOut({ redirect: false });
      
      // Then force a redirect regardless of NextAuth's success
      window.location.href = '/';
    } catch (error) {
      console.error('Error during sign out:', error);
      // Fallback: direct redirect
      window.location.href = '/';
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
          <div className={styles.profileDropdown} ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={styles.profileButton}
            >
              {session.user?.image ? (
                <img 
                  src={session.user.image} 
                  alt={session.user.name || 'User'} 
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profileInitial}>
                  {session.user?.name ? session.user.name.charAt(0) : 'U'}
                </div>
              )}
              <span className={styles.profileName}>
                {session.user?.name ? session.user.name.split(' ')[0] : 'User'}
              </span>
              <span className={styles.dropdownArrow}>▼</span>
            </button>
            
            {dropdownOpen && (
              <div className={styles.dropdownMenu}>
                <Link href="/users/profile">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>👤</span>
                    Profile
                  </a>
                </Link>
                <Link href="/users/settings">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>⚙️</span>
                    Settings
                  </a>
                </Link>
                <Link href="/users/account">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>🔑</span>
                    Account
                  </a>
                </Link>
                <Link href="/users/appearance">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>🎨</span>
                    Appearance
                  </a>
                </Link>
                <Link href="/users/notifications">
                  <a className={styles.dropdownItem}>
                    <span className={styles.dropdownIcon}>🔔</span>
                    Notifications
                  </a>
                </Link>
                <div className={styles.dropdownDivider}></div>
                <a 
                  href="#"
                  onClick={handleSignOut}
                  className={styles.dropdownItem}
                >
                  <span className={styles.dropdownIcon}>🚪</span>
                  Sign Out
                </a>
              </div>
            )}
          </div>
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

# 2. Update SpiderChart.js to fix layout and prevent overlapping
echo "Updating SpiderChart.js to fix layout and prevent overlapping..."
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
      const radius = 100;
      
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
      const radius = 100;
      
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
      const radius = 100;
      
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
    gridLines = createGridLines(3);
    axisLines = createAxisLines();
  } catch (error) {
    console.error('Error in SpiderChart calculations:', error);
  }
  
  // Function to position genre labels to prevent truncation
  const getGenreLabelPosition = (index, totalGenres) => {
    const angle = (Math.PI * 2 * index) / totalGenres;
    // Increased label radius to provide more space for text
    const labelRadius = 140;
    const labelX = 150 + labelRadius * Math.cos(angle);
    const labelY = 150 + labelRadius * Math.sin(angle);
    
    // Determine text anchor based on position in the circle
    let textAnchor = "middle";
    if (angle < Math.PI * 0.25 || angle > Math.PI * 1.75) {
      textAnchor = "start";
    } else if (angle >= Math.PI * 0.75 && angle <= Math.PI * 1.25) {
      textAnchor = "end";
    }
    
    return { labelX, labelY, textAnchor };
  };
  
  // Format genre names to prevent truncation
  const formatGenreName = (name) => {
    if (!name) return '';
    
    // If name is already short, return as is
    if (name.length <= 12) return name;
    
    // Common abbreviations for EDM genres
    const abbreviations = {
      'Progressive': 'Prog',
      'Electronic': 'Elec',
      'Melodic': 'Melo',
      'Techno': 'Tech',
      'House': 'House',
      'Trance': 'Trance',
      'Dubstep': 'Dub',
      'Drum and Bass': 'DnB',
      'Drum & Bass': 'DnB',
      'Future Bass': 'Fut Bass',
      'Tropical': 'Trop',
      'Hardstyle': 'Hard',
      'Underground': 'Undgr'
    };
    
    // Check if we can use a common abbreviation
    for (const [full, abbr] of Object.entries(abbreviations)) {
      if (name.includes(full)) {
        return name.replace(full, abbr);
      }
    }
    
    // If no common abbreviation, truncate with ellipsis
    return name.substring(0, 10) + '...';
  };
  
  return (
    <div className={styles.spiderChartContainer}>
      {points.length > 0 ? (
        <svg viewBox="0 0 300 300" className={styles.spiderChart}>
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
              r="3"
              className={styles.dataPoint}
            />
          ))}
          
          {/* Genre labels with improved positioning */}
          {points.map((point, index) => {
            const { labelX, labelY, textAnchor } = getGenreLabelPosition(index, validGenres.length);
            const formattedName = formatGenreName(point.name);
            
            return (
              <text
                key={`label-${index}`}
                x={labelX}
                y={labelY}
                className={styles.genreLabel}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                fontSize="10"
              >
                {formattedName}
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
            <span className={styles.legendColor} style={{ backgroundColor: `hsl(${index * (360 / validGenres.length)}, 70%, 40%)` }}></span>
            <span className={styles.legendText}>{genre.name}: {genre.score}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SpiderChart;
EOL

# 3. Update ArtistCard.js to fix layout and improve design
echo "Updating ArtistCard.js to fix layout and improve design..."
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
              width: '70px',
              height: '70px'
            }}
          />
        ) : (
          <div 
            className={styles.artistImagePlaceholder}
            style={{ 
              width: '70px',
              height: '70px'
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
EOL

# 4. Update TrackCard.js to fix layout and improve design
echo "Updating TrackCard.js to fix layout and improve design..."
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
              width: '70px',
              height: '70px'
            }}
          />
        ) : (
          <div 
            className={styles.albumArtPlaceholder}
            style={{ 
              width: '70px',
              height: '70px'
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

# 5. Update SeasonalMoodCard.js to show all seasons
echo "Updating SeasonalMoodCard.js to show all seasons..."
cat > "$PROJECT_DIR/components/SeasonalMoodCard.js" << 'EOL'
import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';

const SeasonalMoodCard = ({ seasonalMood }) => {
  // Error handling: Check if seasonalMood is valid
  if (!seasonalMood || typeof seasonalMood !== 'object') {
    return (
      <div className={styles.seasonalMoodCard}>
        <div className={styles.errorMessage}>
          <p>Can't show your seasonal vibes right now. Try again later!</p>
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
    if (!mood) return 'rgba(0, 255, 255, 0.7)';
    
    try {
      const moodName = typeof mood === 'string' ? mood.toLowerCase() : '';
      
      switch(moodName) {
        case 'energetic':
          return 'rgba(255, 51, 102, 0.7)';
        case 'chill':
          return 'rgba(51, 204, 255, 0.7)';
        case 'melancholic':
          return 'rgba(153, 102, 255, 0.7)';
        case 'happy':
          return 'rgba(255, 204, 51, 0.7)';
        case 'dark':
          return 'rgba(102, 51, 204, 0.7)';
        case 'uplifting':
          return 'rgba(51, 255, 153, 0.7)';
        default:
          return 'rgba(0, 255, 255, 0.7)';
      }
    } catch (error) {
      console.error('Error getting mood color:', error);
      return 'rgba(0, 255, 255, 0.7)';
    }
  };
  
  // Create a complete seasons array with all four seasons
  const getAllSeasons = () => {
    const allSeasonNames = ['Spring', 'Summer', 'Fall', 'Winter'];
    const existingSeasons = seasons.reduce((acc, season) => {
      if (season && season.name) {
        acc[season.name.toLowerCase()] = season;
      }
      return acc;
    }, {});
    
    return allSeasonNames.map(name => {
      const lowerName = name.toLowerCase();
      if (existingSeasons[lowerName]) {
        return existingSeasons[lowerName];
      } else {
        return {
          name: name,
          primaryMood: 'Coming soon',
          topGenres: []
        };
      }
    });
  };
  
  const allSeasons = getAllSeasons();
  
  // Check if currentSeason has required properties
  const hasValidCurrentSeason = currentSeason && 
                               currentSeason.name && 
                               currentSeason.primaryMood && 
                               Array.isArray(currentSeason.topGenres);
  
  return (
    <div className={styles.seasonalMoodCard}>
      <div className={styles.seasonsGrid}>
        {allSeasons.map((season, index) => (
          <div key={index} className={`${styles.seasonCard} ${season.name === currentSeason.name ? styles.currentSeason : ''}`}>
            <div className={styles.seasonHeader}>
              <span className={styles.seasonIcon}>{getSeasonIcon(season.name)}</span>
              <h3 className={styles.seasonName}>{season.name}</h3>
            </div>
            
            <div className={styles.seasonContent}>
              <div 
                className={styles.moodBadge}
                style={{ backgroundColor: getMoodColor(season.primaryMood) }}
              >
                {season.primaryMood}
              </div>
              
              {Array.isArray(season.topGenres) && season.topGenres.length > 0 ? (
                <div className={styles.genreTags}>
                  {season.topGenres.slice(0, 2).map((genre, idx) => (
                    <span key={idx} className={styles.genreTag}>{genre}</span>
                  ))}
                </div>
              ) : (
                <div className={styles.noGenres}>
                  {season.primaryMood === 'Coming soon' ? 'Keep listening!' : 'No genres yet'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <div className={styles.yearRoundSection}>
        <h4 className={styles.yearRoundTitle}>Your Year-Round Vibes</h4>
        {hasValidCurrentSeason ? (
          <p className={styles.yearRoundDescription}>
            Your sound evolves with the seasons. We track how your taste changes throughout the year.
          </p>
        ) : (
          <p className={styles.yearRoundDescription}>
            Keep streaming! We'll track how your taste changes with the seasons.
          </p>
        )}
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
EOL

# 6. Update VibeQuizCard.js to improve button size and completion percentage
echo "Updating VibeQuizCard.js to improve button size and completion percentage..."
cat > "$PROJECT_DIR/components/VibeQuizCard.js" << 'EOL'
import React, { useState } from 'react';
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
  
  // Improved completion percentage calculation
  // Now calculates based on having at least one selection per category
  // rather than assuming all options need to be selected
  const getCompletionPercentage = () => {
    try {
      let completedCategories = 0;
      const totalCategories = Object.keys(selections).length;
      
      Object.keys(selections).forEach(key => {
        const selectionArray = Array.isArray(selections[key]) ? selections[key] : [];
        if (selectionArray.length > 0) {
          completedCategories++;
        }
      });
      
      return totalCategories > 0 ? Math.round((completedCategories / totalCategories) * 100) : 0;
    } catch (error) {
      console.error('Error calculating completion percentage:', error);
      return 0;
    }
  };
  
  // Navigation functions
  const goToNextTab = () => {
    if (activeTab < tabs.length - 1) {
      setActiveTab(activeTab + 1);
    }
  };
  
  const goToPrevTab = () => {
    if (activeTab > 0) {
      setActiveTab(activeTab - 1);
    }
  };
  
  return (
    <div className={styles.vibeQuizCard}>
      <h3 className={styles.quizTitle}>Customize Your Vibe</h3>
      <p className={styles.quizDescription}>
        Select what you're into to fine-tune your music profile. 
        Choose at least one option in each category.
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
              
              <div className={styles.tabNavigation}>
                {activeTab > 0 && (
                  <button 
                    className={styles.navButton}
                    onClick={goToPrevTab}
                  >
                    ← Previous
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

# 7. Update music-taste.js to fix layout and improve design
echo "Updating music-taste.js to fix layout and improve design..."
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
        {/* Compact header section */}
        <div className={styles.header}>
          <h1 className={styles.title}>Your Sound</h1>
          <p className={styles.subtitle}>
            Based on what you're streaming
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
            
            {/* Seasonal section */}
            <section className={styles.seasonalSection}>
              <h2 className={styles.sectionTitle}>Your Seasonal Vibes</h2>
              <SeasonalMoodCard seasonalMood={seasonalMood} />
            </section>
          </div>
          
          {/* Right column: Events and recommendations */}
          <div className={styles.rightColumn}>
            {/* Events section - prioritized */}
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
        
        {/* Tracks section */}
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
      </main>
    </div>
  );
}
EOL

# 8. Update MusicTaste.module.css to fix layout and restore previous color theme
echo "Updating MusicTaste.module.css to fix layout and restore previous color theme..."
cat > "$PROJECT_DIR/styles/MusicTaste.module.css" << 'EOL'
.container {
  min-height: 100vh;
  background-color: #0a0a14;
  color: #e0e0e0;
}

.main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

/* Header styles */
.header {
  margin-bottom: 1.5rem;
  text-align: center;
}

.title {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, #0088cc, #6600cc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  font-size: 1rem;
  color: #a0a0a0;
  margin-top: 0;
}

/* Two-column layout */
.twoColumnLayout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.leftColumn, .rightColumn {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Summary styles */
.summary {
  background-color: rgba(10, 20, 40, 0.5);
  border-radius: 10px;
  padding: 1rem;
  border: 1px solid rgba(0, 136, 204, 0.3);
}

.summary p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.5;
}

.highlight {
  color: #00ccff;
  font-weight: bold;
}

/* Section styles */
.genreSection, .artistsSection, .tracksSection, .seasonalSection, .eventsSection, .vibeQuizSection {
  background-color: rgba(10, 20, 40, 0.3);
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

.sectionTitle {
  font-size: 1.25rem;
  margin-top: 0;
  margin-bottom: 1rem;
  color: #00ccff;
  border-bottom: 1px solid rgba(0, 204, 255, 0.3);
  padding-bottom: 0.5rem;
}

/* Spider chart container */
.spiderChartContainer {
  width: 100%;
  height: 300px;
}

/* Artists grid */
.artistsGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

/* Tracks grid */
.tracksGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

/* Events grid */
.eventsGrid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

/* No data message */
.noDataMessage {
  text-align: center;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  color: #a0a0a0;
}

.noEventsMessage {
  text-align: center;
  padding: 2rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  color: #a0a0a0;
}

.refreshButton {
  background: linear-gradient(90deg, #0088cc, #6600cc);
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  color: white;
  font-weight: bold;
  margin-top: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.refreshButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 136, 204, 0.3);
}

/* View more container */
.viewMoreContainer {
  text-align: center;
  margin-top: 1rem;
}

.viewMoreButton {
  display: inline-block;
  background: linear-gradient(90deg, #0088cc, #6600cc);
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  color: white;
  text-decoration: none;
  font-weight: bold;
  transition: transform 0.2s, box-shadow 0.2s;
}

.viewMoreButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 136, 204, 0.3);
}

/* Vibe Quiz section */
.vibeQuizPrompt {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  margin-bottom: 1rem;
}

.vibeQuizPrompt p {
  margin: 0;
}

.vibeQuizButton {
  background: linear-gradient(90deg, #0088cc, #6600cc);
  border: none;
  border-radius: 20px;
  padding: 0.6rem 1.8rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  font-size: 1rem;
  transition: transform 0.2s, box-shadow 0.2s;
}

.vibeQuizButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 136, 204, 0.3);
}

/* Loading styles */
.loadingContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
}

.loadingSpinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(0, 136, 204, 0.3);
  border-radius: 50%;
  border-top-color: #00ccff;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Unauthorized styles */
.unauthorizedContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
}

.connectButton {
  background: linear-gradient(90deg, #0088cc, #6600cc);
  border: none;
  border-radius: 25px;
  padding: 0.75rem 2rem;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  margin-top: 2rem;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}

.connectButton:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 136, 204, 0.4);
}

/* Error styles */
.errorContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 70vh;
  text-align: center;
}

.errorMessage {
  color: #ff6b6b;
  margin-bottom: 2rem;
}

.retryButton {
  background: linear-gradient(90deg, #0088cc, #6600cc);
  border: none;
  border-radius: 25px;
  padding: 0.75rem 2rem;
  color: white;
  font-weight: bold;
  font-size: 1.1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.retryButton:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 12px rgba(0, 136, 204, 0.4);
}

/* Responsive styles */
@media (max-width: 768px) {
  .twoColumnLayout {
    grid-template-columns: 1fr;
  }
  
  .artistsGrid, .tracksGrid {
    grid-template-columns: 1fr;
  }
  
  .vibeQuizPrompt {
    flex-direction: column;
    gap: 1rem;
  }
}
EOL

# 9. Update Navigation.module.css to restore previous color theme
echo "Updating Navigation.module.css to restore previous color theme..."
cat > "$PROJECT_DIR/styles/Navigation.module.css" << 'EOL'
.navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: rgba(10, 10, 20, 0.8);
  backdrop-filter: blur(10px);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid rgba(0, 136, 204, 0.2);
}

.logoContainer {
  display: flex;
  flex-direction: column;
}

.logo {
  font-size: 1.5rem;
  font-weight: bold;
  color: #00ccff;
  text-decoration: none;
  letter-spacing: 2px;
}

.tagline {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.7);
}

.navLinks {
  display: flex;
  gap: 1.5rem;
}

.navLink {
  color: white;
  text-decoration: none;
  font-size: 0.9rem;
  padding: 0.5rem 0;
  position: relative;
  transition: color 0.3s;
}

.navLink:hover {
  color: #00ccff;
}

.navLink.active {
  color: #00ccff;
}

.navLink.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #0088cc, #6600cc);
}

.authContainer {
  position: relative;
}

.authButton {
  background: linear-gradient(90deg, #0088cc, #6600cc);
  border: none;
  border-radius: 20px;
  padding: 0.5rem 1.5rem;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.authButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 136, 204, 0.3);
}

.loadingDots {
  display: flex;
  gap: 4px;
}

.loadingDots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #00ccff;
  animation: pulse 1.5s infinite;
}

.loadingDots span:nth-child(2) {
  animation-delay: 0.2s;
}

.loadingDots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%, 100% {
    opacity: 0.5;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

/* Profile dropdown styles */
.profileDropdown {
  position: relative;
}

.profileButton {
  display: flex;
  align-items: center;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 5px;
  border-radius: 20px;
  transition: background-color 0.2s;
}

.profileButton:hover {
  background-color: rgba(0, 136, 204, 0.1);
}

.profileImage {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  margin-right: 8px;
  border: 2px solid #00ccff;
}

.profileInitial {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(45deg, #0088cc, #6600cc);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-right: 8px;
}

.profileName {
  margin-right: 5px;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdownArrow {
  font-size: 10px;
  transition: transform 0.2s;
}

.profileButton:hover .dropdownArrow {
  transform: translateY(2px);
}

.dropdownMenu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background-color: #0a0a14;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  z-index: 10;
  margin-top: 8px;
  border: 1px solid rgba(0, 136, 204, 0.2);
}

.dropdownItem {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  color: white;
  text-decoration: none;
  transition: background-color 0.2s;
  font-size: 14px;
}

.dropdownItem:hover {
  background-color: rgba(0, 136, 204, 0.1);
}

button.dropdownItem {
  width: 100%;
  text-align: left;
  background: none;
  border: none;
  cursor: pointer;
}

.dropdownIcon {
  margin-right: 10px;
  font-size: 16px;
}

.dropdownDivider {
  height: 1px;
  background-color: rgba(0, 136, 204, 0.2);
  margin: 5px 0;
}

@media (max-width: 768px) {
  .navigation {
    padding: 1rem;
  }
  
  .navLinks {
    gap: 1rem;
  }
  
  .profileName {
    display: none;
  }
}
EOL

# Commit changes and deploy to Heroku
echo "Committing changes and deploying to Heroku..."
cd "$PROJECT_DIR"

# Add all changes
git add components/Navigation.js
git add components/SpiderChart.js
git add components/ArtistCard.js
git add components/TrackCard.js
git add components/SeasonalMoodCard.js
git add components/VibeQuizCard.js
git add pages/users/music-taste.js
git add styles/MusicTaste.module.css
git add styles/Navigation.module.css

# Commit changes
git commit -m "Final design-focused implementation: Fixed layout, restored color theme, improved space usage, fixed sign-out"

# Deploy to Heroku
git push heroku main

echo "Deployment complete! Your Sonar EDM Platform has been updated with all the requested improvements."
echo "Visit https://sonar-edm-user-50e4fb038f6e.herokuapp.com/ to see the changes."
echo ""
echo "Key improvements:"
echo "1. Fixed layout problems and overlapping elements"
echo "2. Restored the previous darker color theme"
echo "3. Reorganized content to focus on valuable user data"
echo "4. Fixed sign-out functionality"
echo "5. Improved vibe quiz button and completion percentage"
echo "6. Ensured all seasonal data is properly displayed"
echo ""
echo "If you need to restore from backup, the files are in: $BACKUP_DIR"
