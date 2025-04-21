import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import GenreRadarChart from '@/components/GenreRadarChart';
import styles from '@/styles/SonicSignature.module.css';

export default function SonicSignature({ genreData, mood, topArtist, topTrack, recommendations }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  const [showArtists, setShowArtists] = useState(false);
  const [showTracks, setShowTracks] = useState(false);
  
  // Get primary genres for summary display
  const getPrimaryGenres = () => {
    if (!genreData || Object.keys(genreData).length === 0) return '';
    
    // Sort genres by value (highest first) and take top 2
    const sortedGenres = Object.entries(genreData)
      .sort(([, a], [, b]) => b - a)
      .map(([genre]) => genre)
      .slice(0, 2);
      
    return sortedGenres.join(' + ').toLowerCase();
  };
  
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

  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
    };
  }, [audioElement]);
  
  const openInSpotify = (type, id) => {
    if (!id) return;
    const url = `https://open.spotify.com/${type}/${id}`;
    window.open(url, '_blank');
  };
  
  // Format the "You're all about..." text
  const getSummaryText = () => {
    const primaryGenres = getPrimaryGenres();
    return (
      <div className={styles.summaryContainer}>
        <p className={styles.summaryText}>
          You're all about <span className={styles.highlight}>{primaryGenres}</span> with a vibe shift toward <span className={styles.highlight}>fresh sounds</span>.
        </p>
      </div>
    );
  };
  
  return (
    <div className={styles.container}>
      {/* Summary text instead of title */}
      {getSummaryText()}
      
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
        <div className={styles.mediaCard}>
          <h3 className={styles.cardTitle}>Top Artist</h3>
          {topArtist ? (
            <div className={styles.mediaContent}>
              <div className={styles.mediaHeader}>
                {topArtist.images && topArtist.images.length > 0 ? (
                  <div className={styles.imageContainer}>
                    <Image 
                      src={topArtist.images[0].url} 
                      alt={topArtist.name}
                      width={80}
                      height={80}
                      className={styles.artistImage}
                    />
                    <button 
                      className={styles.spotifyButton}
                      onClick={() => openInSpotify('artist', topArtist.id)}
                      aria-label="Open in Spotify"
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM11.7 11.5C11.6 11.7 11.3 11.8 11.1 11.7C9.2 10.5 6.8 10.3 4 10.9C3.8 11 3.6 10.8 3.5 10.6C3.4 10.4 3.6 10.2 3.8 10.1C6.8 9.4 9.5 9.7 11.6 11C11.8 11.1 11.8 11.4 11.7 11.5ZM12.7 9.3C12.5 9.5 12.2 9.6 12 9.4C9.8 8 6.6 7.6 4 8.4C3.7 8.5 3.4 8.3 3.3 8C3.2 7.7 3.4 7.4 3.7 7.3C6.7 6.5 10.2 6.8 12.7 8.5C12.9 8.6 13 9 12.7 9.3ZM12.8 7C10.2 5.5 5.9 5.3 3.5 6.1C3.2 6.2 2.8 6 2.7 5.7C2.6 5.4 2.8 5 3.1 4.9C5.9 4 10.6 4.2 13.6 6C13.9 6.2 14 6.6 13.8 6.9C13.6 7.1 13.2 7.2 12.8 7Z" fill="#1DB954"/>
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className={styles.placeholderImage}>
                    {topArtist.name.charAt(0)}
                  </div>
                )}
                
                <div className={styles.mediaInfo}>
                  <h4 className={styles.mediaName}>{topArtist.name}</h4>
                  {topArtist.genres && topArtist.genres.length > 0 && (
                    <div className={styles.genreTags}>
                      {topArtist.genres.slice(0, 2).map(genre => (
                        <span key={genre} className={styles.genreTag}>
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  {topArtist.popularity && (
                    <div className={styles.popularityBadge}>
                      {topArtist.popularity}% popularity
                    </div>
                  )}
                </div>
              </div>
              
              {recommendations?.artists && recommendations.artists.length > 0 && (
                <div className={styles.similarSection}>
                  <button 
                    className={styles.toggleButton}
                    onClick={() => setShowArtists(!showArtists)}
                  >
                    {showArtists ? 'Hide Similar Artists' : 'Show Similar Artists'}
                  </button>
                  
                  {showArtists && (
                    <div className={styles.similarList}>
                      {recommendations.artists.slice(0, 3).map((artist) => (
                        <div key={artist.id} className={styles.similarItem}>
                          <div className={styles.similarInfo}>
                            <span className={styles.similarName}>{artist.name}</span>
                            <div className={styles.scoreContainer}>
                              <span className={styles.matchScore}>{artist.matchScore}% match</span>
                              <span className={styles.popularityScore}>{artist.popularity}% popularity</span>
                            </div>
                          </div>
                          <button
                            className={styles.miniSpotifyButton}
                            onClick={() => openInSpotify('artist', artist.id)}
                            aria-label="Open in Spotify"
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM11.7 11.5C11.6 11.7 11.3 11.8 11.1 11.7C9.2 10.5 6.8 10.3 4 10.9C3.8 11 3.6 10.8 3.5 10.6C3.4 10.4 3.6 10.2 3.8 10.1C6.8 9.4 9.5 9.7 11.6 11C11.8 11.1 11.8 11.4 11.7 11.5Z" fill="#1DB954"/>
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.placeholderContent}>
              <div className={styles.placeholderImage}>?</div>
              <p>No top artist data available</p>
            </div>
          )}
        </div>
        
        <div className={styles.mediaCard}>
          <h3 className={styles.cardTitle}>Repeat Track</h3>
          {topTrack ? (
            <div className={styles.mediaContent}>
              <div className={styles.mediaHeader}>
                {topTrack.album?.images && topTrack.album.images.length > 0 ? (
                  <div className={styles.imageContainer}>
                    <Image 
                      src={topTrack.album.images[0].url} 
                      alt={topTrack.name}
                      width={80}
                      height={80}
                      className={styles.trackImage}
                    />
                    <div className={styles.buttonOverlay}>
                      {topTrack.preview_url && (
                        <button 
                          className={`${styles.playButton} ${currentPreview === topTrack.preview_url && isPlaying ? styles.playing : ''}`}
                          onClick={() => togglePlay(topTrack.preview_url)}
                          aria-label={isPlaying && currentPreview === topTrack.preview_url ? "Pause" : "Play 30s preview"}
                        >
                          {currentPreview === topTrack.preview_url && isPlaying ? '■' : '▶'}
                        </button>
                      )}
                      <button 
                        className={styles.spotifyButton}
                        onClick={() => openInSpotify('track', topTrack.id)}
                        aria-label="Open in Spotify"
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM11.7 11.5C11.6 11.7 11.3 11.8 11.1 11.7C9.2 10.5 6.8 10.3 4 10.9C3.8 11 3.6 10.8 3.5 10.6C3.4 10.4 3.6 10.2 3.8 10.1C6.8 9.4 9.5 9.7 11.6 11C11.8 11.1 11.8 11.4 11.7 11.5Z" fill="#1DB954"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.placeholderImage}>
                    ♪
                  </div>
                )}
                
                <div className={styles.mediaInfo}>
                  <h4 className={styles.mediaName}>{topTrack.name}</h4>
                  <p className={styles.artistName}>
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
              
              {recommendations?.tracks && recommendations.tracks.length > 0 && (
                <div className={styles.similarSection}>
                  <button 
                    className={styles.toggleButton}
                    onClick={() => setShowTracks(!showTracks)}
                  >
                    {showTracks ? 'Hide Similar Tracks' : 'Show Similar Tracks'}
                  </button>
                  
                  {showTracks && (
                    <div className={styles.similarList}>
                      {recommendations.tracks.slice(0, 3).map((track) => (
                        <div key={track.id} className={styles.similarItem}>
                          <div className={styles.similarInfo}>
                            <span className={styles.similarName}>{track.name}</span>
                            <span className={styles.similarArtist}>{track.artist}</span>
                            <div className={styles.scoreContainer}>
                              <span className={styles.matchScore}>{track.matchScore}% match</span>
                              <span className={styles.popularityScore}>{track.popularity}% popularity</span>
                            </div>
                          </div>
                          <div className={styles.trackControls}>
                            {track.preview_url && (
                              <button 
                                className={`${styles.miniPlayButton} ${currentPreview === track.preview_url && isPlaying ? styles.playing : ''}`}
                                onClick={() => togglePlay(track.preview_url)}
                                aria-label={isPlaying && currentPreview === track.preview_url ? "Pause" : "Play 30s preview"}
                              >
                                {currentPreview === track.preview_url && isPlaying ? '■' : '▶'}
                              </button>
                            )}
                            <button
                              className={styles.miniSpotifyButton}
                              onClick={() => openInSpotify('track', track.id)}
                              aria-label="Open in Spotify"
                            >
                              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8 0C3.6 0 0 3.6 0 8C0 12.4 3.6 16 8 16C12.4 16 16 12.4 16 8C16 3.6 12.4 0 8 0ZM11.7 11.5C11.6 11.7 11.3 11.8 11.1 11.7C9.2 10.5 6.8 10.3 4 10.9C3.8 11 3.6 10.8 3.5 10.6C3.4 10.4 3.6 10.2 3.8 10.1C6.8 9.4 9.5 9.7 11.6 11C11.8 11.1 11.8 11.4 11.7 11.5Z" fill="#1DB954"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.placeholderContent}>
              <div className={styles.placeholderImage}>♪</div>
              <p>No top track data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}