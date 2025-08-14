#!/usr/bin/env node
/**
 * USER-ARTIST ESSENTIA-BASED MATCHING ENGINE
 * Matches user taste preferences with artist Essentia audio profiles
 * Uses advanced ML-based audio analysis instead of deprecated Spotify features
 */

/**
 * Calculate artist match score using Essentia audio profiles
 * @param {Object} userTasteProfile - User's sound preferences (Essentia-based)
 * @param {Object} artistEssentiaProfile - Artist's Essentia audio profile with tracks
 * @returns {Object} Match score and breakdown
 */
function calculateEssentiaArtistMatchScore(userTasteProfile, artistEssentiaProfile) {
  if (!artistEssentiaProfile || !artistEssentiaProfile.tracks || artistEssentiaProfile.tracks.length === 0) {
    return { score: 0, confidence: 0, matchedTracks: 0, breakdown: null };
  }
  
  const userPreferences = userTasteProfile.essentiaProfile || userTasteProfile.soundProfile;
  if (!userPreferences) {
    return { score: 0, confidence: 0, matchedTracks: 0, breakdown: null };
  }
  
  // Calculate match score for each track using Essentia features
  const trackMatches = [];
  let totalMatchScore = 0;
  
  for (const track of artistEssentiaProfile.tracks) {
    if (track.essentiaFeatures) {
      const trackScore = calculateEssentiaTrackMatch(userPreferences, track.essentiaFeatures);
      trackMatches.push({
        trackName: track.name,
        score: trackScore.score,
        confidence: trackScore.confidence,
        essentiaFeatures: trackScore.matchedFeatures
      });
      totalMatchScore += trackScore.score;
    }
  }
  
  if (trackMatches.length === 0) {
    return { score: 0, confidence: 0, matchedTracks: 0, breakdown: null };
  }
  
  // Calculate overall artist match
  const averageTrackScore = totalMatchScore / trackMatches.length;
  const matchedTracks = trackMatches.filter(t => t.score >= 0.7).length;
  const matchPercentage = matchedTracks / trackMatches.length;
  
  // Bonus for high match percentage and Essentia quality
  let finalScore = averageTrackScore;
  if (matchPercentage >= 0.5) finalScore *= 1.2; // 20% bonus for 50%+ track matches
  if (matchPercentage >= 0.7) finalScore *= 1.3; // 30% bonus for 70%+ track matches
  
  // Bonus for advanced Essentia features (spectral analysis, etc.)
  if (artistEssentiaProfile.spectralFeatures && Object.keys(artistEssentiaProfile.spectralFeatures).length > 0) {
    finalScore *= 1.1; // 10% bonus for spectral analysis
  }
  
  // Cap at 1.0
  finalScore = Math.min(finalScore, 1.0);
  
  const confidence = Math.min(trackMatches.length / 10, 1.0); // Higher confidence with more tracks
  
  return {
    score: finalScore,
    confidence: confidence,
    matchedTracks: matchedTracks,
    totalTracks: trackMatches.length,
    matchPercentage: matchPercentage,
    breakdown: {
      averageTrackScore: averageTrackScore,
      matchedTracks: matchedTracks,
      bestTracks: trackMatches
        .sort((a, b) => b.score - a.score)
        .slice(0, 5), // Top 5 matching tracks
      artistAverageFeatures: artistEssentiaProfile.averageFeatures,
      spectralFeatures: artistEssentiaProfile.spectralFeatures,
      source: 'essentia_ml_analysis'
    }
  };
}

/**
 * Calculate how well a single track matches user preferences using Essentia features
 * @param {Object} userPreferences - User's Essentia-based sound preferences
 * @param {Object} trackEssentiaFeatures - Track's Essentia analysis features
 * @returns {Object} Track match score and confidence
 */
