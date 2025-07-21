// ENHANCED: lib/enhancedRecommendationSystem.js - Phase 2 COMPLETE: Three-Dimensional Taste Understanding
// Surgical integration with existing taste filtering system + Sound Characteristics as 3rd Dimension

const { ExpandedGenreMatrix } = require('./expandedGenreMatrix');
const { AlternativeArtistRelationships } = require('./alternativeArtistRelationships');
const { AudioFeaturesService } = require('./audioFeaturesService');

/**
 * Enhanced Recommendation System - Phase 2 COMPLETE
 * Three-Dimensional Taste Understanding:
 * 1. Genre Similarity (35% weight) - PRESERVED: ExpandedGenreMatrix
 * 2. Artist Relationships (35% weight) - PRESERVED: AlternativeArtistRelationships  
 * 3. Sound Characteristics (30% weight) - NEW: Audio features matching
 */
class EnhancedRecommendationSystem {
  constructor() {
    // PRESERVED: All existing components
    this.genreMatrix = new ExpandedGenreMatrix();
    this.artistRelationships = new AlternativeArtistRelationships();
    this.enabled = process.env.ENHANCED_RECOMMENDATION_ENABLED === 'true';
    
    // NEW: Sound characteristics integration
    this.soundCharacteristicsEnabled = process.env.SOUND_CHARACTERISTICS_ENABLED === 'true';
    this.audioFeaturesService = new AudioFeaturesService();
    
    // UPDATED: Version tracking
    this.version = '2.1.0'; // Enhanced with sound characteristics
    
    console.log(`🚀 Enhanced Recommendation System v${this.version} initialized`);
    console.log(`   Enhanced recommendation: ${this.enabled}`);
    console.log(`   Sound characteristics: ${this.soundCharacteristicsEnabled}`);
    console.log(`   Three-dimensional taste understanding: ${this.enabled && this.soundCharacteristicsEnabled ? 'ACTIVE' : 'PARTIAL'}`);
  }

  /**
   * ENHANCED: Main processing function with three-dimensional scoring
   */
  async processEventsWithEnhancedScoring(events, userTaste) {
    if (!this.enabled || !events || events.length === 0) {
      return events;
    }

    const dimensionCount = this.soundCharacteristicsEnabled ? 3 : 2;
    console.log(`🎯 Processing ${events.length} events with ${dimensionCount}-dimensional enhanced scoring...`);

    try {
      // Process each event with enhanced scoring
      const enhancedEvents = await Promise.all(
        events.map(event => this.enhanceEventScoring(event, userTaste))
      );

      // Calculate average score improvement
      const originalAvg = events.reduce((sum, e) => sum + (e.tasteScore || 0), 0) / events.length;
      const enhancedAvg = enhancedEvents.reduce((sum, e) => sum + (e.tasteScore || 0), 0) / enhancedEvents.length;
      
      console.log(`📊 Score improvement: ${originalAvg.toFixed(1)}% → ${enhancedAvg.toFixed(1)}%`);
      console.log(`✅ ${dimensionCount}-dimensional scoring complete. Average score improvement calculated.`);

      return enhancedEvents;
    } catch (error) {
      console.error('❌ Enhanced scoring failed:', error);
      return events; // Return original events if enhancement fails
    }
  }

