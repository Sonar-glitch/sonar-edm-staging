const similarity = 1 - Math.abs(eventSound[feature] - userSound[feature]);
/**
 * VIBE MATCH SCORING USING PHASE 1 DEPLOYED METADATA
 * 
 * Uses actual deployed Phase 1 enhancements:
 * - soundCharacteristics (energy, danceability, valence, tempo, etc.)
 * - artistMetadata (popularity, edmWeight, soundDNA)
 * - enhancedGenres (primary, expanded, similarity, edmClassification)
 * 
 * Scoring Range: 0-100 (honest scoring)
 * - 0-20%: Terrible match (jazz for techno lover)
 * - 20-40%: Poor match (house for trance lover)
 * - 40-60%: Okay match (progressive house for house lover)
 * - 60-80%: Good match (tech house for house lover)
 * - 80-100%: Excellent match (minimal techno for techno lover)
 */

/**
 * Calculate vibe match score using Phase 1 metadata
 * @param {Object} event - Event with Phase 1 metadata
 * @param {Object} userTasteProfile - User's taste profile
 * @returns {Object} - Vibe match result with score and breakdown
 */
function calculateVibeMatchScore(event, userTasteProfile) {
  let totalScore = 0;
  let totalWeight = 0;
  const breakdown = {};

  // COMPONENT 1: SOUND CHARACTERISTICS MATCH (50% weight)
  if (event.soundCharacteristics && userTasteProfile.soundCharacteristics) {
    const soundScore = calculateSoundCharacteristicsMatch(
      event.soundCharacteristics, 
      userTasteProfile.soundCharacteristics
    );
    
    totalScore += soundScore * 0.5;
    totalWeight += 0.5;
    breakdown.soundMatch = soundScore;
  }

  // COMPONENT 2: ENHANCED GENRES MATCH (30% weight)
  if (event.enhancedGenres && userTasteProfile.genrePreferences) {
    const genreScore = calculateEnhancedGenreMatch(
      event.enhancedGenres,
      userTasteProfile.genrePreferences
    );
    
    totalScore += genreScore * 0.3;
    totalWeight += 0.3;
    breakdown.genreMatch = genreScore;
  }

  // COMPONENT 3: ARTIST METADATA MATCH (20% weight)
  if (event.artistMetadata && userTasteProfile.artistPreferences) {
    const artistScore = calculateArtistMetadataMatch(
      event.artistMetadata,
      userTasteProfile.artistPreferences
    );
    
    totalScore += artistScore * 0.2;
    totalWeight += 0.2;
    breakdown.artistMatch = artistScore;
  }

  // Calculate final score (0-100 range)
  const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

  return {
    vibeMatchScore: Math.max(0, Math.min(100, finalScore)), // Ensure 0-100 range
    breakdown: breakdown,
    confidence: totalWeight, // How much data we had to work with
    source: 'phase1_metadata'
  };
}

/**
 * Calculate sound characteristics similarity
 * Uses deployed Phase 1 soundCharacteristics metadata
 */
function calculateSoundCharacteristicsMatch(eventSound, userSound) {
  const features = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness'];
  let totalSimilarity = 0;
  let featureCount = 0;

  features.forEach(feature => {
    if (eventSound[feature] !== undefined && userSound[feature] !== undefined) {
      // Calculate similarity (1 - absolute difference)
const similarity = Math.max(0, Math.exp(-Math.abs(eventSound[feature] - userSound[feature]) * 3));
      totalSimilarity += similarity;
      featureCount++;
    }
  });

  // Special handling for tempo (BPM)
  if (eventSound.tempo && userSound.tempo) {
    // Tempo similarity with tolerance (±20 BPM = good match)
    const tempoDiff = Math.abs(eventSound.tempo - userSound.tempo);
    const tempoSimilarity = Math.max(0, 1 - (tempoDiff / 40)); // 40 BPM = 0% similarity
    totalSimilarity += tempoSimilarity;
    featureCount++;
  }

  return featureCount > 0 ? Math.round((totalSimilarity / featureCount) * 100) : 0;
}

/**
 * Calculate enhanced genre similarity
 * Uses deployed Phase 1 enhancedGenres metadata
 */
function calculateEnhancedGenreMatch(eventGenres, userGenres) {
  let maxScore = 0;

  // Check primary genre matches
  if (eventGenres.primary && userGenres.primary) {
    eventGenres.primary.forEach(eventGenre => {
      userGenres.primary.forEach(userGenre => {
        if (eventGenre.toLowerCase() === userGenre.toLowerCase()) {
          maxScore = Math.max(maxScore, 100); // Perfect primary match
        }
      });
    });
  }

  // Check expanded genre matches
  if (eventGenres.expanded && userGenres.expanded) {
    eventGenres.expanded.forEach(eventGenre => {
      userGenres.expanded.forEach(userGenre => {
        if (eventGenre.toLowerCase() === userGenre.toLowerCase()) {
          maxScore = Math.max(maxScore, 85); // Good expanded match
        }
      });
    });
  }

  // Check similarity scores from Phase 1 metadata
  if (eventGenres.similarity && userGenres.primary) {
    userGenres.primary.forEach(userGenre => {
      const similarityScore = eventGenres.similarity[userGenre.toLowerCase()];
      if (similarityScore) {
        maxScore = Math.max(maxScore, Math.round(similarityScore * 100));
      }
    });
  }

  // EDM classification bonus
  if (eventGenres.edmClassification === 'core_edm' && userGenres.edmPreference > 0.8) {
    maxScore = Math.max(maxScore, 70); // EDM lover gets bonus for EDM events
  }

  return maxScore;
}

