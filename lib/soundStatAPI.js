// lib/soundStatAPI.js
// CORRECTED: SoundStat API Service with proper response validation for real API structure
// Fixes: Invalid SoundStat response: missing audio_analysis

class SoundStatAPI {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes cache (as per Claude guidelines)
    this.rateLimitDelayMs = 200; // ✅ FIXED: Property for delay amount
    this.lastRequestTime = 0;
    
    // Statistics tracking (following AudioFeaturesService pattern)
    this.stats = {
      totalRequests: 0,
      liveDataFetches: 0,
      fallbackUsages: 0,
      errors: 0,
      authErrors: 0,
      lastError: null,
      lastErrorCode: null,
      lastSuccessfulFetch: null,
      cacheSize: 0
    };

    // SoundStat API configuration
    this.apiKey = "4Bwbb8OrfpHukJBZSOaIolUMZat0rj3I-baIzASBVw0";
    this.baseUrl = "https://soundstat.info/api/v1";
    this.apiEnabled = !!this.apiKey;
    
    console.log(`🔬 SoundStatAPI: ${this.apiEnabled ? 'API key configured' : 'No API key - using fallback'}`);
  }

  /**
   * Get proper headers for SoundStat API (X-API-Key authentication)
   */
  getHeaders() {
    return {
      'X-API-Key': this.apiKey,  // ✅ CORRECT authentication method
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  /**
   * Get cache key for a track
   */
  getCacheKey(spotifyTrackId) {
    return `soundstat_track_${spotifyTrackId}`;
  }

  /**
   * Get cached result if available and not expired
   */
  getFromCache(cacheKey) {
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(cacheKey); // Remove expired cache
    }
    return null;
  }

  /**
   * Store result in cache
   */
  setCache(cacheKey, data) {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    this.stats.cacheSize = this.cache.size;
  }

  /**
   * ✅ FIXED: Rate limiting delay method (was missing)
   */
  async rateLimitDelay() {
    const timeSinceLastRequest = Date.now() - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelayMs) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelayMs - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Get track analysis from SoundStat API
   */
  async getTrackAnalysis(spotifyTrackId) {
    this.stats.totalRequests++;
    
    try {
      // Check cache first
      const cacheKey = this.getCacheKey(spotifyTrackId);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // ✅ FIXED: Now properly calls the method
      await this.rateLimitDelay();

      // Make API request with correct headers
      const response = await fetch(`${this.baseUrl}/track/${spotifyTrackId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          this.stats.authErrors++;
          this.stats.lastErrorCode = 'SOUNDSTAT_AUTH_ERROR';
          throw new Error(`SoundStat authentication failed: ${response.status}`);
        }
        if (response.status === 404) {
          this.stats.lastErrorCode = 'SOUNDSTAT_TRACK_NOT_FOUND';
          throw new Error(`Track not found in SoundStat database: ${spotifyTrackId}`);
        }
        if (response.status === 429) {
          this.stats.lastErrorCode = 'SOUNDSTAT_RATE_LIMIT';
          throw new Error('SoundStat rate limit exceeded');
        }
        throw new Error(`SoundStat API error: ${response.status}`);
      }

      const data = await response.json();
      
      // ✅ CORRECTED: Validate real SoundStat response structure
      if (!data.features) {
        this.stats.lastErrorCode = 'SOUNDSTAT_INVALID_RESPONSE';
        throw new Error('Invalid SoundStat response: missing features');
      }

      // ✅ CORRECTED: Validate that features has the expected audio characteristics
      const features = data.features;
      if (typeof features.energy === 'undefined' || 
          typeof features.danceability === 'undefined' || 
          typeof features.valence === 'undefined' || 
          typeof features.instrumentalness === 'undefined') {
        this.stats.lastErrorCode = 'SOUNDSTAT_INCOMPLETE_FEATURES';
        throw new Error('Invalid SoundStat response: incomplete features data');
      }

      this.stats.liveDataFetches++;
      this.stats.lastSuccessfulFetch = new Date().toISOString();
      
      // Cache the result
      this.setCache(cacheKey, data);
      
      return data;

    } catch (error) {
      this.stats.errors++;
      this.stats.lastError = error.message;
      console.error('SoundStat API error:', error);
      throw error;
    }
  }

  /**
   * Get artist analysis from SoundStat API
   */
  async getArtistAnalysis(spotifyArtistId) {
    this.stats.totalRequests++;
    
    try {
      // Check cache first
      const cacheKey = `soundstat_artist_${spotifyArtistId}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // ✅ FIXED: Now properly calls the method
      await this.rateLimitDelay();

      // Make API request
      const response = await fetch(`${this.baseUrl}/artist/${spotifyArtistId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      if (!response.ok) {
        throw new Error(`SoundStat artist API error: ${response.status}`);
      }

      const data = await response.json();
      
      this.stats.liveDataFetches++;
      this.stats.lastSuccessfulFetch = new Date().toISOString();
      
      // Cache the result
      this.setCache(cacheKey, data);
      
      return data;

    } catch (error) {
      this.stats.errors++;
      this.stats.lastError = error.message;
      console.error('SoundStat artist API error:', error);
      throw error;
    }
  }

  /**
   * Check API health
   */
  async checkStatus() {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      
      return {
        available: response.ok,
        status: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        available: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get API statistics
   */
  getStats() {
    return {
      ...this.stats,
      cacheSize: this.cache.size,
      apiEnabled: this.apiEnabled
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    this.stats.cacheSize = 0;
  }
}

export default SoundStatAPI;

