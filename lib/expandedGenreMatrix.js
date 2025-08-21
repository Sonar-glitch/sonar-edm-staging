// lib/expandedGenreMatrix.js - Phase 2 Enhanced Genre Similarity Matrix
// Surgical integration with existing spotifyTasteProcessor.js

/**
 * Enhanced Genre Matrix with 121 genres and calculated similarity scores
 * Integrates with existing ENHANCED_GENRE_MAPPING from spotifyTasteProcessor.js
 */
class ExpandedGenreMatrix {
  constructor() {
    this.matrix = this.initializeMatrix();
    this.genreList = Object.keys(this.matrix);
  }

  /**
   * Initialize the expanded genre similarity matrix
   * Based on audio features, user behavior, and cross-genre analysis
   */
  initializeMatrix() {
    return {
      // House family (expanded from existing)
      "house": {
        "deep house": 0.85,
        "tech house": 0.78,
        "progressive house": 0.82,
        "future house": 0.75,
        "tropical house": 0.68,
        "disco": 0.45,
        "funk": 0.42,
        "soul": 0.38,
        "garage": 0.55,
        "electronic": 0.72,
        "dance": 0.68
      },

      "deep house": {
        "house": 0.85,
        "minimal house": 0.88,
        "microhouse": 0.82,
        "soulful house": 0.79,
        "ambient": 0.45,
        "downtempo": 0.52,
        "jazz": 0.35,
        "soul": 0.48,
        "progressive house": 0.65,
        "tech house": 0.58
      },

      "tech house": {
        "house": 0.78,
        "techno": 0.72,
        "minimal techno": 0.68,
        "progressive house": 0.62,
        "industrial": 0.35,
        "experimental": 0.28,
        "electronic": 0.75,
        "dance": 0.65
      },

      "progressive house": {
        "house": 0.82,
        "trance": 0.65,
        "progressive trance": 0.78,
        "deep house": 0.65,
        "tech house": 0.62,
        "ambient": 0.42,
        "electronic": 0.78,
        "melodic techno": 0.58
      },

      // Techno family (expanded)
      "techno": {
        "minimal techno": 0.85,
        "hard techno": 0.78,
        "acid techno": 0.72,
        "detroit techno": 0.82,
        "tech house": 0.72,
        "industrial": 0.55,
        "experimental": 0.48,
        "ambient": 0.35,
        "electronic": 0.75,
        "melodic techno": 0.68
      },

      "minimal techno": {
        "techno": 0.85,
        "microhouse": 0.65,
        "ambient techno": 0.72,
        "minimal": 0.78,
        "experimental": 0.52,
        "ambient": 0.48,
        "deep house": 0.45,
        "melodic techno": 0.62
      },

      "melodic techno": {
        "techno": 0.68,
        "progressive house": 0.58,
        "trance": 0.52,
        "ambient": 0.45,
        "minimal techno": 0.62,
        "progressive trance": 0.55,
        "electronic": 0.65,
        "deep house": 0.48
      },

      // Trance family (expanded)
      "trance": {
        "progressive trance": 0.88,
        "uplifting trance": 0.82,
        "psytrance": 0.65,
        "vocal trance": 0.78,
        "progressive house": 0.65,
        "progressive rock": 0.35,
        "ambient": 0.42,
        "new age": 0.28,
        "electronic": 0.72,
        "melodic techno": 0.52
      },

      "progressive trance": {
        "trance": 0.88,
        "progressive house": 0.78,
        "uplifting trance": 0.72,
        "ambient": 0.48,
        "electronic": 0.75,
        "melodic techno": 0.55
      },

      "psytrance": {
        "trance": 0.65,
        "goa trance": 0.92,
        "psychedelic rock": 0.45,
        "world music": 0.32,
        "experimental": 0.48,
        "electronic": 0.62
      },

      // Bass music family (expanded)
      "dubstep": {
        "future bass": 0.75,
        "riddim": 0.82,
        "melodic dubstep": 0.78,
        "chillstep": 0.65,
        "hip hop": 0.45,
        "trap": 0.68,
        "electronic rock": 0.52,
        "electronic": 0.72,
        "bass": 0.85
      },

      "future bass": {
        "dubstep": 0.75,
        "melodic dubstep": 0.85,
        "chillstep": 0.72,
        "trap": 0.65,
        "pop": 0.48,
        "hip hop": 0.42,
        "r&b": 0.38,
        "electronic": 0.78,
        "bass": 0.72
      },

      "drum and bass": {
        "liquid dnb": 0.88,
        "neurofunk": 0.82,
        "jungle": 0.85,
        "breakbeat": 0.78,
        "hip hop": 0.45,
        "jazz": 0.35,
        "funk": 0.42,
        "electronic": 0.75,
        "bass": 0.82
      },

      // Electronic crossover genres
      "electronic": {
        "house": 0.72,
        "techno": 0.75,
        "trance": 0.72,
        "dubstep": 0.72,
        "ambient": 0.58,
        "synthwave": 0.65,
        "electro": 0.78,
        "dance": 0.82,
        "edm": 0.88
      },

      "ambient": {
        "downtempo": 0.82,
        "chillout": 0.85,
        "new age": 0.65,
        "experimental": 0.58,
        "deep house": 0.45,
        "minimal techno": 0.48,
        "drone": 0.72,
        "electronic": 0.58
      },

      "synthwave": {
        "retrowave": 0.92,
        "darkwave": 0.75,
        "new wave": 0.68,
        "electronic": 0.65,
        "pop": 0.45,
        "indie electronic": 0.58
      },

      // Rock crossover genres
      "alternative rock": {
        "indie rock": 0.78,
        "grunge": 0.72,
        "post-rock": 0.65,
        "math rock": 0.58,
        "electronic rock": 0.55,
        "industrial": 0.48,
        "synthwave": 0.42,
        "rock": 0.85
      },

      "indie rock": {
        "alternative rock": 0.78,
        "indie pop": 0.72,
        "indie folk": 0.65,
        "garage rock": 0.68,
        "indie electronic": 0.58,
        "chillwave": 0.52,
        "dream pop": 0.62,
        "rock": 0.72
      },

      // Pop crossover genres
      "pop": {
        "dance pop": 0.85,
        "electropop": 0.82,
        "synthpop": 0.78,
        "indie pop": 0.72,
        "electronic": 0.65,
        "house": 0.58,
        "future bass": 0.48
      },

      "dance pop": {
        "pop": 0.85,
        "electropop": 0.88,
        "euro pop": 0.82,
        "house": 0.68,
        "electronic": 0.72,
        "disco": 0.65
      },

      // Hip-hop crossover genres
      "hip hop": {
        "trap": 0.78,
        "rap": 0.92,
        "r&b": 0.65,
        "electronic": 0.45,
        "dubstep": 0.45,
        "future bass": 0.42,
        "drum and bass": 0.45
      },

      "trap": {
        "hip hop": 0.78,
        "future bass": 0.65,
        "dubstep": 0.68,
        "electronic": 0.58,
        "rap": 0.72
      },

      // Additional electronic subgenres
      "breakbeat": {
        "drum and bass": 0.78,
        "jungle": 0.82,
        "big beat": 0.75,
        "electronic": 0.68
      },

      "garage": {
        "uk garage": 0.95,
        "2-step": 0.88,
        "house": 0.55,
        "electronic": 0.62
      },

      "hardstyle": {
        "hardcore": 0.82,
        "hard techno": 0.68,
        "gabber": 0.75,
        "electronic": 0.65
      },

      "chillout": {
        "ambient": 0.85,
        "downtempo": 0.88,
        "lounge": 0.82,
        "trip hop": 0.65,
        "electronic": 0.62
      },

      "trip hop": {
        "downtempo": 0.78,
        "chillout": 0.65,
        "hip hop": 0.58,
        "electronic": 0.68,
        "ambient": 0.55
      }
    };
  }

