import { useEffect, useState } from "react";
import GenreRadarChart from "../../components/GenreRadarChart";
import SeasonalMood from "../../components/SeasonalMood";
import styles from "../../styles/MusicTaste.module.css";

export default function MusicTaste() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/spotify/user-taste")
      .then(res => res.json())
      .then(setData)
      .catch(() => setData({ fallback: true }));
  }, []);

  if (!data) return <div>Loading your vibe...</div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.header}>Your Sonic Signature</h1>
      {data.fallback && <div className={styles.warning}>Using backup taste data</div>}
      <SeasonalMood mood={data.mood} />
      <GenreRadarChart genreData={data.genreData || {}} />
    </div>
  );
}