function calculateEssentiaTrackMatch(userPreferences, trackEssentiaFeatures) {
  // Essentia feature weights - prioritizing advanced ML features
  const featureWeights = {
    // Basic audio features
    energy: 0.15,
    danceability: 0.20,
    valence: 0.10,
    
    // Advanced Essentia features
    dynamic_complexity: 0.15,
    bpm: 0.10,
    loudness: 0.05,
    
    // Spectral features (unique to Essentia)
    spectral_centroid: 0.10,
    spectral_rolloff: 0.05,
    zero_crossing_rate: 0.05,
    
    // Timbral features
    dissonance: 0.05
  };
  
  let weightedScore = 0;
  let totalWeight = 0;
  const featureScores = {};
  const matchedFeatures = [];
  
  for (const [feature, weight] of Object.entries(featureWeights)) {
    if (userPreferences[feature] !== undefined && trackEssentiaFeatures[feature] !== undefined) {
      let featureScore;
      
      if (feature === 'bpm') {
        // BPM matching - closer = better
        const bpmDiff = Math.abs(userPreferences[feature] - trackEssentiaFeatures[feature]);
        const maxBpmDiff = 40; // Within 40 BPM is good match
        featureScore = Math.max(0, 1 - (bpmDiff / maxBpmDiff));
      } else if (feature === 'loudness') {
        // Loudness matching - normalize to 0-1 scale
        const loudnessDiff = Math.abs(userPreferences[feature] - trackEssentiaFeatures[feature]);
        const maxLoudnessDiff = 20; // dB difference
        featureScore = Math.max(0, 1 - (loudnessDiff / maxLoudnessDiff));
      } else {
        // Standard feature matching (0-1 scale)
        const diff = Math.abs(userPreferences[feature] - trackEssentiaFeatures[feature]);
        featureScore = Math.max(0, 1 - diff);
      }
      
      featureScores[feature] = featureScore;
      weightedScore += featureScore * weight;
      totalWeight += weight;
      
      matchedFeatures.push({
        feature: feature,
        userValue: userPreferences[feature],
        trackValue: trackEssentiaFeatures[feature],
        score: featureScore,
        weight: weight
      });
    }
  }
  
  if (totalWeight === 0) {
    return { score: 0, confidence: 0, featureScores: {}, matchedFeatures: [] };
  }
  
  const finalScore = weightedScore / totalWeight;
  const confidence = totalWeight / Object.values(featureWeights).reduce((a, b) => a + b, 0);
  
  return {
    score: finalScore,
    confidence: confidence,
    featureScores: featureScores,
    matchedFeatures: matchedFeatures,
    source: 'essentia_ml_features'
  };
}

/**
 * Find similar artists based on genre overlap and Essentia audio feature similarity
 * @param {Object} targetArtist - Artist to find similar artists for
 * @param {Array} allArtists - All artists in the database with Essentia audio profiles
 * @param {number} limit - Maximum number of similar artists to return
 * @returns {Array} Similar artists with similarity scores
 */
function findSimilarArtistsEssentia(targetArtist, allArtists, limit = 10) {
  const similarArtists = [];
  
  for (const artist of allArtists) {
    if (artist._id.toString() === targetArtist._id.toString()) continue;
    
    const similarity = calculateEssentiaArtistSimilarity(targetArtist, artist);
    if (similarity.score > 0.3) { // Minimum similarity threshold
      similarArtists.push({
        artist: artist,
        similarity: similarity
      });
    }
  }
  
  // Sort by similarity score and return top results
  return similarArtists
    .sort((a, b) => b.similarity.score - a.similarity.score)
    .slice(0, limit);
}

/**
 * Calculate similarity between two artists using Essentia profiles
 * @param {Object} artist1 - First artist
 * @param {Object} artist2 - Second artist
 * @returns {Object} Similarity score and breakdown
 */
