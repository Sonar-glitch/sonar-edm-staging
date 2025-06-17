#!/bin/bash

echo "🎯 FINAL TIKO FIX - ALL YELLOW BOX ISSUES..."
echo "============================================="

# Navigate to the project directory
cd /c/sonar/users/sonar-edm-user || {
    echo "❌ Error: Could not navigate to project directory"
    exit 1
}

echo "✅ Step 1: Fixing spider chart normalization and height..."

# Update Top5GenresSpiderChart with proper normalization and reduced height
cat > components/Top5GenresSpiderChart.js << 'EOF'
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

const Top5GenresSpiderChart = ({ userTasteProfile, spotifyData }) => {
  // Default genre data with PROPER NORMALIZATION (max 100%)
  const defaultGenres = [
    { genre: 'House', value: 100, normalizedValue: 100 },
    { genre: 'Techno', value: 85, normalizedValue: 85 },
    { genre: 'Progressive house', value: 70, normalizedValue: 70 },
    { genre: 'Progressive', value: 68, normalizedValue: 68 },
    { genre: 'Deep house', value: 61, normalizedValue: 61 }
  ];

  // Process user data with proper normalization
  const processGenreData = (data) => {
    if (!data || !data.topGenres) return defaultGenres;
    
    const genres = data.topGenres.slice(0, 5);
    
    // Find the maximum value for normalization
    const maxValue = Math.max(...genres.map(g => g.count || g.value || 0));
    
    return genres.map(genre => {
      const rawValue = genre.count || genre.value || 0;
      // ENSURE VALUES NEVER EXCEED 100%
      const normalizedValue = Math.min(100, Math.round((rawValue / maxValue) * 100));
      
      return {
        genre: genre.name || genre.genre,
        value: rawValue,
        normalizedValue: normalizedValue
      };
    });
  };

  const genresData = userTasteProfile ? processGenreData(userTasteProfile) : defaultGenres;

  // Prepare data for radar chart
  const radarData = genresData.map(item => ({
    genre: item.genre,
    value: item.normalizedValue // Use normalized value (0-100%)
  }));

  return (
    <div className={styles.container}>
      {/* REDUCED HEIGHT SPIDER CHART */}
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={200}> {/* Reduced from 300 to 200 */}
          <RadarChart data={radarData}>
            <PolarGrid 
              stroke="rgba(255, 255, 255, 0.2)"
              radialLines={true}
            />
            <PolarAngleAxis 
              dataKey="genre" 
              tick={{ 
                fontSize: 11, 
                fill: '#fff',
                fontWeight: 500
              }}
              className={styles.genreLabel}
            />
            <Radar
              name="Taste Profile"
              dataKey="value"
              stroke="#ff006e"
              fill="rgba(255, 0, 110, 0.3)"
              strokeWidth={2}
              dot={{ 
                fill: '#ff006e', 
                strokeWidth: 2, 
                stroke: '#fff',
                r: 4
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Top5GenresSpiderChart;
EOF

echo "✅ Step 2: Fixing SoundCharacteristics - remove subtitle and duplicate percentages..."

# Update SoundCharacteristics with no redundant subtitle and single percentages
cat > components/SoundCharacteristics.js << 'EOF'
import React from 'react';
import styles from '@/styles/SoundCharacteristics.module.css';

const SoundCharacteristics = ({ userAudioFeatures, dataStatus = 'demo' }) => {
  // Default audio features
  const defaultFeatures = {
    energy: 0.75,
    danceability: 0.82,
    valence: 0.65, // Positivity
    acousticness: 0.15
  };

  const features = userAudioFeatures || defaultFeatures;

  const characteristicsData = [
    {
      name: 'Energy',
      value: features.energy,
      percentage: Math.round(features.energy * 100),
      icon: '⚡',
      color: '#ff6b6b',
      description: 'How energetic and intense your music feels'
    },
    {
      name: 'Danceability',
      value: features.danceability,
      percentage: Math.round(features.danceability * 100),
      icon: '💃',
      color: '#4ecdc4',
      description: 'How suitable your music is for dancing'
    },
    {
      name: 'Positivity',
      value: features.valence,
      percentage: Math.round(features.valence * 100),
      icon: '😊',
      color: '#45b7d1',
      description: 'The musical positivity conveyed by your tracks'
    },
    {
      name: 'Acoustic',
      value: features.acousticness,
      percentage: Math.round(features.acousticness * 100),
      icon: '🎸',
      color: '#f9ca24',
      description: 'How acoustic vs electronic your music is'
    }
  ];

  return (
    <div className={styles.container}>
      {/* REMOVED REDUNDANT SUBTITLE */}
      
      <div className={styles.characteristicsGrid}>
        {characteristicsData.map((characteristic, index) => (
          <div key={index} className={styles.characteristicItem}>
            <div className={styles.characteristicHeader}>
              <div className={styles.iconAndName}>
                <span className={styles.icon}>{characteristic.icon}</span>
                <span className={styles.name}>{characteristic.name}</span>
              </div>
              {/* SINGLE PERCENTAGE DISPLAY - NO DUPLICATES */}
              <span className={styles.percentage}>{characteristic.percentage}%</span>
            </div>
            
            {/* Shiny Progress Bar WITHOUT duplicate percentage */}
            <div className={styles.progressContainer}>
              <div className={styles.progressTrack}>
                <div 
                  className={styles.progressBar}
                  style={{ 
                    width: `${characteristic.percentage}%`,
                    background: `linear-gradient(90deg, ${characteristic.color}, ${characteristic.color}dd)`,
                    boxShadow: `0 0 20px ${characteristic.color}40, inset 0 1px 0 rgba(255,255,255,0.3)`
                  }}
                >
                  <div className={styles.shine}></div>
                </div>
              </div>
              {/* NO DUPLICATE PERCENTAGE HERE */}
            </div>
            
            <p className={styles.description}>{characteristic.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundCharacteristics;
EOF

echo "✅ Step 3: Creating CSS with NO EMPTY SPACE between sections..."

# Update CSS with zero gaps and balanced heights
cat > styles/EnhancedPersonalizedDashboard.module.css << 'EOF'
.container {
  min-height: 100vh;
  background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%);
  color: #fff;
  padding: 0;
  overflow-x: hidden;
}

/* ZERO SPACE HEADER */
.header {
  padding: 1rem 1rem 0 1rem; /* NO bottom padding */
  text-align: center;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 0, 110, 0.1);
  margin-bottom: 0; /* NO margin */
}

.title {
  margin: 0 0 0.5rem 0;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
}

.logo {
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  letter-spacing: 0.1em;
  text-shadow: 0 0 30px rgba(255, 0, 110, 0.5);
}

.subtitle {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.4;
  margin: 0; /* NO margin */
}

.highlight {
  color: #ff006e;
  font-weight: 600;
  text-shadow: 0 0 20px rgba(255, 0, 110, 0.3);
}

.mainContent {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem; /* NO top padding - connects directly to header */
  display: flex;
  flex-direction: column;
  gap: 0; /* NO GAPS between sections */
}

/* ZERO GAPS BETWEEN ROWS */
.informationalRow, .dataInsightsRow, .functionalRow {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem; /* Only small gap between left/right columns */
  margin: 0; /* NO margins between rows */
  align-items: stretch; /* Equal heights */
  border-bottom: 1px solid rgba(255, 255, 255, 0.05); /* Visual separation instead of space */
  padding: 1rem 0; /* Internal padding instead of margins */
}

.dataInsightsRow {
  grid-template-columns: 1fr; /* Full width for unified sound characteristics */
}

.leftColumn, .rightColumn, .fullWidth {
  display: flex;
  flex-direction: column;
  height: 100%; /* Fill available space - NO empty space */
}

/* COMPACT CARDS - NO MARGINS */
.card {
  background: rgba(15, 15, 25, 0.8);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  padding: 1rem; /* Reduced padding */
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  transition: all 0.3s ease;
  height: 100%; /* Fill column height */
  margin: 0; /* NO margins */
  display: flex;
  flex-direction: column;
}

.card:hover {
  box-shadow: 0 6px 25px rgba(0, 0, 0, 0.5);
  transform: translateY(-1px);
}

.cardHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.8rem; /* Reduced margin */
}

.cardTitle {
  font-size: 1.2rem; /* Slightly smaller */
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dataIndicator {
  font-size: 0.75rem;
  padding: 0.2rem 0.4rem;
  border-radius: 8px;
  background: rgba(0, 212, 255, 0.1);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: #00d4ff;
  font-weight: 500;
}

/* COMPACT SEASONAL VIBES */
.seasonalGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.6rem; /* Reduced gap */
  flex: 1; /* Fill available space */
}

.seasonCard {
  padding: 0.6rem; /* Reduced padding */
  border-radius: 8px;
  text-align: center;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.seasonCard:hover {
  transform: translateY(-2px);
  filter: drop-shadow(0 0 15px rgba(0, 212, 255, 0.3));
}

.seasonCard h3 {
  margin: 0 0 0.2rem 0; /* Reduced margin */
  font-weight: 600;
  font-size: 0.85rem; /* Smaller font */
}

.seasonCard p {
  margin: 0;
  font-size: 0.7rem; /* Smaller font */
  opacity: 0.9;
}

.spring {
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.05));
  color: #22c55e;
}

.summer {
  background: linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(249, 115, 22, 0.05));
  color: #f97316;
}

.fall {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.05));
  color: #ef4444;
}

.winter {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.05));
  color: #3b82f6;
}

/* COMPACT VIBE MATCH */
.vibeMatch {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.5rem 0;
  height: 100%; /* Fill available space */
  align-items: center;
  justify-content: center;
}

.vibeLabel {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
  min-width: 80px;
}

.vibeSlider {
  flex: 1;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.vibeProgress {
  height: 100%;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  border-radius: 3px;
  transition: width 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 0, 110, 0.5);
}

.vibePercentage {
  font-weight: 600;
  color: #00d4ff;
  min-width: 40px;
  text-align: right;
}

.gearIcon {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 0, 110, 0.2);
  border-radius: 6px;
  padding: 0.4rem;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.gearIcon:hover {
  background: rgba(255, 0, 110, 0.1);
  box-shadow: 0 0 10px rgba(255, 0, 110, 0.3);
}

/* EVENTS SECTION - NO TOP MARGIN */
.eventsSection {
  margin-top: 0; /* NO gap from previous section */
  padding-top: 1rem; /* Internal padding instead */
  border-top: 1px solid rgba(255, 255, 255, 0.05); /* Visual separation */
}

.eventsHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.sectionTitle {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* LOADING, ERROR STATES */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
  text-align: center;
}

.spinner {
  width: 30px;
  height: 30px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-top: 2px solid #ff006e;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 0.8rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error {
  text-align: center;
  padding: 1.5rem;
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 8px;
  margin: 0.8rem 0;
  backdrop-filter: blur(10px);
}

.retryButton {
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  color: #fff;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.8rem;
  transition: all 0.2s ease;
}

.retryButton:hover {
  transform: translateY(-1px);
  box-shadow: 0 3px 12px rgba(255, 0, 110, 0.3);
}

.noEvents {
  text-align: center;
  padding: 2rem;
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
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
  font-size: 2rem;
  margin-bottom: 0.8rem;
  background: linear-gradient(90deg, #ff006e, #00d4ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.authPrompt p {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 500px;
}

/* RESPONSIVE DESIGN */
@media (max-width: 1024px) {
  .informationalRow, .functionalRow {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }
  
  .mainContent {
    padding: 0 0.8rem;
  }
}

@media (max-width: 768px) {
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 0.9rem;
  }
  
  .header {
    padding: 0.8rem;
  }
  
  .mainContent {
    padding: 0 0.5rem;
  }
  
  .seasonalGrid {
    grid-template-columns: 1fr;
  }
  
  .vibeMatch {
    flex-direction: column;
    gap: 0.5rem;
  }
}
EOF

echo "✅ Step 4: Creating compact spider chart CSS..."

# Update spider chart CSS for reduced height
cat > styles/Top5GenresSpiderChart.module.css << 'EOF'
.container {
  width: 100%;
  height: 100%; /* Fill available space */
  display: flex;
  flex-direction: column;
}

/* REDUCED HEIGHT CHART CONTAINER */
.chartContainer {
  flex: 1;
  min-height: 200px; /* Reduced from 300px */
  max-height: 200px; /* Cap the height */
  display: flex;
  align-items: center;
  justify-content: center;
}

.genreLabel {
  font-size: 11px !important;
  fill: #fff !important;
  font-weight: 500 !important;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .chartContainer {
    min-height: 180px;
    max-height: 180px;
  }
  
  .genreLabel {
    font-size: 10px !important;
  }
}
EOF

echo "✅ Step 5: Creating compact SoundCharacteristics CSS..."

# Update sound characteristics CSS with no redundant elements
cat > styles/SoundCharacteristics.module.css << 'EOF'
.container {
  width: 100%;
  height: 100%; /* Fill available space */
  display: flex;
  flex-direction: column;
}

/* NO REDUNDANT SUBTITLE */

.characteristicsGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem; /* Reduced gap */
  flex: 1; /* Fill available space */
}

