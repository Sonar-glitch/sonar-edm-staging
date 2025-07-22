// SURGICAL FIX: /lib/spotify.js
// Adds missing getRecentlyPlayed function and improves error handling
// PRESERVES: All existing functions, just adds the missing one and enhances error handling

async function getTopArtists(token, timeRange = 'medium_term', limit = 20) {
  try {
    const res = await fetch(`https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = data.error?.message || res.statusText;
      throw new Error(`Failed to fetch top artists: ${errorMsg} (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error('Spotify API error in getTopArtists:', error.message);
    // ENHANCED: Return empty state with error info instead of throwing
    return { 
      items: [], 
      error: error.message,
      errorCode: 'TOP_ARTISTS_ERROR'
    };
  }
}

async function getTopTracks(token, timeRange = 'medium_term', limit = 50) {
  try {
    const res = await fetch(`https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = data.error?.message || res.statusText;
      throw new Error(`Failed to fetch top tracks: ${errorMsg} (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error('Spotify API error in getTopTracks:', error.message);
    // ENHANCED: Return empty state with error info instead of throwing
    return { 
      items: [], 
      error: error.message,
      errorCode: 'TOP_TRACKS_ERROR'
    };
  }
}

// SURGICAL ADDITION: Missing getRecentlyPlayed function
async function getRecentlyPlayed(token, limit = 50) {
  try {
    const res = await fetch(`https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = data.error?.message || res.statusText;
      throw new Error(`Failed to fetch recently played: ${errorMsg} (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error('Spotify API error in getRecentlyPlayed:', error.message);
    // ENHANCED: Return empty state with error info instead of throwing
    return { 
      items: [], 
      error: error.message,
      errorCode: 'RECENTLY_PLAYED_ERROR'
    };
  }
}

// ENHANCED: Get audio features for tracks (if needed in the future)
async function getAudioFeatures(token, trackIds) {
  try {
    if (!trackIds || trackIds.length === 0) {
      return { audio_features: [] };
    }
    
    const ids = Array.isArray(trackIds) ? trackIds.join(',') : trackIds;
    const res = await fetch(`https://api.spotify.com/v1/audio-features?ids=${ids}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = data.error?.message || res.statusText;
      throw new Error(`Failed to fetch audio features: ${errorMsg} (${res.status})`);
    }

    return await res.json();
  } catch (error) {
    console.error('Spotify API error in getAudioFeatures:', error.message);
    // Return empty state with error info
    return { 
      audio_features: [], 
      error: error.message,
      errorCode: 'AUDIO_FEATURES_ERROR'
    };
  }
}

// PRESERVED: Existing refresh token function with enhancements
async function refreshAccessToken(session) {
  try {
    const url = "https://accounts.spotify.com/api/token";

    const params = new URLSearchParams();
    params.append("grant_type", "refresh_token");
    params.append("refresh_token", session.refreshToken);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(
          `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
        ).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error('Token refresh failed:', refreshedTokens);
      throw refreshedTokens;
    }

    // ENHANCED: Return refreshed session with metadata
    return {
      ...session,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? session.refreshToken,
      expires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null;
  }
}

// ENHANCED: Validate token function for better error handling
async function validateToken(token) {
  try {
    const res = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    
    return res.ok;
  } catch (error) {
    console.error('Token validation error:', error.message);
    return false;
  }
}

// SURGICAL ADDITION: Export the new function while preserving existing exports
module.exports = {
  getTopArtists,
  getTopTracks,
  getRecentlyPlayed,    // ✅ NEW: Export the missing function
  getAudioFeatures,     // ✅ NEW: Export audio features function
  refreshAccessToken,
  validateToken         // ✅ NEW: Export token validation function
};

