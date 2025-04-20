import { useEffect, useState } from "react";
import styles from "@/styles/MusicTaste.module.css";

export default function MusicTaste() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/spotify/user-taste")
      .then((res) => res.json())
      .then(setData)
      .catch(setError);
  }, []);

  if (error) return <div className={styles.error}>Error: {error.message}</div>;
  if (!data) return <div className={styles.loading}>Loading...</div>;

  const artist = data.artists?.items?.[0];
  const track = data.tracks?.items?.[0];

  return (
    <div className={styles.container}>
      <h1>Your Sonic Snapshot</h1>
      {artist && (
        <div className={styles.card}>
          <img src={artist.images?.[0]?.url} alt="Artist" className={styles.image} />
          <h2>{artist.name}</h2>
          <p>Popularity: {artist.popularity}</p>
        </div>
      )}
      {track && (
        <div className={styles.card}>
          <img src={track.album?.images?.[0]?.url} alt="Track" className={styles.image} />
          <h2>{track.name}</h2>
          <p>{track.artists.map((a) => a.name).join(", ")}</p>
        </div>
      )}
      <details>
        <summary>Full Data</summary>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}