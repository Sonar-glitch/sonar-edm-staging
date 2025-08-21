import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

/**
 * Enhanced API for personalized recommendations
 * - Provides popularity and match scores for artists and tracks
 * - Ensures preview URLs are included for playback functionality
 */
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = session.accessToken;
    
    if (!token) {
      return res.status(401).json({ error: "No valid token" });
    }

    // Get seed data from user's listening history
    const [
      topArtists,
      topTracks,
      recentlyPlayed
    ] = await Promise.all([
      fetchTopArtists(token),
      fetchTopTracks(token),
      fetchRecentlyPlayed(token)
    ]);
    
    if (!topArtists || !topTracks) {
      return res.status(500).json({ error: "Failed to fetch user listening data" });
    }
    
    // Get artist and track seeds
    const artistSeeds = topArtists.items.slice(0, 2).map(artist => artist.id);
    const trackSeeds = topTracks.items.slice(0, 3).map(track => track.id);
    
    // Get recommendations based on seeds
    const recommendations = await fetchRecommendations(token, {
      seed_artists: artistSeeds.join(','),
      seed_tracks: trackSeeds.join(','),
      limit: 10
    });
    
    if (!recommendations) {
      return res.status(500).json({ error: "Failed to fetch recommendations" });
    }
    
    // Process recommended tracks to add match scores
    const enhancedTracks = enhanceTracksWithScores(
      recommendations.tracks, 
      topTracks.items,
      recentlyPlayed?.items
    );
    
    // Get similar artists based on top artists
    const similarArtists = await fetchSimilarArtists(token, topArtists.items[0].id);
    
    // Process similar artists to add match scores
    const enhancedArtists = enhanceArtistsWithScores(
      similarArtists?.artists || [],
      topArtists.items
    );
    
    // Return formatted recommendations
    return res.status(200).json({
      tracks: enhancedTracks,
      artists: enhancedArtists
    });
    
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: "Failed to generate recommendations",
      message: error.message
    });
  }
}

// Fetch top artists
async function fetchTopArtists(token, timeRange = 'short_term', limit = 10) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/artists?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch top artists:', await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching top artists:', error);
    return null;
  }
}

// Fetch top tracks
async function fetchTopTracks(token, timeRange = 'short_term', limit = 10) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/top/tracks?time_range=${timeRange}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch top tracks:', await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching top tracks:', error);
    return null;
  }
}

// Fetch recently played tracks
async function fetchRecentlyPlayed(token, limit = 20) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/me/player/recently-played?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch recently played:', await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching recently played:', error);
    return null;
  }
}

// Fetch recommendations
async function fetchRecommendations(token, params) {
  try {
    const queryParams = new URLSearchParams(params);
    
    const response = await fetch(
      `https://api.spotify.com/v1/recommendations?${queryParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch recommendations:', await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    return null;
  }
}

// Fetch similar artists
async function fetchSimilarArtists(token, artistId) {
  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/related-artists`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      console.error('Failed to fetch similar artists:', await response.text());
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching similar artists:', error);
    return null;
  }
}

// Calculate track match scores based on user's listening history
function enhanceTracksWithScores(recommendedTracks, topTracks, recentlyPlayed = []) {
  return recommendedTracks.map(track => {
    let matchScore = 65; // Base score
    
    // Check if the track's artist appears in the user's top artists
    const artistMatches = topTracks.filter(t => 
      t.artists.some(a => track.artists.some(ra => ra.id === a.id))
    ).length;
    
    if (artistMatches > 0) {
      matchScore += 15 * Math.min(artistMatches, 2); // Up to +30 points for artist match
    }
    
    // Check if track has similar genre to top tracks (using artist genres)
    // This is approximate since tracks don't have genres in Spotify
    if (track.artists[0]?.id) {
      const matchedTopArtists = topTracks.filter(t =>
        t.artists.some(a => a.id === track.artists[0].id)
      );
      
      if (matchedTopArtists.length > 0) {
        matchScore += 10; // +10 for genre similarity
      }
    }
    
    // Check if recently played (indicates current interest)
    if (recentlyPlayed) {
      const isRecentlyPlayed = recentlyPlayed.some(item => 
        item.track.id === track.id
      );
      
      if (isRecentlyPlayed) {
        matchScore += 10; // +10 for recent play
      }
    }
    
    // Ensure score is within bounds
    matchScore = Math.min(98, Math.max(60, matchScore));
    
    // Format track for client
    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown Artist',
      album: track.album?.name || 'Unknown Album',
      albumArt: track.album?.images?.[0]?.url || null,
      preview_url: track.preview_url || null,
      popularity: track.popularity || 70,
      matchScore: Math.round(matchScore)
    };
  });
}

// Calculate artist match scores based on user's listening history
function enhanceArtistsWithScores(similarArtists, topArtists) {
  return similarArtists.map(artist => {
    let matchScore = 65; // Base score
    
    // Check if artist appears in user's top artists
    const isInTopArtists = topArtists.some(a => a.id === artist.id);
    if (isInTopArtists) {
      matchScore += 30; // Major boost for being a top artist
    }
    
    // Check for genre overlap with top artists
    if (artist.genres && artist.genres.length > 0) {
      const topGenres = new Set(topArtists.flatMap(a => a.genres || []));
      const genreOverlap = artist.genres.filter(g => topGenres.has(g)).length;
      
      if (genreOverlap > 0) {
        matchScore += Math.min(20, genreOverlap * 5); // Up to +20 for genre overlap
      }
    }
    
    // Factor in popularity (gives a modest boost to more popular artists)
    if (artist.popularity) {
      matchScore += Math.round(artist.popularity / 20); // Up to +5 for very popular artists
    }
    
    // Ensure score is within bounds
    matchScore = Math.min(98, Math.max(60, matchScore));
    
    // Format artist for client
    return {
      id: artist.id,
      name: artist.name,
      images: artist.images || [],
      genres: artist.genres || [],
      popularity: artist.popularity || 70,
      matchScore: Math.round(matchScore)
    };
  });
}