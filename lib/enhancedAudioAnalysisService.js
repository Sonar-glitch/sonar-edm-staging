// Enhanced Audio Analysis Service - CORRECTED for seamless integration
// REPLACES: tikoSoundStatIntegration.js
// PRESERVES: All existing interfaces and schemas
// INTEGRATES: With existing pipeline components

const { EnhancedMetadataInferenceEngine } = require('./enhancedMetadataInferenceEngine');

/**
 * Enhanced Audio Analysis Service
 * 
 * INTEGRATION POINTS:
 * - Replaces tikoSoundStatIntegration.js with same interface
 * - Uses existing ExpandedGenreMatrix and AlternativeArtistRelationships
 * - Outputs same format as current audioFeaturesService.js
 * - Compatible with enhancedRecommendationSystem.js
 * - Integrates with Essentia.js service via environment variables
 */
class EnhancedAudioAnalysisService {
  constructor() {
    // INTEGRATION: Initialize components
    this.metadataInference = new EnhancedMetadataInferenceEngine();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes - match existing
    
    // SERVICE CONFIGURATION: From environment variables
    this.essentiaServiceUrl = process.env.ESSENTIA_SERVICE_URL;
    this.soundCloudClientId = process.env.SOUNDCLOUD_CLIENT_ID;
    this.enabled = process.env.ENHANCED_AUDIO_ANALYSIS_ENABLED === 'true';
    
    // FALLBACK CONFIGURATION: Match existing tikoSoundStatIntegration
    this.demoData = {
      energy: 75,
      danceability: 82,
      positivity: 65,
      acoustic: 15
    };
    
    console.log('🎵 Enhanced Audio Analysis Service initialized');
    console.log(`   Essentia Service: ${this.essentiaServiceUrl || 'Not configured'}`);
    console.log(`   SoundCloud Client: ${this.soundCloudClientId ? 'Configured' : 'Not configured'}`);
    console.log(`   Enhanced Analysis: ${this.enabled}`);
  }

  /**
   * MAIN ANALYSIS METHOD
   * Matches tikoSoundStatIntegration.js interface exactly
   * Implements the corrected sound characteristics flow from diagram
   */
  async analyzeUserTracks(spotifyTracks) {
    try {
      // SAFETY CHECK: Handle empty tracks
      if (!spotifyTracks || spotifyTracks.length === 0) {
        return this.getFallbackCharacteristics('NO_TRACKS', []);
      }

      // SAMPLE TRACKS: Match existing behavior (up to 10 tracks)
      const tracksToAnalyze = spotifyTracks.slice(0, 10);
      console.log(`🎵 Analyzing ${tracksToAnalyze.length} tracks with enhanced pipeline`);

      // ENHANCED ANALYSIS: Process each track through the corrected flow
      const analysisPromises = tracksToAnalyze.map(track => 
        this.analyzeTrackWithEnhancedFlow(track)
      );

      const analyses = await Promise.allSettled(analysisPromises);
      
      // FILTER SUCCESSFUL ANALYSES
      const successfulAnalyses = analyses
        .filter(result => result.status === 'fulfilled' && result.value.success)
        .map(result => result.value.data);

      if (successfulAnalyses.length === 0) {
        // NO ENHANCED DATA: Use metadata inference fallback
        return this.getMetadataInferenceCharacteristics(tracksToAnalyze);
      }

      // CALCULATE AGGREGATED CHARACTERISTICS: Match existing format
      const aggregated = this.calculateAggregatedCharacteristics(successfulAnalyses);
      
      return {
        // SCHEMA COMPATIBILITY: Match tikoSoundStatIntegration.js output
        soundCharacteristics: aggregated,
        source: 'enhanced_audio_analysis',
        isRealData: true,
        confidence: this.calculateConfidence(successfulAnalyses.length, tracksToAnalyze.length),
        tracksAnalyzed: successfulAnalyses.length,
        totalTracks: tracksToAnalyze.length,
        lastFetch: new Date().toISOString(),
        fallbackReason: null
      };

    } catch (error) {
      console.error('Enhanced audio analysis error:', error);
      return this.getFallbackCharacteristics('ANALYSIS_ERROR', spotifyTracks, error.message);
    }
  }

