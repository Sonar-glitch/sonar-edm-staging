// components/CompactMusicTaste.js
// TIKO-compliant music taste display with real insights instead of spider charts

import { useState, useEffect } from 'react';
import styles from '../styles/CompactMusicTaste.module.css';

export default function CompactMusicTaste({ userProfile, dataSource }) {
  const [showDetails, setShowDetails] = useState(false);

  // Generate insights about data accuracy
  const getDataAccuracyInsights = () => {
    const insights = [];
    
    if (dataSource?.spotify?.isReal) {
      insights.push({
        type: 'spotify_real',
        text: 'Based on your actual Spotify listening history',
        icon: '✅',
        confidence: 'high'
      });
    } else {
      insights.push({
        type: 'spotify_demo',
        text: 'Using demo data - connect Spotify for real insights',
        icon: '⚠️',
        confidence: 'low'
      });
    }

    if (dataSource?.soundstat?.isReal) {
      insights.push({
        type: 'soundstat_real',
        text: 'Real audio analysis from your tracks',
        icon: '🧬',
        confidence: 'high'
      });
    } else {
      insights.push({
        type: 'soundstat_demo',
        text: 'Sound characteristics estimated from genres',
        icon: '📊',
        confidence: 'medium'
      });
    }

    return insights;
  };

  // Generate genre insights with percentages
  const getGenreInsights = () => {
    if (!userProfile?.topGenres) return [];
    
    const totalPercentage = userProfile.topGenres.reduce((sum, genre) => sum + (genre.percentage || 0), 0);
    const dominantGenre = userProfile.topGenres[0];
    const insights = [];

    if (dominantGenre && dominantGenre.percentage > 30) {
      insights.push({
        type: 'dominant_genre',
        text: `${Math.round(dominantGenre.percentage)}% of your music is ${dominantGenre.genre}`,
        genre: dominantGenre.genre,
        strength: 'strong'
      });
    }

    // Count electronic music percentage
    const electronicGenres = userProfile.topGenres.filter(g => 
      g.genre.toLowerCase().includes('house') ||
      g.genre.toLowerCase().includes('techno') ||
      g.genre.toLowerCase().includes('electronic') ||
      g.genre.toLowerCase().includes('edm') ||
      g.genre.toLowerCase().includes('progressive') ||
      g.genre.toLowerCase().includes('melodic') ||
      g.genre.toLowerCase().includes('ambient') ||
      g.genre.toLowerCase().includes('trance')
    );

    const electronicPercentage = electronicGenres.reduce((sum, g) => sum + (g.percentage || 0), 0);
    
    if (electronicPercentage > 50) {
      insights.push({
        type: 'electronic_focus',
        text: `${Math.round(electronicPercentage)}% electronic music focus`,
        strength: 'strong'
      });
    } else if (electronicPercentage > 25) {
      insights.push({
        type: 'electronic_mix',
        text: `${Math.round(electronicPercentage)}% electronic, mixed taste`,
        strength: 'medium'
      });
    }

    // Diversity insight
    const diversityScore = userProfile.topGenres.length;
    if (diversityScore > 8) {
      insights.push({
        type: 'diverse_taste',
        text: `Very diverse taste across ${diversityScore} genres`,
        strength: 'medium'
      });
    } else if (diversityScore <= 3) {
      insights.push({
        type: 'focused_taste',
        text: `Focused taste in ${diversityScore} main genres`,
        strength: 'strong'
      });
    }

    return insights;
  };

  // Generate sound DNA insights
  const getSoundDNAInsights = () => {
    if (!userProfile?.soundCharacteristics) return [];
    
    const { energy, danceability, positivity, acoustic } = userProfile.soundCharacteristics;
    const insights = [];

    if (energy > 75) {
      insights.push({
        type: 'high_energy',
        text: `High energy listener (${Math.round(energy)}%)`,
        value: energy,
        icon: '⚡'
      });
    } else if (energy < 25) {
      insights.push({
        type: 'low_energy',
        text: `Prefers chill vibes (${Math.round(energy)}% energy)`,
        value: energy,
        icon: '😌'
      });
    }

    if (danceability > 80) {
      insights.push({
        type: 'dance_focused',
        text: `Dance floor ready (${Math.round(danceability)}% danceability)`,
        value: danceability,
        icon: '💃'
      });
    }

    if (positivity > 70) {
      insights.push({
        type: 'positive_vibes',
        text: `Positive vibes (${Math.round(positivity)}% positivity)`,
        value: positivity,
        icon: '😊'
      });
    } else if (positivity < 40) {
      insights.push({
        type: 'moody_music',
        text: `Appreciates moody music (${Math.round(positivity)}% positivity)`,
        value: positivity,
        icon: '🌙'
      });
    }

    if (acoustic > 50) {
      insights.push({
        type: 'acoustic_balance',
        text: `Enjoys acoustic elements (${Math.round(acoustic)}%)`,
        value: acoustic,
        icon: '🎸'
      });
    } else if (acoustic < 20) {
      insights.push({
        type: 'electronic_pure',
        text: `Pure electronic sound (${Math.round(100-acoustic)}% synthetic)`,
        value: 100-acoustic,
        icon: '🤖'
      });
    }

    return insights.slice(0, 3); // Show max 3 insights
  };

  const accuracyInsights = getDataAccuracyInsights();
  const genreInsights = getGenreInsights();
  const soundInsights = getSoundDNAInsights();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Your Music DNA</h3>
        <div className={styles.dataQuality}>
          {accuracyInsights.map((insight, idx) => (
            <span key={idx} className={`${styles.qualityBadge} ${styles[insight.confidence]}`}>
              {insight.icon} {insight.confidence === 'high' ? 'Real Data' : insight.confidence === 'medium' ? 'Estimated' : 'Demo Data'}
            </span>
          ))}
        </div>
      </div>

      {/* Quick insights */}
      <div className={styles.quickInsights}>
        {genreInsights.slice(0, 2).map((insight, idx) => (
          <div key={idx} className={`${styles.quickInsight} ${styles[insight.strength]}`}>
            <span className={styles.insightText}>{insight.text}</span>
          </div>
        ))}
      </div>

      {/* Sound characteristics bar */}
      {userProfile?.soundCharacteristics && (
        <div className={styles.soundBars}>
          <div className={styles.soundBar}>
            <div className={styles.barLabel}>
              <span>Energy</span>
              <span>{Math.round(userProfile.soundCharacteristics.energy)}%</span>
            </div>
            <div className={styles.barTrack}>
              <div 
                className={styles.barFill} 
                style={{ width: `${userProfile.soundCharacteristics.energy}%` }}
              />
            </div>
          </div>
          
          <div className={styles.soundBar}>
            <div className={styles.barLabel}>
              <span>Danceability</span>
              <span>{Math.round(userProfile.soundCharacteristics.danceability)}%</span>
            </div>
            <div className={styles.barTrack}>
              <div 
                className={styles.barFill} 
                style={{ width: `${userProfile.soundCharacteristics.danceability}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Top genres list */}
      {userProfile?.topGenres && (
        <div className={styles.genresList}>
          <h4 className={styles.sectionTitle}>Your Top Genres</h4>
          <div className={styles.genres}>
            {userProfile.topGenres.slice(0, 5).map((genre, idx) => (
              <div key={idx} className={styles.genreItem}>
                <span className={styles.genreName}>{genre.genre}</span>
                <span className={styles.genrePercentage}>{Math.round(genre.percentage || 0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sound DNA insights */}
      {soundInsights.length > 0 && (
        <div className={styles.soundInsights}>
          <h4 className={styles.sectionTitle}>Sound Insights</h4>
          <div className={styles.insights}>
            {soundInsights.map((insight, idx) => (
              <div key={idx} className={styles.soundInsight}>
                <span className={styles.insightIcon}>{insight.icon}</span>
                <span className={styles.insightText}>{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data accuracy details */}
      <div className={styles.dataAccuracy}>
        <button 
          className={styles.toggleDetails}
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide' : 'Show'} data source details
        </button>
        
        {showDetails && (
          <div className={styles.dataDetails}>
            {accuracyInsights.map((insight, idx) => (
              <div key={idx} className={`${styles.dataDetail} ${styles[insight.confidence]}`}>
                <span className={styles.detailIcon}>{insight.icon}</span>
                <span className={styles.detailText}>{insight.text}</span>
              </div>
            ))}
            
            {dataSource?.spotify?.lastFetch && (
              <div className={styles.lastUpdate}>
                Last updated: {new Date(dataSource.spotify.lastFetch).toLocaleDateString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
