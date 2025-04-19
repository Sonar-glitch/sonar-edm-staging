#!/bin/bash
# TIKO Visualization Restoration and Performance Optimization Script
# This script restores missing visualization components and navigation features while optimizing performance

# Set colors for better readability
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== TIKO Visualization Restoration and Performance Optimization Script ===${NC}"
echo -e "${BLUE}This script restores missing visualization components and navigation features while optimizing performance${NC}\n"

# Create backup directory
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="./backups/visualization_restore_${TIMESTAMP}"
mkdir -p $BACKUP_DIR

echo -e "${GREEN}Created backup directory at ${BACKUP_DIR}${NC}"

# Backup existing files
echo -e "${YELLOW}Backing up existing files...${NC}"
cp -r ./package.json $BACKUP_DIR/ 2>/dev/null || :
cp -r ./components $BACKUP_DIR/ 2>/dev/null || :
cp -r ./pages $BACKUP_DIR/ 2>/dev/null || :
cp -r ./styles $BACKUP_DIR/ 2>/dev/null || :
echo -e "${GREEN}Backup complete${NC}"

# Update package.json with all required dependencies
echo -e "${YELLOW}Updating package.json with all required dependencies...${NC}"

# Check if package.json exists
if [ ! -f ./package.json ]; then
  echo -e "${RED}Error: package.json not found${NC}"
  exit 1
fi

# Create a new package.json with all required dependencies
cat > ./package.json << 'EOL'
{
  "name": "sonar-edm-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "heroku-postbuild": "npm run build"
  },
  "dependencies": {
    "axios": "^0.27.2",
    "chart.js": "^3.9.1",
    "critters": "^0.0.16",
    "d3": "^7.6.1",
    "mongodb": "^4.10.0",
    "next": "12.3.1",
    "next-auth": "^4.12.2",
    "next-pwa": "^5.6.0",
    "react": "18.2.0",
    "react-chartjs-2": "^4.3.1",
    "react-dom": "18.2.0",
    "react-icons": "^4.4.0",
    "react-intersection-observer": "^9.4.0",
    "tailwindcss": "^3.1.8",
    "autoprefixer": "^10.4.12",
    "postcss": "^8.4.17"
  },
  "devDependencies": {
    "eslint": "8.25.0",
    "eslint-config-next": "12.3.1"
  },
  "engines": {
    "node": "16.x"
  }
}
EOL

echo -e "${GREEN}Updated package.json with all required dependencies${NC}"

# Create SpiderChart component
echo -e "${YELLOW}Creating SpiderChart component...${NC}"

mkdir -p ./components

cat > ./components/SpiderChart.js << 'EOL'
import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from '../styles/SpiderChart.module.css';

