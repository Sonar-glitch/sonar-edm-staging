// lib/alternativeArtistRelationships.js - Phase 2 Artist Relationship System
// Surgical integration with existing taste processing system

/**
 * Alternative Artist Relationships using Last.fm API and fallback data
 * Handles unknown artists by finding similar artists and calculating relationship scores
 */
class AlternativeArtistRelationships {
  constructor() {
    this.cache = new Map();
    this.fallbackRelationships = this.initializeFallbackRelationships();
    this.lastfmApiKey = process.env.LASTFM_API_KEY;
  }

  /**
   * Initialize fallback artist relationships for when API is unavailable
   * Based on real music industry relationships and genre crossovers
   */
  initializeFallbackRelationships() {
    return {
      // Melodic Techno Artists
      'boris brejcha': {
        similar: [
          { name: 'Ann Clue', similarity: 0.89, genres: ['melodic techno', 'minimal techno'] },
          { name: 'Stephan Bodzin', similarity: 0.82, genres: ['melodic techno', 'progressive house'] },
          { name: 'Mathame', similarity: 0.78, genres: ['melodic techno', 'progressive house'] },
          { name: 'Tale Of Us', similarity: 0.75, genres: ['melodic techno', 'deep house'] }
        ],
        genres: ['melodic techno', 'minimal techno', 'high tech minimal']
      },

      'tale of us': {
        similar: [
          { name: 'Artbat', similarity: 0.88, genres: ['melodic house', 'melodic techno'] },
          { name: 'Mathame', similarity: 0.84, genres: ['melodic techno', 'progressive house'] },
          { name: 'Mind Against', similarity: 0.81, genres: ['melodic techno', 'deep house'] },
          { name: 'Agents Of Time', similarity: 0.77, genres: ['melodic house', 'deep house'] },
          { name: 'Boris Brejcha', similarity: 0.75, genres: ['melodic techno', 'minimal techno'] }
        ],
        genres: ['melodic techno', 'deep house', 'melodic house']
      },

      'artbat': {
        similar: [
          { name: 'Tale Of Us', similarity: 0.88, genres: ['melodic techno', 'deep house'] },
          { name: 'Mathame', similarity: 0.85, genres: ['melodic techno', 'progressive house'] },
          { name: 'Mind Against', similarity: 0.79, genres: ['melodic techno', 'deep house'] },
          { name: 'Agents Of Time', similarity: 0.76, genres: ['melodic house', 'deep house'] },
          { name: 'Adriatique', similarity: 0.73, genres: ['deep house', 'melodic house'] }
        ],
        genres: ['melodic house', 'melodic techno', 'deep house']
      },

      'mathame': {
        similar: [
          { name: 'Tale Of Us', similarity: 0.84, genres: ['melodic techno', 'deep house'] },
          { name: 'Artbat', similarity: 0.85, genres: ['melodic house', 'melodic techno'] },
          { name: 'Mind Against', similarity: 0.82, genres: ['melodic techno', 'deep house'] },
          { name: 'Boris Brejcha', similarity: 0.78, genres: ['melodic techno', 'minimal techno'] },
          { name: 'Stephan Bodzin', similarity: 0.75, genres: ['melodic techno', 'progressive house'] }
        ],
        genres: ['melodic techno', 'progressive house', 'melodic house']
      },

      // Progressive House Artists
      'lane 8': {
        similar: [
          { name: 'Yotto', similarity: 0.91, genres: ['progressive house', 'melodic house'] },
          { name: 'Marsh', similarity: 0.85, genres: ['progressive house', 'melodic house'] },
          { name: 'Spencer Brown', similarity: 0.82, genres: ['progressive house', 'tech house'] },
          { name: 'Tinlicker', similarity: 0.79, genres: ['progressive house', 'melodic house'] },
          { name: 'Nora En Pure', similarity: 0.76, genres: ['deep house', 'progressive house'] }
        ],
        genres: ['progressive house', 'melodic house', 'deep house']
      },

      'eric prydz': {
        similar: [
          { name: 'Deadmau5', similarity: 0.83, genres: ['progressive house', 'electro house'] },
          { name: 'Above & Beyond', similarity: 0.78, genres: ['trance', 'progressive house'] },
          { name: 'Sasha', similarity: 0.81, genres: ['progressive house', 'tech house'] },
          { name: 'John Digweed', similarity: 0.79, genres: ['progressive house', 'tech house'] },
          { name: 'Lane 8', similarity: 0.74, genres: ['progressive house', 'melodic house'] }
        ],
        genres: ['progressive house', 'tech house', 'electro house']
      },

      'yotto': {
        similar: [
          { name: 'Lane 8', similarity: 0.91, genres: ['progressive house', 'melodic house'] },
          { name: 'Marsh', similarity: 0.87, genres: ['progressive house', 'melodic house'] },
          { name: 'Spencer Brown', similarity: 0.84, genres: ['progressive house', 'tech house'] },
          { name: 'Tinlicker', similarity: 0.81, genres: ['progressive house', 'melodic house'] },
          { name: 'Nora En Pure', similarity: 0.78, genres: ['deep house', 'progressive house'] }
        ],
        genres: ['progressive house', 'melodic house', 'deep house']
      },

      // Tech House Artists
      'fisher': {
        similar: [
          { name: 'Chris Lake', similarity: 0.89, genres: ['tech house', 'house'] },
          { name: 'Walker & Royce', similarity: 0.85, genres: ['tech house', 'house'] },
          { name: 'Solardo', similarity: 0.82, genres: ['tech house', 'house'] },
          { name: 'Camelphat', similarity: 0.79, genres: ['tech house', 'deep house'] },
          { name: 'Green Velvet', similarity: 0.76, genres: ['tech house', 'techno'] }
        ],
        genres: ['tech house', 'house', 'techno']
      },

      'chris lake': {
        similar: [
          { name: 'Fisher', similarity: 0.89, genres: ['tech house', 'house'] },
          { name: 'Walker & Royce', similarity: 0.86, genres: ['tech house', 'house'] },
          { name: 'Solardo', similarity: 0.83, genres: ['tech house', 'house'] },
          { name: 'Camelphat', similarity: 0.80, genres: ['tech house', 'deep house'] },
          { name: 'Green Velvet', similarity: 0.77, genres: ['tech house', 'techno'] }
        ],
        genres: ['tech house', 'house', 'deep house']
      },

      // Trance Artists
      'above & beyond': {
        similar: [
          { name: 'Armin van Buuren', similarity: 0.85, genres: ['trance', 'progressive trance'] },
          { name: 'Aly & Fila', similarity: 0.82, genres: ['trance', 'uplifting trance'] },
          { name: 'Andrew Rayel', similarity: 0.79, genres: ['trance', 'uplifting trance'] },
          { name: 'Cosmic Gate', similarity: 0.76, genres: ['trance', 'progressive trance'] },
          { name: 'Eric Prydz', similarity: 0.78, genres: ['progressive house', 'trance'] }
        ],
        genres: ['trance', 'progressive trance', 'progressive house']
      },

      'armin van buuren': {
        similar: [
          { name: 'Above & Beyond', similarity: 0.85, genres: ['trance', 'progressive trance'] },
          { name: 'Aly & Fila', similarity: 0.83, genres: ['trance', 'uplifting trance'] },
          { name: 'Andrew Rayel', similarity: 0.80, genres: ['trance', 'uplifting trance'] },
          { name: 'Cosmic Gate', similarity: 0.77, genres: ['trance', 'progressive trance'] },
          { name: 'Ferry Corsten', similarity: 0.81, genres: ['trance', 'progressive trance'] }
        ],
        genres: ['trance', 'progressive trance', 'uplifting trance']
      },

      // Bass Music Artists
      'deadmau5': {
        similar: [
          { name: 'Eric Prydz', similarity: 0.83, genres: ['progressive house', 'electro house'] },
          { name: 'Skrillex', similarity: 0.72, genres: ['dubstep', 'electro house'] },
          { name: 'Porter Robinson', similarity: 0.75, genres: ['electro house', 'future bass'] },
          { name: 'Madeon', similarity: 0.73, genres: ['electro house', 'future bass'] },
          { name: 'Rezz', similarity: 0.71, genres: ['bass', 'electro house'] }
        ],
        genres: ['progressive house', 'electro house', 'techno']
      },

      'skrillex': {
        similar: [
          { name: 'Diplo', similarity: 0.78, genres: ['dubstep', 'trap'] },
          { name: 'Flume', similarity: 0.75, genres: ['future bass', 'dubstep'] },
          { name: 'Porter Robinson', similarity: 0.73, genres: ['dubstep', 'future bass'] },
          { name: 'Deadmau5', similarity: 0.72, genres: ['electro house', 'dubstep'] },
          { name: 'Zeds Dead', similarity: 0.81, genres: ['dubstep', 'bass'] }
        ],
        genres: ['dubstep', 'bass', 'future bass']
      },

      // Deep House Artists
      'nora en pure': {
        similar: [
          { name: 'Lane 8', similarity: 0.76, genres: ['progressive house', 'deep house'] },
          { name: 'Yotto', similarity: 0.78, genres: ['progressive house', 'deep house'] },
          { name: 'Marsh', similarity: 0.74, genres: ['progressive house', 'deep house'] },
          { name: 'Tinlicker', similarity: 0.72, genres: ['progressive house', 'deep house'] },
          { name: 'Adriatique', similarity: 0.79, genres: ['deep house', 'melodic house'] }
        ],
        genres: ['deep house', 'progressive house', 'melodic house']
      },

      'adriatique': {
        similar: [
          { name: 'Artbat', similarity: 0.73, genres: ['melodic house', 'deep house'] },
          { name: 'Nora En Pure', similarity: 0.79, genres: ['deep house', 'progressive house'] },
          { name: 'Agents Of Time', similarity: 0.76, genres: ['melodic house', 'deep house'] },
          { name: 'Mind Against', similarity: 0.74, genres: ['melodic techno', 'deep house'] },
          { name: 'Tale Of Us', similarity: 0.71, genres: ['melodic techno', 'deep house'] }
        ],
        genres: ['deep house', 'melodic house', 'progressive house']
      }
    };
  }