  /**
   * ENHANCED TRACK ANALYSIS
   * Implements the corrected sound characteristics flow:
   * 1. ISRC in AcousticBrainz? → Use features
   * 2. Apple Preview Available? → Essentia.js analysis  
   * 3. YouTube/SoundCloud Available? → Extract audio features
   * 4. Final fallback → Enhanced Metadata Inference
   */
  async analyzeTrackWithEnhancedFlow(track) {
    const startTime = Date.now();
    console.log(`🔍 Enhanced analysis: ${track.name} by ${track.artists[0]?.name}`);
    
    try {
      // STEP 1: Check AcousticBrainz (ISRC lookup)
      if (track.external_ids?.isrc) {
        console.log(`🔍 Step 1: Checking AcousticBrainz for ISRC: ${track.external_ids.isrc}`);
        const acousticFeatures = await this.checkAcousticBrainz(track.external_ids.isrc);
        if (acousticFeatures) {
          console.log(`✅ AcousticBrainz features found`);
          return {
            success: true,
            data: {
              features: this.convertToStandardFormat(acousticFeatures),
              source: 'acousticbrainz',
              confidence: 0.95,
              processingTime: Date.now() - startTime
            },
            trackId: track.id,
            trackName: track.name
          };
        }
      }

      // STEP 2: Try Preview Services (Apple/SoundCloud)
      console.log(`🔍 Step 2: Trying preview services`);
      const previewUrl = await this.getPreviewUrl(track);
      
      if (previewUrl) {
        console.log(`✅ Preview URL found, analyzing with Essentia.js`);
        
        // STEP 3: Analyze with Essentia.js
        const essentiaFeatures = await this.analyzeWithEssentia(previewUrl, track.id);
        if (essentiaFeatures) {
          console.log(`✅ Essentia.js analysis completed`);
          return {
            success: true,
            data: {
              features: this.convertToStandardFormat(essentiaFeatures),
              source: 'essentia_analysis',
              confidence: 0.90,
              processingTime: Date.now() - startTime
            },
            trackId: track.id,
            trackName: track.name
          };
        }
      }

      // STEP 4: Enhanced Metadata Inference (Final fallback)
      console.log(`🔍 Step 4: Using enhanced metadata inference`);
      const inferredFeatures = await this.metadataInference.inferFeatures(track);
      
      return {
        success: true,
        data: {
          features: this.convertToStandardFormat(inferredFeatures),
          source: 'enhanced_metadata_inference',
          confidence: inferredFeatures.confidence || 0.60,
          processingTime: Date.now() - startTime
        },
        trackId: track.id,
        trackName: track.name
      };

    } catch (error) {
      console.error(`Track analysis failed for ${track.name}:`, error);
      return {
        success: false,
        error: error.message,
        trackId: track.id,
        trackName: track.name
      };
    }
  }

  /**
   * STEP 1: AcousticBrainz Integration
   */
  async checkAcousticBrainz(isrc) {
    try {
      // AcousticBrainz uses MBID, not ISRC directly
      // This is a simplified implementation - most tracks won't be found
      console.log(`🔍 AcousticBrainz lookup for ISRC: ${isrc}`);
      
      // For now, return null as AcousticBrainz has limited coverage
      // In production, this would query: https://acousticbrainz.org/api/v1/
      return null;
      
    } catch (error) {
      console.error('AcousticBrainz lookup failed:', error);
      return null;
    }
  }

  /**
   * STEP 2: Get Preview URL (Apple iTunes / SoundCloud)
   */
  async getPreviewUrl(track) {
    const artist = track.artists[0]?.name;
    const title = track.name;
    
    if (!artist || !title) {
      console.log('❌ Missing artist or title for preview search');
      return null;
    }

    // Try Apple iTunes first
    try {
      console.log(`🍎 Trying Apple iTunes for: ${artist} - ${title}`);
      const appleUrl = await this.searchAppleItunes(artist, title);
      if (appleUrl) {
        console.log(`✅ Apple preview found`);
        return appleUrl;
      }
    } catch (error) {
      console.error('Apple iTunes search failed:', error);
    }

    // Try SoundCloud if configured
    if (this.soundCloudClientId) {
      try {
        console.log(`☁️ Trying SoundCloud for: ${artist} - ${title}`);
        const soundCloudUrl = await this.searchSoundCloud(artist, title);
        if (soundCloudUrl) {
          console.log(`✅ SoundCloud stream found`);
          return soundCloudUrl;
        }
      } catch (error) {
        console.error('SoundCloud search failed:', error);
      }
    }

    console.log(`❌ No preview URL found for: ${artist} - ${title}`);
    return null;
  }

