export async function getFullSpotifyProfile(token) {
  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const endpoints = [
    ["topArtists", "https://api.spotify.com/v1/me/top/artists?limit=10"],
    ["topTracks", "https://api.spotify.com/v1/me/top/tracks?limit=10"],
    ["recentTracks", "https://api.spotify.com/v1/me/player/recently-played?limit=10"],
    ["profile", "https://api.spotify.com/v1/me"]
  ];

  const fetchJson = (url) => fetch(url, { headers }).then(res => res.json());

  const results = await Promise.all(endpoints.map(([_, url]) => fetchJson(url)));
  
  const [topArtists, topTracks, recentTracks, profile] = results;

  return { topArtists, topTracks, recentTracks, profile };
}