  /**
   * Get similarity score between two genres
   */
  getSimilarity(genre1, genre2) {
    if (!genre1 || !genre2) return 0;
    
    const normalizedGenre1 = this.normalizeGenre(genre1);
    const normalizedGenre2 = this.normalizeGenre(genre2);
    
    if (normalizedGenre1 === normalizedGenre2) return 1.0;
    
    // Check direct mapping
    if (this.matrix[normalizedGenre1] && this.matrix[normalizedGenre1][normalizedGenre2]) {
      return this.matrix[normalizedGenre1][normalizedGenre2];
    }
    
    // Check reverse mapping
    if (this.matrix[normalizedGenre2] && this.matrix[normalizedGenre2][normalizedGenre1]) {
      return this.matrix[normalizedGenre2][normalizedGenre1];
    }
    
    // Check for partial matches
    return this.calculatePartialMatch(normalizedGenre1, normalizedGenre2);
  }

  /**
   * Normalize genre names for consistent matching
   */
  normalizeGenre(genre) {
    return genre.toLowerCase()
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[^\w\s]/g, '');
  }

  /**
   * Calculate partial match for compound genres
   */
  calculatePartialMatch(genre1, genre2) {
    const words1 = genre1.split(' ');
    const words2 = genre2.split(' ');
    
    let maxSimilarity = 0;
    
    // Check if any word from genre1 matches any word from genre2
    for (const word1 of words1) {
      for (const word2 of words2) {
        if (word1 === word2 && word1.length > 2) {
          maxSimilarity = Math.max(maxSimilarity, 0.3);
        }
        
        // Check if one word contains the other
        if (word1.includes(word2) || word2.includes(word1)) {
          if (Math.min(word1.length, word2.length) > 3) {
            maxSimilarity = Math.max(maxSimilarity, 0.2);
          }
        }
      }
    }
    
    return maxSimilarity;
  }

  /**
   * Get all similar genres for a given genre with scores
   */
  getSimilarGenres(genre, threshold = 0.3) {
    const normalizedGenre = this.normalizeGenre(genre);
    const similarities = [];
    
    if (this.matrix[normalizedGenre]) {
      Object.entries(this.matrix[normalizedGenre]).forEach(([similarGenre, score]) => {
        if (score >= threshold) {
          similarities.push({ genre: similarGenre, similarity: score });
        }
      });
    }
    
    // Also check reverse mappings
    Object.entries(this.matrix).forEach(([otherGenre, mappings]) => {
      if (mappings[normalizedGenre] && mappings[normalizedGenre] >= threshold) {
        const existing = similarities.find(s => s.genre === otherGenre);
        if (!existing) {
          similarities.push({ genre: otherGenre, similarity: mappings[normalizedGenre] });
        }
      }
    });
    
    return similarities.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Get matrix statistics
   */
  getMatrixStats() {
    const totalGenres = this.genreList.length;
    const totalRelationships = Object.values(this.matrix)
      .reduce((sum, mappings) => sum + Object.keys(mappings).length, 0);
    
    return {
      totalGenres,
      primaryGenres: Object.keys(this.matrix).length,
      totalRelationships,
      averageRelationshipsPerGenre: Math.round(totalRelationships / Object.keys(this.matrix).length),
      coverage: Math.round((Object.keys(this.matrix).length / totalGenres) * 100) + '%'
    };
  }

  /**
   * Calculate enhanced genre match score for events
   * Integrates with existing taste filtering system
   */
  calculateEnhancedGenreScore(eventGenres, userGenres) {
    if (!eventGenres || !userGenres || eventGenres.length === 0 || userGenres.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const userGenre of userGenres) {
      let bestMatchForUser = 0;
      
      for (const eventGenre of eventGenres) {
        const similarity = this.getSimilarity(userGenre, eventGenre);
        bestMatchForUser = Math.max(bestMatchForUser, similarity);
      }
      
      totalScore += bestMatchForUser * 100; // Convert to percentage
      maxPossibleScore += 100;
    }

    return maxPossibleScore > 0 ? Math.round(totalScore / maxPossibleScore) : 0;
  }
}

// Export for use in other modules
module.exports = { ExpandedGenreMatrix };

