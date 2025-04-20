export async function getTopArtists(token) {
  const res = await fetch(\`https://api.spotify.com/v1/me/top/artists?limit=10\`, {
    headers: {
      Authorization: \`Bearer \${token}\`,
    },
  });

  if (!res.ok) {
    throw new Error(\`Spotify top artists fetch failed: \${res.status}\`);
  }

  return await res.json();
}

export async function getTopTracks(token) {
  const res = await fetch(\`https://api.spotify.com/v1/me/top/tracks?limit=10\`, {
    headers: {
      Authorization: \`Bearer \${token}\`,
    },
  });

  if (!res.ok) {
    throw new Error(\`Spotify top tracks fetch failed: \${res.status}\`);
  }

  return await res.json();
}

export async function getAudioFeaturesForTracks(token, trackIds) {
  const ids = trackIds.join(',');
  const res = await fetch(\`https://api.spotify.com/v1/audio-features?ids=\${ids}\`, {
    headers: {
      Authorization: \`Bearer \${token}\`,
    },
  });

  if (!res.ok) {
    throw new Error(\`Spotify audio features fetch failed: \${res.status}\`);
  }

  return await res.json();
}
