// Integration with existing deployed Essentia worker service
// Connects to the separate Essentia app for audio analysis

class EssentiaIntegration {
  constructor() {
    // Connect to deployed Essentia audio service
    this.essentiaBaseUrl = process.env.ESSENTIA_SERVICE_URL || 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
    this.apiKey = process.env.ESSENTIA_API_KEY;
    this.requestTimeout = 30000; // 30 seconds for audio processing
  }

  /**
   * Get user's audio taste profile from Essentia worker
   * @param {string} userId - User identifier
   * @param {Array} recentTracks - User's recent listening history
   * @returns {Object} Detailed audio taste profile
   */
  async getUserAudioProfile(userId, recentTracks = []) {
    try {
      const response = await fetch(`${this.essentiaBaseUrl}/api/analyze/user-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          userId,
          tracks: recentTracks,
          analysisDepth: 'comprehensive' // deep audio feature extraction
        }),
        signal: AbortSignal.timeout(this.requestTimeout)
      });

      if (!response.ok) {
        throw new Error(`Essentia worker responded with ${response.status}`);
      }

      const profile = await response.json();
      
      return {
        audioFeatures: {
          energy: profile.energy || 0.7,
          danceability: profile.danceability || 0.8,
          valence: profile.valence || 0.6,
          acousticness: profile.acousticness || 0.1,
          instrumentalness: profile.instrumentalness || 0.6,
          speechiness: profile.speechiness || 0.05,
          liveness: profile.liveness || 0.15,
          tempo: profile.preferredTempo || 125
        },
        genrePreferences: profile.genres || {
          'house': 0.85,
          'techno': 0.80,
          'melodic house': 0.75,
          'progressive house': 0.70,
          'deep house': 0.65
        },
        timeOfDayPreferences: profile.timePreferences || {
          morning: 0.3,
          afternoon: 0.5,
          evening: 0.8,
          night: 0.9
        },
        confidenceScore: profile.confidence || 0.75,
        analysisDate: new Date().toISOString(),
        source: 'essentia_worker'
      };

    } catch (error) {
      console.error('Essentia integration error:', error);
      
      // Fallback profile when Essentia worker is unavailable
      return this.getFallbackProfile(userId);
    }
  }

  /**
   * Analyze event compatibility with user's Essentia profile
   * @param {Object} event - Event to analyze
   * @param {Object} userProfile - User's Essentia audio profile
   * @returns {Object} Compatibility analysis
   */
  async analyzeEventCompatibility(event, userProfile) {
    try {
      const response = await fetch(`${this.essentiaBaseUrl}/api/analyze/event-match`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          event: {
            name: event.name,
            artists: event.artists,
            genres: event.genres,
            venue: event.venue,
            description: event.description
          },
          userProfile: userProfile.audioFeatures,
          analysisType: 'deep_compatibility'
        }),
        signal: AbortSignal.timeout(this.requestTimeout)
      });

      if (!response.ok) {
        throw new Error(`Essentia compatibility analysis failed: ${response.status}`);
      }

      const analysis = await response.json();
      
      return {
        compatibilityScore: analysis.score || 0,
        featureMatches: {
          energy: analysis.energyMatch || 0,
          danceability: analysis.danceabilityMatch || 0,
          valence: analysis.valenceMatch || 0,
          tempo: analysis.tempoMatch || 0
        },
        genreAlignment: analysis.genreCompatibility || 0,
        confidence: analysis.confidence || 0.5,
        reasoning: analysis.explanation || 'Basic compatibility analysis',
        essentiaEnhancement: analysis.enhancementScore || 0, // Additional points from Essentia
        source: 'essentia_worker'
      };

    } catch (error) {
      console.error('Essentia compatibility analysis error:', error);
      
      // Fallback compatibility analysis
      return this.getFallbackCompatibility(event, userProfile);
    }
  }

  /**
   * Get real-time audio analysis for tracks mentioned in events
   * @param {Array} trackUrls - Spotify/Apple Music track URLs
   * @returns {Object} Real-time audio analysis
   */
  async getRealtimeAudioAnalysis(trackUrls = []) {
    try {
      const response = await fetch(`${this.essentiaBaseUrl}/api/analyze/realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          tracks: trackUrls,
          analysisFeatures: ['energy', 'danceability', 'valence', 'tempo', 'key', 'mode']
        }),
        signal: AbortSignal.timeout(15000) // Longer timeout for real-time analysis
      });

      if (!response.ok) {
        throw new Error(`Realtime analysis failed: ${response.status}`);
      }

      return await response.json();

    } catch (error) {
      console.error('Realtime audio analysis error:', error);
      return { tracks: [], error: error.message };
    }
  }

  /**
   * Fallback profile when Essentia worker is unavailable
   */
  getFallbackProfile(userId) {
    return {
      audioFeatures: {
        energy: 0.75,
        danceability: 0.85,
        valence: 0.65,
        acousticness: 0.08,
        instrumentalness: 0.65,
        speechiness: 0.04,
        liveness: 0.12,
        tempo: 125
      },
      genrePreferences: {
        'house': 0.8,
        'techno': 0.75,
        'melodic house': 0.7,
        'electronic': 0.65
      },
      timeOfDayPreferences: {
        evening: 0.8,
        night: 0.9
      },
      confidenceScore: 0.6,
      analysisDate: new Date().toISOString(),
      source: 'fallback_profile'
    };
  }

  /**
   * Fallback compatibility when Essentia worker is unavailable
   */
  getFallbackCompatibility(event, userProfile) {
    // Basic compatibility based on genre matching
    const eventGenres = event.genres || [];
    const userGenres = Object.keys(userProfile.genrePreferences || {});
    
    const genreMatches = eventGenres.filter(genre => 
      userGenres.some(userGenre => 
        genre.toLowerCase().includes(userGenre.toLowerCase()) ||
        userGenre.toLowerCase().includes(genre.toLowerCase())
      )
    );

    const baseScore = genreMatches.length > 0 ? 0.6 + (genreMatches.length * 0.1) : 0.3;

    return {
      compatibilityScore: Math.min(baseScore, 1.0),
      featureMatches: {
        energy: 0.6,
        danceability: 0.7,
        valence: 0.5,
        tempo: 0.6
      },
      genreAlignment: genreMatches.length > 0 ? 0.8 : 0.3,
      confidence: 0.5,
      reasoning: 'Fallback analysis - Essentia worker unavailable',
      essentiaEnhancement: Math.round(baseScore * 10), // 0-10 additional points
      source: 'fallback_analysis'
    };
  }

  /**
   * Health check for Essentia worker
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.essentiaBaseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      
      return {
        status: response.ok ? 'healthy' : 'degraded',
        responseTime: response.headers.get('x-response-time'),
        version: response.headers.get('x-service-version')
      };
    } catch (error) {
      return {
        status: 'unavailable',
        error: error.message
      };
    }
  }
}

module.exports = new EssentiaIntegration();
