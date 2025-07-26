// lib/tikoSoundStatIntegration.js
// TIKO SoundStat Integration with caching, aggregation, and fallback hierarchy
// Follows existing patterns and preserves all functionality

import SoundStatAPI from './soundStatAPI.js';

class TIKOSoundStatIntegration {
  constructor() {
    this.soundStat = new SoundStatAPI();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5-minute cache as per guidelines
    
    // Genre-based fallback profiles (intermediate fallback)
    this.genreProfiles = {
      'house': { energy: 0.8, danceability: 0.9, valence: 0.7, instrumentalness: 0.1 },
      'tech house': { energy: 0.85, danceability: 0.95, valence: 0.6, instrumentalness: 0.15 },
      'deep house': { energy: 0.6, danceability: 0.8, valence: 0.8, instrumentalness: 0.2 },
      'progressive house': { energy: 0.7, danceability: 0.7, valence: 0.6, instrumentalness: 0.3 },
      'techno': { energy: 0.9, danceability: 0.8, valence: 0.5, instrumentalness: 0.2 },
      'melodic techno': { energy: 0.75, danceability: 0.75, valence: 0.65, instrumentalness: 0.25 },
      'trance': { energy: 0.85, danceability: 0.7, valence: 0.8, instrumentalness: 0.1 },
      'progressive trance': { energy: 0.8, danceability: 0.65, valence: 0.75, instrumentalness: 0.15 },
      'ambient': { energy: 0.3, danceability: 0.2, valence: 0.5, instrumentalness: 0.8 },
      'downtempo': { energy: 0.4, danceability: 0.3, valence: 0.6, instrumentalness: 0.6 },
      'electronic': { energy: 0.75, danceability: 0.8, valence: 0.65, instrumentalness: 0.25 }, // Default electronic
      'edm': { energy: 0.9, danceability: 0.9, valence: 0.8, instrumentalness: 0.1 }
    };

    // Demo data (final fallback)
    this.demoData = {
      energy: 75,
      danceability: 82,
      valence: 65,
      instrumentalness: 15
    };
  }

