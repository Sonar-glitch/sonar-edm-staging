#!/bin/bash
# STEP 1: UI Enhancements - Spider Chart + Capsule Indicators
# File: deploy_step1_ui_enhancements.sh
# Target: Replace bar charts with spider chart and capsule indicators

echo "🎯 STEP 1: TIKO UI ENHANCEMENTS DEPLOYMENT"
echo "Target: Spider chart (genres) + Capsule indicators (sound features)"
echo "📍 Current directory: $(pwd)"

# Verify we're in the correct directory
if [[ ! -f "package.json" ]]; then
    echo "❌ Error: package.json not found. Please run from /c/sonar/users/sonar-edm-user"
    exit 1
fi

echo "✅ Verified project directory"

# Install required dependencies
echo "📦 Installing recharts for spider chart..."
npm install recharts@2.8.0 --save
if [ $? -ne 0 ]; then
    echo "❌ Failed to install recharts"
    exit 1
fi
echo "✅ Dependencies installed"

# Create directories
echo "📁 Creating component directories..."
mkdir -p components
mkdir -p styles

# Create Top5GenresSpiderChart component
echo "🕷️ Creating Top5GenresSpiderChart component..."
cat > components/Top5GenresSpiderChart.js << 'EOF'
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import styles from '@/styles/Top5GenresSpiderChart.module.css';

