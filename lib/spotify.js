const BASE_URL = "https://api.spotify.com/v1";

async function fetchSpotify(endpoint, token) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Spotify API error: ${res.status}`);
  return res.json();
}

export async function getTopArtists(token) {
  return fetchSpotify("/me/top/artists?limit=10", token);
}

export async function getTopTracks(token) {
  return fetchSpotify("/me/top/tracks?limit=10", token);
}