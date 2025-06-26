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
/**
 * Refreshes the access token using the refresh token
 * @param {Object} session - The current session object
 * @returns {Object} - The updated session object with new tokens
 */
export async function refreshAccessToken(session) {
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
      throw refreshedTokens;
    }
    
    return {
      ...session,
      accessToken: refreshedTokens.access_token,
      refreshToken: refreshedTokens.refresh_token ?? session.refreshToken,
      expires: Date.now() + refreshedTokens.expires_in * 1000
    };
  } catch (error) {
    console.error("Error refreshing access token:", error);
    return null;
  }
}
