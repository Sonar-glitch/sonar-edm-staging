/**
 * Spotify API integration for Sonar EDM Platform
 * 
 * This module provides functions to interact with the Spotify API
 * using the centralized configuration system for authentication.
 */

const axios = require('axios');
const config = require('../config');

// Cache for Spotify access token
let spotifyAccessToken = null;
let tokenExpirationTime = null;

/**
 * Get a client credentials access token from Spotify API
 * @returns {Promise<string>} Access token
 */
async function getClientCredentialsToken() {
  // Check if we have a valid cached token
  if (spotifyAccessToken && tokenExpirationTime && Date.now() < tokenExpirationTime) {
    return spotifyAccessToken;
  }

  try {
    // Validate Spotify configuration
    if (!config.spotify.isConfigured()) {
      throw new Error('Spotify API credentials are not configured');
    }

    // Prepare authentication for Spotify API
    const authString = Buffer.from(
      `${config.spotify.clientId}:${config.spotify.clientSecret}`
    ).toString('base64');

    // Request new access token
    const response = await axios({
      method: 'post',
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        'Authorization': `Basic ${authString}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: 'grant_type=client_credentials'
    });

    // Cache the token and set expiration time
    spotifyAccessToken = response.data.access_token;
    // Set expiration time 5 minutes before actual expiration for safety
    tokenExpirationTime = Date.now() + (response.data.expires_in - 300) * 1000;
    
    return spotifyAccessToken;
  } catch (error) {
    console.error('Error getting Spotify access token:', error.message);
    throw error;
  }
}

/**
 * Create an authenticated Spotify API client
 * @returns {Object} Spotify API client with common methods
 */
async function createSpotifyClient() {
  const token = await getClientCredentialsToken();
  
  return {
    /**
     * Search for artists, tracks, or genres
     * @param {string} query - Search query
     * @param {string} type - Type of search (artist, track, etc.)
     * @param {number} limit - Maximum number of results
     * @returns {Promise<Object>} Search results
     */
    search: async (query, type = 'artist', limit = 20) => {
      try {
        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/search',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            q: query,
            type,
            limit
          }
        });
        return response.data;
      } catch (error) {
        console.error('Spotify search error:', error.message);
        throw error;
      }
    },

    /**
     * Get artist details by ID
     * @param {string} artistId - Spotify artist ID
     * @returns {Promise<Object>} Artist details
     */
    getArtist: async (artistId) => {
      try {
        const response = await axios({
          method: 'get',
          url: `https://api.spotify.com/v1/artists/${artistId}`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error getting artist details:', error.message);
        throw error;
      }
    },

    /**
     * Get top tracks for an artist
     * @param {string} artistId - Spotify artist ID
     * @param {string} market - Market code (e.g., 'US')
     * @returns {Promise<Object>} Top tracks
     */
    getArtistTopTracks: async (artistId, market = 'US') => {
      try {
        const response = await axios({
          method: 'get',
          url: `https://api.spotify.com/v1/artists/${artistId}/top-tracks`,
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            market
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error getting artist top tracks:', error.message);
        throw error;
      }
    },

    /**
     * Get related artists
     * @param {string} artistId - Spotify artist ID
     * @returns {Promise<Object>} Related artists
     */
    getRelatedArtists: async (artistId) => {
      try {
        const response = await axios({
          method: 'get',
          url: `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error getting related artists:', error.message);
        throw error;
      }
    },

    /**
     * Get genre recommendations
     * @param {Array<string>} seedGenres - List of seed genres
     * @param {number} limit - Maximum number of recommendations
     * @returns {Promise<Object>} Recommendations
     */
    getRecommendations: async (seedGenres, limit = 20) => {
      try {
        const response = await axios({
          method: 'get',
          url: 'https://api.spotify.com/v1/recommendations',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          params: {
            seed_genres: seedGenres.join(','),
            limit
          }
        });
        return response.data;
      } catch (error) {
        console.error('Error getting recommendations:', error.message);
        throw error;
      }
    }
  };
}

module.exports = {
  getClientCredentialsToken,
  createSpotifyClient
};
