import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Navigation from '../../components/Navigation';
import SpiderChart from '../../components/SpiderChart';
import ArtistCard from '../../components/ArtistCard';
import styles from '../../styles/MusicTaste.module.css';

export default function MusicTaste() {
  // ... existing code (session, router, state, etc.) ...

  // ... existing loading and error states ...

  return (
    <div className={styles.container}>
      <Navigation activePage="music-taste" />
      <h1 className={styles.title}>Your Music Taste Profile</h1>
      <p className={styles.subtitle}>Based on your Spotify listening history</p>
      
      {/* Spider Chart for Top Genres */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Your Genre Affinity</h2>
        <div className={styles.spiderChartContainer}>
          <SpiderChart genres={tasteData.topGenres} />
        </div>
      </div>
      
      {/* Your Music Personality */}
      <div className={styles.profileSection}>
        <h2 className={styles.sectionTitle}>Your Music Personality</h2>
        <div className={styles.tasteLabels}>
          {tasteData.tasteLabels.map((label, index) => (
            <span key={index} className={styles.tasteLabel}>{label}</span>
          ))}
        </div>
        <p className={styles.tasteProfile}>{tasteData.tasteProfile}</p>
      </div>
      
      {/* Top Artists with Similar Artists */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top Artists</h2>
        <p className={styles.sectionDescription}>
          Tap on an artist to see similar artists you might enjoy
        </p>
        <div className={styles.artistsList}>
          {tasteData.topArtists.map((artist, index) => (
            <ArtistCard key={index} artist={artist} />
          ))}
        </div>
      </div>
      
      {/* Rest of the existing code (Top Tracks, Genres, Seasonal Mood, etc.) */}
      
    </div>
  );
}