  /**
   * Get similar artists for a given artist
   * Uses Last.fm API with fallback to local relationships
   */
  async getSimilarArtists(artistName, limit = 5) {
    if (!artistName) return [];

    const normalizedName = this.normalizeArtistName(artistName);
    const cacheKey = `similar_${normalizedName}`;

    // Check cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let similarArtists = [];

    // Try Last.fm API first
    if (this.lastfmApiKey) {
      try {
        similarArtists = await this.fetchFromLastfm(artistName, limit);
      } catch (error) {
        console.error(`❌ Last.fm API failed for ${artistName}:`, error.message);
      }
    }

    // Fallback to local relationships if API fails or no API key
    if (similarArtists.length === 0) {
      similarArtists = this.getFallbackSimilarArtists(normalizedName, limit);
    }

    // Cache the result
    this.cache.set(cacheKey, similarArtists);

    return similarArtists;
  }

  /**
   * Fetch similar artists from Last.fm API
   */
  async fetchFromLastfm(artistName, limit) {
    try {
      // Use dynamic import for fetch compatibility
      let fetchFunction;
      try {
        fetchFunction = (await import('node-fetch')).default;
      } catch (importError) {
        // Fallback to global fetch (Node.js 18+) or require
        fetchFunction = global.fetch || require('node-fetch');
      }

      const url = `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${this.lastfmApiKey}&format=json&limit=${limit * 2}`;
      
      const response = await fetchFunction(url, { timeout: 5000 });
      
      if (!response.ok) {
        throw new Error(`Last.fm API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.similarartists || !data.similarartists.artist) {
        return [];
      }

      const artists = Array.isArray(data.similarartists.artist) 
        ? data.similarartists.artist 
        : [data.similarartists.artist];

      return artists.slice(0, limit).map(artist => ({
        name: artist.name,
        similarity: parseFloat(artist.match) || 0.5,
        genres: this.inferGenresFromArtist(artist.name)
      }));

    } catch (error) {
      console.error('Last.fm API error:', error);
      return [];
    }
  }

  /**
   * Get fallback similar artists from local relationships
   */
  getFallbackSimilarArtists(normalizedName, limit) {
    const artistData = this.fallbackRelationships[normalizedName];
    
    if (artistData && artistData.similar) {
      return artistData.similar.slice(0, limit);
    }

    // If exact match not found, try partial matching
    const partialMatches = this.findPartialMatches(normalizedName);
    return partialMatches.slice(0, limit);
  }

  /**
   * Find partial matches for unknown artists
   */
  findPartialMatches(artistName) {
    const matches = [];
    const words = artistName.split(' ');

    Object.entries(this.fallbackRelationships).forEach(([knownArtist, data]) => {
      const knownWords = knownArtist.split(' ');
      
      // Check for word matches
      const commonWords = words.filter(word => 
        knownWords.some(knownWord => 
          word.length > 2 && (word === knownWord || word.includes(knownWord) || knownWord.includes(word))
        )
      );

      if (commonWords.length > 0) {
        const similarity = commonWords.length / Math.max(words.length, knownWords.length);
        matches.push({
          name: knownArtist,
          similarity: similarity * 0.6, // Reduce confidence for partial matches
          genres: data.genres || ['electronic']
        });
      }
    });

    return matches.sort((a, b) => b.similarity - a.similarity);
  }

  /**
   * Infer genres from artist name using patterns and known associations
   */
  inferGenresFromArtist(artistName) {
    const name = artistName.toLowerCase();
    
    // Pattern-based genre inference
    if (name.includes('dj') || name.includes('mc')) {
      return ['electronic', 'house'];
    }
    
    if (name.includes('bass') || name.includes('drop')) {
      return ['bass', 'dubstep'];
    }
    
    if (name.includes('tech') || name.includes('minimal')) {
      return ['techno', 'tech house'];
    }
    
    // Default to electronic
    return ['electronic'];
  }

  /**
   * Normalize artist name for consistent matching
   */
  normalizeArtistName(name) {
    return name.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate artist relationship score for event matching
   * Integrates with existing taste filtering system
   */
  async calculateArtistScore(eventArtists, userTopArtists) {
    if (!eventArtists || !userTopArtists || eventArtists.length === 0 || userTopArtists.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const userArtist of userTopArtists) {
      let bestMatchForUser = 0;
      
      // Check direct matches first
      for (const eventArtist of eventArtists) {
        if (this.normalizeArtistName(userArtist.name) === this.normalizeArtistName(eventArtist)) {
          bestMatchForUser = 100; // Perfect match
          break;
        }
      }

      // If no direct match, check similar artists
      if (bestMatchForUser === 0) {
        try {
          const similarArtists = await this.getSimilarArtists(userArtist.name, 10);
          
          for (const eventArtist of eventArtists) {
            const similarMatch = similarArtists.find(similar => 
              this.normalizeArtistName(similar.name) === this.normalizeArtistName(eventArtist)
            );
            
            if (similarMatch) {
              const score = similarMatch.similarity * 100;
              bestMatchForUser = Math.max(bestMatchForUser, score);
            }
          }
        } catch (error) {
          console.error(`Error getting similar artists for ${userArtist.name}:`, error);
        }
      }

      // Weight by artist popularity/importance
      const artistWeight = userArtist.popularity || 50;
      totalScore += bestMatchForUser * (artistWeight / 100);
      maxPossibleScore += artistWeight;
    }

    return maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;
  }

  /**
   * Get artist relationship statistics
   */
  getRelationshipStats() {
    const totalArtists = Object.keys(this.fallbackRelationships).length;
    const totalRelationships = Object.values(this.fallbackRelationships)
      .reduce((sum, artist) => sum + (artist.similar ? artist.similar.length : 0), 0);

    return {
      totalArtists,
      totalRelationships,
      averageRelationshipsPerArtist: Math.round(totalRelationships / totalArtists),
      cacheSize: this.cache.size,
      hasLastfmApi: !!this.lastfmApiKey
    };
  }
   /**
   * Alias for getRelationshipStats() - for compatibility with enhanced recommendation system
   */
    getStats() {
    return this.getRelationshipStats();
  }
}

// Export for use in other modules
module.exports = { AlternativeArtistRelationships };