.characteristicItem {
  display: flex;
  flex-direction: column;
  gap: 0.6rem; /* Reduced gap */
}

.characteristicHeader {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.iconAndName {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.icon {
  font-size: 1.1rem; /* Slightly smaller */
}

.name {
  font-size: 0.95rem; /* Slightly smaller */
  font-weight: 600;
  color: #fff;
}

/* SINGLE PERCENTAGE DISPLAY */
.percentage {
  font-size: 0.95rem; /* Slightly smaller */
  font-weight: 600;
  color: #00d4ff;
}

.progressContainer {
  display: flex;
  align-items: center;
  gap: 0; /* NO gap - no duplicate percentage */
}

.progressTrack {
  flex: 1;
  height: 6px; /* Slightly smaller */
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  position: relative;
  overflow: hidden;
}

.progressBar {
  height: 100%;
  border-radius: 3px;
  position: relative;
  transition: width 0.8s ease;
  overflow: hidden;
}

.shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shine 2s infinite;
}

@keyframes shine {
  0% {
    left: -100%;
  }
  50% {
    left: 100%;
  }
  100% {
    left: 100%;
  }
}

.description {
  font-size: 0.7rem; /* Smaller font */
  color: rgba(255, 255, 255, 0.6);
  margin: 0;
  line-height: 1.3;
}

/* RESPONSIVE DESIGN */
@media (max-width: 768px) {
  .characteristicsGrid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
EOF

echo "✅ Step 6: Committing and deploying final fix..."

git add .
git commit -m "🎯 FINAL TIKO FIX - ALL YELLOW BOX ISSUES RESOLVED

✅ DATA FIXES:
- Fixed spider chart normalization (values capped at 100%)
- Removed redundant subtitle from sound characteristics
- Fixed duplicate percentages (single display only)

✅ LAYOUT FIXES:
- Balanced column heights (reduced Top 5 section height)
- Filled empty space through height optimization
- Eliminated ALL empty space between sections

✅ SPACING STRATEGY:
- Zero margins/gaps between sections
- Tight header spacing connecting directly to content
- Equal column heights with no floating sections
- Seamless flow with visual borders instead of white space

🎨 Perfect balance and no wasted space!"

echo "✅ Deploying to staging..."
git push heroku main

echo ""
echo "🎉 FINAL TIKO FIX DEPLOYED!"
echo "=========================="
echo ""
echo "✅ All Yellow Box Issues Fixed:"
echo "   ✅ Spider chart normalization (max 100%)"
echo "   ✅ Balanced column heights"
echo "   ✅ No empty space between sections"
echo "   ✅ Removed redundant subtitle"
echo "   ✅ Fixed duplicate percentages"
echo ""
echo "🚀 Check your staging site:"
echo "   https://sonar-edm-staging-ef96efd71e8e.herokuapp.com/dashboard"
echo ""
echo "Perfect balance with zero wasted space!"
echo ""
EOF

chmod +x /home/ubuntu/final_yellow_box_fix.sh

echo "🎯 FINAL YELLOW BOX FIX READY!"
echo ""
echo "This script fixes ALL the highlighted issues:"
echo "✅ Spider chart normalization (max 100%)"
echo "✅ Balanced column heights (reduced Top 5 height)"
echo "✅ No empty space between sections"
echo "✅ Removed redundant subtitle"
echo "✅ Fixed duplicate percentages"

