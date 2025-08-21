#!/usr/bin/env node
/**
 * YOUTUBE AUDIO EXTRACTION
 * Extract audio from YouTube videos for artists without preview URLs
 */

// Enhanced audio source functions for Essentia service

async function findYouTubeAudioUrl(artistName, trackName) {
  try {
    console.log(`🎥 Searching YouTube for: ${artistName} - ${trackName}`);
    
    // Search YouTube for the track
    const searchQuery = encodeURIComponent(`${artistName} ${trackName}`);
    const youtubeSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${searchQuery}&type=video&maxResults=5&key=${process.env.YOUTUBE_API_KEY}`;
    
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(youtubeSearchUrl);
    
    if (!response.ok) {
      console.log(`⚠️ YouTube search failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log(`⚠️ No YouTube results for: ${artistName} - ${trackName}`);
      return null;
    }
    
    // Find the best match (prefer official videos, audio quality)
    const bestMatch = data.items.find(item => {
      const title = item.snippet.title.toLowerCase();
      const description = item.snippet.description.toLowerCase();
      
      // Prefer official videos
      if (title.includes('official') || description.includes('official')) {
        return true;
      }
      
      // Prefer audio-focused content
      if (title.includes('audio') || title.includes('hq') || title.includes('high quality')) {
        return true;
      }
      
      return false;
    }) || data.items[0]; // Fallback to first result
    
    const videoId = bestMatch.id.videoId;
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    
    console.log(`✅ Found YouTube video: ${bestMatch.snippet.title}`);
    
    // Note: In production, you would use youtube-dl or similar to extract audio URL
    // For now, we'll return the video URL and handle extraction separately
    return {
      videoUrl: videoUrl,
      videoId: videoId,
      title: bestMatch.snippet.title,
      channel: bestMatch.snippet.channelTitle,
      source: 'youtube'
    };
    
  } catch (error) {
    console.log(`❌ YouTube search error: ${error.message}`);
    return null;
  }
}

async function findBeatportPreviewUrl(artistName, trackName) {
  try {
    console.log(`🎛️ Searching Beatport for: ${artistName} - ${trackName}`);
    
    // Beatport has longer previews (2 minutes) but requires web scraping
    // This is a simplified version - in production, you'd need proper Beatport integration
    
    const searchQuery = encodeURIComponent(`${artistName} ${trackName}`);
    const beatportSearchUrl = `https://www.beatport.com/search?q=${searchQuery}`;
    
    // Note: This would require web scraping or Beatport API access
    // For now, we'll return a placeholder structure
    
    console.log(`📝 Beatport search requires web scraping implementation`);
    return null;
    
  } catch (error) {
    console.log(`❌ Beatport search error: ${error.message}`);
    return null;
  }
}

// Enhanced audio URL finder with multiple sources
async function findDeezerPreviewUrl(artistName, trackName) {
  try {
    console.log(`🎶 Searching Deezer for: ${artistName} - ${trackName}`);
    const searchQuery = encodeURIComponent(`${artistName} ${trackName}`);
    const deezerSearchUrl = `https://api.deezer.com/search?q=${searchQuery}`;
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(deezerSearchUrl);
    if (!response.ok) {
      console.log(`⚠️ Deezer search failed: ${response.status}`);
      return null;
    }
    const data = await response.json();
    if (!data.data || data.data.length === 0) {
      console.log(`⚠️ No Deezer results for: ${artistName} - ${trackName}`);
      return null;
    }
    // Find the first result with a preview
    const bestTrack = data.data.find(track => track.preview);
    if (!bestTrack) {
      console.log(`⚠️ No Deezer preview found`);
      return null;
    }
    console.log(`✅ Found Deezer preview: ${bestTrack.title}`);
    return {
      audioUrl: bestTrack.preview,
      title: bestTrack.title,
      artist: bestTrack.artist && bestTrack.artist.name,
      duration: 30000,
      source: 'deezer',
      deezerId: bestTrack.id
    };
  } catch (error) {
    console.log(`❌ Deezer search error: ${error.message}`);
    return null;
  }
}