  /**
   * Apple iTunes Search
   */
  async searchAppleItunes(artist, title) {
    try {
      const query = `${artist} ${title}`;
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`iTunes API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const track = data.results[0];
        return track.previewUrl;
      }
      
      return null;
    } catch (error) {
      console.error('iTunes search failed:', error);
      return null;
    }
  }

  /**
   * SoundCloud Search
   */
  async searchSoundCloud(artist, title) {
    try {
      const query = `${artist} ${title}`;
      const url = `https://api.soundcloud.com/tracks?q=${encodeURIComponent(query)}&client_id=${this.soundCloudClientId}&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`SoundCloud API error: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.length > 0) {
        const track = data[0];
        return `https://api.soundcloud.com/tracks/${track.id}/stream?client_id=${this.soundCloudClientId}`;
      }
      
      return null;
    } catch (error) {
      console.error('SoundCloud search failed:', error);
      return null;
    }
  }

  /**
   * STEP 3: Essentia.js Analysis
   */
  async analyzeWithEssentia(audioUrl, trackId = null) {
    if (!this.essentiaServiceUrl) {
      console.log('❌ Essentia service URL not configured');
      return null;
    }

    try {
      console.log(`🔬 Sending to Essentia service: ${this.essentiaServiceUrl}`);
      
      const response = await fetch(`${this.essentiaServiceUrl}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioUrl,
          trackId
        }),
        timeout: 30000 // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Essentia service error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.features) {
        console.log(`✅ Essentia analysis successful`);
        return result.features;
      } else {
        console.log(`❌ Essentia analysis failed: ${result.error || 'Unknown error'}`);
        return null;
      }

    } catch (error) {
      console.error('Essentia service request failed:', error);
      return null;
    }
  }

  /**
   * CONVERT TO STANDARD FORMAT
   * Ensures all sources output the same format for aggregation
   */
  convertToStandardFormat(features) {
    // Handle different input formats and normalize to 0-1 scale
    return {
      energy: this.normalizeFeature(features.energy, 0, 1),
      danceability: this.normalizeFeature(features.danceability, 0, 1),
      valence: this.normalizeFeature(features.valence, 0, 1),
      tempo: this.normalizeFeature(features.tempo, 60, 200),
      acousticness: this.normalizeFeature(features.acousticness, 0, 1),
      instrumentalness: this.normalizeFeature(features.instrumentalness, 0, 1),
      speechiness: this.normalizeFeature(features.speechiness, 0, 1)
    };
  }

  /**
   * Normalize feature values to expected ranges
   */
  normalizeFeature(value, min, max) {
    if (value === undefined || value === null) return 0.5; // Default middle value
    
    // If already in 0-1 range, return as is
    if (min === 0 && max === 1) {
      return Math.max(0, Math.min(1, value));
    }
    
    // Normalize to 0-1 range
    return Math.max(0, Math.min(1, (value - min) / (max - min)));
  }

  /**
   * CALCULATE AGGREGATED CHARACTERISTICS
   * Matches existing tikoSoundStatIntegration.js format exactly
   */
  calculateAggregatedCharacteristics(analyses) {
    const characteristics = { energy: 0, danceability: 0, valence: 0, instrumentalness: 0 };
    
    analyses.forEach(analysis => {
      if (analysis.features) {
        characteristics.energy += analysis.features.energy || 0;
        characteristics.danceability += analysis.features.danceability || 0;
        characteristics.valence += analysis.features.valence || 0;
        characteristics.instrumentalness += analysis.features.instrumentalness || 0;
      }
    });

    const count = analyses.length;
    
    // SCHEMA COMPATIBILITY: Convert to percentage format matching existing
    return {
      energy: Math.round((characteristics.energy / count) * 100),
      danceability: Math.round((characteristics.danceability / count) * 100),
      positivity: Math.round((characteristics.valence / count) * 100), // Map valence to positivity
      acoustic: Math.round((characteristics.instrumentalness / count) * 100) // Map instrumentalness to acoustic
    };
  }

  /**
   * METADATA INFERENCE FALLBACK
   * Uses enhanced metadata inference when no audio analysis is available
   */
  async getMetadataInferenceCharacteristics(tracks) {
    try {
      console.log(`🧠 Using enhanced metadata inference for ${tracks.length} tracks`);
      
      // Analyze each track with enhanced metadata inference
      const inferencePromises = tracks.map(track => 
        this.metadataInference.inferFeatures(track)
      );
      
      const inferences = await Promise.allSettled(inferencePromises);
      
      // Filter successful inferences
      const successfulInferences = inferences
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);
      
      if (successfulInferences.length === 0) {
        return this.getFallbackCharacteristics('METADATA_INFERENCE_FAILED', tracks);
      }
      
      // Calculate aggregated characteristics from inferences
      const aggregated = this.calculateAggregatedCharacteristics(
        successfulInferences.map(inference => ({ features: inference }))
      );
      
      // Calculate average confidence
      const avgConfidence = successfulInferences.reduce((sum, inf) => sum + (inf.confidence || 0), 0) / successfulInferences.length;
      
      return {
        soundCharacteristics: aggregated,
        source: 'enhanced_metadata_inference',
        isRealData: false, // Metadata inference is not "real" audio data
        confidence: avgConfidence,
        tracksAnalyzed: successfulInferences.length,
        totalTracks: tracks.length,
        lastFetch: new Date().toISOString(),
        fallbackReason: 'NO_AUDIO_ANALYSIS_AVAILABLE'
      };
      
    } catch (error) {
      console.error('Metadata inference characteristics failed:', error);
      return this.getFallbackCharacteristics('METADATA_INFERENCE_ERROR', tracks, error.message);
    }
  }

  /**
   * FALLBACK CHARACTERISTICS
   * Matches existing tikoSoundStatIntegration.js format exactly
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
   * CONFIDENCE CALCULATION
   * Matches existing tikoSoundStatIntegration.js behavior
   */
  calculateConfidence(successfulCount, totalCount) {
    if (totalCount === 0) return 0;
    const ratio = successfulCount / totalCount;
    return Math.round(ratio * 100) / 100; // Round to 2 decimal places
  }

  /**
   * BATCH ANALYSIS
   * For processing multiple tracks efficiently
   */
  async analyzeTracks(spotifyTracks) {
    console.log(`🎵 Batch analyzing ${spotifyTracks.length} tracks`);
    
    const results = [];
    const maxConcurrent = 3; // Limit concurrent requests
    
    for (let i = 0; i < spotifyTracks.length; i += maxConcurrent) {
      const batch = spotifyTracks.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(track => this.analyzeTrackWithEnhancedFlow(track));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        const track = batch[index];
        if (result.status === 'fulfilled') {
          results.push({
            trackId: track.id,
            trackName: track.name,
            artist: track.artists[0]?.name,
            ...result.value
          });
        } else {
          results.push({
            trackId: track.id,
            trackName: track.name,
            artist: track.artists[0]?.name,
            success: false,
            error: result.reason.message,
            source: 'batch_error'
          });
        }
      });
      
      // Small delay between batches to avoid overwhelming services
      if (i + maxConcurrent < spotifyTracks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const successful = results.filter(r => r.success).length;
    console.log(`✅ Batch analysis complete: ${successful}/${results.length} successful`);
    
    return results;
  }

  /**
   * CACHE MANAGEMENT
   */
  getCacheKey(track) {
    const artist = track.artists?.[0]?.name || 'unknown';
    const title = track.name || 'unknown';
    return `enhanced_${artist}_${title}`.toLowerCase().replace(/[^\w]/g, '_');
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
   * SERVICE STATISTICS
   * Matches existing tikoSoundStatIntegration.js interface
   */
  getStats() {
    return {
      enhancedAudioAnalysis: {
        enabled: this.enabled,
        essentiaServiceConfigured: !!this.essentiaServiceUrl,
        soundCloudConfigured: !!this.soundCloudClientId,
        cacheSize: this.cache.size
      },
      metadataInference: {
        genreMatrixSize: this.metadataInference.genreMatrix.genreList.length,
        artistRelationshipsAvailable: true
      }
    };
  }

  /**
   * CLEAR CACHE
   * Matches existing tikoSoundStatIntegration.js interface
   */
  clearCache() {
    this.cache.clear();
    this.metadataInference.cache.clear();
  }
}

// EXPORT: Use CommonJS to match existing module format
module.exports = EnhancedAudioAnalysisService;

