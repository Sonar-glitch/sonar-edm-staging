import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from '@/styles/ArtistTrackSection.module.css';

export default function ArtistTrackSection({ topArtist, topTrack, similarArtists, similarTracks }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPreview, setCurrentPreview] = useState(null);
  const [audioElement, setAudioElement] = useState(null);
  
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
      <div className={styles.sections}>
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Top Artist</h3>
          {topArtist ? (
            <div className={styles.mediaCard}>
              <div className={styles.mediaImage}>
                {topArtist.images && topArtist.images.length > 0 ? (
                  <Image 
                    src={topArtist.images[0].url} 
                    alt={topArtist.name}
                    width={80}
                    height={80}
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
                  <span className={styles.popularityBadge}>
                    {topArtist.popularity}% popularity
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.placeholderCard}>No data available</div>
          )}
          
          {similarArtists && similarArtists.length > 0 && (
            <div className={styles.similarSection}>
              <h4 className={styles.similarTitle}>Similar Artists</h4>
              <div className={styles.similarList}>
                {similarArtists.slice(0, 3).map((artist) => (
                  <div key={artist.id || artist.name} className={styles.similarItem}>
                    <span className={styles.similarName}>{artist.name}</span>
                    {artist.matchScore && (
                      <span className={styles.matchScore}>{artist.matchScore}%</span>
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.showMoreContainer}>
                <Link href="/artists/recommendations" className={styles.showMoreLink}>
                  Show more
                </Link>
              </div>
            </div>
          )}
        </div>
        
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Top Track</h3>
          {topTrack ? (
            <div className={styles.mediaCard}>
              <div className={styles.mediaImage}>
                {topTrack.album?.images && topTrack.album.images.length > 0 ? (
                  <div className={styles.trackImageContainer}>
                    <Image 
                      src={topTrack.album.images[0].url} 
                      alt={topTrack.name}
                      width={80}
                      height={80}
                      className={styles.trackImage}
                    />
                    {topTrack.preview_url && (
                      <button 
                        className={`${styles.playButton} ${currentPreview === topTrack.preview_url && isPlaying ? styles.playing : ''}`}
                        onClick={() => togglePlay(topTrack.preview_url)}
                        aria-label={isPlaying ? "Pause" : "Play"}
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
                <p className={styles.mediaArtist}>
                  {topTrack.artists && topTrack.artists.length > 0 
                    ? topTrack.artists[0].name 
                    : 'Unknown Artist'}
                </p>
                {topTrack.popularity && (
                  <span className={styles.popularityBadge}>
                    {topTrack.popularity}% popularity
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.placeholderCard}>No data available</div>
          )}
          
          {similarTracks && similarTracks.length > 0 && (
            <div className={styles.similarSection}>
              <h4 className={styles.similarTitle}>Similar Tracks</h4>
              <div className={styles.similarList}>
                {similarTracks.slice(0, 3).map((track) => (
                  <div key={track.id || track.name} className={styles.similarItem}>
                    <div className={styles.trackInfo}>
                      <span className={styles.similarName}>{track.name}</span>
                      <span className={styles.similarArtist}>{track.artist}</span>
                    </div>
                    {track.matchScore && (
                      <span className={styles.matchScore}>{track.matchScore}%</span>
                    )}
                    {track.preview_url && (
                      <button 
                        className={`${styles.miniPlayButton} ${currentPreview === track.preview_url && isPlaying ? styles.playing : ''}`}
                        onClick={() => togglePlay(track.preview_url)}
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {currentPreview === track.preview_url && isPlaying ? '■' : '▶'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.showMoreContainer}>
                <Link href="/tracks/recommendations" className={styles.showMoreLink}>
                  Show more
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}