  /**
   * ENHANCED: Three-dimensional event scoring
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
      let enhancedScore = 0;
      let confidence = 'medium';
      let enhancementDetails = [];

      // Determine if we have sound characteristics from worker
      const hasSoundCharacteristics = event.soundCharacteristics && 
                                     event.soundCharacteristics.source !== 'extraction_failed';

      // ADAPTIVE WEIGHTS based on sound characteristics availability
      let weights;
      if (hasSoundCharacteristics && this.soundCharacteristicsEnabled) {
        // THREE-DIMENSIONAL SCORING with sound characteristics
        weights = {
          genre: 0.35,    // Reduced from 60% to make room for sound
          artist: 0.35,   // Reduced from 40% to make room for sound
          sound: 0.30     // NEW: Sound characteristics dimension
        };
      } else {
        // PRESERVED: Original 2-dimensional weights when sound unavailable
        weights = {
          genre: 0.60,    // Original weight preserved
          artist: 0.40    // Original weight preserved
        };
      }

      // PRESERVED: 1. Enhanced Genre Scoring (Dimension 1)
      const genreEnhancement = this.calculateEnhancedGenreScore(event, userTaste);
      enhancedScore += genreEnhancement.score * weights.genre;
      enhancementDetails.push(`Genre: ${genreEnhancement.score}% (${genreEnhancement.matches} matches, ${Math.round(weights.genre * 100)}% weight)`);

      // PRESERVED: 2. Enhanced Artist Scoring (Dimension 2)
      const artistEnhancement = await this.calculateEnhancedArtistScore(event, userTaste);
      enhancedScore += artistEnhancement.score * weights.artist;
      enhancementDetails.push(`Artist: ${artistEnhancement.score}% (${artistEnhancement.matches} matches, ${Math.round(weights.artist * 100)}% weight)`);

      // NEW: 3. Sound Characteristics Scoring (Dimension 3)
      let soundEnhancement = null;
      if (hasSoundCharacteristics && this.soundCharacteristicsEnabled) {
        soundEnhancement = await this.calculateSoundCharacteristicsScore(event, userTaste);
        enhancedScore += soundEnhancement.score * weights.sound;
        enhancementDetails.push(`Sound: ${soundEnhancement.score}% (${soundEnhancement.confidence}% confidence, ${Math.round(weights.sound * 100)}% weight)`);
      }

      // ENHANCED: Calculate confidence based on all dimensions
      confidence = this.calculateConfidence(event, userTaste, genreEnhancement, artistEnhancement, soundEnhancement);

      // Apply confidence weighting to blend with original score
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
        artistMatches: artistEnhancement.details,
        soundMatches: soundEnhancement?.details,
        
        // NEW: Three-dimensional scoring metadata
        threeDimensionalScoring: hasSoundCharacteristics && this.soundCharacteristicsEnabled,
        scoringWeights: weights,
        dimensionsUsed: hasSoundCharacteristics && this.soundCharacteristicsEnabled ? 3 : 2
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
   * PRESERVED: Calculate enhanced genre score using similarity matrix (exact copy)
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
   * PRESERVED: Calculate enhanced artist score using relationship data (exact copy)
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
   * NEW: Calculate sound characteristics score (3rd dimension)
   */
  async calculateSoundCharacteristicsScore(event, userTaste) {
    try {
      // Check if event has sound characteristics from worker
      if (!event.soundCharacteristics) {
        return { score: 50, confidence: 0, details: 'No sound characteristics available from worker' };
      }

      // Get user's sound profile (will be enhanced with real user data in future)
      const userSoundProfile = this.getUserSoundProfile(userTaste);
      
      // Calculate similarity between event sound characteristics and user profile
      const similarity = this.calculateSoundSimilarity(event.soundCharacteristics, userSoundProfile);
      
      // Apply confidence weighting from worker's sound characteristics
      const workerConfidence = event.soundCharacteristics.confidence || 0.5;
      const confidenceWeightedScore = (similarity.score * workerConfidence) + (50 * (1 - workerConfidence));
      
      const finalScore = Math.round(Math.max(0, Math.min(100, confidenceWeightedScore)));

      return {
        score: finalScore,
        confidence: Math.round(workerConfidence * 100),
        details: `${similarity.details} (worker confidence: ${Math.round(workerConfidence * 100)}%, source: ${event.soundCharacteristics.source})`,
        soundProfile: userSoundProfile,
        eventFeatures: {
          energy: event.soundCharacteristics.energy,
          danceability: event.soundCharacteristics.danceability,
          valence: event.soundCharacteristics.valence,
          tempo: event.soundCharacteristics.tempo
        },
        dataFreshness: event.soundCharacteristics.dataFreshness,
        source: event.soundCharacteristics.source
      };

    } catch (error) {
      console.error('Sound characteristics scoring error:', error);
      return { score: 50, confidence: 0, details: `Error: ${error.message}` };
    }
  }

  /**
   * NEW: Get user's sound profile (placeholder for future user data integration)
   */
  getUserSoundProfile(userTaste) {
    // For now, return EDM-focused profile based on user's genres
    // This will be enhanced with real user listening data in the future
    
    const userGenres = userTaste.genres || [];
    const edmGenres = ['house', 'techno', 'trance', 'dubstep', 'electronic', 'dance', 'edm'];
    const hasEdmPreference = userGenres.some(genre => 
      edmGenres.some(edmGenre => genre.toLowerCase().includes(edmGenre))
    );

    if (hasEdmPreference) {
      return {
        energy: 0.75,        // High energy preference for EDM users
        danceability: 0.80,  // High danceability preference
        valence: 0.60,       // Moderate positivity preference
        tempo: 125,          // Preferred BPM around 125
        profile: 'edm_focused'
      };
    } else {
      return {
        energy: 0.50,        // Moderate energy for non-EDM users
        danceability: 0.60,  // Moderate danceability
        valence: 0.55,       // Moderate positivity
        tempo: 110,          // Lower BPM preference
        profile: 'general'
      };
    }
  }

