import React from 'react';
import Image from 'next/image';
import styles from '@/styles/TopMusicInfo.module.css';

export default function TopMusicInfo({ topArtist, repeatTrack }) {
  // Fallback data if not provided
  const artist = topArtist || {
    name: 'Unknown Artist',
    images: [{ url: '/placeholder-artist.jpg' }]
  };
  
  const track = repeatTrack || {
    name: 'Unknown Track',
    color: '#ff007f'
  };

  return (
    <div className={styles.container}>
      <div className={styles.infoRow}>
        <div className={styles.infoCol}>
          <h3 className={styles.infoLabel}>Top Artist</h3>
          <div className={styles.artistCard}>
            {artist.images && artist.images[0] && (
              <div className={styles.artistImageContainer}>
                <Image 
                  src={artist.images[0].url} 
                  alt={artist.name}
                  width={50}
                  height={50}
                  className={styles.artistImage}
                />
              </div>
            )}
            <span 
              className={styles.artistName}
              style={{ color: '#FFDD00' }}
            >
              {artist.name}
            </span>
          </div>
        </div>
        
        <div className={styles.infoCol}>
          <h3 className={styles.infoLabel}>Repeat Track</h3>
          <div 
            className={styles.trackCard}
            style={{ 
              backgroundColor: 'rgba(255, 0, 127, 0.2)',
              borderColor: track.color || '#ff007f'
            }}
          >
            <span 
              className={styles.trackName}
              style={{ color: track.color || '#ff007f' }}
            >
              {track.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}