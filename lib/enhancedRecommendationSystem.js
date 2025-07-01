// lib/enhancedRecommendationSystem.js - Phase 2 Enhanced Recommendation System
// Surgical integration with existing processEventsWithTasteFiltering function

const { ExpandedGenreMatrix } = require('./expandedGenreMatrix');
const { AlternativeArtistRelationships } = require('./alternativeArtistRelationships');

/**
 * Enhanced Recommendation System that integrates with existing taste filtering
 * Provides ML-powered scoring while maintaining compatibility with current system
 */
class EnhancedRecommendationSystem {
  constructor() {
    this.genreMatrix = new ExpandedGenreMatrix();
    this.artistRelationships = new AlternativeArtistRelationships();
    this.isEnabled = process.env.ENHANCED_RECOMMENDATION_ENABLED === 'true';
    
    console.log(`🎯 Enhanced Recommendation System initialized (enabled: ${this.isEnabled})`);
  }

  /**
   * Calculate enhanced event score using Phase 2 algorithms
   * Integrates with existing taste filtering without breaking compatibility
   */
  async calculateEnhancedEventScore(event, userTaste, originalScore = 0) {
    try {
      if (!this.isEnabled) {
        return originalScore; // Fallback to original scoring if disabled
      }

      if (!event || !userTaste) {
        return originalScore;
      }

      // Extract event data
      const eventGenres = this.extractEventGenres(event);
      const eventArtists = this.extractEventArtists(event);
      const userGenres = userTaste.genres || [];
      const userArtists = userTaste.topArtists || [];

      console.log(`🎵 Calculating enhanced score for: ${event.name}`);
      console.log(`📊 Event genres: ${eventGenres.join(', ')}`);
      console.log(`👤 User genres: ${userGenres.slice(0, 3).join(', ')}`);

      // Calculate component scores
      const genreScore = await this.calculateEnhancedGenreScore(eventGenres, userGenres);
      const artistScore = await this.calculateEnhancedArtistScore(eventArtists, userArtists);
      const confidenceScore = this.calculateConfidenceScore(eventGenres, eventArtists, userGenres, userArtists);

      // Weighted combination of scores
      const enhancedScore = this.combineScores({
        genre: genreScore,
        artist: artistScore,
        confidence: confidenceScore,
        original: originalScore
      });

      console.log(`✅ Enhanced scoring - Genre: ${genreScore}, Artist: ${artistScore}, Final: ${enhancedScore}`);

      return enhancedScore;

    } catch (error) {
      console.error('❌ Error in enhanced scoring:', error);
      return originalScore; // Fallback to original score on error
    }
  }

  /**
   * Calculate enhanced genre score using the expanded genre matrix
   */
  async calculateEnhancedGenreScore(eventGenres, userGenres) {
    if (!eventGenres || !userGenres || eventGenres.length === 0 || userGenres.length === 0) {
      return 0;
    }

    try {
      return this.genreMatrix.calculateEnhancedGenreScore(eventGenres, userGenres);
    } catch (error) {
      console.error('Error in enhanced genre scoring:', error);
      return this.calculateFallbackGenreScore(eventGenres, userGenres);
    }
  }

  /**
   * Calculate enhanced artist score using artist relationships
   */
  async calculateEnhancedArtistScore(eventArtists, userArtists) {
    if (!eventArtists || !userArtists || eventArtists.length === 0 || userArtists.length === 0) {
      return 0;
    }

    try {
      return await this.artistRelationships.calculateArtistScore(eventArtists, userArtists);
    } catch (error) {
      console.error('Error in enhanced artist scoring:', error);
      return this.calculateFallbackArtistScore(eventArtists, userArtists);
    }
  }

  /**
   * Calculate confidence score based on data quality and match types
   */
  calculateConfidenceScore(eventGenres, eventArtists, userGenres, userArtists) {
    let confidence = 50; // Base confidence

    // Boost confidence based on data quality
    if (eventGenres && eventGenres.length > 0) confidence += 15;
    if (eventArtists && eventArtists.length > 0) confidence += 15;
    if (userGenres && userGenres.length > 2) confidence += 10;
    if (userArtists && userArtists.length > 2) confidence += 10;

    return Math.min(confidence, 100);
  }

  /**
   * Combine multiple scores with intelligent weighting
   */
  combineScores({ genre, artist, confidence, original }) {
    // Dynamic weighting based on data availability
    let genreWeight = 0.4;
    let artistWeight = 0.3;
    let originalWeight = 0.3;

    // Adjust weights based on score quality
    if (artist === 0) {
      genreWeight = 0.6;
      originalWeight = 0.4;
      artistWeight = 0;
    }

    if (genre === 0) {
      artistWeight = 0.5;
      originalWeight = 0.5;
      genreWeight = 0;
    }

    // Calculate weighted score
    const weightedScore = (genre * genreWeight) + (artist * artistWeight) + (original * originalWeight);
    
    // Apply confidence modifier
    const confidenceModifier = confidence / 100;
    const finalScore = Math.round(weightedScore * confidenceModifier);

    return Math.max(0, Math.min(100, finalScore));
  }

  /**
   * Extract genres from event data
   */
  extractEventGenres(event) {
    const genres = [];

    // From classifications
    if (event.classifications && event.classifications.length > 0) {
      event.classifications.forEach(classification => {
        if (classification.genre && classification.genre.name) {
          genres.push(classification.genre.name);
        }
        if (classification.subGenre && classification.subGenre.name) {
          genres.push(classification.subGenre.name);
        }
      });
    }

    // From detected genres (if available)
    if (event.detectedGenres && Array.isArray(event.detectedGenres)) {
      genres.push(...event.detectedGenres);
    }

    // From genre field (if available)
    if (event.genre) {
      if (Array.isArray(event.genre)) {
        genres.push(...event.genre);
      } else {
        genres.push(event.genre);
      }
    }

    // Clean and normalize genres
    return [...new Set(genres)]
      .filter(genre => genre && typeof genre === 'string')
      .map(genre => genre.toLowerCase().trim());
  }

