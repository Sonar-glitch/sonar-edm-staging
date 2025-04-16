// This file contains the updated implementation for the user-taste API endpoint
// Path: pages/api/spotify/user-taste.js

import { getSession } from 'next-auth/react';
import axios from 'axios';

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }
  
  try {
    // Get access token from session
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return res.status(400).json({ success: false, error: 'No access token available' });
    }
    
    // Fetch user's top artists
    const topArtistsResponse = await axios.get(
      'https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=10',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    // Fetch user's top tracks
    const topTracksResponse = await axios.get(
      'https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=10',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    // Process top artists data
    const topArtists = await Promise.all(topArtistsResponse.data.items.map(async (artist, index) => {
      // Calculate match percentage (100 for first artist, decreasing by 5 for each subsequent artist)
      const match = Math.max(100 - (index * 5), 60);
      
      // Fetch similar artists for each top artist
      let similarArtists = [];
      try {
        const similarArtistsResponse = await axios.get(
          `https://api.spotify.com/v1/artists/${artist.id}/related-artists`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );
        
        // Get names of top 5 similar artists
        similarArtists = similarArtistsResponse.data.artists
          .slice(0, 5)
          .map(similarArtist => similarArtist.name);
      } catch (error) {
        console.error(`Error fetching similar artists for ${artist.name}:`, error.message);
        // Continue even if similar artists fetch fails
      }
      
      return {
        id: artist.id,
        name: artist.name,
        genres: artist.genres,
        image: artist.images && artist.images.length > 0 ? artist.images[0].url : null,
        match: match,
        similarArtists: similarArtists
      };
    }));
    
    // Process top tracks data
    const topTracks = topTracksResponse.data.items.map(track => ({
      id: track.id,
      name: track.name,
      artist: track.artists.map(artist => artist.name).join(', '),
      album: track.album.name,
      image: track.album.images && track.album.images.length > 0 ? track.album.images[0].url : null,
      previewUrl: track.preview_url
    }));
    
    // Extract genres from top artists and count occurrences
    const genreCounts = {};
    topArtists.forEach(artist => {
      artist.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });
    
    // Convert to array, sort by count, and take top 6 genres
    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, count], index) => ({
        label: label.charAt(0).toUpperCase() + label.slice(1),
        value: Math.max(100 - (index * 10), 20) // Scale values for better visualization
      }));
    
    // Create seasonal mood data based on genres
    const seasonalMood = {
      spring: [],
      summer: [],
      fall: [],
      winter: []
    };
    
    // Assign genres to seasons based on their characteristics
    // This is a simplified approach - in a real app, you might use more sophisticated analysis
    Object.keys(genreCounts).forEach(genre => {
      if (genre.includes('house') || genre.includes('pop') || genre.includes('tropical')) {
        seasonalMood.spring.push(genre);
      } else if (genre.includes('dance') || genre.includes('edm') || genre.includes('electro')) {
        seasonalMood.summer.push(genre);
      } else if (genre.includes('techno') || genre.includes('deep') || genre.includes('progressive')) {
        seasonalMood.fall.push(genre);
      } else if (genre.includes('ambient') || genre.includes('chill') || genre.includes('melodic')) {
        seasonalMood.winter.push(genre);
      } else {
        // Randomly assign remaining genres
        const seasons = ['spring', 'summer', 'fall', 'winter'];
        const randomSeason = seasons[Math.floor(Math.random() * seasons.length)];
        seasonalMood[randomSeason].push(genre);
      }
    });
    
    // Take top 3 genres for each season
    Object.keys(seasonalMood).forEach(season => {
      seasonalMood[season] = seasonalMood[season]
        .slice(0, 3)
        .map(genre => genre.charAt(0).toUpperCase() + genre.slice(1));
    });
    
    // Generate taste labels based on top genres
    const tasteLabels = [];
    if (genreCounts['house'] || genreCounts['deep house'] || genreCounts['progressive house']) {
      tasteLabels.push('House Enthusiast');
    }
    if (genreCounts['techno'] || genreCounts['tech house']) {
      tasteLabels.push('Techno Lover');
    }
    if (genreCounts['trance'] || genreCounts['progressive trance']) {
      tasteLabels.push('Trance Addict');
    }
    if (genreCounts['drum and bass'] || genreCounts['jungle']) {
      tasteLabels.push('Bass Head');
    }
    if (genreCounts['ambient'] || genreCounts['chill']) {
      tasteLabels.push('Chill Seeker');
    }
    
    // If no specific labels were generated, add a generic one
    if (tasteLabels.length === 0) {
      tasteLabels.push('EDM Explorer');
    }
    
    // Generate a taste profile description
    const tasteProfile = `Your music taste shows a strong preference for ${topGenres[0]?.label || 'electronic music'} with elements of ${topGenres[1]?.label || 'various genres'}. You appreciate artists like ${topArtists[0]?.name || 'diverse performers'} who create immersive soundscapes and dynamic beats.`;
    
    // Compile all data
    const tasteData = {
      topGenres,
      topArtists,
      topTracks,
      seasonalMood,
      tasteLabels,
      tasteProfile
    };
    
    return res.status(200).json({ success: true, taste: tasteData });
  } catch (error) {
    console.error('Error fetching music taste data:', error.response?.data || error.message);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch music taste data',
      details: error.response?.data || error.message
    });
  }
}