function calculateEssentiaArtistSimilarity(artist1, artist2) {
  let genreScore = 0;
  let audioScore = 0;
  let spectralScore = 0;
  
  // Genre similarity (30% weight)
  if (artist1.genres && artist2.genres) {
    const genres1 = new Set(artist1.genres.map(g => g.toLowerCase()));
    const genres2 = new Set(artist2.genres.map(g => g.toLowerCase()));
    
    const intersection = new Set([...genres1].filter(g => genres2.has(g)));
    const union = new Set([...genres1, ...genres2]);
    
    genreScore = intersection.size / union.size; // Jaccard similarity
  }
  
  // Essentia audio feature similarity (50% weight)
  if (artist1.essentiaAudioProfile && artist2.essentiaAudioProfile && 
      artist1.essentiaAudioProfile.averageFeatures && artist2.essentiaAudioProfile.averageFeatures) {
    
    const features1 = artist1.essentiaAudioProfile.averageFeatures;
    const features2 = artist2.essentiaAudioProfile.averageFeatures;
    
    audioScore = calculateEssentiaFeatureSimilarity(features1, features2);
  }
  
  // Spectral similarity (20% weight) - unique to Essentia
  if (artist1.essentiaAudioProfile?.spectralFeatures && artist2.essentiaAudioProfile?.spectralFeatures) {
    const spectral1 = artist1.essentiaAudioProfile.spectralFeatures;
    const spectral2 = artist2.essentiaAudioProfile.spectralFeatures;
    
    spectralScore = calculateSpectralSimilarity(spectral1, spectral2);
  }
  
  const overallScore = (genreScore * 0.3) + (audioScore * 0.5) + (spectralScore * 0.2);
  
  return {
    score: overallScore,
    genreScore: genreScore,
    audioScore: audioScore,
    spectralScore: spectralScore,
    sharedGenres: artist1.genres && artist2.genres ? 
      artist1.genres.filter(g1 => 
        artist2.genres.some(g2 => g1.toLowerCase() === g2.toLowerCase())
      ) : [],
    source: 'essentia_similarity'
  };
}

/**
 * Calculate similarity between Essentia audio feature sets
 */
function calculateEssentiaFeatureSimilarity(features1, features2) {
  const featuresToCompare = [
    'energy', 'danceability', 'valence', 'dynamic_complexity', 
    'bpm', 'loudness', 'dissonance'
  ];
  
  let totalSimilarity = 0;
  let validFeatures = 0;
  
  for (const feature of featuresToCompare) {
    if (features1[feature] !== undefined && features2[feature] !== undefined) {
      let similarity;
      
      if (feature === 'bpm') {
        // BPM similarity - closer values = higher similarity
        const bpmDiff = Math.abs(features1[feature] - features2[feature]);
        similarity = Math.max(0, 1 - (bpmDiff / 40)); // 40 BPM max difference
      } else if (feature === 'loudness') {
        // Loudness similarity
        const loudnessDiff = Math.abs(features1[feature] - features2[feature]);
        similarity = Math.max(0, 1 - (loudnessDiff / 20)); // 20 dB max difference
      } else {
        // Standard 0-1 feature similarity
        const diff = Math.abs(features1[feature] - features2[feature]);
        similarity = 1 - diff;
      }
      
      totalSimilarity += similarity;
      validFeatures++;
    }
  }
  
  return validFeatures > 0 ? totalSimilarity / validFeatures : 0;
}

/**
 * Calculate spectral similarity between two artists (Essentia-specific)
 */
function calculateSpectralSimilarity(spectral1, spectral2) {
  const spectralFeatures = ['spectralCentroid', 'spectralRolloff', 'zeroCrossingRate'];
  
  let totalSimilarity = 0;
  let validFeatures = 0;
  
  for (const feature of spectralFeatures) {
    if (spectral1[feature] !== undefined && spectral2[feature] !== undefined) {
      const diff = Math.abs(spectral1[feature] - spectral2[feature]);
      const normalizedDiff = diff / Math.max(spectral1[feature], spectral2[feature], 1);
      const similarity = Math.max(0, 1 - normalizedDiff);
      
      totalSimilarity += similarity;
      validFeatures++;
    }
  }
  
  return validFeatures > 0 ? totalSimilarity / validFeatures : 0;
}

/**
 * Calculate event score enhancement based on Essentia artist matches
 * @param {Object} event - Event with artists
 * @param {Object} userTasteProfile - User's Essentia-based taste profile
 * @param {Array} artistsWithEssentiaProfiles - All artists with Essentia audio profiles
 * @returns {Object} Enhanced score breakdown
 */