async function findAudioUrlEnhanced(artistName, trackName, spotifyPreviewUrl = null) {
  console.log(`🔍 [TEST MODE] Forcing Deezer preview for: ${artistName} - ${trackName}`);
  const deezerResult = await findDeezerPreviewUrl(artistName, trackName);
  if (deezerResult) {
    return {
      audioUrl: deezerResult.audioUrl,
      source: 'deezer',
      duration: 30000,
      quality: 'high',
      metadata: deezerResult
    };
  }
  console.log(`❌ [TEST MODE] No Deezer preview found for: ${artistName} - ${trackName}`);
  return null;
}

// Metadata-based feature inference when no audio is available
function inferAudioFeaturesFromMetadata(artistName, trackName, genres = [], spotifyFeatures = null) {
  console.log(`📊 Inferring audio features from metadata for: ${artistName} - ${trackName}`);
  
  // Use existing Spotify audio features if available
  if (spotifyFeatures) {
    console.log(`✅ Using existing Spotify audio features`);
    return {
      ...spotifyFeatures,
      analysis_source: 'spotify_metadata',
      confidence: 0.8
    };
  }
  
  // Genre-based inference
  const genreFeatures = inferFeaturesFromGenres(genres);
  
  // Artist name-based inference (for EDM artists)
  const artistFeatures = inferFeaturesFromArtistName(artistName);
  
  // Combine inferences
  const inferredFeatures = {
    // Rhythm features
    tempo: genreFeatures.tempo || artistFeatures.tempo || 120,
    beats_per_minute: genreFeatures.tempo || artistFeatures.tempo || 120,
    
    // Energy features
    energy: genreFeatures.energy || artistFeatures.energy || 0.5,
    danceability: genreFeatures.danceability || artistFeatures.danceability || 0.5,
    
    // Tonal features
    valence: genreFeatures.valence || 0.5,
    
    // Metadata
    analysis_source: 'metadata_inference',
    confidence: 0.3,
    inference_methods: ['genre_mapping', 'artist_analysis']
  };
  
  console.log(`📊 Inferred features: tempo=${inferredFeatures.tempo}, energy=${inferredFeatures.energy}`);
  
  return inferredFeatures;
}

function inferFeaturesFromGenres(genres) {
  const genreMappings = {
    // EDM genres
    'house': { tempo: 128, energy: 0.8, danceability: 0.9 },
    'techno': { tempo: 130, energy: 0.9, danceability: 0.8 },
    'trance': { tempo: 132, energy: 0.8, danceability: 0.7 },
    'dubstep': { tempo: 140, energy: 0.9, danceability: 0.8 },
    'drum and bass': { tempo: 174, energy: 0.9, danceability: 0.7 },
    
    // Other genres
    'rock': { tempo: 120, energy: 0.7, danceability: 0.4 },
    'pop': { tempo: 110, energy: 0.6, danceability: 0.6 },
    'hip hop': { tempo: 90, energy: 0.6, danceability: 0.8 },
    'jazz': { tempo: 100, energy: 0.4, danceability: 0.3 }
  };
  
  // Find best matching genre
  for (const genre of genres) {
    const genreLower = genre.toLowerCase();
    for (const [mappedGenre, features] of Object.entries(genreMappings)) {
      if (genreLower.includes(mappedGenre)) {
        return features;
      }
    }
  }
  
  return {}; // No genre match
}

function inferFeaturesFromArtistName(artistName) {
  const name = artistName.toLowerCase();
  
  // EDM artist indicators
  if (name.includes('dj') || name.includes('remix')) {
    return { tempo: 128, energy: 0.8, danceability: 0.9 };
  }
  
  return {}; // No artist-based inference
}

module.exports = {
  findYouTubeAudioUrl,
  findBeatportPreviewUrl,
  findDeezerPreviewUrl,
  findAudioUrlEnhanced,
  inferAudioFeaturesFromMetadata,
  inferFeaturesFromGenres,
  inferFeaturesFromArtistName
};
