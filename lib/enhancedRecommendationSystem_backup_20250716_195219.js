// lib/enhancedRecommendationSystem.js - Phase 2 Enhanced Recommendation System
// Surgical integration with existing taste filtering system

const { ExpandedGenreMatrix } = require('./expandedGenreMatrix');
const { AlternativeArtistRelationships } = require('./alternativeArtistRelationships');

/**
 * Enhanced Recommendation System - Phase 2
 * Provides ML-powered genre similarity and artist relationship scoring
 */
class EnhancedRecommendationSystem {
  constructor() {
    this.genreMatrix = new ExpandedGenreMatrix();
    this.artistRelationships = new AlternativeArtistRelationships();
    this.enabled = process.env.ENHANCED_RECOMMENDATION_ENABLED === 'true';
    this.version = '2.0.0';
    
    console.log(`🚀 Enhanced Recommendation System initialized (enabled: ${this.enabled})`);
  }

  /**
   * Main processing function - enhances existing event scoring
   */
  async processEventsWithEnhancedScoring(events, userTaste) {
    if (!this.enabled || !events || events.length === 0) {
      return events;
    }

    console.log(`🎯 Processing ${events.length} events with Phase 2 enhanced scoring...`);

    try {
      // Process each event with enhanced scoring
      const enhancedEvents = await Promise.all(
        events.map(event => this.enhanceEventScoring(event, userTaste))
      );

      // Calculate average score improvement
      const originalAvg = events.reduce((sum, e) => sum + (e.tasteScore || 0), 0) / events.length;
      const enhancedAvg = enhancedEvents.reduce((sum, e) => sum + (e.tasteScore || 0), 0) / enhancedEvents.length;
      
      console.log(`📊 Score improvement: ${originalAvg.toFixed(1)}% → ${enhancedAvg.toFixed(1)}%`);
      console.log('✅ Enhanced scoring complete. Average score improvement calculated.');

      return enhancedEvents;
    } catch (error) {
      console.error('❌ Enhanced scoring failed:', error);
      return events; // Return original events if enhancement fails
    }
  }

  /**
   * Enhance individual event scoring
   */
  async enhanceEventScoring(event, userTaste) {
    try {
      // SAFETY CHECK: Handle null userTaste
      if (!userTaste || !userTaste.genres) {
        // Return event with default enhanced score
        return {
          ...event,
          tasteScore: event.tasteScore || 50,
          enhancedScore: event.tasteScore || 50,
          confidence: 'low',
          enhancementApplied: false,
          enhancementReason: 'No user taste data available'
        };
      }

      const originalScore = event.tasteScore || 0;
      let enhancedScore = originalScore;
      let confidence = 'medium';
      let enhancementDetails = [];

      // 1. Enhanced Genre Scoring (60% weight)
      const genreEnhancement = this.calculateEnhancedGenreScore(event, userTaste);
      enhancedScore = (enhancedScore * 0.4) + (genreEnhancement.score * 0.6);
      enhancementDetails.push(`Genre: ${genreEnhancement.score}% (${genreEnhancement.matches} matches)`);

      // 2. Enhanced Artist Scoring (40% weight)
      const artistEnhancement = await this.calculateEnhancedArtistScore(event, userTaste);
      enhancedScore = (enhancedScore * 0.6) + (artistEnhancement.score * 0.4);
      enhancementDetails.push(`Artist: ${artistEnhancement.score}% (${artistEnhancement.matches} matches)`);

      // 3. Calculate confidence based on data quality
      confidence = this.calculateConfidence(event, userTaste, genreEnhancement, artistEnhancement);

      // 4. Apply confidence weighting
      const confidenceWeight = confidence === 'high' ? 1.0 : confidence === 'medium' ? 0.8 : 0.6;
      const finalScore = Math.round((originalScore * (1 - confidenceWeight)) + (enhancedScore * confidenceWeight));

      return {
        ...event,
        tasteScore: Math.max(0, Math.min(100, finalScore)),
        originalScore,
        enhancedScore: Math.round(enhancedScore),
        confidence,
        enhancementApplied: true,
        enhancementDetails,
        genreMatches: genreEnhancement.details,
        artistMatches: artistEnhancement.details
      };

    } catch (error) {
      console.error(`Error processing event ${event.name}:`, error);
      return {
        ...event,
        tasteScore: event.tasteScore || 0,
        enhancementApplied: false,
        enhancementError: error.message
      };
    }
  }

