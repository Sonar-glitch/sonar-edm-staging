import { useEffect, useState } from 'react';

export default function MusicTaste() {
  const [taste, setTaste] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/spotify/user-taste")
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setTaste(data);
      })
      .catch(err => setError(err.message));
  }, []);

  if (error) return <div>Error: {error}</div>;
  if (!taste) return <div>Loading...</div>;

  return (
    <div className="taste-wrapper">
      <h1>Top Artist: {taste.topArtists?.items?.[0]?.name}</h1>
      <img src={taste.topArtists?.items?.[0]?.images?.[0]?.url} width="200" alt="Top Artist" />
      <h2>Top Track: {taste.topTracks?.items?.[0]?.name}</h2>
      <img src={taste.topTracks?.items?.[0]?.album?.images?.[0]?.url} width="200" alt="Top Track" />
      <p>Logged in as: {taste.profile?.display_name}</p>
    </div>
  );
}