  /**
   * NEW: Calculate similarity between event sound characteristics and user profile
   */
  calculateSoundSimilarity(eventSound, userProfile) {
    let totalSimilarity = 0;
    let weightSum = 0;

    const featureWeights = {
      energy: 0.30,        // High importance for energy matching
      danceability: 0.30,  // High importance for danceability
      valence: 0.20,       // Medium importance for mood
      tempo: 0.20          // Medium importance for BPM preference
    };

    Object.entries(featureWeights).forEach(([feature, weight]) => {
      if (eventSound[feature] !== undefined && userProfile[feature] !== undefined) {
        let similarity;
        
        if (feature === 'tempo') {
          const difference = Math.abs(eventSound[feature] - userProfile[feature]);
          const maxReasonableDifference = 50; // 50 BPM max difference
          similarity = Math.max(0, 1 - (difference / maxReasonableDifference));
        } else {
          const difference = Math.abs(eventSound[feature] - userProfile[feature]);
          similarity = 1 - difference;
        }
        
        totalSimilarity += similarity * weight;
        weightSum += weight;
      }
    });

    if (weightSum === 0) {
      return { score: 50, details: 'No valid sound features for comparison' };
    }

    const similarityScore = (totalSimilarity / weightSum) * 100;
    
    return {
      score: Math.round(similarityScore),
      details: `Sound similarity: ${Math.round(similarityScore)}% (${userProfile.profile} profile)`
    };
  }

  /**
   * ENHANCED: Calculate confidence level based on all three dimensions
   */
  calculateConfidence(event, userTaste, genreEnhancement, artistEnhancement, soundEnhancement = null) {
    let confidenceScore = 0;

    // Data availability (40% of confidence)
    const hasEventGenres = (event.genres || []).length > 0;
    const hasEventArtists = (event.artists || []).length > 0;
    const hasUserGenres = (userTaste.genres || []).length > 0;
    const hasUserArtists = (userTaste.topArtists || []).length > 0;
    const hasSoundData = soundEnhancement !== null;

    if (hasEventGenres && hasUserGenres) confidenceScore += 15;
    if (hasEventArtists && hasUserArtists) confidenceScore += 15;
    if (hasSoundData) confidenceScore += 10; // NEW: Sound data availability

    // Match quality (60% of confidence)
    if (genreEnhancement.matches > 0) confidenceScore += 20;
    if (artistEnhancement.matches > 0) confidenceScore += 20;
    if (soundEnhancement && soundEnhancement.confidence > 50) confidenceScore += 20; // NEW: Sound quality

    if (confidenceScore >= 70) return 'high';
    if (confidenceScore >= 40) return 'medium';
    return 'low';
  }

  /**
   * ENHANCED: Get system statistics with sound characteristics
   */
  getSystemStats() {
    const audioFeaturesStats = this.audioFeaturesService ? this.audioFeaturesService.getStats() : null;
    
    return {
      enabled: this.enabled,
      soundCharacteristicsEnabled: this.soundCharacteristicsEnabled,
      genreMatrix: this.genreMatrix.getMatrixStats(),
      artistRelationships: this.artistRelationships.getStats(),
      audioFeatures: audioFeaturesStats,
      version: this.version,
      capabilities: [
        'Dynamic genre similarity calculation (Dimension 1)',
        'ML-based artist relationships (Dimension 2)',
        'Sound characteristics matching (Dimension 3)', // NEW
        'Three-dimensional taste understanding', // NEW
        'Adaptive scoring weights',
        'Intelligent confidence scoring',
        'Fallback compatibility'
      ],
      scoringDimensions: this.soundCharacteristicsEnabled ? 3 : 2
    };
  }
}

// Create singleton instance
const enhancedRecommendationSystem = new EnhancedRecommendationSystem();

module.exports = { enhancedRecommendationSystem, EnhancedRecommendationSystem };

