import React, { useState } from 'react';
import GenreRadarChart from '@/components/GenreRadarChart';
import styles from '@/styles/SonicSignature.module.css';

export default function SonicSignature({ genreData, mood, topArtist, topTrack, recommendations }) {
  const [showRecommendations, setShowRecommendations] = useState(false);
  
  // Default recommendations if none provided
  const defaultRecommendations = {
    artists: [
      { name: 'Tale Of Us', matchScore: 92 },
      { name: 'Stephan Bodzin', matchScore: 87 },
      { name: 'Adriatique', matchScore: 85 }
    ],
    tracks: [
      { name: 'Purple Noise', artist: 'Boris Brejcha', matchScore: 94 },
      { name: 'Space Diver', artist: 'Boris Brejcha', matchScore: 91 },
      { name: 'Gravity', artist: 'Boris Brejcha', matchScore: 88 }
    ]
  };
  
  const recs = recommendations || defaultRecommendations;
  
  const toggleRecommendations = () => {
    setShowRecommendations(!showRecommendations);
  };

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Your Sonic Signature</h2>
      
      <div className={styles.chartSection}>
        <div className={styles.chart}>
          <GenreRadarChart genreData={genreData} />
        </div>
      </div>
      
      <div className={styles.moodBanner}>
        <span className={styles.moodIcon}>🌙</span>
        <span className={styles.moodText}>{mood || 'Late-Night Melodic Wave'}</span>
      </div>
      
      <div className={styles.artistTrackSection}>
        <div className={styles.infoColumn}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Top Artist</h3>
            {topArtist?.popularity && (
              <div className={styles.popularityIndicator}>
                <div className={styles.popularityFill} style={{ width: `${topArtist.popularity}%` }}></div>
                <span className={styles.popularityText}>{topArtist.popularity}%</span>
              </div>
            )}
          </div>
          
          <div className={styles.artistCard}>
            {topArtist?.images && topArtist.images.length > 0 ? (
              <div className={styles.artistImage} 
                   style={{backgroundImage: `url(${topArtist.images[0].url})`}}>
              </div>
            ) : (
              <div className={styles.artistImagePlaceholder}></div>
            )}
            <span className={styles.artistName}>
              {topArtist?.name || 'Unknown Artist'}
            </span>
          </div>
          
          <button 
            className={styles.recommendationsToggle} 
            onClick={toggleRecommendations}
          >
            {showRecommendations ? 'Hide Similar Artists' : 'Show Similar Artists'}
          </button>
          
          {showRecommendations && (
            <div className={styles.recommendationsList}>
              {recs.artists.map((artist, index) => (
                <div key={index} className={styles.recommendationItem}>
                  <span className={styles.recommendationName}>{artist.name}</span>
                  <div className={styles.recommendationMatch}>
                    <div className={styles.matchFill} style={{ width: `${artist.matchScore}%` }}></div>
                    <span className={styles.matchScore}>{artist.matchScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.infoColumn}>
          <div className={styles.columnHeader}>
            <h3 className={styles.columnTitle}>Repeat Track</h3>
            {topTrack?.popularity && (
              <div className={styles.popularityIndicator}>
                <div className={styles.popularityFill} style={{ width: `${topTrack.popularity}%` }}></div>
                <span className={styles.popularityText}>{topTrack.popularity}%</span>
              </div>
            )}
          </div>
          
          <div className={styles.trackCard}>
            <span className={styles.trackName}>
              {topTrack?.name || 'Unknown Track'}
            </span>
            {topTrack?.artist && (
              <span className={styles.trackArtist}>by {topTrack.artist}</span>
            )}
          </div>
          
          <button 
            className={styles.recommendationsToggle} 
            onClick={toggleRecommendations}
          >
            {showRecommendations ? 'Hide Similar Tracks' : 'Show Similar Tracks'}
          </button>
          
          {showRecommendations && (
            <div className={styles.recommendationsList}>
              {recs.tracks.map((track, index) => (
                <div key={index} className={styles.recommendationItem}>
                  <div className={styles.recommendationTrackInfo}>
                    <span className={styles.recommendationName}>{track.name}</span>
                    {track.artist && (
                      <span className={styles.recommendationArtist}>by {track.artist}</span>
                    )}
                  </div>
                  <div className={styles.recommendationMatch}>
                    <div className={styles.matchFill} style={{ width: `${track.matchScore}%` }}></div>
                    <span className={styles.matchScore}>{track.matchScore}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className={styles.feedbackContainer}>
        <span className={styles.feedbackQuestion}>Did we get it right?</span>
        <button className={styles.noButton}>no</button>
      </div>
    </div>
  );
}