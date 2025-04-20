const axios = require('axios');
const config = require('../config');

// Cache for Spotify access token
let spotifyAccessToken = null;
let tokenExpirationTime = null;

async function getClientCredentialsToken() {
  if (spotifyAccessToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return spotifyAccessToken;
  }

  try {
    if (!config.spotify.isConfigured()) {
      throw new Error('Spotify API credentials are not configured');
    }

    const authString = Buffer.from(
      `${config.spotify.clientId}:${config.spotify.clientSecret}`
    ).toString('base64');

    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });

    spotifyAccessToken = response.data.access_token;
    tokenExpirationTime = Date.now() + (response.data.expires_in - 300) * 1000;
    
    return spotifyAccessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error.message);
    throw error;
  }
}

async function createSpotifyClient() {
  const token = await getClientCredentialsToken();

  return {
    search: async (query, type = 'artist', limit = 20) => {
      try {
        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/search',
          headers: { 'Authorization': `Bearer ${token}` },
          params: { q: query, type, limit }
        });
        return response.data;
      } catch (error) {
        console.error('Spotify search error:', error.message);
        throw error;
      }
    },

    getArtist: async (artistId) => {
      try {
        const response = await axios({
          method: 'get',
          url: `https://api.spotify.com/v1/artists/${artistId}`,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        console.error('Error getting artist details:', error.message);
        throw error;
      }
    },

    getArtistTopTracks: async (artistId, market = 'US') => {
      try {
        const response = await axios({
          method: 'get',
          url: `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
          headers: { 'Authorization': `Bearer ${token}` },
          params: { market }
        });
        return response.data;
      } catch (error) {
        console.error('Error getting artist top tracks:', error.message);
        throw error;
      }
    },

    getRelatedArtists: async (artistId) => {
      try {
        const response = await axios({
          method: 'get',
          url: `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        return response.data;
      } catch (error) {
        console.error('Error getting related artists:', error.message);
        throw error;
      }
    },

    getRecommendations: async (seedGenres, limit = 20) => {
      try {
        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/recommendations',
          headers: { 'Authorization': `Bearer ${token}` },
          params: { seed_genres: seedGenres.join(','), limit }
        });
        return response.data;
      } catch (error) {
        console.error('Error getting recommendations:', error.message);
        throw error;
      }
    }
  };
}

// ✅ NEW FUNCTIONS FOR USER-AUTH DATA

async function getTopArtists(userToken) {
  try {
    const response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/top/artists',
      headers: { Authorization: `Bearer ${userToken}` },
      params: { limit: 10 }
    });
    console.log("RAW ARTISTS:", JSON.stringify(response.data, null, 2));
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching top artists:", error.message);
    return [];
  }
}

async function getTopTracks(userToken) {
  try {
    const response = await axios({
      method: 'get',
      url: 'https://api.spotify.com/v1/me/top/tracks',
      headers: { Authorization: `Bearer ${userToken}` },
      params: { limit: 10 }
    });
    console.log("RAW TRACKS:", JSON.stringify(response.data, null, 2));
    return response.data.items || [];
  } catch (error) {
    console.error("Error fetching top tracks:", error.message);
    return [];
  }
}

module.exports = {
  getClientCredentialsToken,
  createSpotifyClient,
  getTopArtists,
  getTopTracks
};
