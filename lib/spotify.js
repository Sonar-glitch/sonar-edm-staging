// lib/spotify.js - Update with better error handling

export async function getTopArtists(token, timeRange = 'medium_term', limit = 10) {
  try {
    const res = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = data.error?.message || res.statusText;
      throw new Error(`Failed to fetch top artists: ${errorMsg}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Spotify API error:', error);
    throw error;
  }
}

export async function getTopTracks(token, timeRange = 'medium_term', limit = 10) {
  try {
    const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = data.error?.message || res.statusText;
      throw new Error(`Failed to fetch top tracks: ${errorMsg}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Spotify API error:', error);
    throw error;
  }
}

export async function getAudioFeaturesForTracks(token, trackIds) {
  try {
    if (!trackIds || trackIds.length === 0) {
      return { audio_features: [] };
    }
    
    const ids = trackIds.join(',');
    const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = data.error?.message || res.statusText;
      throw new Error(`Failed to fetch audio features: ${errorMsg}`);
    }
    
    return await res.json();
  } catch (error) {
    console.error('Spotify API error:', error);
    throw error;
  }
}