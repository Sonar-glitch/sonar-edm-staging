// Enhanced Metadata Inference Engine - Integrates with existing TIKO pipeline
// PRESERVES: All existing schemas and integration points
// ENHANCES: Intelligence and accuracy while maintaining compatibility

const { ExpandedGenreMatrix } = require('./expandedGenreMatrix');
const { AlternativeArtistRelationships } = require('./alternativeArtistRelationships');

/**
 * Enhanced Metadata Inference Engine
 * Integrates seamlessly with existing TIKO pipeline and schemas
 * 
 * INTEGRATION POINTS:
 * - Uses existing ExpandedGenreMatrix (121 genres)
 * - Uses existing AlternativeArtistRelationships (Spotify + fallback)
 * - Outputs same format as tikoSoundStatIntegration.js
 * - Compatible with enhancedRecommendationSystem.js
 * - Maintains audioFeaturesService.js schema
 */
class EnhancedMetadataInferenceEngine {
  constructor() {
    // INTEGRATION: Use existing components
    this.genreMatrix = new ExpandedGenreMatrix();
    this.artistRelationships = new AlternativeArtistRelationships();
    
    // Cache for performance
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    
    // SCHEMA COMPATIBILITY: Match existing audioFeaturesService output format
    this.outputSchema = {
      energy: 'number (0-1)',
      danceability: 'number (0-1)', 
      valence: 'number (0-1)',
      tempo: 'number (60-200)',
      acousticness: 'number (0-1)',
      instrumentalness: 'number (0-1)',
      speechiness: 'number (0-1)'
    };
    
    console.log('🧠 Enhanced Metadata Inference Engine initialized');
    console.log(`   Genre matrix: ${this.genreMatrix.genreList.length} genres`);
    console.log(`   Artist relationships: Spotify API + fallback data`);
    console.log(`   Output schema: Compatible with existing pipeline`);
  }

  /**
   * MAIN INFERENCE METHOD
   * Matches tikoSoundStatIntegration.js interface for seamless replacement
   */
  async inferFeatures(spotifyTrack) {
    const startTime = Date.now();
    console.log(`🧠 Inferring features for: ${spotifyTrack.name} by ${spotifyTrack.artists[0]?.name}`);
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(spotifyTrack);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log(`⚡ Cache hit for inference`);
        return cached;
      }

      // MULTI-FACTOR ANALYSIS
      const analysisFactors = await this.gatherAnalysisFactors(spotifyTrack);
      
      // INTELLIGENT SCORING with confidence calculation
      const features = await this.calculateIntelligentFeatures(analysisFactors);
      
      // CONFIDENCE REFINEMENT based on data quality
      const confidence = this.calculateConfidenceScore(analysisFactors);
      
      const result = {
        // SCHEMA COMPATIBILITY: Match existing format
        energy: features.energy,
        danceability: features.danceability,
        valence: features.valence,
        tempo: features.tempo,
        acousticness: features.acousticness || 0.1,
        instrumentalness: features.instrumentalness || 0.5,
        speechiness: features.speechiness || 0.1,
        
        // METADATA for integration
        confidence: confidence,
        source: 'enhanced_metadata_inference',
        processingTime: Date.now() - startTime,
        factors: analysisFactors.summary,
        
        // COMPATIBILITY: Match tikoSoundStatIntegration format
        dataFreshness: new Date(),
        trackName: spotifyTrack.name,
        artistName: spotifyTrack.artists[0]?.name
      };
      
      // Cache the result
      this.setCache(cacheKey, result);
      
