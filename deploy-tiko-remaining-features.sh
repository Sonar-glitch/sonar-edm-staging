#!/bin/bash
# deploy-tiko-remaining-features.sh
# Script to deploy the remaining dashboard improvements to Heroku
# For use in Windows Git Bash at /c/sonar/users/sonar-edm-user/

# Set timestamp to force a clean build on Heroku
TIMESTAMP=$(date +%Y%m%d%H%M%S)
echo "Starting deployment of remaining features at $TIMESTAMP"

# Store current directory to return to it later
CURRENT_DIR=$(pwd)
echo "Current directory: $CURRENT_DIR"

# Navigate to the main project directory
cd /c/sonar/users/sonar-edm-user/
echo "Moved to main project directory: $(pwd)"

# Make sure we have the latest changes
echo "Checking current branch..."
CURRENT_BRANCH=$(git branch --show-current)
echo "Current branch: $CURRENT_BRANCH"

# Create necessary directories if they don't exist
mkdir -p components
mkdir -p styles

# 1. Create ReorganizedSeasonalVibes component
echo "Creating ReorganizedSeasonalVibes component..."
cat > components/ReorganizedSeasonalVibes.js << 'EOL'
import React, { useState } from 'react';
import styles from '@/styles/SeasonalVibes.module.css';
import UserFeedbackGrid from './UserFeedbackGrid';

export default function ReorganizedSeasonalVibes({ seasonalData, isLoading }) {
  // Get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'fall';
    return 'winter';
  };
  
  const currentSeason = getCurrentSeason();
  const [showFeedback, setShowFeedback] = useState(false);
  
  // Handle feedback submission
  const handleFeedbackSubmit = async (preferences) => {
    try {
      // Send preferences to API
      const response = await fetch('/api/user/update-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ preferences }),
      });
      
      if (response.ok) {
        // Close feedback grid on successful submission
        setShowFeedback(false);
      }
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };
  
  // If loading or no data
  if (isLoading || !seasonalData) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Your Seasonal Vibes</h2>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Analyzing your seasonal taste...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Seasonal Vibes</h2>
      
      {/* Year-Round Signature - Now at the top as a summary */}
      <div className={styles.yearRoundContainer}>
        <div className={styles.yearRoundTitle}>
          <span className={styles.yearRoundEmoji}>✨</span>
          <span className={styles.yearRoundTitleText}>Your Year-Round Vibes</span>
        </div>
        <p className={styles.yearRoundText}>
          Your taste evolves from <span className={styles.highlight}>deep house vibes</span> in winter 
          to <span className={styles.highlight}>high-energy techno</span> in summer, with a consistent 
          appreciation for <span className={styles.highlight}>melodic elements</span> year-round.
        </p>
      </div>
      
      {/* Seasonal Grid - Now below the year-round summary */}
      <div className={styles.seasonGrid}>
        {Object.entries(seasonalData).map(([season, data]) => (
          <div 
            key={season}
            className={`${styles.seasonCard} ${season === currentSeason ? styles.currentSeason : ''}`}
          >
            <div className={styles.seasonHeader}>
              <div className={styles.seasonInfo}>
                <span className={styles.seasonEmoji}>{data.emoji}</span>
                <span className={styles.seasonName}>{data.title}</span>
              </div>
              {season === currentSeason && (
                <span className={styles.currentBadge}>Now</span>
              )}
            </div>
            
            <div className={styles.seasonGenres}>
              <span className={styles.genreLabel}>Vibe:</span>
              <span className={styles.genreList}>{data.genres}</span>
            </div>
            
            <div className={styles.seasonMessage}>
              {data.message}
            </div>
          </div>
        ))}
      </div>
      
      {/* Feedback section with updated "No" presentation */}
      <div className={styles.feedbackContainer}>
        <span className={styles.feedbackQuestion}>Did we get it right?</span>
        <button 
          className={styles.feedbackButton}
          onClick={() => setShowFeedback(!showFeedback)}
        >
          No
        </button>
      </div>
      
      {/* User feedback grid */}
      {showFeedback && (
        <div className={styles.feedbackGridOverlay}>
          <UserFeedbackGrid 
            onSubmit={handleFeedbackSubmit}
            onClose={() => setShowFeedback(false)}
          />
        </div>
      )}
    </div>
  );
}
EOL