async function calculateEventEssentiaArtistScore(event, userTasteProfile, artistsWithEssentiaProfiles) {
  if (!event.artists || event.artists.length === 0) {
    return { score: 0, confidence: 0, breakdown: { directMatches: [], similarMatches: [] } };
  }
  
  const artistLookup = new Map();
  artistsWithEssentiaProfiles.forEach(artist => {
    artistLookup.set(artist.originalName.toLowerCase(), artist);
    if (artist.artistName) {
      artistLookup.set(artist.artistName.toLowerCase(), artist);
    }
  });
  
  const directMatches = [];
  const similarMatches = [];
  
  // Find direct artist matches
  for (const eventArtistName of event.artists) {
    if (typeof eventArtistName !== 'string') continue;
    
    const artist = artistLookup.get(eventArtistName.toLowerCase());
    if (artist && artist.essentiaAudioProfile) {
      const matchScore = calculateEssentiaArtistMatchScore(userTasteProfile, artist.essentiaAudioProfile);
      if (matchScore.score > 0) {
        directMatches.push({
          artistName: eventArtistName,
          artist: artist,
          matchScore: matchScore
        });
      }
    }
  }
  
  // Find similar artist matches for each direct match
  for (const directMatch of directMatches) {
    const similarArtists = findSimilarArtistsEssentia(directMatch.artist, artistsWithEssentiaProfiles, 5);
    
    for (const similar of similarArtists) {
      if (similar.artist.essentiaAudioProfile) {
        const similarMatchScore = calculateEssentiaArtistMatchScore(userTasteProfile, similar.artist.essentiaAudioProfile);
        if (similarMatchScore.score > 0.5) { // Higher threshold for similar artists
          similarMatches.push({
            originalArtist: directMatch.artistName,
            similarArtist: similar.artist.originalName,
            similarity: similar.similarity,
            matchScore: similarMatchScore
          });
        }
      }
    }
  }
  
  // Calculate overall event score
  let eventScore = 0;
  let confidence = 0;
  
  if (directMatches.length > 0) {
    const directScore = directMatches.reduce((sum, match) => sum + match.matchScore.score, 0) / directMatches.length;
    eventScore += directScore * 0.8; // Direct matches have 80% weight
    confidence = directMatches.reduce((sum, match) => sum + match.matchScore.confidence, 0) / directMatches.length;
  }
  
  if (similarMatches.length > 0) {
    const similarScore = similarMatches.reduce((sum, match) => 
      sum + (match.matchScore.score * match.similarity.score), 0) / similarMatches.length;
    eventScore += similarScore * 0.2; // Similar matches have 20% weight
  }
  
  return {
    score: Math.min(eventScore, 1.0),
    confidence: confidence,
    breakdown: {
      directMatches: directMatches,
      similarMatches: similarMatches,
      directScore: directMatches.length > 0 ? directMatches.reduce((sum, match) => sum + match.matchScore.score, 0) / directMatches.length : 0,
      similarScore: similarMatches.length > 0 ? similarMatches.reduce((sum, match) => sum + match.matchScore.score, 0) / similarMatches.length : 0,
      analysisType: 'essentia_ml_analysis',
      totalTracksAnalyzed: directMatches.reduce((sum, match) => sum + match.matchScore.totalTracks, 0)
    }
  };
}

module.exports = {
  calculateEssentiaArtistMatchScore,
  calculateEssentiaTrackMatch,
  findSimilarArtistsEssentia,
  calculateEssentiaArtistSimilarity,
  calculateEventEssentiaArtistScore,
  
  // Legacy functions for backward compatibility (deprecated)
  calculateArtistMatchScore: calculateEssentiaArtistMatchScore,
  calculateTrackMatch: calculateEssentiaTrackMatch,
  findSimilarArtists: findSimilarArtistsEssentia,
  calculateArtistSimilarity: calculateEssentiaArtistSimilarity,
  calculateEventArtistScore: calculateEventEssentiaArtistScore
};
