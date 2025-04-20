import React, { useEffect, useState } from "react";

export default function MusicTastePage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTaste() {
      try {
        const res = await fetch("/api/spotify/user-taste");
        if (!res.ok) throw new Error("Failed to fetch");
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError("Could not load your music taste. Try reconnecting your Spotify.");
      } finally {
        setLoading(false);
      }
    }

    fetchTaste();
  }, []);

  return (
    <div style={{ color: "white", padding: "2rem", fontFamily: "sans-serif", backgroundColor: "#0b0014" }}>
      <h1>Your Sonic Signature</h1>
      {loading && <p>Loading your vibe...</p>}
      {error && <p>{error}</p>}
      {!loading && !error && data && (
        <div>
          <h2>Top Artist</h2>
          <p>{data.topArtist || "No artist data"}</p>
          <h2>Repeat Track</h2>
          <p>{data.repeatTrack || "No track data"}</p>
          <h3>Events You’ll Like</h3>
          <p>{data.events?.length ? data.events.join(", ") : "No events matched your vibe yet."}</p>
          <p>Did we get it right? <strong>yes</strong> / <strong>no</strong></p>
        </div>
      )}
    </div>
  );
}