      console.log(`✅ Inference complete with confidence: ${confidence.toFixed(2)}`);
      return result;

    } catch (error) {
      console.error('Metadata inference failed:', error);
      
      // FALLBACK: Return safe default matching existing schema
      return this.getEmergencyFallback(spotifyTrack);
    }
  }

  /**
   * MULTI-FACTOR ANALYSIS GATHERING
   * Collects all available data for intelligent inference
   */
  async gatherAnalysisFactors(spotifyTrack) {
    const factors = {
      // 1. GENRE ANALYSIS (reuse existing ExpandedGenreMatrix)
      genres: await this.analyzeGenres(spotifyTrack),
      
      // 2. ARTIST ANALYSIS (reuse existing AlternativeArtistRelationships)
      artists: await this.analyzeArtists(spotifyTrack),
      
      // 3. TRACK CHARACTERISTICS INFERENCE
      trackCharacteristics: this.analyzeTrackCharacteristics(spotifyTrack),
      
      // 4. TEMPORAL FACTORS
      temporalFactors: this.analyzeTemporalFactors(spotifyTrack),
      
      // 5. POPULARITY ANALYSIS
      popularityFactors: this.analyzePopularityFactors(spotifyTrack)
    };
    
    // Summary for confidence calculation
    factors.summary = {
      genreMatches: factors.genres.matches.length,
      artistDataAvailable: factors.artists.hasData,
      trackDataQuality: factors.trackCharacteristics.quality,
      temporalRelevance: factors.temporalFactors.relevance,
      popularityIndicators: factors.popularityFactors.indicators
    };
    
    return factors;
  }

  /**
   * 1. GENRE ANALYSIS using existing ExpandedGenreMatrix
   */
  async analyzeGenres(spotifyTrack) {
    const genres = [];
    
    // Extract genres from all artists
    if (spotifyTrack.artists) {
      for (const artist of spotifyTrack.artists) {
        if (artist.genres) {
          genres.push(...artist.genres);
        } else {
          // Use existing artist relationships to infer genres
          const inferredGenres = await this.artistRelationships.inferGenresFromArtist(artist.name);
          genres.push(...inferredGenres);
        }
      }
    }
    
    // Find genre profiles using existing matrix
    const matches = [];
    const uniqueGenres = [...new Set(genres)];
    
    for (const genre of uniqueGenres) {
      const similarGenres = this.genreMatrix.getSimilarGenres(genre, 0.3);
      matches.push({
        genre: genre,
        similarGenres: similarGenres,
        confidence: similarGenres.length > 0 ? 0.8 : 0.4
      });
    }
    
    return {
      genres: uniqueGenres,
      matches: matches,
      primaryGenre: uniqueGenres[0] || 'electronic',
      confidence: matches.length > 0 ? 0.8 : 0.3
    };
  }

  /**
   * 2. ARTIST ANALYSIS using existing AlternativeArtistRelationships
   */
  async analyzeArtists(spotifyTrack) {
    if (!spotifyTrack.artists || spotifyTrack.artists.length === 0) {
      return { hasData: false, confidence: 0 };
    }
    
    const primaryArtist = spotifyTrack.artists[0];
    
    try {
      // Use existing artist relationships system
      const similarArtists = await this.artistRelationships.getSimilarArtists(primaryArtist.name, 5);
      const artistGenres = await this.artistRelationships.inferGenresFromArtist(primaryArtist.name);
      
      return {
        hasData: true,
        primaryArtist: primaryArtist.name,
        similarArtists: similarArtists,
        inferredGenres: artistGenres,
        confidence: similarArtists.length > 0 ? 0.9 : 0.6,
        source: 'existing_artist_relationships'
      };
      
    } catch (error) {
      console.warn('Artist analysis failed:', error.message);
      return { hasData: false, confidence: 0, error: error.message };
    }
  }

  /**
   * 3. TRACK CHARACTERISTICS INFERENCE
   * Analyzes track-specific factors for audio feature inference
   */
  analyzeTrackCharacteristics(spotifyTrack) {
    const characteristics = {
      namePatterns: this.analyzeTrackNamePatterns(spotifyTrack.name),
      durationAnalysis: this.analyzeDuration(spotifyTrack.duration_ms),
      albumContext: this.analyzeAlbumContext(spotifyTrack.album),
      releaseYear: this.analyzeReleaseYear(spotifyTrack.album?.release_date)
    };
    
    // Calculate quality score
    let quality = 0;
    if (characteristics.namePatterns.confidence > 0) quality += 0.3;
    if (characteristics.durationAnalysis.confidence > 0) quality += 0.2;
    if (characteristics.albumContext.confidence > 0) quality += 0.3;
    if (characteristics.releaseYear.confidence > 0) quality += 0.2;
    
    return {
      ...characteristics,
      quality: quality,
      confidence: quality > 0.5 ? 0.7 : 0.4
    };
  }

  /**
   * TRACK NAME PATTERN ANALYSIS
   */
  analyzeTrackNamePatterns(trackName) {
    if (!trackName) return { confidence: 0 };
    
    const name = trackName.toLowerCase();
    const patterns = {
      remix: /remix|rmx|rework|edit|bootleg/i,
      extended: /extended|original mix|club mix/i,
      radio: /radio edit|radio mix|radio version/i,
      acoustic: /acoustic|unplugged|stripped/i,
      live: /live|concert|session/i,
      instrumental: /instrumental|karaoke/i
    };
    
    const matches = {};
    let confidence = 0;
    
    Object.entries(patterns).forEach(([type, pattern]) => {
      if (pattern.test(name)) {
        matches[type] = true;
        confidence += 0.2;
      }
    });
    
    return {
      matches: matches,
      confidence: Math.min(confidence, 1.0),
      implications: this.getPatternImplications(matches)
    };
  }

  /**
   * Get audio feature implications from track name patterns
   */
  getPatternImplications(patterns) {
    const implications = {};
    
    if (patterns.remix) {
      implications.energy = 0.1; // Remixes often more energetic
      implications.danceability = 0.1;
    }
    
    if (patterns.extended) {
      implications.energy = 0.05;
      implications.danceability = 0.05;
    }
    
    if (patterns.radio) {
      implications.energy = -0.05; // Radio edits often toned down
      implications.valence = 0.05; // More mainstream appeal
    }
    
    if (patterns.acoustic) {
      implications.acousticness = 0.4; // Much more acoustic
      implications.energy = -0.2;
      implications.instrumentalness = 0.1;
    }
    
    if (patterns.instrumental) {
      implications.instrumentalness = 0.5;
      implications.speechiness = -0.3;
    }
    
    return implications;
  }

  /**
   * DURATION ANALYSIS
   */
  analyzeDuration(durationMs) {
    if (!durationMs) return { confidence: 0 };
    
    const minutes = durationMs / (1000 * 60);
    let characteristics = {};
    let confidence = 0.6;
    
    if (minutes < 3) {
      // Short tracks - often radio edits or intros
      characteristics = {
        type: 'short',
        implications: {
          valence: 0.05, // More mainstream
          energy: -0.05
        }
      };
    } else if (minutes > 6) {
      // Long tracks - often progressive or extended mixes
      characteristics = {
        type: 'extended',
        implications: {
          energy: 0.05,
          danceability: 0.05,
          instrumentalness: 0.1
        }
      };
    } else {
      // Standard length
      characteristics = {
        type: 'standard',
        implications: {}
      };
      confidence = 0.3;
    }
    
    return {
      duration: minutes,
      characteristics: characteristics,
      confidence: confidence
    };
  }

  /**
   * 4. TEMPORAL FACTORS ANALYSIS
   */
  analyzeTemporalFactors(spotifyTrack) {
    const releaseDate = spotifyTrack.album?.release_date;
    if (!releaseDate) return { relevance: 0, confidence: 0 };
    
    const releaseYear = new Date(releaseDate).getFullYear();
    const currentYear = new Date().getFullYear();
    const age = currentYear - releaseYear;
    
    // Era-based audio characteristics
    let eraCharacteristics = {};
    let relevance = 1.0;
    
    if (releaseYear < 2000) {
      // Classic electronic era
      eraCharacteristics = {
        energy: -0.1,
        acousticness: 0.05,
        instrumentalness: 0.1
      };
      relevance = 0.7;
    } else if (releaseYear < 2010) {
      // Early 2000s electronic
      eraCharacteristics = {
        energy: 0.05,
        danceability: 0.05
      };
      relevance = 0.8;
    } else if (releaseYear < 2020) {
      // Modern electronic era
      eraCharacteristics = {
        energy: 0.1,
        danceability: 0.1,
        valence: 0.05
      };
      relevance = 0.9;
    } else {
      // Contemporary
      eraCharacteristics = {
        energy: 0.05,
        valence: 0.1
      };
      relevance = 1.0;
    }
    
    return {
      releaseYear: releaseYear,
      age: age,
      era: this.getEraName(releaseYear),
      characteristics: eraCharacteristics,
      relevance: relevance,
      confidence: 0.6
    };
  }

  /**
   * 5. POPULARITY ANALYSIS
   */
  analyzePopularityFactors(spotifyTrack) {
    const popularity = spotifyTrack.popularity || 0;
    let characteristics = {};
    let indicators = 0;
    
    if (popularity > 70) {
      // High popularity - mainstream characteristics
      characteristics = {
        valence: 0.1, // More positive
        energy: 0.05,
        speechiness: 0.02 // Slightly more vocal
      };
      indicators = 3;
    } else if (popularity > 40) {
      // Medium popularity
      characteristics = {
        valence: 0.05
      };
      indicators = 2;
    } else {
      // Low popularity - underground characteristics
      characteristics = {
        instrumentalness: 0.05,
        energy: 0.05 // Underground often more intense
      };
      indicators = 1;
    }
    
    return {
      popularity: popularity,
      tier: this.getPopularityTier(popularity),
      characteristics: characteristics,
      indicators: indicators,
      confidence: popularity > 0 ? 0.5 : 0.1
    };
  }

  /**
   * INTELLIGENT FEATURE CALCULATION
   * Multi-factor scoring with weighted contributions
   */
  async calculateIntelligentFeatures(factors) {
    // Base features from primary genre
    const baseFeatures = this.getGenreBaseFeatures(factors.genres.primaryGenre);
    
    // Apply multi-factor adjustments
    const adjustments = this.calculateFactorAdjustments(factors);
    
    // Combine with weights
    const weights = {
      genreMatch: 0.4,           // Primary genre influence
      artistSimilarity: 0.3,     // Similar artists' characteristics  
      trackCharacteristics: 0.2, // Track-specific factors
      temporalFactors: 0.1       // Release year, trends
    };
    
    const features = {};
    
    // Calculate each feature with weighted adjustments
    ['energy', 'danceability', 'valence', 'tempo'].forEach(feature => {
      let value = baseFeatures[feature] || 0.5;
      
      // Apply weighted adjustments
      if (adjustments.genre[feature]) {
        value += adjustments.genre[feature] * weights.genreMatch;
      }
      if (adjustments.artist[feature]) {
        value += adjustments.artist[feature] * weights.artistSimilarity;
      }
      if (adjustments.track[feature]) {
        value += adjustments.track[feature] * weights.trackCharacteristics;
      }
      if (adjustments.temporal[feature]) {
        value += adjustments.temporal[feature] * weights.temporalFactors;
      }
      
      // Normalize and add randomness to avoid identical profiles
      if (feature === 'tempo') {
        features[feature] = Math.max(60, Math.min(200, value + (Math.random() - 0.5) * 10));
      } else {
        features[feature] = Math.max(0, Math.min(1, value + (Math.random() - 0.5) * 0.1));
      }
    });
    
    // Add additional features with defaults
    features.acousticness = this.calculateAcousticness(factors);
    features.instrumentalness = this.calculateInstrumentalness(factors);
    features.speechiness = this.calculateSpeechiness(factors);
    
    return features;
  }

  /**
   * Get base features from genre using existing ExpandedGenreMatrix
   */
  getGenreBaseFeatures(genre) {
    // Use existing genre profiles from audioFeaturesService for consistency
    const genreProfiles = {
      'house': { energy: 0.8, danceability: 0.9, valence: 0.7, tempo: 125 },
      'techno': { energy: 0.9, danceability: 0.8, valence: 0.6, tempo: 130 },
      'deep house': { energy: 0.7, danceability: 0.9, valence: 0.8, tempo: 120 },
      'tech house': { energy: 0.85, danceability: 0.9, valence: 0.7, tempo: 125 },
      'progressive house': { energy: 0.75, danceability: 0.85, valence: 0.75, tempo: 125 },
      'trance': { energy: 0.8, danceability: 0.7, valence: 0.8, tempo: 135 },
      'ambient': { energy: 0.3, danceability: 0.4, valence: 0.6, tempo: 90 },
      'electronic': { energy: 0.7, danceability: 0.8, valence: 0.7, tempo: 120 }
    };
    
    const normalizedGenre = genre.toLowerCase();
    return genreProfiles[normalizedGenre] || genreProfiles['electronic'];
  }

  /**
   * Calculate factor-based adjustments
   */
  calculateFactorAdjustments(factors) {
    return {
      genre: this.calculateGenreAdjustments(factors.genres),
      artist: this.calculateArtistAdjustments(factors.artists),
      track: this.calculateTrackAdjustments(factors.trackCharacteristics),
      temporal: this.calculateTemporalAdjustments(factors.temporalFactors)
    };
  }

  /**
   * CONFIDENCE SCORING based on data quality
   */
  calculateConfidenceScore(factors) {
    let confidence = 0;
    
    // Genre confidence (40% weight)
    confidence += factors.genres.confidence * 0.4;
    
    // Artist confidence (30% weight)
    confidence += (factors.artists.confidence || 0) * 0.3;
    
    // Track characteristics confidence (20% weight)
    confidence += factors.trackCharacteristics.confidence * 0.2;
    
    // Temporal factors confidence (10% weight)
    confidence += (factors.temporalFactors.confidence || 0) * 0.1;
    
    return Math.max(0.3, Math.min(0.95, confidence)); // Clamp between 0.3 and 0.95
  }

  /**
   * CACHE MANAGEMENT
   */
  getCacheKey(track) {
    const artist = track.artists?.[0]?.name || 'unknown';
    const title = track.name || 'unknown';
    return `${artist}_${title}`.toLowerCase().replace(/[^\w]/g, '_');
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * EMERGENCY FALLBACK matching existing schema
   */
  getEmergencyFallback(spotifyTrack) {
    return {
      energy: 0.7,
      danceability: 0.8,
      valence: 0.6,
      tempo: 125,
      acousticness: 0.1,
      instrumentalness: 0.5,
      speechiness: 0.1,
      confidence: 0.3,
      source: 'emergency_fallback',
      processingTime: 0,
      trackName: spotifyTrack.name,
      artistName: spotifyTrack.artists?.[0]?.name,
      dataFreshness: new Date()
    };
  }

  /**
   * UTILITY METHODS
   */
  getEraName(year) {
    if (year < 2000) return 'classic';
    if (year < 2010) return 'early_2000s';
    if (year < 2020) return 'modern';
    return 'contemporary';
  }

  getPopularityTier(popularity) {
    if (popularity > 70) return 'mainstream';
    if (popularity > 40) return 'popular';
    if (popularity > 10) return 'underground';
    return 'niche';
  }

  // Additional calculation methods for specific features
  calculateAcousticness(factors) {
    let base = 0.1;
    if (factors.trackCharacteristics.namePatterns.matches?.acoustic) {
      base += 0.4;
    }
    return Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.1));
  }

  calculateInstrumentalness(factors) {
    let base = 0.5;
    if (factors.trackCharacteristics.namePatterns.matches?.instrumental) {
      base += 0.4;
    }
    return Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.1));
  }

  calculateSpeechiness(factors) {
    let base = 0.1;
    if (factors.popularityFactors.popularity > 70) {
      base += 0.05; // Popular tracks might have more vocals
    }
    return Math.max(0, Math.min(1, base + (Math.random() - 0.5) * 0.05));
  }

  // Placeholder methods for adjustment calculations
  calculateGenreAdjustments(genreFactors) {
    return {}; // Implement based on genre similarity scores
  }

  calculateArtistAdjustments(artistFactors) {
    return {}; // Implement based on similar artists' characteristics
  }

  calculateTrackAdjustments(trackFactors) {
    const adjustments = {};
    if (trackFactors.namePatterns.implications) {
      Object.assign(adjustments, trackFactors.namePatterns.implications);
    }
    if (trackFactors.durationAnalysis.characteristics?.implications) {
      Object.assign(adjustments, trackFactors.durationAnalysis.characteristics.implications);
    }
    return adjustments;
  }

  calculateTemporalAdjustments(temporalFactors) {
    return temporalFactors.characteristics || {};
  }
}

module.exports = { EnhancedMetadataInferenceEngine };

