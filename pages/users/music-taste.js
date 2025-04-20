import React, { useEffect, useState } from "react";
import GenreRadarChart from "@/components/GenreRadarChart";
import SeasonalMood from "@/components/SeasonalMood";
import "@/styles/MusicTaste.module.css";

export default function MusicTastePage() {
  const [tasteData, setTasteData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchTaste() {
      try {
        const res = await fetch("/api/spotify/user-taste");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setTasteData(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      }
    }
    fetchTaste();
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!tasteData) return <div>Loading...</div>;

  return (
    <div className="taste-page">
      <h1>Your Sonic Signature</h1>
      <SeasonalMood mood={tasteData.mood} />
      <GenreRadarChart genres={tasteData.genreWeights} />
    </div>
  );
}
