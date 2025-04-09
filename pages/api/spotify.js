/**
 * API routes for Spotify data in Sonar EDM Platform
 * 
 * This file provides API endpoints for accessing Spotify data
 * using the centralized configuration system.
 */

import { createSpotifyClient } from '../../lib/spotify';
import { getSession } from 'next-auth/react';

/**
 * API handler for Spotify-related endpoints
 */
export default async function handler(req, res) {
  // Check if the request method is GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the current user session
    const session = await getSession({ req });
    
    // Create a Spotify client
    const spotifyClient = await createSpotifyClient();
    
    // Extract query parameters
    const { type, query, id, market } = req.query;
    
    // Handle different endpoint types
    switch (type) {
      case 'search':
        if (!query) {
          return res.status(400).json({ error: 'Query parameter is required' });
        }
        const searchResults = await spotifyClient.search(query, req.query.searchType || 'artist');
        return res.status(200).json(searchResults);
        
      case 'artist':
        if (!id) {
          return res.status(400).json({ error: 'Artist ID is required' });
        }
        const artistData = await spotifyClient.getArtist(id);
        return res.status(200).json(artistData);
        
      case 'top-tracks':
        if (!id) {
          return res.status(400).json({ error: 'Artist ID is required' });
        }
        const topTracks = await spotifyClient.getArtistTopTracks(id, market || 'US');
        return res.status(200).json(topTracks);
        
      case 'related-artists':
        if (!id) {
          return res.status(400).json({ error: 'Artist ID is required' });
        }
        const relatedArtists = await spotifyClient.getRelatedArtists(id);
        return res.status(200).json(relatedArtists);
        
      case 'recommendations':
        if (!req.query.genres) {
          return res.status(400).json({ error: 'Seed genres are required' });
        }
        const genres = req.query.genres.split(',');
        const recommendations = await spotifyClient.getRecommendations(genres);
        return res.status(200).json(recommendations);
        
      default:
        return res.status(400).json({ error: 'Invalid endpoint type' });
    }
  } catch (error) {
    console.error('API error:', error.message);
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
}