  /**
   * Calculate enhanced genre score using similarity matrix
   */
  calculateEnhancedGenreScore(event, userTaste) {
    const eventGenres = event.genres || [];
    const userGenres = userTaste.genres || [];

    if (eventGenres.length === 0 || userGenres.length === 0) {
      return { score: 30, matches: 0, details: [] };
    }

    let totalSimilarity = 0;
    let matchCount = 0;
    const details = [];

    for (const userGenre of userGenres) {
      let bestMatch = 0;
      let bestEventGenre = '';

      for (const eventGenre of eventGenres) {
        const similarity = this.genreMatrix.getSimilarity(userGenre, eventGenre);
        if (similarity > bestMatch) {
          bestMatch = similarity;
          bestEventGenre = eventGenre;
        }
      }

      if (bestMatch > 0.3) { // Threshold for meaningful similarity
        totalSimilarity += bestMatch;
        matchCount++;
        details.push({
          userGenre,
          eventGenre: bestEventGenre,
          similarity: Math.round(bestMatch * 100)
        });
      }
    }

    const averageSimilarity = matchCount > 0 ? totalSimilarity / matchCount : 0;
    const score = Math.round(averageSimilarity * 100);

    return {
      score: Math.max(20, Math.min(100, score)),
      matches: matchCount,
      details
    };
  }

  /**
   * Calculate enhanced artist score using relationship data
   */
  async calculateEnhancedArtistScore(event, userTaste) {
    const eventArtists = event.artists || [];
    const userArtists = userTaste.topArtists || [];

    if (eventArtists.length === 0 || userArtists.length === 0) {
      return { score: 30, matches: 0, details: [] };
    }

    let totalSimilarity = 0;
    let matchCount = 0;
    const details = [];

    for (const userArtist of userArtists.slice(0, 10)) { // Limit to top 10 for performance
      let bestMatch = 0;
      let bestEventArtist = '';

      for (const eventArtist of eventArtists) {
        // Direct name match
        if (userArtist.name.toLowerCase() === eventArtist.name.toLowerCase()) {
          bestMatch = 1.0;
          bestEventArtist = eventArtist.name;
          break;
        }

        // Similarity via artist relationships
        const similarity = await this.artistRelationships.getArtistSimilarity(
          userArtist.name, 
          eventArtist.name
        );

        if (similarity > bestMatch) {
          bestMatch = similarity;
          bestEventArtist = eventArtist.name;
        }
      }

      if (bestMatch > 0.3) { // Threshold for meaningful similarity
        totalSimilarity += bestMatch;
        matchCount++;
        details.push({
          userArtist: userArtist.name,
          eventArtist: bestEventArtist,
          similarity: Math.round(bestMatch * 100)
        });
      }
    }

    const averageSimilarity = matchCount > 0 ? totalSimilarity / matchCount : 0;
    const score = Math.round(averageSimilarity * 100);

    return {
      score: Math.max(20, Math.min(100, score)),
      matches: matchCount,
      details
    };
  }

  /**
   * Calculate confidence level based on data quality
   */
  calculateConfidence(event, userTaste, genreEnhancement, artistEnhancement) {
    let confidenceScore = 0;

    // Data availability (40% of confidence)
    const hasEventGenres = (event.genres || []).length > 0;
    const hasEventArtists = (event.artists || []).length > 0;
    const hasUserGenres = (userTaste.genres || []).length > 0;
    const hasUserArtists = (userTaste.topArtists || []).length > 0;

    if (hasEventGenres && hasUserGenres) confidenceScore += 20;
    if (hasEventArtists && hasUserArtists) confidenceScore += 20;

    // Match quality (60% of confidence)
    if (genreEnhancement.matches > 0) confidenceScore += 30;
    if (artistEnhancement.matches > 0) confidenceScore += 30;

    if (confidenceScore >= 70) return 'high';
    if (confidenceScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    return {
      enabled: this.enabled,
      genreMatrix: this.genreMatrix.getMatrixStats(),
      artistRelationships: this.artistRelationships.getStats(),
      version: this.version,
      capabilities: [
        'Dynamic genre similarity calculation',
        'ML-based artist relationships',
        'Intelligent confidence scoring',
        'Fallback compatibility'
      ]
    };
  }
}

// Create singleton instance
const enhancedRecommendationSystem = new EnhancedRecommendationSystem();

module.exports = { enhancedRecommendationSystem, EnhancedRecommendationSystem };

