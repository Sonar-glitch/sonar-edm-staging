// Enhanced Music API Service - Combines Spotify and Apple Music
// Provides comprehensive artist analysis and user preference matching

const SpotifyApiService = require('./spotifyApiService');
const AppleMusicApiService = require('./appleMusicApiService');

class EnhancedMusicApiService {
  constructor() {
    this.spotify = new SpotifyApiService();
    this.appleMusic = new AppleMusicApiService();
    this.cache = new Map();
    this.cacheExpiry = 1000 * 60 * 60; // 1 hour cache
  }

  // Main function to analyze event artists with both APIs
  async analyzeEventWithMusicApis(event, userPreferences = {}) {
    console.log(`🎵 Starting enhanced music analysis for event: "${event.name}"`);
    
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(event);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        console.log(`⚡ Using cached analysis for "${event.name}"`);
        return cached.data;
      }
    }

    const analysis = {
      eventName: event.name,
      originalScore: event.personalizedScore || 0,
      enhancedScore: 0,
      confidence: 'low',
      artistsAnalyzed: 0,
      spotifyData: null,
      appleMusicData: null,
      combinedInsights: {
        dominantGenres: {},
        audioProfile: null,
        popularityTier: 'unknown',
        matchFactors: []
      },
      recommendations: [],
      processingTime: 0
    };

    try {
      // Extract artists from event
      const eventArtists = this.extractEventArtists(event);
      
      if (eventArtists.length === 0) {
        console.log(`⚠️ No artists found for event "${event.name}"`);
        analysis.confidence = 'very-low';
        return analysis;
      }

      console.log(`🎤 Found ${eventArtists.length} artists to analyze:`, eventArtists);

      // Analyze with Spotify (primary source)
      try {
        analysis.spotifyData = await this.spotify.analyzeEventArtists(eventArtists);
        analysis.artistsAnalyzed = analysis.spotifyData.artists.length;
        
        if (analysis.artistsAnalyzed > 0) {
          analysis.confidence = analysis.artistsAnalyzed === eventArtists.length ? 'high' : 'medium';
        }
      } catch (error) {
        console.error('❌ Spotify analysis failed:', error.message);
      }

      // Enhance with Apple Music (supplementary)
      try {
        const appleMusicEnhancements = [];
        for (const artistName of eventArtists.slice(0, 3)) { // Limit for rate limiting
          const spotifyArtist = analysis.spotifyData?.artists.find(a => 
            a.name.toLowerCase() === artistName.toLowerCase()
          );
          
          const enhanced = await this.appleMusic.enhanceArtistData(artistName, spotifyArtist);
          if (enhanced) {
            appleMusicEnhancements.push(enhanced);
          }
        }
        
        analysis.appleMusicData = appleMusicEnhancements;
      } catch (error) {
        console.error('❌ Apple Music enhancement failed:', error.message);
      }

      // Generate combined insights
      analysis.combinedInsights = this.generateCombinedInsights(analysis);

      // Calculate enhanced score
      analysis.enhancedScore = this.calculateEnhancedScore(event, analysis, userPreferences);

      // Generate recommendations
      analysis.recommendations = this.generateRecommendations(analysis, userPreferences);

      analysis.processingTime = Date.now() - startTime;
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: analysis,
        timestamp: Date.now()
      });

      console.log(`🎵 Enhanced analysis complete for "${event.name}" in ${analysis.processingTime}ms`);
      console.log(`   Original score: ${analysis.originalScore}% → Enhanced score: ${analysis.enhancedScore}%`);
      
      return analysis;

    } catch (error) {
      console.error(`❌ Enhanced music analysis failed for "${event.name}":`, error.message);
      analysis.processingTime = Date.now() - startTime;
      return analysis;
    }
  }

  extractEventArtists(event) {
    const artists = [];
    
    // From event.artists array
    if (event.artists && Array.isArray(event.artists)) {
      event.artists.forEach(artist => {
        if (typeof artist === 'string' && artist.trim()) {
          artists.push(artist.trim());
        } else if (typeof artist === 'object' && artist.name) {
          artists.push(artist.name.trim());
        }
      });
    }

    // From event name (extract artist names)
    if (event.name) {
      const namePatterns = [
        /w\/\s+([^,\n]+)/i, // "Event w/ Artist Name"
        /featuring\s+([^,\n]+)/i, // "Event featuring Artist"
        /ft\.?\s+([^,\n]+)/i, // "Event ft. Artist"
        /presents\s+([^,\n]+)/i, // "Venue presents Artist"
      ];

      namePatterns.forEach(pattern => {
        const match = event.name.match(pattern);
        if (match && match[1]) {
          const extractedArtist = match[1].trim().replace(/[^\w\s&-]/g, '');
          if (extractedArtist && !artists.includes(extractedArtist)) {
            artists.push(extractedArtist);
          }
        }
      });
    }

    return [...new Set(artists)]; // Remove duplicates
  }

  generateCombinedInsights(analysis) {
    const insights = {
      dominantGenres: {},
      audioProfile: null,
      popularityTier: 'unknown',
      matchFactors: [],
      crossPlatformConsistency: 0
    };

    // Combine genres from both platforms
    if (analysis.spotifyData && analysis.spotifyData.dominantGenres) {
      Object.entries(analysis.spotifyData.dominantGenres).forEach(([genre, count]) => {
        insights.dominantGenres[genre] = (insights.dominantGenres[genre] || 0) + count;
      });
    }

    if (analysis.appleMusicData) {
      analysis.appleMusicData.forEach(artistData => {
        if (artistData.combinedGenres) {
          artistData.combinedGenres.forEach(genre => {
            insights.dominantGenres[genre] = (insights.dominantGenres[genre] || 0) + 1;
          });
        }
      });
    }

    // Use Spotify audio profile as primary
    if (analysis.spotifyData && analysis.spotifyData.audioProfile) {
      insights.audioProfile = analysis.spotifyData.audioProfile;
    }

    // Determine popularity tier
    if (analysis.spotifyData && analysis.spotifyData.averagePopularity) {
      const pop = analysis.spotifyData.averagePopularity;
      if (pop >= 70) insights.popularityTier = 'mainstream';
      else if (pop >= 40) insights.popularityTier = 'emerging';
      else insights.popularityTier = 'underground';
    }

    // Calculate cross-platform consistency
    if (analysis.spotifyData && analysis.appleMusicData && analysis.appleMusicData.length > 0) {
      const spotifyGenres = new Set(Object.keys(analysis.spotifyData.dominantGenres || {}));
      const appleMusicGenres = new Set();
      
      analysis.appleMusicData.forEach(artistData => {
        if (artistData.combinedGenres) {
          artistData.combinedGenres.forEach(genre => appleMusicGenres.add(genre));
        }
      });

      const intersection = new Set([...spotifyGenres].filter(x => appleMusicGenres.has(x)));
      const union = new Set([...spotifyGenres, ...appleMusicGenres]);
      
      insights.crossPlatformConsistency = union.size > 0 ? intersection.size / union.size : 0;
    }

    return insights;
  }

  calculateEnhancedScore(event, analysis, userPreferences) {
    let enhancedScore = event.personalizedScore || 0;
    const boosts = [];

    // Artist data quality boost (0-15 points)
    if (analysis.artistsAnalyzed > 0) {
      const qualityBoost = Math.min(15, analysis.artistsAnalyzed * 5);
      enhancedScore += qualityBoost;
      boosts.push({ factor: 'Artist Data Quality', boost: qualityBoost });
    }

    // Genre matching boost (0-20 points)
    if (userPreferences.favoriteGenres && analysis.combinedInsights.dominantGenres) {
      const userGenres = userPreferences.favoriteGenres.map(g => g.toLowerCase());
      const eventGenres = Object.keys(analysis.combinedInsights.dominantGenres);
      
      const matches = eventGenres.filter(genre => 
        userGenres.some(userGenre => 
          genre.includes(userGenre) || userGenre.includes(genre)
        )
      );

      if (matches.length > 0) {
        const genreBoost = Math.min(20, matches.length * 8);
        enhancedScore += genreBoost;
        boosts.push({ factor: 'Genre Matching', boost: genreBoost, matches });
      }
    }

    // Audio profile compatibility boost (0-15 points)
    if (userPreferences.audioProfile && analysis.combinedInsights.audioProfile) {
      const similarity = this.spotify.calculateAudioSimilarity(
        analysis.combinedInsights.audioProfile,
        userPreferences.audioProfile
      );
      
      const audioBoost = Math.round(similarity * 15);
      enhancedScore += audioBoost;
      boosts.push({ factor: 'Audio Compatibility', boost: audioBoost, similarity });
    }

    // Cross-platform consistency boost (0-10 points)
    if (analysis.combinedInsights.crossPlatformConsistency > 0.5) {
      const consistencyBoost = Math.round(analysis.combinedInsights.crossPlatformConsistency * 10);
      enhancedScore += consistencyBoost;
      boosts.push({ factor: 'Cross-Platform Consistency', boost: consistencyBoost });
    }

    // Popularity preference alignment (0-10 points)
    if (userPreferences.popularityPreference && analysis.spotifyData) {
      const alignment = this.spotify.calculatePopularityAlignment(
        analysis.spotifyData.averagePopularity,
        userPreferences.popularityPreference
      );
      
      const popularityBoost = Math.round(alignment * 10);
      enhancedScore += popularityBoost;
      boosts.push({ factor: 'Popularity Alignment', boost: popularityBoost });
    }

    // Cap the score at 100
    enhancedScore = Math.min(100, enhancedScore);

    // Store boost details for transparency
    analysis.scoreBoosts = boosts;
    analysis.totalBoost = boosts.reduce((sum, boost) => sum + boost.boost, 0);

    return Math.round(enhancedScore);
  }

  generateRecommendations(analysis, userPreferences) {
    const recommendations = [];

    // Artist discovery recommendations
    if (analysis.spotifyData && analysis.spotifyData.relatedArtists.length > 0) {
      const topRelated = analysis.spotifyData.relatedArtists
        .sort((a, b) => b.popularity - a.popularity)
        .slice(0, 3);

      recommendations.push({
        type: 'artist_discovery',
        title: 'You might also like',
        items: topRelated.map(artist => ({
          name: artist.name,
          reason: `Similar to artists in this event`,
          popularity: artist.popularity
        }))
      });
    }

    // Genre exploration recommendations
    if (analysis.combinedInsights.dominantGenres) {
      const topGenres = Object.entries(analysis.combinedInsights.dominantGenres)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([genre]) => genre);

      if (topGenres.length > 0) {
        recommendations.push({
          type: 'genre_exploration',
          title: 'Explore these genres',
          items: topGenres.map(genre => ({
            name: genre,
            reason: 'Featured in this event',
            searchTerm: genre
          }))
        });
      }
    }

    // Audio profile recommendations
    if (analysis.combinedInsights.audioProfile) {
      const profile = analysis.combinedInsights.audioProfile;
      const characteristics = [];

      if (profile.energy > 0.7) characteristics.push('high-energy');
      if (profile.danceability > 0.7) characteristics.push('danceable');
      if (profile.valence > 0.6) characteristics.push('uplifting');

      if (characteristics.length > 0) {
        recommendations.push({
          type: 'audio_characteristics',
          title: 'Events with similar vibes',
          items: characteristics.map(char => ({
            characteristic: char,
            reason: 'Matches this event\'s energy',
            searchFilter: char
          }))
        });
      }
    }

    return recommendations;
  }

  generateCacheKey(event) {
    const artistsStr = this.extractEventArtists(event).join('|');
    return `event_${event.id || event.name}_${artistsStr}`.replace(/[^a-zA-Z0-9_|]/g, '');
  }

  // Utility method to get user preferences from database or defaults
  async getUserMusicPreferences(userId) {
    // This would typically fetch from a user preferences database
    // For now, return reasonable EDM-focused defaults
    return {
      favoriteGenres: ['electronic', 'house', 'techno', 'edm', 'dance'],
      audioProfile: {
        danceability: 0.8,
        energy: 0.75,
        valence: 0.6
      },
      popularityPreference: 'balanced',
      discoveryOpenness: 0.7
    };
  }

  // Clear cache (useful for development)
  clearCache() {
    this.cache.clear();
    console.log('🧹 Music API cache cleared');
  }
}

module.exports = EnhancedMusicApiService;
