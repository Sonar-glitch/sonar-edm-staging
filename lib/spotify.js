/**
 * Enhanced Spotify API integration for Sonar EDM Platform
 */

// Base Spotify API URL
const SPOTIFY_API_URL = 'https://api.spotify.com/v1';

/**
 * Get user's top artists
 * @param {string} token - Spotify access token
 * @param {string} timeRange - Time range (short_term, medium_term, long_term)
 * @param {number} limit - Number of artists to fetch
 * @returns {Promise<Object>} - Top artists data
 */
export async function getTopArtists(token, timeRange = 'medium_term', limit = 10) {
  const res = await fetch(`${SPOTIFY_API_URL}/me/top/artists?time_range=${timeRange}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch top artists: ${error.error?.message || res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Get user's top tracks
 * @param {string} token - Spotify access token
 * @param {string} timeRange - Time range (short_term, medium_term, long_term)
 * @param {number} limit - Number of tracks to fetch
 * @returns {Promise<Object>} - Top tracks data
 */
export async function getTopTracks(token, timeRange = 'medium_term', limit = 10) {
  const res = await fetch(`${SPOTIFY_API_URL}/me/top/tracks?time_range=${timeRange}&limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch top tracks: ${error.error?.message || res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Get audio features for multiple tracks
 * @param {string} token - Spotify access token
 * @param {string[]} trackIds - Array of track IDs
 * @returns {Promise<Object>} - Audio features data
 */
export async function getAudioFeaturesForTracks(token, trackIds) {
  if (!trackIds || trackIds.length === 0) {
    return { audio_features: [] };
  }
  
  const ids = trackIds.join(',');
  const res = await fetch(`${SPOTIFY_API_URL}/audio-features?ids=${ids}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch audio features: ${error.error?.message || res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Get recently played tracks
 * @param {string} token - Spotify access token
 * @param {number} limit - Number of tracks to fetch
 * @returns {Promise<Object>} - Recently played tracks data
 */
export async function getRecentlyPlayed(token, limit = 20) {
  const res = await fetch(`${SPOTIFY_API_URL}/me/player/recently-played?limit=${limit}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch recently played: ${error.error?.message || res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Get recommendations based on seed genres, artists, or tracks
 * @param {string} token - Spotify access token
 * @param {Object} seedParams - Seed parameters (seed_artists, seed_genres, seed_tracks)
 * @param {Object} targetParams - Target audio features
 * @param {number} limit - Number of recommendations to fetch
 * @returns {Promise<Object>} - Recommendations data
 */
export async function getRecommendations(token, seedParams, targetParams = {}, limit = 20) {
  // Construct query parameters
  const queryParams = new URLSearchParams({
    limit,
    ...seedParams,
    ...targetParams
  });
  
  const res = await fetch(`${SPOTIFY_API_URL}/recommendations?${queryParams.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch recommendations: ${error.error?.message || res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Get detailed information about specific tracks
 * @param {string} token - Spotify access token
 * @param {string[]} trackIds - Array of track IDs
 * @returns {Promise<Object>} - Tracks data
 */
export async function getTracks(token, trackIds) {
  if (!trackIds || trackIds.length === 0) {
    return { tracks: [] };
  }
  
  const ids = trackIds.join(',');
  const res = await fetch(`${SPOTIFY_API_URL}/tracks?ids=${ids}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch tracks: ${error.error?.message || res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Get available genre seeds for recommendations
 * @param {string} token - Spotify access token
 * @returns {Promise<Object>} - Available genre seeds
 */
export async function getGenreSeeds(token) {
  const res = await fetch(`${SPOTIFY_API_URL}/recommendations/available-genre-seeds`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Failed to fetch genre seeds: ${error.error?.message || res.statusText}`);
  }
  
  return await res.json();
}

/**
 * Search for items on Spotify
 * @param {string} token - Spotify access token
 * @param {string} query - Search query
 * @param {string} type - Item types to search (comma-separated)
 * @param {number} limit - Number of items to return
 * @returns {Promise<Object>} - Search results
 */
export async function search(token, query, type = 'track,artist', limit = 10) {
  const res = await fetch(
    `${SPOTIFY_API_URL}/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Search failed: ${error.error?.message || res.statusText}`);
  }
  
  return await res.json();
}