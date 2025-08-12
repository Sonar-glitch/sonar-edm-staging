// Essentia Audio Analysis Service for Personalized User Taste Profiling
// Integrates with the existing Essentia service for advanced audio analysis

const fs = require('fs');
const path = require('path');

class EssentiaUserProfilingService {
  constructor() {
    this.essentiaServiceUrl = process.env.ESSENTIA_SERVICE_URL || 'http://localhost:8000';
    this.audioAnalysisCache = new Map();
    this.userProfiles = new Map();
    this.cacheExpiry = 1000 * 60 * 60 * 24; // 24 hour cache
  }

  // Analyze a user's music taste based on their listening history
  async analyzeUserTasteProfile(userId, musicSamples = []) {
    console.log(`🎵 Analyzing taste profile for user ${userId} with ${musicSamples.length} samples...`);
    
    try {
      const profile = {
        userId,
        audioCharacteristics: {
          energy: { average: 0, variance: 0, preference: 'unknown' },
          danceability: { average: 0, variance: 0, preference: 'unknown' },
          valence: { average: 0, variance: 0, preference: 'unknown' },
          tempo: { average: 0, variance: 0, preference: 'unknown' },
          acousticness: { average: 0, variance: 0, preference: 'unknown' },
          instrumentalness: { average: 0, variance: 0, preference: 'unknown' }
        },
        genrePreferences: {},
        listeningPatterns: {
          preferredTimeOfDay: [],
          sessionLength: 'medium',
          skipRate: 0,
          repeatListening: false
        },
        personalityInsights: {
          openness: 0.5,
          conscientiousness: 0.5,
          extraversion: 0.5,
          agreeableness: 0.5,
          neuroticism: 0.5
        },
        recommendations: {
          suggestedGenres: [],
          avoidGenres: [],
          idealEventCharacteristics: {}
        },
        confidence: 'low',
        lastUpdated: new Date().toISOString()
      };

      // If no music samples provided, use default EDM profile
      if (musicSamples.length === 0) {
        console.log('📊 No music samples provided, using default EDM taste profile');
        return this.getDefaultEDMProfile(userId);
      }

      // Analyze each music sample with Essentia
      const audioAnalyses = [];
      for (const sample of musicSamples.slice(0, 20)) { // Limit for performance
        const analysis = await this.analyzeAudioSample(sample);
        if (analysis) {
          audioAnalyses.push(analysis);
        }
      }

      if (audioAnalyses.length === 0) {
        console.log('⚠️ No successful audio analyses, falling back to default profile');
        return this.getDefaultEDMProfile(userId);
      }

      // Calculate statistical measures for each audio feature
      const features = ['energy', 'danceability', 'valence', 'tempo', 'acousticness', 'instrumentalness'];
      
      features.forEach(feature => {
        const values = audioAnalyses.map(a => a[feature]).filter(v => v !== undefined);
        
        if (values.length > 0) {
          const average = values.reduce((sum, val) => sum + val, 0) / values.length;
          const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
          
          profile.audioCharacteristics[feature] = {
            average: Number(average.toFixed(3)),
            variance: Number(variance.toFixed(3)),
            preference: this.interpretFeaturePreference(feature, average, variance)
          };
        }
      });

      // Analyze genre preferences from samples
      profile.genrePreferences = this.extractGenrePreferences(audioAnalyses);

      // Determine listening patterns
      profile.listeningPatterns = this.analyzeListeningPatterns(musicSamples, audioAnalyses);

      // Generate personality insights based on music preferences
      profile.personalityInsights = this.generatePersonalityInsights(profile.audioCharacteristics);

      // Generate personalized recommendations
      profile.recommendations = this.generatePersonalizedRecommendations(profile);

      // Set confidence based on sample size and analysis quality
      profile.confidence = this.calculateProfileConfidence(audioAnalyses.length, musicSamples.length);

      // Cache the profile
      this.userProfiles.set(userId, {
        profile,
        timestamp: Date.now()
      });

      console.log(`✅ User taste profile analysis complete for ${userId}`);
      console.log(`   Confidence: ${profile.confidence}`);
      console.log(`   Audio samples analyzed: ${audioAnalyses.length}/${musicSamples.length}`);
      console.log(`   Dominant characteristics: Energy=${profile.audioCharacteristics.energy.average.toFixed(2)}, Danceability=${profile.audioCharacteristics.danceability.average.toFixed(2)}`);

      return profile;

    } catch (error) {
      console.error(`❌ User taste profile analysis failed for ${userId}:`, error.message);
      return this.getDefaultEDMProfile(userId);
    }
  }