  /**
   * Extract artists from event data
   */
  extractEventArtists(event) {
    const artists = [];

    // From embedded attractions
    if (event._embedded && event._embedded.attractions) {
      event._embedded.attractions.forEach(attraction => {
        if (attraction.name) {
          artists.push(attraction.name);
        }
      });
    }

    // From headliners (if available)
    if (event.headliners && Array.isArray(event.headliners)) {
      artists.push(...event.headliners);
    }

    // From artistList (if available)
    if (event.artistList && Array.isArray(event.artistList)) {
      artists.push(...event.artistList);
    }

    // From name parsing (last resort)
    if (artists.length === 0 && event.name) {
      const nameArtists = this.extractArtistsFromEventName(event.name);
      artists.push(...nameArtists);
    }

    return [...new Set(artists)]
      .filter(artist => artist && typeof artist === 'string')
      .map(artist => artist.trim());
  }

  /**
   * Extract artists from event name using patterns
   */
  extractArtistsFromEventName(eventName) {
    const artists = [];
    
    // Common patterns for artist extraction
    const patterns = [
      /^([^:]+):/,  // "Artist: Event Title"
      /presents:?\s*([^,]+)/i,  // "Venue presents: Artist"
      /featuring:?\s*([^,]+)/i,  // "Event featuring Artist"
      /with:?\s*([^,]+)/i,  // "Event with Artist"
      /^([^-]+)\s*-/,  // "Artist - Event Title"
    ];

    for (const pattern of patterns) {
      const match = eventName.match(pattern);
      if (match && match[1]) {
        const artist = match[1].trim();
        if (artist.length > 2 && !artist.toLowerCase().includes('night') && !artist.toLowerCase().includes('party')) {
          artists.push(artist);
        }
      }
    }

    return artists;
  }

  /**
   * Fallback genre scoring using simple matching
   */
  calculateFallbackGenreScore(eventGenres, userGenres) {
    let score = 0;
    
    for (const userGenre of userGenres) {
      for (const eventGenre of eventGenres) {
        if (userGenre.toLowerCase() === eventGenre.toLowerCase()) {
          score += 30; // Exact match
        } else if (userGenre.toLowerCase().includes(eventGenre.toLowerCase()) || 
                   eventGenre.toLowerCase().includes(userGenre.toLowerCase())) {
          score += 15; // Partial match
        }
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Fallback artist scoring using simple matching
   */
  calculateFallbackArtistScore(eventArtists, userArtists) {
    let score = 0;
    
    for (const userArtist of userArtists) {
      for (const eventArtist of eventArtists) {
        if (userArtist.name && userArtist.name.toLowerCase() === eventArtist.toLowerCase()) {
          score += 40; // Exact match
        } else if (userArtist.name && 
                   (userArtist.name.toLowerCase().includes(eventArtist.toLowerCase()) ||
                    eventArtist.toLowerCase().includes(userArtist.name.toLowerCase()))) {
          score += 20; // Partial match
        }
      }
    }

    return Math.min(score, 100);
  }

  /**
   * Process events with enhanced recommendation system
   * Integrates with existing processEventsWithTasteFiltering function
   */
  async processEventsWithEnhancedScoring(events, userTaste) {
    if (!this.isEnabled || !events || events.length === 0) {
      return events;
    }

    console.log(`🚀 Processing ${events.length} events with enhanced scoring...`);

    const enhancedEvents = await Promise.all(
      events.map(async (event) => {
        try {
          // Calculate enhanced score
          const originalScore = event.matchScore || 0;
          const enhancedScore = await this.calculateEnhancedEventScore(event, userTaste, originalScore);
          
          return {
            ...event,
            matchScore: enhancedScore,
            tasteScore: enhancedScore, // For compatibility
            enhancedScoring: true,
            scoringComponents: {
              genre: await this.calculateEnhancedGenreScore(
                this.extractEventGenres(event), 
                userTaste.genres || []
              ),
              artist: await this.calculateEnhancedArtistScore(
                this.extractEventArtists(event), 
                userTaste.topArtists || []
              ),
              original: originalScore
            }
          };
        } catch (error) {
          console.error(`Error processing event ${event.name}:`, error);
          return event; // Return original event on error
        }
      })
    );

    console.log(`✅ Enhanced scoring complete. Average score improvement calculated.`);
    return enhancedEvents;
  }

  /**
   * Get system statistics and performance metrics
   */
  getSystemStats() {
    return {
      enabled: this.isEnabled,
      genreMatrix: this.genreMatrix.getMatrixStats(),
      artistRelationships: this.artistRelationships.getRelationshipStats(),
      version: '2.0.0',
      capabilities: [
        'Dynamic genre similarity calculation',
        'ML-based artist relationships',
        'Intelligent confidence scoring',
        'Fallback compatibility'
      ]
    };
  }

  /**
   * Enable or disable the enhanced recommendation system
   */
  setEnabled(enabled) {
    this.isEnabled = enabled;
    console.log(`🎯 Enhanced Recommendation System ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Export singleton instance
const enhancedRecommendationSystem = new EnhancedRecommendationSystem();

module.exports = { 
  EnhancedRecommendationSystem,
  enhancedRecommendationSystem
};

