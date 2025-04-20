import React, { useState } from 'react';
import Image from 'next/image';
import GenreRadarChart from '@/components/GenreRadarChart';
import styles from '@/styles/SonicSignature.module.css';

export default function SonicSignature({ genreData, mood, topArtist, topTrack, recommendations }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [showArtists, setShowArtists] = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  
  // Handle audio playback
  const togglePlay = (previewUrl) => {
    if (!previewUrl) return;
    
    // If we already have an audio element playing, stop it
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      
      // If we're clicking the same track, just stop it
      if (currentPreview === previewUrl) {
        setIsPlaying(false);
        setCurrentPreview(null);
        setAudioElement(null);
        return;
      }
    }
    
    // Create new audio element
    const audio = new Audio(previewUrl);
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
      setCurrentPreview(null);
    });
    
    audio.play().then(() => {
      setIsPlaying(true);
      setCurrentPreview(previewUrl);
      setAudioElement(audio);
    }).catch(err => {
      console.error('Failed to play track preview:', err);
      setIsPlaying(false);
    });
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
        <span className={styles.moodText}>{mood || 'Chillwave Flow'}</span>
      </div>
      
      <div className={styles.artistTrackSection}>
        <div className={styles.column}>
          <h3 className={styles.sectionTitle}>Top Artist</h3>
          {topArtist ? (
            <div className={styles.mediaCard}>
              <div className={styles.mediaImage}>
                {topArtist.images && topArtist.images.length > 0 ? (
                  <Image 
                    src={topArtist.images[0].url} 
                    alt={topArtist.name}
                    width={120}
                    height={120}
                    className={styles.artistImage}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    {topArtist.name.charAt(0)}
                  </div>
                )}
              </div>
              <div className={styles.mediaInfo}>
                <h4 className={styles.mediaName}>{topArtist.name}</h4>
                {topArtist.popularity && (
                  <div className={styles.popularityBadge}>
                    {topArtist.popularity}% popularity
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.placeholderCard}>
              <div className={styles.imagePlaceholder}>?</div>
              <p>No top artist data</p>
            </div>
          )}
          
          {recommendations?.artists && recommendations.artists.length > 0 && (
            <>
              <button 
                className={styles.similarButton}
                onClick={() => setShowArtists(!showArtists)}
              >
                {showArtists ? 'Hide Similar Artists' : 'Show Similar Artists'}
              </button>
              
              {showArtists && (
                <div className={styles.similarList}>
                  {recommendations.artists.slice(0, 3).map((artist) => (
                    <div key={artist.id} className={styles.similarItem}>
                      <div className={styles.itemName}>{artist.name}</div>
                      <div className={styles.itemScores}>
                        <span className={styles.matchScore}>{artist.matchScore}% match</span>
                        <span className={styles.popularity}>{artist.popularity}% popularity</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className={styles.column}>
          <h3 className={styles.sectionTitle}>Repeat Track</h3>
          {topTrack ? (
            <div className={styles.mediaCard}>
              <div className={styles.mediaImage}>
                {topTrack.album?.images && topTrack.album.images.length > 0 ? (
                  <div className={styles.trackImageContainer}>
                    <Image 
                      src={topTrack.album.images[0].url} 
                      alt={topTrack.name}
                      width={120}
                      height={120}
                      className={styles.trackImage}
                    />
                    {topTrack.preview_url && (
                      <button 
                        className={`${styles.playButton} ${currentPreview === topTrack.preview_url && isPlaying ? styles.playing : ''}`}
                        onClick={() => togglePlay(topTrack.preview_url)}
                      >
                        {currentPreview === topTrack.preview_url && isPlaying ? '■' : '▶'}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className={styles.imagePlaceholder}>
                    ♪
                  </div>
                )}
              </div>
              <div className={styles.mediaInfo}>
                <h4 className={styles.mediaName}>{topTrack.name}</h4>
                <p className={styles.mediaSubtitle}>
                  {topTrack.artists && topTrack.artists.length > 0 
                    ? topTrack.artists[0].name 
                    : 'Unknown Artist'}
                </p>
                {topTrack.popularity && (
                  <div className={styles.popularityBadge}>
                    {topTrack.popularity}% popularity
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.placeholderCard}>
              <div className={styles.imagePlaceholder}>♪</div>
              <p>No top track data</p>
            </div>
          )}
          
          {recommendations?.tracks && recommendations.tracks.length > 0 && (
            <>
              <button 
                className={styles.similarButton}
                onClick={() => setShowTracks(!showTracks)}
              >
                {showTracks ? 'Hide Similar Tracks' : 'Show Similar Tracks'}
              </button>
              
              {showTracks && (
                <div className={styles.similarList}>
                  {recommendations.tracks.slice(0, 3).map((track) => (
                    <div key={track.id} className={styles.similarItem}>
                      <div className={styles.itemNameContainer}>
                        <div className={styles.itemName}>{track.name}</div>
                        <div className={styles.itemArtist}>{track.artist}</div>
                      </div>
                      <div className={styles.itemScores}>
                        <span className={styles.matchScore}>{track.matchScore}% match</span>
                        <span className={styles.popularity}>{track.popularity}% popularity</span>
                      </div>
                      {track.preview_url && (
                        <button 
                          className={`${styles.smallPlayButton} ${currentPreview === track.preview_url && isPlaying ? styles.playing : ''}`}
                          onClick={() => togglePlay(track.preview_url)}
                        >
                          {currentPreview === track.preview_url && isPlaying ? '■' : '▶'}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
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