  // Analyze individual audio sample using Essentia service
  async analyzeAudioSample(sample) {
    try {
      // Check cache first
      const cacheKey = this.generateSampleCacheKey(sample);
      if (this.audioAnalysisCache.has(cacheKey)) {
        const cached = this.audioAnalysisCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.analysis;
        }
      }

      let analysis = null;

      // Try to analyze with Essentia service if available
      if (sample.audioUrl || sample.filePath) {
        analysis = await this.callEssentiaService(sample);
      }

      // Fallback to metadata-based analysis
      if (!analysis && sample.metadata) {
        analysis = this.analyzeFromMetadata(sample.metadata);
      }

      // Fallback to genre-based estimation
      if (!analysis && sample.genre) {
        analysis = this.estimateFromGenre(sample.genre);
      }

      if (analysis) {
        // Cache the analysis
        this.audioAnalysisCache.set(cacheKey, {
          analysis,
          timestamp: Date.now()
        });
      }

      return analysis;

    } catch (error) {
      console.error('❌ Audio sample analysis failed:', error.message);
      return null;
    }
  }

  // Call Essentia service for advanced audio analysis
  async callEssentiaService(sample) {
    try {
      const payload = {
        audio_url: sample.audioUrl,
        analysis_type: 'comprehensive',
        features: ['energy', 'danceability', 'valence', 'tempo', 'key', 'mode', 'acousticness', 'instrumentalness']
      };

      const response = await fetch(`${this.essentiaServiceUrl}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        timeout: 30000 // 30 second timeout
      });

      if (!response.ok) {
        throw new Error(`Essentia service error: ${response.status}`);
      }

      const result = await response.json();
      
      return {
        energy: result.energy || 0.5,
        danceability: result.danceability || 0.5,
        valence: result.valence || 0.5,
        tempo: result.tempo || 120,
        acousticness: result.acousticness || 0.5,
        instrumentalness: result.instrumentalness || 0.5,
        key: result.key || 0,
        mode: result.mode || 1,
        source: 'essentia',
        confidence: result.confidence || 0.8
      };

    } catch (error) {
      console.error('❌ Essentia service call failed:', error.message);
      return null;
    }
  }

  // Analyze audio characteristics from track metadata
  analyzeFromMetadata(metadata) {
    return {
      energy: this.estimateEnergyFromMetadata(metadata),
      danceability: this.estimateDanceabilityFromMetadata(metadata),
      valence: this.estimateValenceFromMetadata(metadata),
      tempo: metadata.bpm || this.estimateTempoFromGenre(metadata.genre),
      acousticness: this.estimateAcousticnessFromMetadata(metadata),
      instrumentalness: this.estimateInstrumentalnessFromMetadata(metadata),
      source: 'metadata',
      confidence: 0.6
    };
  }

  // Estimate audio features from genre
  estimateFromGenre(genre) {
    const genreProfiles = {
      'house': { energy: 0.75, danceability: 0.85, valence: 0.65, tempo: 125, acousticness: 0.05, instrumentalness: 0.70 },
      'techno': { energy: 0.85, danceability: 0.80, valence: 0.45, tempo: 130, acousticness: 0.03, instrumentalness: 0.80 },
      'trance': { energy: 0.80, danceability: 0.75, valence: 0.70, tempo: 138, acousticness: 0.03, instrumentalness: 0.60 },
      'drum and bass': { energy: 0.95, danceability: 0.90, valence: 0.45, tempo: 175, acousticness: 0.01, instrumentalness: 0.80 },
      'ambient': { energy: 0.20, danceability: 0.30, valence: 0.50, tempo: 90, acousticness: 0.80, instrumentalness: 0.90 },
      'pop': { energy: 0.70, danceability: 0.75, valence: 0.75, tempo: 120, acousticness: 0.15, instrumentalness: 0.20 }
    };

    const normalizedGenre = genre.toLowerCase();
    for (const [genreKey, profile] of Object.entries(genreProfiles)) {
      if (normalizedGenre.includes(genreKey)) {
        return {
          ...profile,
          source: 'genre_estimation',
          confidence: 0.4
        };
      }
    }

    // Default electronic music profile
    return {
      energy: 0.70,
      danceability: 0.75,
      valence: 0.60,
      tempo: 125,
      acousticness: 0.10,
      instrumentalness: 0.60,
      source: 'default',
      confidence: 0.3
    };
  }

  // Helper methods for metadata-based estimation
  estimateEnergyFromMetadata(metadata) {
    if (metadata.genre) {
      const highEnergyGenres = ['techno', 'hardcore', 'drum and bass', 'dubstep'];
      if (highEnergyGenres.some(genre => metadata.genre.toLowerCase().includes(genre))) {
        return 0.85 + Math.random() * 0.15;
      }
    }
    return 0.5 + Math.random() * 0.3;
  }

  estimateDanceabilityFromMetadata(metadata) {
    if (metadata.genre) {
      const danceableGenres = ['house', 'disco', 'funk', 'dance'];
      if (danceableGenres.some(genre => metadata.genre.toLowerCase().includes(genre))) {
        return 0.80 + Math.random() * 0.20;
      }
    }
    return 0.4 + Math.random() * 0.4;
  }

  estimateValenceFromMetadata(metadata) {
    if (metadata.title) {
      const positiveWords = ['happy', 'joy', 'love', 'party', 'celebration'];
      const negativeWords = ['sad', 'dark', 'lonely', 'pain', 'melancholy'];
      
      const title = metadata.title.toLowerCase();
      const positiveCount = positiveWords.filter(word => title.includes(word)).length;
      const negativeCount = negativeWords.filter(word => title.includes(word)).length;
      
      if (positiveCount > negativeCount) return 0.7 + Math.random() * 0.3;
      if (negativeCount > positiveCount) return 0.1 + Math.random() * 0.3;
    }
    return 0.4 + Math.random() * 0.4;
  }

  estimateTempoFromGenre(genre) {
    const tempoRanges = {
      'ambient': [60, 90],
      'downtempo': [80, 110],
      'house': [120, 130],
      'techno': [125, 135],
      'trance': [130, 140],
      'drum and bass': [160, 180]
    };

    if (genre) {
      const normalizedGenre = genre.toLowerCase();
      for (const [genreKey, [min, max]] of Object.entries(tempoRanges)) {
        if (normalizedGenre.includes(genreKey)) {
          return min + Math.random() * (max - min);
        }
      }
    }

    return 120 + Math.random() * 20; // Default electronic range
  }

  estimateAcousticnessFromMetadata(metadata) {
    if (metadata.genre) {
      const acousticGenres = ['folk', 'acoustic', 'country', 'classical'];
      if (acousticGenres.some(genre => metadata.genre.toLowerCase().includes(genre))) {
        return 0.7 + Math.random() * 0.3;
      }
    }
    return Math.random() * 0.3; // Most electronic music has low acousticness
  }

  estimateInstrumentalnessFromMetadata(metadata) {
    if (metadata.genre) {
      const instrumentalGenres = ['ambient', 'classical', 'electronic', 'instrumental'];
      if (instrumentalGenres.some(genre => metadata.genre.toLowerCase().includes(genre))) {
        return 0.6 + Math.random() * 0.4;
      }
    }
    return 0.2 + Math.random() * 0.4;
  }

  // Interpret feature preferences
  interpretFeaturePreference(feature, average, variance) {
    const interpretations = {
      energy: {
        high: (avg) => avg > 0.7 ? 'high-energy' : avg > 0.5 ? 'moderate-energy' : 'low-energy',
        variance: (var_) => var_ > 0.1 ? 'varied' : 'consistent'
      },
      danceability: {
        high: (avg) => avg > 0.7 ? 'highly-danceable' : avg > 0.5 ? 'moderately-danceable' : 'non-danceable',
        variance: (var_) => var_ > 0.1 ? 'varied' : 'consistent'
      },
      valence: {
        high: (avg) => avg > 0.6 ? 'positive' : avg > 0.4 ? 'neutral' : 'melancholic',
        variance: (var_) => var_ > 0.15 ? 'mood-varied' : 'mood-consistent'
      }
    };

    const interp = interpretations[feature];
    if (interp) {
      const level = interp.high(average);
      const consistency = interp.variance(variance);
      return `${level}-${consistency}`;
    }

    return 'unknown';
  }

  // Extract genre preferences from audio analyses
  extractGenrePreferences(audioAnalyses) {
    const genreScores = {};
    
    audioAnalyses.forEach(analysis => {
      if (analysis.source === 'genre_estimation' && analysis.genre) {
        genreScores[analysis.genre] = (genreScores[analysis.genre] || 0) + 1;
      }
    });

    return genreScores;
  }

  // Analyze listening patterns
  analyzeListeningPatterns(musicSamples, audioAnalyses) {
    return {
      preferredTimeOfDay: ['evening', 'night'], // Would be extracted from listening history
      sessionLength: musicSamples.length > 10 ? 'long' : musicSamples.length > 5 ? 'medium' : 'short',
      skipRate: 0.1, // Would be calculated from actual listening data
      repeatListening: false // Would be detected from listening history
    };
  }

  // Generate personality insights from music preferences
  generatePersonalityInsights(audioCharacteristics) {
    const insights = {
      openness: 0.5,
      conscientiousness: 0.5,
      extraversion: 0.5,
      agreeableness: 0.5,
      neuroticism: 0.5
    };

    // Higher openness correlates with diverse music and experimental sounds
    if (audioCharacteristics.instrumentalness.variance > 0.2) {
      insights.openness += 0.2;
    }

    // Higher extraversion correlates with danceable, energetic music
    if (audioCharacteristics.danceability.average > 0.7 && audioCharacteristics.energy.average > 0.7) {
      insights.extraversion += 0.3;
    }

    // Higher agreeableness correlates with positive valence music
    if (audioCharacteristics.valence.average > 0.6) {
      insights.agreeableness += 0.2;
    }

    // Higher neuroticism correlates with emotional variability in music
    if (audioCharacteristics.valence.variance > 0.2) {
      insights.neuroticism += 0.1;
    }

    // Normalize scores between 0 and 1
    Object.keys(insights).forEach(trait => {
      insights[trait] = Math.max(0, Math.min(1, insights[trait]));
    });

    return insights;
  }

  // Generate personalized recommendations
  generatePersonalizedRecommendations(profile) {
    const recommendations = {
      suggestedGenres: [],
      avoidGenres: [],
      idealEventCharacteristics: {}
    };

    const { audioCharacteristics } = profile;

    // Suggest genres based on audio preferences
    if (audioCharacteristics.energy.average > 0.7 && audioCharacteristics.danceability.average > 0.7) {
      recommendations.suggestedGenres.push('techno', 'house', 'electronic dance');
    }

    if (audioCharacteristics.valence.average > 0.7) {
      recommendations.suggestedGenres.push('uplifting trance', 'progressive house');
    }

    if (audioCharacteristics.acousticness.average < 0.3 && audioCharacteristics.instrumentalness.average > 0.6) {
      recommendations.suggestedGenres.push('ambient', 'downtempo', 'chillout');
    }

    // Genres to avoid
    if (audioCharacteristics.energy.average < 0.3) {
      recommendations.avoidGenres.push('hardcore', 'gabber', 'speedcore');
    }

    // Ideal event characteristics
    recommendations.idealEventCharacteristics = {
      venueSize: audioCharacteristics.energy.average > 0.8 ? 'large' : 'intimate',
      timeOfDay: audioCharacteristics.valence.average > 0.6 ? 'day' : 'night',
      duration: profile.listeningPatterns.sessionLength === 'long' ? 'extended' : 'standard',
      crowdEnergy: audioCharacteristics.danceability.average > 0.7 ? 'high' : 'moderate'
    };

    return recommendations;
  }

  // Calculate profile confidence based on data quality
  calculateProfileConfidence(analyzedSamples, totalSamples) {
    if (analyzedSamples === 0) return 'very-low';
    
    const analysisRatio = analyzedSamples / Math.max(totalSamples, 1);
    
    if (analyzedSamples >= 15 && analysisRatio > 0.8) return 'high';
    if (analyzedSamples >= 8 && analysisRatio > 0.6) return 'medium';
    if (analyzedSamples >= 3 && analysisRatio > 0.4) return 'low';
    
    return 'very-low';
  }

  // Get default EDM-focused profile for users without samples
  getDefaultEDMProfile(userId) {
    return {
      userId,
      audioCharacteristics: {
        energy: { average: 0.75, variance: 0.15, preference: 'high-energy-varied' },
        danceability: { average: 0.80, variance: 0.10, preference: 'highly-danceable-consistent' },
        valence: { average: 0.60, variance: 0.20, preference: 'positive-mood-varied' },
        tempo: { average: 128, variance: 25, preference: 'moderate-tempo-varied' },
        acousticness: { average: 0.08, variance: 0.05, preference: 'electronic-consistent' },
        instrumentalness: { average: 0.65, variance: 0.25, preference: 'instrumental-varied' }
      },
      genrePreferences: {
        'house': 3,
        'techno': 2,
        'electronic': 4,
        'dance': 3
      },
      listeningPatterns: {
        preferredTimeOfDay: ['evening', 'night'],
        sessionLength: 'medium',
        skipRate: 0.15,
        repeatListening: true
      },
      personalityInsights: {
        openness: 0.7,
        conscientiousness: 0.5,
        extraversion: 0.7,
        agreeableness: 0.6,
        neuroticism: 0.4
      },
      recommendations: {
        suggestedGenres: ['house', 'techno', 'electronic dance', 'progressive house'],
        avoidGenres: ['country', 'folk', 'classical'],
        idealEventCharacteristics: {
          venueSize: 'large',
          timeOfDay: 'night',
          duration: 'extended',
          crowdEnergy: 'high'
        }
      },
      confidence: 'medium',
      lastUpdated: new Date().toISOString(),
      source: 'default_edm_profile'
    };
  }

  // Generate cache key for audio samples
  generateSampleCacheKey(sample) {
    return `audio_${sample.audioUrl || sample.filePath || sample.id || 'unknown'}`.replace(/[^a-zA-Z0-9_]/g, '');
  }

  // Get cached user profile
  getUserProfile(userId) {
    if (this.userProfiles.has(userId)) {
      const cached = this.userProfiles.get(userId);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.profile;
      }
    }
    return null;
  }

  // Clear cache
  clearCache() {
    this.audioAnalysisCache.clear();
    this.userProfiles.clear();
    console.log('🧹 Essentia user profiling cache cleared');
  }
}

module.exports = EssentiaUserProfilingService;
