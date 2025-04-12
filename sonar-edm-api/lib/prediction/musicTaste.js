// lib/prediction/musicTaste.js

/**
 * Analyzes user's music taste based on listening history and preferences
 * @param {string} userId - User ID
 * @param {Object} options - Additional options for analysis
 * @returns {Object} Music taste analysis with genre preferences and artist recommendations
 */
export async function analyzeMusicTaste(userId, options = {}) {
  try {
    // Get user's listening history
    const listeningHistory = await getUserListeningHistory(userId);
    
    // Analyze genre preferences
    const genrePreferences = analyzeGenrePreferences(listeningHistory);
    
    // Analyze artist preferences
    const artistPreferences = analyzeArtistPreferences(listeningHistory);
    
    // Analyze feature preferences (tempo, energy, danceability)
    const featurePreferences = analyzeFeaturePreferences(listeningHistory);
    
    // Generate recommendations
    const recommendations = generateRecommendations(
      genrePreferences, 
      artistPreferences, 
      featurePreferences,
      options.limit || 10
    );
    
    return {
      userId,
      topGenres: genrePreferences.slice(0, 5),
      topArtists: artistPreferences.slice(0, 5).map(a => a.name),
      featurePreferences,
      recommendations: recommendations.map(r => ({
        name: r.name,
        genres: r.genres,
        matchScore: r.matchScore
      })),
      analysisDate: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error analyzing music taste:', error);
    throw new Error('Failed to analyze music taste');
  }
}

// Helper functions
async function getUserListeningHistory(userId) {
  // Mock implementation - would use Spotify API in production
  return [
    { artist: 'Daft Punk', genre: 'electronic', features: { tempo: 120, energy: 0.8, danceability: 0.9 } },
    { artist: 'Avicii', genre: 'edm', features: { tempo: 128, energy: 0.7, danceability: 0.8 } },
    { artist: 'Deadmau5', genre: 'progressive house', features: { tempo: 125, energy: 0.6, danceability: 0.7 } }
  ];
}

function analyzeGenrePreferences(listeningHistory) {
  // Mock implementation - would use more sophisticated analysis in production
  const genreCounts = {};
  
  listeningHistory.forEach(item => {
    genreCounts[item.genre] = (genreCounts[item.genre] || 0) + 1;
  });
  
  return Object.keys(genreCounts).sort((a, b) => genreCounts[b] - genreCounts[a]);
}

function analyzeArtistPreferences(listeningHistory) {
  // Mock implementation - would use more sophisticated analysis in production
  const artistCounts = {};
  
  listeningHistory.forEach(item => {
    artistCounts[item.artist] = (artistCounts[item.artist] || 0) + 1;
  });
  
  return Object.keys(artistCounts).map(name => ({
    name,
    count: artistCounts[name]
  })).sort((a, b) => b.count - a.count);
}

function analyzeFeaturePreferences(listeningHistory) {
  // Mock implementation - would use more sophisticated analysis in production
  const features = listeningHistory.map(item => item.features);
  
  const avgTempo = features.reduce((sum, f) => sum + f.tempo, 0) / features.length;
  const avgEnergy = features.reduce((sum, f) => sum + f.energy, 0) / features.length;
  const avgDanceability = features.reduce((sum, f) => sum + f.danceability, 0) / features.length;
  
  return {
    tempo: avgTempo,
    energy: avgEnergy,
    danceability: avgDanceability
  };
}

function generateRecommendations(genrePreferences, artistPreferences, featurePreferences, limit) {
  // Mock implementation - would use Spotify API in production
  return [
    { name: 'Swedish House Mafia', genres: ['edm', 'progressive house'], matchScore: 0.92 },
    { name: 'Calvin Harris', genres: ['edm', 'electro house'], matchScore: 0.89 },
    { name: 'Martin Garrix', genres: ['edm', 'big room house'], matchScore: 0.85 }
  ];
}
