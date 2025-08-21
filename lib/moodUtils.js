/**
 * Enhanced mood and genre analysis utilities for Sonar EDM Platform
 */

// EDM-specific genre mapping for better categorization
const EDM_GENRE_MAPPING = {
  // House music genres
  'house': 'house',
  'deep house': 'house',
  'tech house': 'house',
  'progressive house': 'house',
  'electro house': 'house',
  'funky house': 'house',
  'future house': 'house',
  'tropical house': 'house',
  'bass house': 'house',
  
  // Techno genres
  'techno': 'techno',
  'minimal techno': 'techno',
  'acid techno': 'techno',
  'hard techno': 'techno',
  'detroit techno': 'techno',
  'industrial techno': 'techno',
  
  // Trance genres
  'trance': 'trance',
  'progressive trance': 'trance',
  'uplifting trance': 'trance',
  'vocal trance': 'trance',
  'psytrance': 'trance',
  'goa trance': 'trance',
  'tech trance': 'trance',
  
  // Drum and bass genres
  'drum and bass': 'drum and bass',
  'liquid drum and bass': 'drum and bass',
  'neurofunk': 'drum and bass',
  'jump up': 'drum and bass',
  
  // Dubstep and bass music
  'dubstep': 'dubstep',
  'brostep': 'dubstep',
  'future bass': 'bass',
  'trap': 'bass',
  'bass': 'bass',
  'glitch hop': 'bass',
  
  // Ambient/downtempo
  'ambient': 'ambient',
  'chillout': 'ambient',
  'downtempo': 'ambient',
  'electronica': 'ambient',
  
  // Hardstyle/hardcore
  'hardstyle': 'hardstyle',
  'hardcore': 'hardstyle',
  'hard dance': 'hardstyle',
  'gabber': 'hardstyle',
  
  // Other electronic
  'electro': 'other electronic',
  'breakbeat': 'other electronic',
  'uk garage': 'other electronic',
  'future garage': 'other electronic',
  'idm': 'other electronic',
  'synthwave': 'other electronic',
};

/**
 * Normalizes a genre name using EDM-specific mappings
 * @param {string} genre - Original genre name
 * @returns {string} - Normalized genre name
 */
function normalizeGenre(genre) {
  // Convert to lowercase for matching
  const lowercaseGenre = genre.toLowerCase();
  
  // Check direct matches in the mapping
  if (EDM_GENRE_MAPPING[lowercaseGenre]) {
    return EDM_GENRE_MAPPING[lowercaseGenre];
  }
  
  // Check partial matches
  for (const [key, value] of Object.entries(EDM_GENRE_MAPPING)) {
    if (lowercaseGenre.includes(key)) {
      return value;
    }
  }
  
  // If no match found, return original
  return genre;
}

/**
 * Extracts and analyzes top genres from artist data
 * @param {Array} artists - Array of artist objects from Spotify API
 * @returns {Object} - Genre profile with percentages
 */
function getTopGenres(artists) {
  if (!artists || artists.length === 0) {
    return {};
  }
  
  const genreMap = {};
  
  // Count genre occurrences
  artists.forEach((artist) => {
    if (artist.genres && artist.genres.length > 0) {
      artist.genres.forEach((genre) => {
        const normalizedGenre = normalizeGenre(genre);
        genreMap[normalizedGenre] = (genreMap[normalizedGenre] || 0) + 1;
      });
    }
  });
  
  // Sort genres by count
  const sortedGenres = Object.entries(genreMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7); // Get top 7 genres for radar chart
  
  const total = sortedGenres.reduce((acc, [, count]) => acc + count, 0);
  
  // Calculate percentages
  const genreData = {};
  sortedGenres.forEach(([genre, count]) => {
    genreData[genre] = Math.round((count / total) * 100);
  });
  
  return genreData;
}

/**
 * Analyzes audio features to determine seasonal/emotional mood
 * @param {Array} features - Array of audio feature objects from Spotify API
 * @returns {string} - Mood description
 */
function getSeasonalMood(features) {
  if (!features || features.length === 0) {
    return 'Unknown Mood';
  }
  
  // Calculate averages for key features
  const avgValence = features.reduce((sum, f) => sum + (f.valence || 0), 0) / features.length;
  const avgEnergy = features.reduce((sum, f) => sum + (f.energy || 0), 0) / features.length;
  const avgDanceability = features.reduce((sum, f) => sum + (f.danceability || 0), 0) / features.length;
  
  // Determine mood based on audio features
  if (avgValence > 0.7 && avgEnergy > 0.7) {
    return "Summer Festival Rush";
  } else if (avgValence > 0.5 && avgDanceability > 0.6) {
    return "Chillwave Flow";
  } else if (avgEnergy > 0.7) {
    return "Late-Night Raver";
  } else if (avgValence < 0.4 && avgEnergy > 0.5) {
    return "Dark Melodic Journey";
  } else if (avgDanceability > 0.7) {
    return "Groovy Pulse";
  } else {
    return "Melodic Afterglow";
  }
}

// Export the original functions for backward compatibility
function detectSeasonalMood(features) {
  return getSeasonalMood(features);
}

module.exports = { 
  getTopGenres, 
  getSeasonalMood, 
  detectSeasonalMood 
};