const SpiderChart = ({ genres }) => {
  const chartRef = useRef(null);
  
  useEffect(() => {
    if (!genres || genres.length === 0 || !chartRef.current) return;
    
    // Clear previous chart
    d3.select(chartRef.current).selectAll("*").remove();
    
    // Chart dimensions
    const width = 400;
    const height = 400;
    const margin = 60;
    const radius = Math.min(width, height) / 2 - margin;
    
    // Create SVG
    const svg = d3.select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width/2}, ${height/2})`);
    
    // Scale for the radius
    const radialScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, radius]);
    
    // Angle for each genre
    const angleSlice = (Math.PI * 2) / genres.length;
    
    // Create circular grid lines
    const gridLevels = 5;
    const gridCircles = svg.selectAll(".gridCircle")
      .data(d3.range(1, gridLevels + 1).reverse())
      .enter()
      .append("circle")
      .attr("class", "gridCircle")
      .attr("r", d => radius / gridLevels * d)
      .style("fill", "none")
      .style("stroke", "rgba(255, 255, 255, 0.1)")
      .style("stroke-width", 1);
    
    // Create axis lines
    const axes = svg.selectAll(".axis")
      .data(genres)
      .enter()
      .append("g")
      .attr("class", "axis");
    
    axes.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", (d, i) => radialScale(100) * Math.cos(angleSlice * i - Math.PI/2))
      .attr("y2", (d, i) => radialScale(100) * Math.sin(angleSlice * i - Math.PI/2))
      .style("stroke", "rgba(255, 255, 255, 0.1)")
      .style("stroke-width", 1);
    
    // Add genre labels
    axes.append("text")
      .attr("class", styles.axisLabel)
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .attr("x", (d, i) => radialScale(110) * Math.cos(angleSlice * i - Math.PI/2))
      .attr("y", (d, i) => radialScale(110) * Math.sin(angleSlice * i - Math.PI/2))
      .text(d => d.name)
      .style("fill", "#00ffff")
      .style("font-size", "12px");
    
    // Create the radar chart path
    const radarLine = d3.lineRadial()
      .radius(d => radialScale(d.value))
      .angle((d, i) => i * angleSlice)
      .curve(d3.curveLinearClosed);
    
    // Draw the radar chart path
    const dataPoints = genres.map(genre => ({ value: genre.score }));
    
    svg.append("path")
      .datum(dataPoints)
      .attr("class", styles.radarArea)
      .attr("d", radarLine)
      .style("fill", "rgba(255, 0, 255, 0.2)")
      .style("stroke", "#ff00ff")
      .style("stroke-width", 2);
    
    // Add data points
    svg.selectAll(".dataPoint")
      .data(dataPoints)
      .enter()
      .append("circle")
      .attr("class", styles.dataPoint)
      .attr("cx", (d, i) => radialScale(d.value) * Math.cos(angleSlice * i - Math.PI/2))
      .attr("cy", (d, i) => radialScale(d.value) * Math.sin(angleSlice * i - Math.PI/2))
      .attr("r", 4)
      .style("fill", "#ff00ff");
      
  }, [genres]);
  
  return (
    <div className={styles.spiderChartWrapper}>
      <div ref={chartRef} className={styles.spiderChart}></div>
    </div>
  );
};

export default SpiderChart;
EOL

echo -e "${GREEN}Created SpiderChart component${NC}"

# Create SpiderChart styles
echo -e "${YELLOW}Creating SpiderChart styles...${NC}"

mkdir -p ./styles

cat > ./styles/SpiderChart.module.css << 'EOL'
.spiderChartWrapper {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
}

.spiderChart {
  position: relative;
  width: 400px;
  height: 400px;
}

.radarArea {
  filter: drop-shadow(0 0 8px rgba(255, 0, 255, 0.5));
}

.dataPoint {
  filter: drop-shadow(0 0 5px rgba(255, 0, 255, 0.8));
}

.axisLabel {
  filter: drop-shadow(0 0 3px rgba(0, 255, 255, 0.8));
}
EOL

echo -e "${GREEN}Created SpiderChart styles${NC}"

# Create SeasonalMoodCard component
echo -e "${YELLOW}Creating SeasonalMoodCard component...${NC}"

cat > ./components/SeasonalMoodCard.js << 'EOL'
import React from 'react';
import styles from '../styles/SeasonalMoodCard.module.css';
import { FaSnowflake, FaLeaf, FaSun, FaCanadianMapleLeaf } from 'react-icons/fa';

const SeasonalMoodCard = ({ seasonalMood }) => {
  const { currentSeason, previousSeason, seasonalShift } = seasonalMood;
  
  const getSeasonIcon = (season) => {
    switch(season.toLowerCase()) {
      case 'winter':
        return <FaSnowflake className={styles.winterIcon} />;
      case 'spring':
        return <FaLeaf className={styles.springIcon} />;
      case 'summer':
        return <FaSun className={styles.summerIcon} />;
      case 'fall':
      case 'autumn':
        return <FaCanadianMapleLeaf className={styles.fallIcon} />;
      default:
        return <FaSun className={styles.defaultIcon} />;
    }
  };
  
  const getShiftDescription = () => {
    if (seasonalShift.intensity < 20) {
      return "Your music taste has been very consistent across seasons.";
    } else if (seasonalShift.intensity < 50) {
      return "Your music taste shows moderate seasonal variation.";
    } else {
      return "Your music taste changes significantly with the seasons.";
    }
  };
  
  return (
    <div className={styles.seasonalMoodCard}>
      <div className={styles.currentSeason}>
        <div className={styles.seasonHeader}>
          <h3>Current Season</h3>
          {getSeasonIcon(currentSeason.name)}
        </div>
        <div className={styles.seasonContent}>
          <p className={styles.seasonName}>{currentSeason.name}</p>
          <div className={styles.genreList}>
            <p>Top Genres:</p>
            <ul>
              {currentSeason.topGenres.map((genre, index) => (
                <li key={index}>{genre}</li>
              ))}
            </ul>
          </div>
          <div className={styles.moodIndicator}>
            <p>Mood: {currentSeason.mood}</p>
            <div className={styles.moodBar}>
              <div 
                className={styles.moodFill} 
                style={{
                  width: `${currentSeason.energy}%`,
                  background: currentSeason.energy > 70 ? 'var(--neon-pink)' : 
                              currentSeason.energy > 40 ? 'var(--neon-blue)' : 'var(--neon-purple)'
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.seasonalShift}>
        <h3>Seasonal Shift</h3>
        <div className={styles.shiftIndicator}>
          <div className={styles.shiftBar}>
            <div 
              className={styles.shiftFill} 
              style={{width: `${seasonalShift.intensity}%`}}
            ></div>
          </div>
          <p>{getShiftDescription()}</p>
        </div>
        <div className={styles.shiftDetails}>
          <p>From {previousSeason.name} to {currentSeason.name}:</p>
          <ul>
            {seasonalShift.changes.map((change, index) => (
              <li key={index}>{change}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SeasonalMoodCard;
EOL

echo -e "${GREEN}Created SeasonalMoodCard component${NC}"

# Create SeasonalMoodCard styles
echo -e "${YELLOW}Creating SeasonalMoodCard styles...${NC}"

cat > ./styles/SeasonalMoodCard.module.css << 'EOL'
.seasonalMoodCard {
  background-color: rgba(10, 0, 20, 0.6);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 0 15px rgba(255, 0, 255, 0.2);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.seasonHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.seasonHeader h3 {
  font-size: 1.2rem;
  color: var(--neon-blue);
  margin: 0;
}

.seasonName {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 10px;
  color: white;
}

.genreList {
  margin-bottom: 15px;
}

.genreList p {
  margin-bottom: 5px;
  color: var(--neon-blue);
}

.genreList ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.genreList li {
  background-color: rgba(255, 0, 255, 0.2);
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: white;
  border: 1px solid var(--neon-pink);
}

.moodIndicator p {
  margin-bottom: 5px;
  color: var(--neon-blue);
}

.moodBar, .shiftBar {
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.moodFill, .shiftFill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--neon-blue), var(--neon-pink));
}

.seasonalShift h3 {
  font-size: 1.2rem;
  color: var(--neon-blue);
  margin-bottom: 15px;
}

.shiftDetails {
  margin-top: 15px;
}

.shiftDetails p {
  color: var(--neon-blue);
  margin-bottom: 5px;
}

.shiftDetails ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.shiftDetails li {
  padding: 5px 0;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.shiftDetails li:last-child {
  border-bottom: none;
}

.winterIcon {
  color: #a0e6ff;
  font-size: 1.5rem;
}

.springIcon {
  color: #a0ffa0;
  font-size: 1.5rem;
}

.summerIcon {
  color: #ffcc00;
  font-size: 1.5rem;
}

.fallIcon {
  color: #ff6600;
  font-size: 1.5rem;
}

.defaultIcon {
  color: #ffffff;
  font-size: 1.5rem;
}

@media (min-width: 768px) {
  .seasonalMoodCard {
    flex-direction: row;
  }
  
  .currentSeason, .seasonalShift {
    flex: 1;
  }
  
  .currentSeason {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    padding-right: 20px;
  }
  
  .seasonalShift {
    padding-left: 20px;
  }
}
EOL

echo -e "${GREEN}Created SeasonalMoodCard styles${NC}"

# Create VibeQuizCard component
echo -e "${YELLOW}Creating VibeQuizCard component...${NC}"

cat > ./components/VibeQuizCard.js << 'EOL'
import React, { useState } from 'react';
import styles from '../styles/VibeQuizCard.module.css';

const VibeQuizCard = ({ onSubmit }) => {
  const [step, setStep] = useState(1);
  const [preferences, setPreferences] = useState({
    genres: [],
    mood: 'energetic',
    tempo: 'medium',
    discovery: 'balanced',
    venues: []
  });
  
  const genreOptions = [
    'House', 'Techno', 'Trance', 'Drum & Bass', 'Dubstep', 
    'Ambient', 'Hardstyle', 'Garage', 'Electro', 'Progressive'
  ];
  
  const moodOptions = ['energetic', 'chill', 'dark', 'euphoric', 'experimental'];
  const tempoOptions = ['slow', 'medium', 'fast', 'varied'];
  const discoveryOptions = ['mainstream', 'balanced', 'underground'];
  const venueOptions = ['clubs', 'festivals', 'warehouses', 'outdoor', 'intimate venues'];
  
  const handleGenreToggle = (genre) => {
    if (preferences.genres.includes(genre)) {
      setPreferences({
        ...preferences,
        genres: preferences.genres.filter(g => g !== genre)
      });
    } else {
      if (preferences.genres.length < 5) {
        setPreferences({
          ...preferences,
          genres: [...preferences.genres, genre]
        });
      }
    }
  };
  
  const handleVenueToggle = (venue) => {
    if (preferences.venues.includes(venue)) {
      setPreferences({
        ...preferences,
        venues: preferences.venues.filter(v => v !== venue)
      });
    } else {
      setPreferences({
        ...preferences,
        venues: [...preferences.venues, venue]
      });
    }
  };
  
  const handleSubmit = () => {
    onSubmit(preferences);
  };
  
  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className={styles.quizStep}>
            <h3>Select your favorite genres (max 5)</h3>
            <div className={styles.optionsGrid}>
              {genreOptions.map(genre => (
                <button
                  key={genre}
                  className={`${styles.optionButton} ${preferences.genres.includes(genre) ? styles.selected : ''}`}
                  onClick={() => handleGenreToggle(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className={styles.quizStep}>
            <h3>What's your preferred mood?</h3>
            <div className={styles.optionsGrid}>
              {moodOptions.map(mood => (
                <button
                  key={mood}
                  className={`${styles.optionButton} ${preferences.mood === mood ? styles.selected : ''}`}
                  onClick={() => setPreferences({...preferences, mood})}
                >
                  {mood.charAt(0).toUpperCase() + mood.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className={styles.quizStep}>
            <h3>What tempo do you prefer?</h3>
            <div className={styles.optionsGrid}>
              {tempoOptions.map(tempo => (
                <button
                  key={tempo}
                  className={`${styles.optionButton} ${preferences.tempo === tempo ? styles.selected : ''}`}
                  onClick={() => setPreferences({...preferences, tempo})}
                >
                  {tempo.charAt(0).toUpperCase() + tempo.slice(1)}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
(Content truncated due to size limit. Use line ranges to read in chunks)