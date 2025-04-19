
import { useEffect, useState } from 'react';
import styles from '../../styles/MusicTaste.module.css';

export default function MusicTastePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchTaste() {
      try {
        const res = await fetch('/api/spotify/user-taste');
        if (!res.ok) throw new Error('Network response was not ok');
        const result = await res.json();
        setData(result);
      } catch (err) {
        console.error('Failed to fetch user taste:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    fetchTaste();
  }, []);

  if (loading) return <div className={styles.container}><h2>Loading your vibe...</h2></div>;
  if (error || !data)
    return (
      <div className={styles.container}>
        <h1>Your Sonic Signature</h1>
        <p className={styles.error}>Could not load your music taste. Try reconnecting your Spotify.</p>
      </div>
    );

  const { topArtist, repeatTrack, matchedEvents } = data;

  return (
    <div className={styles.container}>
      <h1>Your Sonic Signature</h1>
      <div className={styles.summary}>
        <div><strong>Top Artist</strong><p>{topArtist || 'No artist data'}</p></div>
        <div><strong>Repeat Track</strong><p>{repeatTrack || 'No track data'}</p></div>
      </div>
      <div className={styles.events}>
        <h2>Events You’ll Like</h2>
        {matchedEvents && matchedEvents.length > 0 ? (
          <ul>{matchedEvents.map((event, idx) => <li key={idx}>{event}</li>)}</ul>
        ) : (
          <p>No events matched your vibe yet.</p>
        )}
      </div>
      <p>Did we get it right? <strong>yes / no</strong></p>
    </div>
  );
}