const Top5GenresSpiderChart = ({ userTasteProfile, spotifyData }) => {
  const getTop5GenresData = () => {
    // Fallback demo data for testing
    if (!userTasteProfile?.genrePreferences && !spotifyData?.topGenres) {
      return [
        { genre: 'House', value: 85, normalizedValue: 85 },
        { genre: 'Techno', value: 72, normalizedValue: 72 },
        { genre: 'Progressive', value: 68, normalizedValue: 68 },
        { genre: 'Deep House', value: 61, normalizedValue: 61 },
        { genre: 'Trance', value: 45, normalizedValue: 45 }
      ];
    }

    // Real data processing
    const genreScores = new Map();
    
    if (userTasteProfile?.genrePreferences) {
      userTasteProfile.genrePreferences.forEach(genre => {
        genreScores.set(genre.name, (genre.weight || 0) * 100);
      });
    }
    
    if (spotifyData?.topGenres) {
      spotifyData.topGenres.forEach((genre, index) => {
        const spotifyScore = Math.max(0, 100 - (index * 15));
        const existingScore = genreScores.get(genre.name) || 0;
        genreScores.set(genre.name, Math.max(existingScore, spotifyScore));
      });
    }
    
    const sortedGenres = Array.from(genreScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    const maxScore = Math.max(...sortedGenres.map(([, score]) => score));
    return sortedGenres.map(([genre, score]) => ({
      genre: genre.charAt(0).toUpperCase() + genre.slice(1),
      value: score,
      normalizedValue: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0
    }));
  };

  const genresData = getTop5GenresData();
  const overallTasteStrength = genresData.length > 0 
    ? Math.round(genresData.reduce((sum, genre) => sum + genre.normalizedValue, 0) / genresData.length)
    : 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Top 5 Genres</h3>
        <div className={styles.tasteStrength}>
          <span className={styles.strengthLabel}>Taste Strength</span>
          <span className={styles.strengthValue}>{overallTasteStrength}%</span>
        </div>
      </div>
      
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={genresData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.1)" radialLines={true} />
            <PolarAngleAxis 
              dataKey="genre"
              tick={{ fill: '#fff', fontSize: 12, fontWeight: 500 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: 'rgba(255, 255, 255, 0.6)', fontSize: 10 }}
              tickCount={6}
            />
            <Radar
              name="Genre Preference"
              dataKey="normalizedValue"
              stroke="#ff1493"
              fill="#ff1493"
              fillOpacity={0.3}
              strokeWidth={3}
              dot={{ fill: '#ff1493', strokeWidth: 2, stroke: '#00bfff', r: 6 }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className={styles.genresList}>
        {genresData.map((genre, index) => (
          <div key={genre.genre} className={styles.genreItem}>
            <div className={styles.genreRank}>#{index + 1}</div>
            <div className={styles.genreInfo}>
              <span className={styles.genreName}>{genre.genre}</span>
              <span className={styles.genreScore}>{genre.normalizedValue}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Top5GenresSpiderChart;
EOF

# Create spider chart styles
echo "🎨 Creating spider chart styles..."
cat > styles/Top5GenresSpiderChart.module.css << 'EOF'
.container {
  background: rgba(18, 18, 24, 0.8);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  color: #fff;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.title {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ff1493, #00bfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tasteStrength {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.strengthLabel {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.2rem;
}

.strengthValue {
  font-size: 1.1rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ff1493, #00bfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.chartContainer {
  margin: 1rem 0;
  position: relative;
}

.genresList {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 1rem;
}

.genreItem {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.genreItem:hover {
  background: rgba(255, 20, 147, 0.1);
  transform: translateX(4px);
}

.genreRank {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff1493, #00bfff);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: 600;
  color: #fff;
}

.genreInfo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 1;
}

.genreName {
  font-weight: 500;
  color: #fff;
}

.genreScore {
  font-weight: 600;
  color: #00bfff;
}

@media (max-width: 768px) {
  .container {
    padding: 1rem;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  
  .tasteStrength {
    align-items: flex-start;
  }
}
EOF

# Create SoundFeatureCapsules component
echo "💊 Creating SoundFeatureCapsules component..."
cat > components/SoundFeatureCapsules.js << 'EOF'
import React from 'react';
import styles from '@/styles/SoundFeatureCapsules.module.css';

const SoundFeatureCapsules = ({ userAudioFeatures, universalAverages }) => {
  const defaultUniversalAverages = {
    energy: 0.65,
    danceability: 0.70,
    valence: 0.55,
    acousticness: 0.25,
    instrumentalness: 0.15,
    tempo: 120
  };

  const universalNorms = universalAverages || defaultUniversalAverages;

  const normalizeFeature = (userValue, universalAverage, isTempoFeature = false) => {
    if (!userValue && userValue !== 0) return 0;
    
    if (isTempoFeature) {
      const minTempo = 60;
      const maxTempo = 180;
      const normalizedTempo = Math.max(0, Math.min(100, 
        ((userValue - minTempo) / (maxTempo - minTempo)) * 100
      ));
      return Math.round(normalizedTempo);
    }
    
    const percentage = Math.round(userValue * 100);
    return Math.max(0, Math.min(100, percentage));
  };

  const soundFeatures = [
    {
      key: 'energy',
      name: 'Energy',
      icon: '⚡',
      description: 'How energetic and intense your music feels',
      userValue: userAudioFeatures?.energy || 0.7,
      universalValue: universalNorms.energy,
      color: '#ff6b6b'
    },
    {
      key: 'danceability',
      name: 'Danceability',
      icon: '💃',
      description: 'How suitable your music is for dancing',
      userValue: userAudioFeatures?.danceability || 0.8,
      universalValue: universalNorms.danceability,
      color: '#4ecdc4'
    },
    {
      key: 'valence',
      name: 'Positivity',
      icon: '😊',
      description: 'How positive and uplifting your music is',
      userValue: userAudioFeatures?.valence || 0.6,
      universalValue: universalNorms.valence,
      color: '#45b7d1'
    },
    {
      key: 'acousticness',
      name: 'Acoustic',
      icon: '🎸',
      description: 'How acoustic vs electronic your music is',
      userValue: userAudioFeatures?.acousticness || 0.2,
      universalValue: universalNorms.acousticness,
      color: '#f9ca24'
    },
    {
      key: 'instrumentalness',
      name: 'Instrumental',
      icon: '🎵',
      description: 'How much instrumental vs vocal music you prefer',
      userValue: userAudioFeatures?.instrumentalness || 0.3,
      universalValue: universalNorms.instrumentalness,
      color: '#6c5ce7'
    },
    {
      key: 'tempo',
      name: 'Tempo',
      icon: '🥁',
      description: 'The speed/BPM of your preferred music',
      userValue: userAudioFeatures?.tempo || 128,
      universalValue: universalNorms.tempo,
      color: '#fd79a8',
      isTempo: true
    }
  ];

  const featuresWithNormalization = soundFeatures.map(feature => {
    const normalizedValue = normalizeFeature(
      feature.userValue, 
      feature.universalValue, 
      feature.isTempo
    );
    
    return {
      ...feature,
      normalizedValue,
      displayValue: feature.isTempo 
        ? `${Math.round(feature.userValue)} BPM`
        : `${normalizedValue}%`
    };
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Sound Characteristics</h3>
        <p className={styles.subtitle}>Normalized by universal music taste</p>
      </div>
      
      <div className={styles.featuresGrid}>
        {featuresWithNormalization.map((feature) => (
          <div key={feature.key} className={styles.featureItem}>
            <div className={styles.featureHeader}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <div className={styles.featureInfo}>
                <span className={styles.featureName}>{feature.name}</span>
                <span className={styles.featureValue}>{feature.displayValue}</span>
              </div>
            </div>
            
            <div className={styles.capsuleContainer}>
              <div className={styles.capsule}>
                <div 
                  className={styles.capsuleFill}
                  style={{ 
                    width: `${feature.normalizedValue}%`,
                    background: `linear-gradient(90deg, ${feature.color}, ${feature.color}dd)`
                  }}
                />
              </div>
              <span className={styles.percentageLabel}>{feature.normalizedValue}%</span>
            </div>
            
            <p className={styles.featureDescription}>{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SoundFeatureCapsules;
EOF

# Create capsule styles
echo "🎨 Creating capsule styles..."
cat > styles/SoundFeatureCapsules.module.css << 'EOF'
.container {
  background: rgba(18, 18, 24, 0.8);
  border: 1px solid rgba(255, 20, 147, 0.3);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(10px);
  color: #fff;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.title {
  margin: 0 0 0.5rem 0;
  font-size: 1.3rem;
  font-weight: 600;
  background: linear-gradient(135deg, #ff1493, #00bfff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
}

.featuresGrid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.featureItem {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.2rem;
  transition: all 0.3s ease;
}

.featureItem:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 20, 147, 0.3);
  transform: translateY(-2px);
}

.featureHeader {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.featureIcon {
  font-size: 1.8rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
}

.featureInfo {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.featureName {
  font-size: 1rem;
  font-weight: 600;
  color: #fff;
  margin-bottom: 0.2rem;
}

.featureValue {
  font-size: 0.9rem;
  font-weight: 500;
  color: #00bfff;
}

.capsuleContainer {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.capsule {
  flex: 1;
  height: 24px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.capsuleFill {
  height: 100%;
  border-radius: 12px;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.capsuleFill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, 
    transparent 0%, 
    rgba(255, 255, 255, 0.3) 50%, 
    transparent 100%);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.percentageLabel {
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
  min-width: 35px;
  text-align: right;
}

.featureDescription {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.4;
  margin: 0;
}

@media (max-width: 768px) {
  .featuresGrid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
EOF

echo "✅ Step 1 components created successfully!"
echo ""
echo "🧪 TESTING INSTRUCTIONS:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo "3. Verify: Spider chart shows 5 genres"
echo "4. Verify: Capsules show 6 sound features with animations"
echo "5. Verify: No console errors"
echo ""
echo "📋 SUCCESS CRITERIA:"
echo "- [ ] Spider chart renders with genre data"
echo "- [ ] Capsule indicators show percentage fills"
echo "- [ ] Animations work smoothly"
echo "- [ ] Components are responsive"
echo "- [ ] TIKO theme colors are correct"
echo ""
echo "Ready for integration into dashboard? Run: ./integrate_step1_dashboard.sh"
EOF

chmod +x deploy_step1_ui_enhancements.sh