/**
 * Calculate artist metadata similarity
 * Uses deployed Phase 1 artistMetadata
 */
function calculateArtistMetadataMatch(eventArtist, userArtistPrefs) {
  let score = 0;

  // EDM weight matching
  if (eventArtist.edmWeight && userArtistPrefs.edmPreference) {
    const edmMatch = Math.min(eventArtist.edmWeight, userArtistPrefs.edmPreference);
    score += edmMatch * 60; // Up to 60 points for EDM matching
  }

  // Sound DNA matching (if available)
  if (eventArtist.soundDNA && userArtistPrefs.soundDNA) {
    const soundDNAMatch = calculateSoundCharacteristicsMatch(
      eventArtist.soundDNA, 
      userArtistPrefs.soundDNA
    );
    score += soundDNAMatch * 0.4; // Up to 40 points for sound DNA
  }

  // Popularity factor (slight preference for known artists)
  if (eventArtist.popularity) {
    const popularityBonus = Math.min(eventArtist.popularity / 100 * 10, 10); // Max 10 points
    score += popularityBonus;
  }

  return Math.round(Math.min(score, 100));
}

/**
 * Create user taste profile from Spotify data for vibe matching
 * This would be called when user logs in to build their taste profile
 */
function createUserTasteProfile(spotifyData) {
  // Extract sound characteristics from user's top tracks
  const soundCharacteristics = extractUserSoundCharacteristics(spotifyData.topTracks);
  
  // Extract genre preferences from user's listening history
  const genrePreferences = extractUserGenrePreferences(spotifyData.topArtists, spotifyData.topTracks);
  
  // Extract artist preferences
  const artistPreferences = extractUserArtistPreferences(spotifyData.topArtists);

  return {
    soundCharacteristics,
    genrePreferences,
    artistPreferences,
    lastUpdated: new Date().toISOString(),
    source: 'spotify_analysis'
  };
}

/**
 * Extract user's sound characteristics from their top tracks
 */
function extractUserSoundCharacteristics(topTracks) {
  if (!topTracks || topTracks.length === 0) return null;

  const features = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness'];
  const averages = {};
  let tempoSum = 0;
  let trackCount = 0;

  // Calculate weighted averages (more recent tracks have higher weight)
  topTracks.forEach((track, index) => {
    if (track.audio_features) {
      const weight = 1 - (index / topTracks.length) * 0.5; // Recent tracks get higher weight
      
      features.forEach(feature => {
        if (track.audio_features[feature] !== undefined) {
          averages[feature] = (averages[feature] || 0) + (track.audio_features[feature] * weight);
        }
      });

      if (track.audio_features.tempo) {
        tempoSum += track.audio_features.tempo * weight;
      }
      
      trackCount += weight;
    }
  });

  // Normalize averages
  features.forEach(feature => {
    if (averages[feature]) {
      averages[feature] = averages[feature] / trackCount;
    }
  });

  return {
    ...averages,
    tempo: tempoSum / trackCount,
    trackCount: topTracks.length,
    confidence: Math.min(trackCount / 50, 1) // Higher confidence with more tracks
  };
}

/**
 * Extract user's genre preferences
 */
function extractUserGenrePreferences(topArtists, topTracks) {
  const genreCounts = {};
  let totalGenres = 0;

  // Count genres from top artists
  topArtists.forEach(artist => {
    if (artist.genres) {
      artist.genres.forEach(genre => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        totalGenres++;
      });
    }
  });

  // Get primary genres (top 5)
  const sortedGenres = Object.entries(genreCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([genre]) => genre);

  // Calculate EDM preference
  const edmGenres = ['house', 'techno', 'trance', 'electronic', 'edm', 'dance'];
  const edmCount = sortedGenres.filter(genre => 
    edmGenres.some(edmGenre => genre.toLowerCase().includes(edmGenre))
  ).length;
  const edmPreference = edmCount / Math.max(sortedGenres.length, 1);

  return {
    primary: sortedGenres,
    expanded: Object.keys(genreCounts), // All genres
    edmPreference: edmPreference,
    confidence: Math.min(totalGenres / 20, 1)
  };
}

/**
 * Extract user's artist preferences
 */
function extractUserArtistPreferences(topArtists) {
  if (!topArtists || topArtists.length === 0) return null;

  // Calculate average EDM weight from top artists
  const edmGenres = ['house', 'techno', 'trance', 'electronic', 'edm', 'dance'];
  let edmArtistCount = 0;
  
  topArtists.forEach(artist => {
    if (artist.genres) {
      const isEDM = artist.genres.some(genre => 
        edmGenres.some(edmGenre => genre.toLowerCase().includes(edmGenre))
      );
      if (isEDM) edmArtistCount++;
    }
  });

  const edmPreference = edmArtistCount / topArtists.length;

  return {
    edmPreference: edmPreference,
    topArtistCount: topArtists.length,
    confidence: Math.min(topArtists.length / 20, 1)
  };
}

module.exports = {
  calculateVibeMatchScore,
  createUserTasteProfile,
  calculateSoundCharacteristicsMatch,
  calculateEnhancedGenreMatch,
  calculateArtistMetadataMatch
};

