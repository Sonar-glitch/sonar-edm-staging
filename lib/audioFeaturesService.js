// Next.js Compatible Audio Features Service
// Uses dynamic imports for ESM packages like node-fetch

class AudioFeaturesService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
    this.rateLimitDelay = 200; // 200ms between requests
    this.lastRequestTime = 0;
    
    // Statistics tracking
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

    // API configuration
    this.apiKey = process.env.RECCOBEATS_API_KEY;
    this.apiEnabled = !!this.apiKey;
    this.baseUrl = 'https://api.reccobeats.com';
    
    console.log(`🎵 AudioFeaturesService: ${this.apiEnabled ? 'API key configured' : 'Using genre-based fallback (no API key configured)'}`);
  }

  /**
   * Get audio features for an event with fallback to genre-based estimation
   */
  async getEventAudioFeatures(event) {
    this.stats.totalRequests++;
    
    try {
      // Try to get from cache first
      const cacheKey = this.getCacheKey(event);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return cached;
      }

      // Try API if enabled and we have artists
      if (this.apiEnabled && event.artists && event.artists.length > 0) {
        try {
          const apiResult = await this.fetchFromAPI(event.artists[0]);
          if (apiResult) {
            this.setCache(cacheKey, apiResult);
            this.stats.liveDataFetches++;
            this.stats.lastSuccessfulFetch = new Date();
            return apiResult;
          }
        } catch (apiError) {
          console.warn(`API fetch failed for ${event.artists[0]}:`, apiError.message);
          this.stats.errors++;
          this.stats.lastError = apiError.message;
          
          if (apiError.message.includes('401') || apiError.message.includes('403')) {
            this.stats.authErrors++;
            this.stats.lastErrorCode = apiError.message.includes('401') ? 401 : 403;
          }
        }
      }

      // Fallback to genre-based estimation
      const fallbackResult = this.getGenreBasedAudioFeatures(event.primaryGenre || 'unknown');
      this.setCache(cacheKey, fallbackResult);
      this.stats.fallbackUsages++;
      return fallbackResult;

    } catch (error) {
      console.error('Audio features service error:', error);
      this.stats.errors++;
      this.stats.lastError = error.message;
      
      // Return safe fallback
      return this.getGenreBasedAudioFeatures('unknown');
    }
  }

  /**
   * Fetch audio features from ReccoBeats API using dynamic import
   */
  async fetchFromAPI(artistName) {
    // Dynamic import for node-fetch (ESM package)
    const fetch = (await import('node-fetch')).default;
    
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimitDelay) {
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    try {
      // Step 1: Search for artist
      const searchUrl = `${this.baseUrl}/search/artist?q=${encodeURIComponent(artistName)}`;
      const searchHeaders = this.getHeaders();
      
      const searchResponse = await fetch(searchUrl, { headers: searchHeaders });
      
      if (!searchResponse.ok) {
        throw new Error(`Artist search failed: ${searchResponse.status} ${searchResponse.statusText}`);
      }
      
      const searchData = await searchResponse.json();
      
      if (!searchData.artists || searchData.artists.length === 0) {
        throw new Error(`No artist found for: ${artistName}`);
      }

      const artist = searchData.artists[0];
      
      // Step 2: Get artist's tracks
      const tracksUrl = `${this.baseUrl}/artist/${artist.id}/tracks`;
      const tracksResponse = await fetch(tracksUrl, { headers: searchHeaders });
      
      if (!tracksResponse.ok) {
        throw new Error(`Tracks fetch failed: ${tracksResponse.status} ${tracksResponse.statusText}`);
      }
      
      const tracksData = await tracksResponse.json();
      
      if (!tracksData.tracks || tracksData.tracks.length === 0) {
        throw new Error(`No tracks found for artist: ${artistName}`);
      }

      const track = tracksData.tracks[0];
      
      // Step 3: Get audio features for the track
      const featuresUrl = `${this.baseUrl}/track/${track.id}/audio-features`;
      const featuresResponse = await fetch(featuresUrl, { headers: searchHeaders });
      
      if (!featuresResponse.ok) {
        throw new Error(`Audio features fetch failed: ${featuresResponse.status} ${featuresResponse.statusText}`);
      }
      
      const featuresData = await featuresResponse.json();
      
      return {
        energy: featuresData.energy || 0.5,
        danceability: featuresData.danceability || 0.5,
        valence: featuresData.valence || 0.5,
        tempo: featuresData.tempo || 120,
        acousticness: featuresData.acousticness || 0.1,
        instrumentalness: featuresData.instrumentalness || 0.5,
        speechiness: featuresData.speechiness || 0.1,
        confidence: 0.9,
        source: 'reccobeats_api',
        dataFreshness: new Date(),
        artistName: artistName,
        trackName: track.name
      };

    } catch (error) {
      throw new Error(`ReccoBeats API error: ${error.message}`);
    }
  }

  /**
   * Get headers for API requests
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'TIKO-SoundCharacteristics/1.0'
    };

    if (this.apiKey) {
      // Try multiple header formats for API key
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['X-API-Key'] = this.apiKey;
      headers['ApiKey'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Genre-based audio features estimation (fallback)
   */
  getGenreBasedAudioFeatures(genre) {
    const genreProfiles = {
      // EDM Genres
      'house': { energy: 0.8, danceability: 0.9, valence: 0.7, tempo: 125, confidence: 0.75 },
      'techno': { energy: 0.9, danceability: 0.8, valence: 0.6, tempo: 130, confidence: 0.75 },
      'trance': { energy: 0.8, danceability: 0.7, valence: 0.8, tempo: 135, confidence: 0.75 },
      'dubstep': { energy: 0.95, danceability: 0.8, valence: 0.5, tempo: 140, confidence: 0.75 },
      'progressive house': { energy: 0.75, danceability: 0.85, valence: 0.75, tempo: 125, confidence: 0.75 },
      'deep house': { energy: 0.7, danceability: 0.9, valence: 0.8, tempo: 120, confidence: 0.75 },
      'tech house': { energy: 0.85, danceability: 0.9, valence: 0.7, tempo: 125, confidence: 0.75 },
      'electro house': { energy: 0.9, danceability: 0.9, valence: 0.8, tempo: 128, confidence: 0.75 },
      'big room': { energy: 0.95, danceability: 0.85, valence: 0.8, tempo: 130, confidence: 0.75 },
      'future house': { energy: 0.8, danceability: 0.9, valence: 0.8, tempo: 125, confidence: 0.75 },
      'drum and bass': { energy: 0.9, danceability: 0.8, valence: 0.6, tempo: 175, confidence: 0.75 },
      'dnb': { energy: 0.9, danceability: 0.8, valence: 0.6, tempo: 175, confidence: 0.75 },
      'hardstyle': { energy: 0.95, danceability: 0.8, valence: 0.7, tempo: 150, confidence: 0.75 },
      'trap': { energy: 0.8, danceability: 0.85, valence: 0.6, tempo: 140, confidence: 0.75 },
      'electronic': { energy: 0.7, danceability: 0.8, valence: 0.7, tempo: 120, confidence: 0.6 },
      'dance': { energy: 0.8, danceability: 0.9, valence: 0.8, tempo: 125, confidence: 0.6 },
      'edm': { energy: 0.85, danceability: 0.85, valence: 0.75, tempo: 128, confidence: 0.6 },
      'electro': { energy: 0.8, danceability: 0.8, valence: 0.7, tempo: 125, confidence: 0.6 },
      'electronica': { energy: 0.6, danceability: 0.7, valence: 0.6, tempo: 115, confidence: 0.6 },
      'ambient': { energy: 0.3, danceability: 0.4, valence: 0.6, tempo: 90, confidence: 0.6 },

      // Non-EDM Genres
      'hip hop': { energy: 0.7, danceability: 0.8, valence: 0.6, tempo: 95, confidence: 0.6 },
      'jazz': { energy: 0.4, danceability: 0.5, valence: 0.7, tempo: 110, confidence: 0.6 },
      'rock': { energy: 0.8, danceability: 0.5, valence: 0.6, tempo: 120, confidence: 0.6 },
      'pop': { energy: 0.7, danceability: 0.7, valence: 0.8, tempo: 115, confidence: 0.6 },
      'country': { energy: 0.5, danceability: 0.6, valence: 0.7, tempo: 100, confidence: 0.6 },
      'folk': { energy: 0.4, danceability: 0.5, valence: 0.7, tempo: 95, confidence: 0.6 },
      'classical': { energy: 0.3, danceability: 0.2, valence: 0.6, tempo: 80, confidence: 0.6 }
    };

    const normalizedGenre = genre.toLowerCase().trim();
    const profile = genreProfiles[normalizedGenre] || genreProfiles['electronic']; // Default to electronic

    return {
      energy: profile.energy,
      danceability: profile.danceability,
      valence: profile.valence,
      tempo: profile.tempo,
      acousticness: 0.1,
      instrumentalness: 0.5,
      speechiness: 0.1,
      confidence: profile.confidence,
      source: 'genre_based_estimation',
      dataFreshness: new Date(),
      genre: normalizedGenre,
      errorCode: this.stats.lastErrorCode,
      errorMessage: this.stats.lastError
    };
  }

  /**
   * Cache management
   */
  getCacheKey(event) {
    const artists = event.artists ? event.artists.join(',') : '';
    const genre = event.primaryGenre || 'unknown';
    return `${artists}_${genre}`.toLowerCase();
  }

  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheExpiry) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    this.stats.cacheSize = this.cache.size;
  }

  /**
   * Get data freshness indicator for UI
   */
  getDataFreshnessIndicator(audioFeatures) {
    const source = audioFeatures.source;
    const dataFreshness = audioFeatures.dataFreshness;
    const errorCode = audioFeatures.errorCode;
    const errorMessage = audioFeatures.errorMessage;

    if (source === 'reccobeats_api') {
      const minutesAgo = Math.floor((Date.now() - new Date(dataFreshness).getTime()) / (1000 * 60));
      return {
        label: 'Live',
        tooltip: `Fetched ${minutesAgo} minutes ago from ReccoBeats API`,
        status: 'live'
      };
    } else if (source === 'genre_based_estimation') {
      let tooltip = `Genre-based estimation for ${audioFeatures.genre}`;
      if (errorCode && errorMessage) {
        tooltip += ` (API Error ${errorCode}: ${errorMessage})`;
      }
      return {
        label: 'Fallback',
        tooltip: tooltip,
        status: 'fallback'
      };
    } else {
      return {
        label: 'Unknown',
        tooltip: 'Unknown data source',
        status: 'unknown'
      };
    }
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 ? 
        Math.round((this.stats.liveDataFetches / this.stats.totalRequests) * 100) : 0,
      authErrorRate: this.stats.totalRequests > 0 ? 
        Math.round((this.stats.authErrors / this.stats.totalRequests) * 100) : 0,
      cacheSize: this.cache.size,
      apiKeyConfigured: !!this.apiKey,
      apiEnabled: this.apiEnabled
    };
  }
}

module.exports = { AudioFeaturesService };