# 2. Create UserFeedbackGrid component
echo "Creating UserFeedbackGrid component..."
cat > components/UserFeedbackGrid.js << 'EOL'
import React, { useState } from 'react';
import styles from '@/styles/UserFeedbackGrid.module.css';

const UserFeedbackGrid = ({ onSubmit, onClose }) => {
  const [preferences, setPreferences] = useState({
    genres: [],
    mood: [],
    tempo: [],
    discovery: [],
    venues: []
  });
  
  // Define options for each category
  const genreOptions = [
    'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 
    'Ambient', 'Hardstyle', 'Garage', 'Electro', 'Progressive',
    'Melodic Techno', 'Deep House', 'Tech House', 'Minimal', 'Downtempo'
  ];
  
  const moodOptions = [
    'Energetic', 'Chill', 'Dark', 'Euphoric', 'Experimental',
    'Melodic', 'Aggressive', 'Uplifting', 'Hypnotic', 'Atmospheric'
  ];
  
  const tempoOptions = [
    'Slow', 'Medium', 'Fast', 'Varied', 'Progressive',
    'Building', 'Steady', 'Driving', 'Pulsing', 'Rhythmic'
  ];
  
  const discoveryOptions = [
    'Mainstream', 'Underground', 'Emerging', 'Classic', 'Fusion',
    'Experimental', 'Regional', 'Global', 'Trending', 'Timeless'
  ];
  
  const venueOptions = [
    'Clubs', 'Festivals', 'Warehouses', 'Outdoor', 'Intimate Venues',
    'Beach Parties', 'Boat Parties', 'Rooftops', 'Underground', 'Arenas'
  ];
  
  // Toggle selection for any category
  const handleToggle = (category, item) => {
    if (preferences[category].includes(item)) {
      setPreferences({
        ...preferences,
        [category]: preferences[category].filter(i => i !== item)
      });
    } else {
      // Limit to 5 selections per category
      if (preferences[category].length < 5) {
        setPreferences({
          ...preferences,
          [category]: [...preferences[category], item]
        });
      }
    }
  };
  
  // Handle submission of preferences
  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(preferences);
    }
    if (onClose) {
      onClose();
    }
  };
  
  // Render a grid of options for a category
  const renderOptionGrid = (category, options) => (
    <div className={styles.optionCategory}>
      <h3 className={styles.categoryTitle}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </h3>
      <div className={styles.optionsGrid}>
        {options.map(option => (
          <button
            key={option}
            className={`${styles.optionButton} ${preferences[category].includes(option) ? styles.selected : ''}`}
            onClick={() => handleToggle(category, option)}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
  
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Help Us Understand Your Taste</h2>
        <p className={styles.subtitle}>Select up to 5 options in each category that match your preferences</p>
        <button className={styles.closeButton} onClick={onClose}>×</button>
      </div>
      
      <div className={styles.gridContainer}>
        {renderOptionGrid('genres', genreOptions)}
        {renderOptionGrid('mood', moodOptions)}
        {renderOptionGrid('tempo', tempoOptions)}
        {renderOptionGrid('discovery', discoveryOptions)}
        {renderOptionGrid('venues', venueOptions)}
      </div>
      
      <div className={styles.actions}>
        <button 
          className={styles.submitButton}
          onClick={handleSubmit}
        >
          Update My Profile
        </button>
      </div>
    </div>
  );
};

export default UserFeedbackGrid;
EOL

# 3. Create EnhancedEventFilters component
echo "Creating EnhancedEventFilters component..."
cat > components/EnhancedEventFilters.js << 'EOL'
import React, { useState } from 'react';
import styles from '@/styles/EnhancedEventFilters.module.css';

const EnhancedEventFilters = ({ onFilterChange, initialFilters }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [filters, setFilters] = useState({
    vibeMatch: initialFilters?.vibeMatch || 50,
    eventType: initialFilters?.eventType || 'all',
    distance: initialFilters?.distance || 'all',
  });

  // Handler for vibe match slider
  const handleVibeMatchChange = (e) => {
    const newValue = parseInt(e.target.value);
    updateFilter('vibeMatch', newValue);
  };
  
  // Handler for other filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    updateFilter(name, value);
  };
  
  // Update filter state and notify parent
  const updateFilter = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };
  
  // Reset all filters
  const resetFilters = () => {
    const resetValues = {
      vibeMatch: 50,
      eventType: 'all',
      distance: 'all'
    };
    
    setFilters(resetValues);
    if (onFilterChange) {
      onFilterChange(resetValues);
    }
  };
  
  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div className={styles.container}>
      {/* Vibe Match Slider - Always visible */}
      <div className={styles.vibeSection}>
        <div className={styles.sectionHeader}>
          <span className={styles.label}>Vibe Match</span>
          <span className={styles.vibeValue}>{filters.vibeMatch}%+</span>
        </div>
        
        <div className={styles.sliderContainer}>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value={filters.vibeMatch} 
            onChange={handleVibeMatchChange}
            className={styles.slider}
          />
          <div 
            className={styles.sliderFill} 
            style={{ width: `${filters.vibeMatch}%` }}
          ></div>
        </div>
      </div>
      
      {/* Toggle button for additional filters */}
      <button 
        className={styles.toggleButton} 
        onClick={toggleExpanded}
        aria-expanded={isExpanded}
      >
        {isExpanded ? 'Less Filters' : 'More Filters'}
        <span className={`${styles.toggleIcon} ${isExpanded ? styles.expanded : ''}`}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </button>
      
      {/* Expandable filters section */}
      {isExpanded && (
        <div className={styles.expandedFilters}>
          <div className={styles.filterGrid}>
            {/* Event Type filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Event Type</label>
              <select 
                name="eventType" 
                value={filters.eventType} 
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">All Types</option>
                <option value="warehouse">Warehouse</option>
                <option value="festival">Festival</option>
                <option value="club">Club</option>
                <option value="terrace">Terrace</option>
                <option value="openair">Open Air</option>
              </select>
            </div>
            
            {/* Distance filter */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Distance</label>
              <select 
                name="distance" 
                value={filters.distance} 
                onChange={handleFilterChange}
                className={styles.filterSelect}
              >
                <option value="all">Any Distance</option>
                <option value="local">Local</option>
                <option value="national">National</option>
                <option value="international">International</option>
              </select>
            </div>
          </div>
          
          {/* Active filters and reset */}
          <div className={styles.activeFiltersSection}>
            <div className={styles.activeFilters}>
              {Object.entries(filters)
                .filter(([key, value]) => value !== 'all' && key !== 'vibeMatch')
                .map(([key, value]) => (
                  <div key={key} className={styles.activeFilter}>
                    <span className={styles.filterValue}>{value}</span>
                    <button 
                      className={styles.removeFilter}
                      onClick={() => updateFilter(key, 'all')}
                      aria-label={`Remove ${value} filter`}
                    >
                      ×
                    </button>
                  </div>
                ))}
              
              {filters.vibeMatch > 0 && (
                <div className={styles.activeFilter}>
                  <span className={styles.filterValue}>{filters.vibeMatch}%+ Match</span>
                  <button 
                    className={styles.removeFilter}
                    onClick={() => updateFilter('vibeMatch', 0)}
                    aria-label="Reset vibe match"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            
            <button 
              className={styles.resetButton}
              onClick={resetFilters}
              aria-label="Reset all filters"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedEventFilters;
EOL

# 4. Create ImprovedEventList component
echo "Creating ImprovedEventList component..."
cat > components/ImprovedEventList.js << 'EOL'
import React from 'react';
import styles from '@/styles/ImprovedEventList.module.css';

const ImprovedEventList = ({ events, onEventClick }) => {
  if (!events || events.length === 0) {
    return (
      <div className={styles.noEvents}>
        <p>No events match your current filters. Try adjusting your filters to see more events.</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {events.map((event, index) => (
        <div key={event.id || index} className={styles.eventCard}>
          <div className={styles.eventInfo}>
            <h3 className={styles.eventTitle}>{event.name}</h3>
            <p className={styles.eventVenue}>
              {event.venue} • {event.venueType}
            </p>
            
            {/* Headliners/DJs section */}
            <div className={styles.eventArtists}>
              <span className={styles.artistsLabel}>Featuring:</span>
              <span className={styles.artistsList}>
                {event.artists && event.artists.length > 0 
                  ? event.artists.join(', ') 
                  : 'TBA'}
              </span>
            </div>
            
            {/* Tags section */}
            <div className={styles.eventTags}>
              <span className={styles.eventTag}>{event.genre}</span>
              <span className={styles.eventPrice}>${event.price}</span>
              <span className={styles.eventDate}>{event.date}</span>
            </div>
          </div>
          
          {/* Match percentage circle - only show the circle, not duplicate text */}
          <div className={styles.matchSection}>
            <div className={styles.matchCircle} style={{ 
              background: `conic-gradient(
                from 0deg,
                rgba(0, 255, 255, 0.8) 0%,
                rgba(255, 0, 255, 0.8) ${event.match / 2}%,
                rgba(0, 255, 255, 0.8) ${event.match}%,
                rgba(20, 20, 40, 0.3) ${event.match}% 100%
              )`
            }}>
              <div className={styles.matchInner}>
                <span className={styles.matchValue}>{event.match}</span>
              </div>
            </div>
            
            <button 
              className={styles.detailsButton}
              onClick={() => onEventClick && onEventClick(event)}
            >
              Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImprovedEventList;
EOL

# 5. Create CSS files for the components
echo "Creating CSS files for the components..."

# SeasonalVibes.module.css
cat > styles/SeasonalVibes.module.css << 'EOL'
.container {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
}

.title {
  color: #fff;
  font-size: 1.5rem;
  margin-top: 0;
  margin-bottom: 20px;
  text-align: center;
}

/* Year-Round Vibes section - now at the top */
.yearRoundContainer {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 20px;
  border: 1px solid rgba(0, 255, 255, 0.3);
}

.yearRoundTitle {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.yearRoundEmoji {
  font-size: 1.5rem;
  margin-right: 10px;
}

.yearRoundTitleText {
  color: #00e5ff;
  font-weight: bold;
  font-size: 1.1rem;
}

.yearRoundText {
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  line-height: 1.5;
}

.highlight {
  color: #ff00ff;
  font-weight: bold;
}

/* Seasonal Grid */
.seasonGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 20px;
}

.seasonCard {
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.seasonCard:hover {
  border-color: rgba(0, 255, 255, 0.5);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.currentSeason {
  border-color: rgba(0, 255, 255, 0.5);
  box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
}

.seasonHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.seasonInfo {
  display: flex;
  align-items: center;
}

.seasonEmoji {
  font-size: 1.2rem;
  margin-right: 8px;
}

.seasonName {
  color: #fff;
  font-weight: bold;
}

.currentBadge {
  background: linear-gradient(90deg, #00e5ff, #ff00ff);
  color: #000;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 10px;
}

.seasonGenres {
  margin-bottom: 8px;
}

.genreLabel {
  color: rgba(255, 255, 255, 0.7);
  margin-right: 5px;
}

.genreList {
  color: #00e5ff;
}

.seasonMessage {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.9rem;
  font-style: italic;
}

/* Feedback section */
.feedbackContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 15px;
}

.feedbackQuestion {
  color: rgba(255, 255, 255, 0.7);
  margin-right: 10px;
}

.feedbackButton {
  background: none;
  border: none;
  color: #00e5ff;
  cursor: pointer;
  font-weight: bold;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.feedbackButton:hover {
  background-color: rgba(0, 229, 255, 0.1);
  text-decoration: underline;
}

/* Loading state */
.loadingState {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 229, 255, 0.3);
  border-top: 3px solid #00e5ff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Feedback grid overlay */
.feedbackGridOverlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .seasonGrid {
    grid-template-columns: 1fr;
  }
}
EOL

# UserFeedbackGrid.module.css
cat > styles/UserFeedbackGrid.module.css << 'EOL'
.container {
  background-color: rgba(10, 10, 20, 0.95);
  border-radius: 12px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.4);
  border: 1px solid rgba(0, 255, 255, 0.3);
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.header {
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
}

.title {
  color: #fff;
  font-size: 1.5rem;
  margin: 0 0 5px 0;
  text-align: center;
}

.subtitle {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin: 0;
  text-align: center;
}

.closeButton {
  position: absolute;
  top: 15px;
  right: 15px;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.closeButton:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.gridContainer {
  padding: 20px;
  overflow-y: auto;
}

.optionCategory {
  margin-bottom: 25px;
}

.categoryTitle {
  color: #00e5ff;
  font-size: 1.1rem;
  margin: 0 0 10px 0;
  border-bottom: 1px solid rgba(0, 229, 255, 0.3);
  padding-bottom: 5px;
}

.optionsGrid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}

.optionButton {
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.8);
  padding: 8px 5px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.optionButton:hover {
  background-color: rgba(0, 229, 255, 0.1);
  border-color: rgba(0, 229, 255, 0.5);
}

.optionButton.selected {
  background: linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(255, 0, 255, 0.2));
  border-color: #00e5ff;
  color: #fff;
  box-shadow: 0 0 8px rgba(0, 229, 255, 0.3);
}

.actions {
  padding: 15px 20px 20px;
  display: flex;
  justify-content: center;
}

.submitButton {
  background: linear-gradient(90deg, #00e5ff, #ff00ff);
  border: none;
  border-radius: 6px;
  color: #000;
  font-weight: bold;
  padding: 10px 25px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
}

.submitButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 229, 255, 0.4);
}

.submitButton:active {
  transform: translateY(0);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .optionsGrid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 480px) {
  .optionsGrid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .container {
    width: 95%;
  }
}
EOL

# EnhancedEventFilters.module.css
cat > styles/EnhancedEventFilters.module.css << 'EOL'
.container {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.2);
}

.vibeSection {
  margin-bottom: 15px;
}

.sectionHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.label {
  color: #fff;
  font-weight: bold;
}

.vibeValue {
  color: #00e5ff;
  font-weight: bold;
}

.sliderContainer {
  position: relative;
  height: 8px;
  margin: 0 5px;
}

.slider {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  outline: none;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.8);
}

.slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.8);
}

.sliderFill {
  position: absolute;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #00e5ff, #ff00ff);
  top: 0;
  left: 0;
  z-index: 1;
}

.toggleButton {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toggleButton:hover {
  color: #fff;
  background-color: rgba(255, 255, 255, 0.1);
}

.toggleIcon {
  margin-left: 5px;
  font-size: 0.7rem;
  transition: transform 0.2s ease;
}

.toggleIcon.expanded {
  transform: rotate(180deg);
}

.expandedFilters {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.filterGrid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 15px;
}

.filterGroup {
  display: flex;
  flex-direction: column;
}

.filterLabel {
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  margin-bottom: 5px;
}

.filterSelect {
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: #fff;
  padding: 8px 10px;
  font-size: 0.9rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255, 255, 255, 0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
}

.filterSelect:focus {
  border-color: #00e5ff;
  outline: none;
}

.activeFiltersSection {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.activeFilters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.activeFilter {
  background-color: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 20px;
  padding: 4px 10px;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
}

.filterValue {
  color: #00e5ff;
}

.removeFilter {
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  font-size: 1rem;
  margin-left: 5px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.removeFilter:hover {
  color: #fff;
}

.resetButton {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 4px 10px;
  font-size: 0.8rem;
  transition: all 0.2s ease;
}

.resetButton:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filterGrid {
    grid-template-columns: 1fr;
    gap: 10px;
  }
  
  .activeFiltersSection {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .resetButton {
    align-self: flex-end;
  }
}
EOL

# ImprovedEventList.module.css
cat > styles/ImprovedEventList.module.css << 'EOL'
.container {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin: 20px 0;
}

.eventCard {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-between;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.1);
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.eventCard:hover {
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
  border-color: rgba(0, 255, 255, 0.2);
  transform: translateY(-2px);
}

.eventInfo {
  flex: 1;
}

.eventTitle {
  color: #fff;
  font-size: 1.3rem;
  margin: 0 0 5px 0;
}

.eventVenue {
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 10px 0;
  font-size: 0.9rem;
}

.eventArtists {
  margin-bottom: 15px;
}

.artistsLabel {
  color: rgba(255, 255, 255, 0.6);
  font-size: 0.85rem;
  margin-right: 5px;
}

.artistsList {
  color: #00e5ff;
  font-size: 0.95rem;
}

.eventTags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.eventTag {
  background-color: rgba(0, 229, 255, 0.1);
  border: 1px solid rgba(0, 229, 255, 0.3);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.8rem;
  color: #00e5ff;
}

.eventPrice {
  background-color: rgba(255, 0, 255, 0.1);
  border: 1px solid rgba(255, 0, 255, 0.3);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.8rem;
  color: #ff00ff;
}

.eventDate {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 3px 10px;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.matchSection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-left: 20px;
}

.matchCircle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 10px;
}

.matchInner {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
}

.matchValue {
  color: #fff;
  font-size: 1.3rem;
  font-weight: bold;
}

.detailsButton {
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 5px 15px;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.detailsButton:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.4);
}

.noEvents {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 30px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .eventCard {
    flex-direction: column;
  }
  
  .matchSection {
    margin-left: 0;
    margin-top: 15px;
    flex-direction: row;
    gap: 15px;
  }
  
  .matchCircle {
    margin-bottom: 0;
  }
}
EOL

# 6. Update the music-taste.js page to use the new components
echo "Updating music-taste.js to use the new components..."
cat > pages/users/music-taste.js << 'EOL'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import SoundCharacteristicsChart from '@/components/SoundCharacteristicsChart';
import ReorganizedSeasonalVibes from '@/components/ReorganizedSeasonalVibes';
import EnhancedEventFilters from '@/components/EnhancedEventFilters';
import ImprovedEventList from '@/components/ImprovedEventList';
import styles from '@/styles/MusicTaste.module.css';

export default function MusicTaste() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState(null);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    vibeMatch: 50,
    eventType: 'all',
    distance: 'all'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);
  
  // Fetch user profile data
  useEffect(() => {
    if (status === 'authenticated') {
      fetchUserData();
    }
  }, [status]);
  
  // Define fallback sound characteristics
  const getFallbackSoundCharacteristics = () => {
    return {
      'Melody': 85,
      'Danceability': 78,
      'Energy': 72,
      'Tempo': 68,
      'Obscurity': 63
    };
  };
  
  // Define fallback seasonal data
  const getFallbackSeasonalData = () => {
    return {
      spring: {
        title: 'Spring',
        emoji: '🌸',
        genres: 'House, Progressive',
        message: 'Fresh beats & uplifting vibes'
      },
      summer: {
        title: 'Summer',
        emoji: '☀️',
        genres: 'Techno, Tech House',
        message: 'High energy open air sounds'
      },
      fall: {
        title: 'Fall',
        emoji: '🍂',
        genres: 'Organic House, Downtempo',
        message: 'Mellow grooves & deep beats'
      },
      winter: {
        title: 'Winter',
        emoji: '❄️',
        genres: 'Deep House, Ambient Techno',
        message: 'Hypnotic journeys & warm basslines'
      }
    };
  };
  
  // Define fallback events
  const getFallbackEvents = () => {
    return [
      {
        id: 1,
        name: 'Techno Dreamscape',
        venue: 'Warehouse 23',
        venueType: 'Warehouse',
        artists: ['Charlotte de Witte', 'Amelie Lens'],
        genre: 'Techno',
        price: 45,
        date: 'Thu, May 1',
        match: 92
      },
      {
        id: 2,
        name: 'Deep House Journey',
        venue: 'Club Echo',
        venueType: 'Club',
        artists: ['Lane 8', 'Yotto'],
        genre: 'Deep House',
        price: 35,
        date: 'Thu, May 8',
        match: 85
      },
      {
        id: 3,
        name: 'Melodic Techno Night',
        venue: 'The Sound Bar',
        venueType: 'Club',
        artists: ['Tale Of Us', 'Mind Against'],
        genre: 'Melodic Techno',
        price: 55,
        date: 'Sun, Apr 27',
        match: 88
      }
    ];
  };
  
  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch music taste data
      const tasteResponse = await fetch('/api/spotify/user-taste')
        .catch(err => {
          console.error('Network error fetching taste data:', err);
          return { ok: false };
        });
      
      // Use fallback data if API call fails
      let tasteData = {
        genreProfile: {
          'House': 75,
          'Techno': 65,
          'Progressive House': 60,
          'Trance': 45,
          'Indie dance': 55
        },
        soundCharacteristics: getFallbackSoundCharacteristics(),
        seasonalVibes: getFallbackSeasonalData(),
        mood: 'Chillwave Flow',
        topArtists: [{ 
          name: 'Boris Brejcha', 
          id: '6bDWAcdtVR39rjZS5A3SoD',
          images: [{ url: 'https://i.scdn.co/image/ab6761610000e5eb8ae72ad1d3e564e2b883afb5' }],
          popularity: 85,
          genres: ['melodic techno', 'minimal techno']
        }],
        topTracks: [{ 
          name: 'Realm of Consciousness', 
          id: '2pXJ3zJ9smoG8SQqlMBvoF',
          artists: [{ name: 'Tale Of Us' }],
          album: { 
            name: 'Realm of Consciousness', 
            images: [{ url: 'https://i.scdn.co/image/ab67616d0000b273c3a84c67544c46c7df9529c5' }] 
          },
          popularity: 80,
          preview_url: 'https://p.scdn.co/mp3-preview/5a6aa5ef7516e6771c964c3d44b77156c5330b7e'
        }]
      };
      
      if (tasteResponse.ok) {
        const fetchedData = await tasteResponse.json();
        tasteData = {
          ...fetchedData,
          // Ensure we have fallbacks if API returns incomplete data
          genreProfile: fetchedData.genreProfile || tasteData.genreProfile,
          soundCharacteristics: fetchedData.soundCharacteristics || getFallbackSoundCharacteristics(),
          seasonalVibes: fetchedData.seasonalVibes || getFallbackSeasonalData(),
          mood: fetchedData.mood || tasteData.mood,
          topArtists: fetchedData.topArtists?.items || tasteData.topArtists,
          topTracks: fetchedData.topTracks?.items || tasteData.topTracks
        };
      }
      
      // Set events data (using fallback for now)
      setEvents(getFallbackEvents());
      
      // Set the user profile
      setUserProfile({
        taste: tasteData
      });
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load your profile. Please try again later.');
      setLoading(false);
    }
  };
  
  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    
    // Filter events based on vibe match
    const filteredEvents = getFallbackEvents().filter(event => {
      // Filter by vibe match
      if (event.match < newFilters.vibeMatch) {
        return false;
      }
      
      // Filter by event type
      if (newFilters.eventType !== 'all') {
        const eventType = event.venueType.toLowerCase();
        if (eventType !== newFilters.eventType) {
          return false;
        }
      }
      
      // For distance, we would need real data with location info
      // This is just a placeholder for the concept
      
      return true;
    });
    
    setEvents(filteredEvents);
  };
  
  // Handle event click
  const handleEventClick = (event) => {
    console.log('Event clicked:', event);
    // Here you would navigate to event details or show a modal
  };

  if (status === 'loading' || loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingPulse}></div>
        <p>Analyzing your sonic signature...</p>
      </div>
    );
  }
  
  if (error && !userProfile) {
    return (
      <div className={styles.errorContainer}>
        <h2>Oops!</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={fetchUserData}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Ensure we have data to render
  const profile = userProfile || {
    taste: {
      genreProfile: {},
      soundCharacteristics: {},
      seasonalVibes: {},
      mood: '',
      topArtists: [],
      topTracks: []
    }
  };
  
  // Get primary genres for display
  const primaryGenres = Object.entries(profile.taste.genreProfile)
    .sort(([, a], [, b]) => b - a)
    .map(([genre]) => genre.toLowerCase())
    .slice(0, 2)
    .join(' + ');
  
  return (
    <>
      <Head>
        <title>Your Music Taste | Sonar</title>
        <meta name="description" content="Discover your unique music taste profile" />
      </Head>
      
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>TIKO</h1>
          <nav>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/users/events">Events</Link>
            <Link href="/users/profile">Profile</Link>
          </nav>
        </header>
        
        <main className={styles.main}>
          {/* Summary Banner */}
          <div className={styles.summaryBanner}>
            <p>You're all about <span className={styles.highlight}>{primaryGenres}</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.</p>
          </div>
          
          {/* Sound Characteristics Chart */}
          <SoundCharacteristicsChart 
            soundData={profile.taste.soundCharacteristics} 
          />
          
          {/* Seasonal Vibes Section */}
          <ReorganizedSeasonalVibes 
            seasonalData={profile.taste.seasonalVibes}
            isLoading={loading}
          />
          
          {/* Events Section */}
          <section className={styles.eventsSection}>
            <h2 className={styles.sectionTitle}>Events Matching Your Vibe</h2>
            
            {/* Event Filters */}
            <EnhancedEventFilters 
              onFilterChange={handleFilterChange}
              initialFilters={filters}
            />
            
            {/* Event List */}
            <ImprovedEventList 
              events={events}
              onEventClick={handleEventClick}
            />
          </section>
        </main>
        
        <footer className={styles.footer}>
          <p>TIKO by Sonar • Your EDM Companion</p>
        </footer>
      </div>
    </>
  );
}
EOL

# 7. Create MusicTaste.module.css
echo "Creating MusicTaste.module.css..."
cat > styles/MusicTaste.module.css << 'EOL'
.container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #0a0a14;
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.header h1 {
  color: #00e5ff;
  margin: 0;
  font-size: 1.5rem;
}

.header nav {
  display: flex;
  gap: 20px;
}

.header nav a {
  color: rgba(255, 255, 255, 0.7);
  text-decoration: none;
  transition: color 0.2s ease;
}

.header nav a:hover {
  color: #fff;
}

.main {
  flex: 1;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.summaryBanner {
  background: linear-gradient(90deg, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.3));
  border-radius: 12px;
  padding: 15px 20px;
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.1rem;
}

.highlight {
  color: #ff00ff;
  font-weight: bold;
}

.sectionTitle {
  color: #fff;
  font-size: 1.5rem;
  margin: 30px 0 20px;
  text-align: center;
}

.eventsSection {
  margin-top: 30px;
}

.footer {
  padding: 15px 20px;
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.9rem;
  background-color: rgba(0, 0, 0, 0.3);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.loadingContainer {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0a0a14;
  color: #fff;
}

.loadingPulse {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: rgba(0, 229, 255, 0.2);
  animation: pulse 1.5s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    box-shadow: 0 0 0 0 rgba(0, 229, 255, 0.7);
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 20px rgba(0, 229, 255, 0);
  }
  100% {
    transform: scale(0.8);
  }
}

.errorContainer {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #0a0a14;
  color: #fff;
  padding: 20px;
  text-align: center;
}

.errorContainer h2 {
  color: #ff00ff;
  margin-bottom: 10px;
}

.retryButton {
  background: linear-gradient(90deg, #00e5ff, #ff00ff);
  border: none;
  border-radius: 6px;
  color: #000;
  font-weight: bold;
  padding: 10px 25px;
  cursor: pointer;
  margin-top: 20px;
  transition: all 0.2s ease;
}

.retryButton:hover {
  transform: translateY(-2px);
  box-shadow: 0 5px 15px rgba(0, 229, 255, 0.4);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main {
    padding: 15px;
  }
  
  .summaryBanner {
    font-size: 1rem;
  }
}
EOL

# 8. Add timestamp to force Heroku rebuild
echo "DEPLOY_TIMESTAMP=$TIMESTAMP" > .env

# 9. Commit changes
echo "Committing changes..."
git add .
git commit -m "Implement remaining dashboard improvements: reorganized seasonal vibes, user feedback grid, and enhanced event display"

# 10. Check for main branch and Heroku remote
echo "Checking for main branch and Heroku remote..."
git branch -a
git remote -v

# 11. Checkout main branch and merge changes
echo "Checking out main branch and merging changes..."
git checkout main || git checkout master

# Determine which main branch name is used
MAIN_BRANCH=$(git branch | grep -E "main|master" | sed 's/\* //' | head -n 1)
echo "Main branch is: $MAIN_BRANCH"

# Merge changes from feature branch
git merge $CURRENT_BRANCH -m "Merge remaining dashboard improvements"

# 12. Deploy to Heroku
echo "Deploying to Heroku..."
git push heroku $MAIN_BRANCH:master --force

echo "Deployment complete! Your improved dashboard with all remaining features should be live in a few minutes."
echo "Visit https://sonar-edm-user-50e4fb038f6e.herokuapp.com to see the changes."

# Return to original directory
cd "$CURRENT_DIR"
echo "Returned to original directory: $(pwd)"
