
import React, { useEffect, useState } from 'react';
import GenreRadarChart from '@/components/GenreRadarChart';
import SeasonalMood from '@/components/SeasonalMood';
import styles from '@/styles/MusicTaste.module.css';

export default function MusicTastePage() {
  const [tasteData, setTasteData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/spotify/user-taste')
      .then(res => res.json())
      .then(data => {
        setTasteData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load user taste.');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.container}>
      <SeasonalMood mood={tasteData.mood || 'Energetic Flow'} />
      <GenreRadarChart genreData={tasteData.genreProfile || { techno: 50, house: 40 }} />
    </div>
  );
}