  /**
   * Analyze user tracks and return aggregated sound characteristics
   * Implements proper fallback hierarchy: SoundStat → Genre-based → Demo
   */
  async analyzeUserTracks(spotifyTracks) {
    try {
      // Sample up to 10 tracks for analysis (as per guidelines)
      const tracksToAnalyze = spotifyTracks.slice(0, 10);
      
      if (tracksToAnalyze.length === 0) {
        return this.getFallbackCharacteristics('NO_TRACKS', []);
      }

      // Try SoundStat analysis for each track
      const analysisPromises = tracksToAnalyze.map(track => 
        this.analyzeTrackWithFallback(track)
      );

      const analyses = await Promise.allSettled(analysisPromises);
      
      // Filter successful analyses
      const successfulAnalyses = analyses
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => result.value.data);

      if (successfulAnalyses.length === 0) {
        // No SoundStat data available, use genre-based fallback
        return this.getGenreBasedCharacteristics(tracksToAnalyze);
      }

      // Calculate aggregated characteristics from SoundStat data
      const aggregated = this.calculateAggregatedCharacteristics(successfulAnalyses);
      
      return {
        soundCharacteristics: aggregated,
        source: 'soundstat_api',
        isRealData: true,
        confidence: this.calculateConfidence(successfulAnalyses.length, tracksToAnalyze.length),
        tracksAnalyzed: successfulAnalyses.length,
        totalTracks: tracksToAnalyze.length,
        lastFetch: new Date().toISOString(),
        fallbackReason: null
      };

    } catch (error) {
      console.error('TIKO SoundStat integration error:', error);
      return this.getFallbackCharacteristics('INTEGRATION_ERROR', spotifyTracks, error.message);
    }
  }

  /**
   * Analyze a single track with fallback handling
   */
  async analyzeTrackWithFallback(track) {
    try {
      const analysis = await this.soundStat.getTrackAnalysis(track.id);
      
      if (analysis && analysis.audio_analysis) {
        return {
          success: true,
          data: analysis,
          trackId: track.id,
          trackName: track.name
        };
      } else {
        return {
          success: false,
          error: 'Invalid SoundStat response',
          trackId: track.id
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        trackId: track.id
      };
    }
  }

  /**
   * Calculate aggregated characteristics from SoundStat analyses
   * Handles the correct audio_analysis.energy.value structure
   */
  calculateAggregatedCharacteristics(analyses) {
    const characteristics = { energy: 0, danceability: 0, valence: 0, instrumentalness: 0 };
    
    analyses.forEach(analysis => {
      if (analysis.audio_analysis) {
        // ✅ CORRECT: Handle nested structure audio_analysis.energy.value
        characteristics.energy += analysis.audio_analysis.energy?.value || 0;
        characteristics.danceability += analysis.audio_analysis.danceability?.value || 0;
        characteristics.valence += analysis.audio_analysis.valence?.value || 0;
        characteristics.instrumentalness += analysis.audio_analysis.instrumentalness?.value || 0;
      }
    });

    const count = analyses.length;
    return {
      energy: Math.round((characteristics.energy / count) * 100),
      danceability: Math.round((characteristics.danceability / count) * 100),
      positivity: Math.round((characteristics.valence / count) * 100), // Map valence to positivity
      acoustic: Math.round((characteristics.instrumentalness / count) * 100) // Map instrumentalness to acoustic
    };
  }

  /**
   * Get genre-based characteristics (intermediate fallback)
   */
  getGenreBasedCharacteristics(tracks) {
    try {
      // Extract genres from tracks
      const genres = tracks.flatMap(track => 
        track.artists?.flatMap(artist => artist.genres || []) || []
      );

      if (genres.length === 0) {
        return this.getFallbackCharacteristics('NO_GENRES', tracks);
      }

      // Find matching genre profiles
      const matchingProfiles = genres
        .map(genre => this.findGenreProfile(genre.toLowerCase()))
        .filter(profile => profile !== null);

      if (matchingProfiles.length === 0) {
        return this.getFallbackCharacteristics('NO_MATCHING_GENRES', tracks);
      }

      // Average the matching profiles
      const avgProfile = this.averageGenreProfiles(matchingProfiles);
      
      return {
        soundCharacteristics: {
          energy: Math.round(avgProfile.energy * 100),
          danceability: Math.round(avgProfile.danceability * 100),
          positivity: Math.round(avgProfile.valence * 100),
          acoustic: Math.round(avgProfile.instrumentalness * 100)
        },
        source: 'genre_estimation',
        isRealData: false,
        confidence: 0.6,
        tracksAnalyzed: tracks.length,
        totalTracks: tracks.length,
        lastFetch: new Date().toISOString(),
        fallbackReason: 'SOUNDSTAT_UNAVAILABLE'
      };

    } catch (error) {
      return this.getFallbackCharacteristics('GENRE_ANALYSIS_ERROR', tracks, error.message);
    }
  }

  /**
   * Find genre profile by name (fuzzy matching)
   */
  findGenreProfile(genreName) {
    // Exact match first
    if (this.genreProfiles[genreName]) {
      return this.genreProfiles[genreName];
    }

    // Fuzzy matching for common variations
    const genreKeys = Object.keys(this.genreProfiles);
    for (const key of genreKeys) {
      if (genreName.includes(key) || key.includes(genreName)) {
        return this.genreProfiles[key];
      }
    }

    // Default to electronic if no match
    return this.genreProfiles['electronic'];
  }

  /**
   * Average multiple genre profiles
   */
  averageGenreProfiles(profiles) {
    const avg = { energy: 0, danceability: 0, valence: 0, instrumentalness: 0 };
    
    profiles.forEach(profile => {
      avg.energy += profile.energy;
      avg.danceability += profile.danceability;
      avg.valence += profile.valence;
      avg.instrumentalness += profile.instrumentalness;
    });

    const count = profiles.length;
    return {
      energy: avg.energy / count,
      danceability: avg.danceability / count,
      valence: avg.valence / count,
      instrumentalness: avg.instrumentalness / count
    };
  }

  /**
   * Get fallback characteristics (final fallback)
   */
  getFallbackCharacteristics(reason, tracks = [], errorMessage = null) {
    return {
      soundCharacteristics: this.demoData,
      source: 'demo_data',
      isRealData: false,
      confidence: 0.0,
      tracksAnalyzed: 0,
      totalTracks: tracks.length,
      lastFetch: new Date().toISOString(),
      fallbackReason: reason,
      error: errorMessage
    };
  }

  /**
   * Calculate confidence score based on successful analyses
   */
  calculateConfidence(successfulCount, totalCount) {
    if (totalCount === 0) return 0;
    const ratio = successfulCount / totalCount;
    return Math.round(ratio * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Get integration statistics
   */
  getStats() {
    return {
      soundStatAPI: this.soundStat.getStats(),
      cacheSize: this.cache.size,
      genreProfilesAvailable: Object.keys(this.genreProfiles).length
    };
  }

  /**
   * Clear all caches
   */
  clearCache() {
    this.cache.clear();
    this.soundStat.clearCache();
  }
}

export default TIKOSoundStatIntegration;

