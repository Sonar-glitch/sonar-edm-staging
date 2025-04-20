export async function getTopArtists(token) {
  const res = await fetch('https://api.spotify.com/v1/me/top/artists?limit=10', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch top artists');
  return await res.json();
}

export async function getTopTracks(token) {
  const res = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=10', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch top tracks');
  return await res.json();
}

export async function getAudioFeaturesForTracks(token, trackIds) {
  const ids = trackIds.join(',');
  const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) throw new Error('Failed to fetch audio features');
  return await res.json();
}
