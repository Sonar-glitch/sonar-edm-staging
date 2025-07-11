// ENHANCED: Surgical integration with existing taste processing system + Spotify API + MongoDB caching

const { connectToDatabase } = require('./mongodb');

/**
 * Enhanced Alternative Artist Relationships with Spotify API integration and MongoDB caching
 * Handles unknown artists by finding similar artists and calculating relationship scores
 * NEW: Spotify API integration for real-time genre data with persistent caching
 */
class AlternativeArtistRelationships {
  constructor() {
    this.cache = new Map(); // In-memory cache for session
    this.fallbackRelationships = this.initializeFallbackRelationships();
    this.lastfmApiKey = process.env.LASTFM_API_KEY;
    
    // NEW: Spotify API configuration
    this.spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
    this.spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.spotifyToken = null;
    this.spotifyTokenExpiry = null;
    
    // NEW: Rate limiting configuration
    this.lastSpotifyCall = 0;
    this.minCallInterval = 100; // 100ms between calls (600 calls/minute max)
    this.retryAttempts = 3;
    this.retryDelay = 1000; // Start with 1 second
  }

  /**
   * NEW: Get Spotify access token with caching
   */
  async getSpotifyToken() {
    // Return cached token if still valid
    if (this.spotifyToken && this.spotifyTokenExpiry && Date.now() < this.spotifyTokenExpiry) {
      return this.spotifyToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(this.spotifyClientId + ':' + this.spotifyClientSecret).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error(`Spotify token request failed: ${response.status}`);
      }

      const data = await response.json();
      this.spotifyToken = data.access_token;
      this.spotifyTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 minute early
      
      return this.spotifyToken;
    } catch (error) {
      console.error('🚨 Spotify token error:', error.message);
      return null;
    }
  }

  /**
   * NEW: Rate-limited Spotify API call with exponential backoff
   */
  async callSpotifyAPI(url, retryCount = 0) {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastCall = now - this.lastSpotifyCall;
    if (timeSinceLastCall < this.minCallInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minCallInterval - timeSinceLastCall));
    }
    this.lastSpotifyCall = Date.now();

    try {
      const token = await this.getSpotifyToken();
      if (!token) {
        throw new Error('No Spotify token available');
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': 'Bearer ' + token
        }
      });

      if (response.status === 429) {
        // Rate limited - exponential backoff
        const retryAfter = parseInt(response.headers.get('Retry-After') || '1');
        const delay = Math.max(retryAfter * 1000, this.retryDelay * Math.pow(2, retryCount));
        
        if (retryCount < this.retryAttempts) {
          console.log(`🔄 Spotify rate limited, retrying in ${delay}ms (attempt ${retryCount + 1})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          return this.callSpotifyAPI(url, retryCount + 1);
        } else {
          throw new Error('Spotify rate limit exceeded, max retries reached');
        }
      }

      if (!response.ok) {
        throw new Error(`Spotify API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      if (retryCount < this.retryAttempts) {
        const delay = this.retryDelay * Math.pow(2, retryCount);
        console.log(`🔄 Spotify API error, retrying in ${delay}ms: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.callSpotifyAPI(url, retryCount + 1);
      }
      throw error;
    }
  }

  /**
   * NEW: Get artist genres from MongoDB cache
   */
  async getCachedArtistGenres(artistName) {
    try {
      const { db } = await connectToDatabase();
      const cached = await db.collection('artistGenres').findOne({
        artistName: artistName.toLowerCase(),
        lastUpdated: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // 30 days TTL
      });
      
      if (cached) {
        console.log(`💾 Cache hit for artist: ${artistName}`);
        return cached.genres;
      }
      return null;
    } catch (error) {
      console.error('🚨 Cache read error:', error.message);
      return null;
    }
  }

  /**
   * NEW: Cache artist genres in MongoDB
   */
  async cacheArtistGenres(artistName, genres, spotifyId = null) {
    try {
      const { db } = await connectToDatabase();
      await db.collection('artistGenres').updateOne(
        { artistName: artistName.toLowerCase() },
        {
          $set: {
            artistName: artistName.toLowerCase(),
            originalName: artistName,
            spotifyId: spotifyId,
            genres: genres,
            lastUpdated: new Date(),
            source: 'spotify'
          }
        },
        { upsert: true }
      );
      console.log(`💾 Cached genres for ${artistName}: ${genres.join(', ')}`);
    } catch (error) {
      console.error('🚨 Cache write error:', error.message);
    }
  }

  /**
   * NEW: Get artist genres from Spotify API
   */
  async getSpotifyArtistGenres(artistName) {
    try {
      // Search for artist
      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=1`;
      const searchResult = await this.callSpotifyAPI(searchUrl);
      
      if (!searchResult.artists || !searchResult.artists.items.length) {
        console.log(`🔍 No Spotify results for: ${artistName}`);
        return null;
      }

      const artist = searchResult.artists.items[0];
      const genres = artist.genres || [];
      
      console.log(`🎵 Spotify genres for ${artistName}: ${genres.join(', ')}`);
      
      // Cache the result
      await this.cacheArtistGenres(artistName, genres, artist.id);
      
      return genres;
    } catch (error) {
      console.error(`🚨 Spotify API error for ${artistName}:`, error.message);
      return null;
    }
  }

  /**
   * ENHANCED: Infer genres from artist name using Spotify API + caching + fallbacks
   */
  async inferGenresFromArtist(artistName) {
    if (!artistName) return ['electronic'];
    
    const normalizedName = artistName.toLowerCase().trim();
    
    // Step 1: Check in-memory cache
    if (this.cache.has(normalizedName)) {
      console.log(`⚡ Memory cache hit for: ${artistName}`);
      return this.cache.get(normalizedName);
    }

    // Step 2: Check MongoDB cache
    const cachedGenres = await this.getCachedArtistGenres(normalizedName);
    if (cachedGenres && cachedGenres.length > 0) {
      this.cache.set(normalizedName, cachedGenres);
      return cachedGenres;
    }

    // Step 3: Check fallback relationships (existing hardcoded data)
    if (this.fallbackRelationships[normalizedName]) {
      const genres = this.fallbackRelationships[normalizedName].genres || ['electronic'];
      console.log(`📚 Fallback genres for ${artistName}: ${genres.join(', ')}`);
      
      // Cache the fallback result
      await this.cacheArtistGenres(artistName, genres);
      this.cache.set(normalizedName, genres);
      return genres;
    }

    // Step 4: Try Spotify API (NEW)
    if (this.spotifyClientId && this.spotifyClientSecret) {
      const spotifyGenres = await this.getSpotifyArtistGenres(artistName);
      if (spotifyGenres && spotifyGenres.length > 0) {
        this.cache.set(normalizedName, spotifyGenres);
        return spotifyGenres;
      }
    }

    // Step 5: Pattern-based inference (existing logic as final fallback)
    const patternGenres = this.inferGenresFromPattern(normalizedName);
    
    // Cache the pattern result
    await this.cacheArtistGenres(artistName, patternGenres);
    this.cache.set(normalizedName, patternGenres);
    
    console.log(`🔍 Pattern-based genres for ${artistName}: ${patternGenres.join(', ')}`);
    return patternGenres;
  }

  /**
   * EXTRACTED: Pattern-based genre inference (existing logic)
   */
  inferGenresFromPattern(artistName) {
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

      // Progressive House Artists
      'deadmau5': {
        similar: [
          { name: 'Eric Prydz', similarity: 0.85, genres: ['progressive house', 'tech house'] },
          { name: 'Above & Beyond', similarity: 0.78, genres: ['progressive house', 'trance'] },
          { name: 'Kaskade', similarity: 0.76, genres: ['progressive house', 'deep house'] },
          { name: 'Porter Robinson', similarity: 0.73, genres: ['progressive house', 'electro house'] },
          { name: 'Madeon', similarity: 0.73, genres: ['electro house', 'future bass'] },
          { name: 'Rezz', similarity: 0.71, genres: ['bass', 'electro house'] }
        ],
        genres: ['progressive house', 'electro house', 'techno']
      },

      'eric prydz': {
        similar: [
          { name: 'Deadmau5', similarity: 0.85, genres: ['progressive house', 'electro house'] },
          { name: 'Above & Beyond', similarity: 0.82, genres: ['progressive house', 'trance'] },
          { name: 'Kaskade', similarity: 0.79, genres: ['progressive house', 'deep house'] },
          { name: 'Lane 8', similarity: 0.76, genres: ['progressive house', 'deep house'] },
          { name: 'Yotto', similarity: 0.74, genres: ['progressive house', 'deep house'] }
        ],
        genres: ['progressive house', 'tech house', 'techno']
      },

      // Tech House Artists
      'fisher': {
        similar: [
          { name: 'Chris Lake', similarity: 0.89, genres: ['tech house', 'house'] },
          { name: 'Walker & Royce', similarity: 0.84, genres: ['tech house', 'house'] },
          { name: 'Claude VonStroke', similarity: 0.81, genres: ['tech house', 'house'] },
          { name: 'Green Velvet', similarity: 0.78, genres: ['tech house', 'techno'] },
          { name: 'Solardo', similarity: 0.76, genres: ['tech house', 'house'] }
        ],
        genres: ['tech house', 'house', 'electronic']
      },

      'chris lake': {
        similar: [
          { name: 'Fisher', similarity: 0.89, genres: ['tech house', 'house'] },
          { name: 'Walker & Royce', similarity: 0.86, genres: ['tech house', 'house'] },
          { name: 'Claude VonStroke', similarity: 0.83, genres: ['tech house', 'house'] },
          { name: 'Solardo', similarity: 0.79, genres: ['tech house', 'house'] },
          { name: 'Green Velvet', similarity: 0.76, genres: ['tech house', 'techno'] }
        ],
        genres: ['tech house', 'house', 'electronic']
      },

      // Trance Artists
      'ferry corsten': {
        similar: [
          { name: 'Armin van Buuren', similarity: 0.88, genres: ['trance', 'progressive trance'] },
          { name: 'Above & Beyond', similarity: 0.85, genres: ['trance', 'progressive house'] },
          { name: 'Paul van Dyk', similarity: 0.82, genres: ['trance', 'progressive trance'] },
          { name: 'Tiësto', similarity: 0.79, genres: ['trance', 'progressive house'] },
          { name: 'Markus Schulz', similarity: 0.76, genres: ['trance', 'progressive trance'] }
        ],
        genres: ['trance', 'progressive trance', 'uplifting trance']
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
    
    // Check cache first
    const cacheKey = `similar_${normalizedName}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Try fallback relationships first
    if (this.fallbackRelationships[normalizedName]) {
      const similar = this.fallbackRelationships[normalizedName].similar || [];
      this.cache.set(cacheKey, similar.slice(0, limit));
      return similar.slice(0, limit);
    }

    // Try Last.fm API if available
    if (this.lastfmApiKey) {
      try {
        const response = await fetch(
          `https://ws.audioscrobbler.com/2.0/?method=artist.getsimilar&artist=${encodeURIComponent(artistName)}&api_key=${this.lastfmApiKey}&format=json&limit=${limit}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data.similarartists && data.similarartists.artist) {
            const similar = data.similarartists.artist.map(artist => ({
              name: artist.name,
              similarity: parseFloat(artist.match) || 0.5,
              genres: ['electronic'] // Default genre for Last.fm results
            }));
            
            this.cache.set(cacheKey, similar);
            return similar;
          }
        }
      } catch (error) {
        console.error('Last.fm API error:', error);
      }
    }

    // Fallback to pattern matching
    return this.findSimilarByPattern(artistName, limit);
  }

  /**
   * Find similar artists using pattern matching
   */
  findSimilarByPattern(artistName, limit = 5) {
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

    return matches.sort((a, b) => b.similarity - a.similarity).slice(0, limit);
  }

  /**
   * Normalize artist name for consistent matching
   */
  normalizeArtistName(name) {
    return name.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }

  /**
   * Calculate relationship score between user's taste and event artists
   */
  async calculateArtistRelationshipScore(eventArtists, userTopArtists) {
    if (!eventArtists || !userTopArtists || eventArtists.length === 0 || userTopArtists.length === 0) {
      return 0;
    }

    let totalScore = 0;
    let maxPossibleScore = 0;

    for (const eventArtist of eventArtists) {
      let bestMatch = 0;
      
      // Direct match check
      for (const userArtist of userTopArtists) {
        if (this.normalizeArtistName(eventArtist) === this.normalizeArtistName(userArtist.name)) {
          bestMatch = Math.max(bestMatch, userArtist.weight || 1);
        }
      }

      // Similar artist check if no direct match
      if (bestMatch === 0) {
        const similarArtists = await this.getSimilarArtists(eventArtist, 10);
        
        for (const similar of similarArtists) {
          for (const userArtist of userTopArtists) {
            if (this.normalizeArtistName(similar.name) === this.normalizeArtistName(userArtist.name)) {
              const relationshipScore = (similar.similarity || 0.5) * (userArtist.weight || 1);
              bestMatch = Math.max(bestMatch, relationshipScore);
            }
          }
        }
      }

      totalScore += bestMatch;
      maxPossibleScore += 1; // Assuming max weight is 1
    }

    return maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
  }

  async getArtistSimilarity(userArtist, eventArtist) {
    try {
      const { connectToDatabase } = require('./mongodb');
      const { db } = await connectToDatabase();
      
      const normalizedUserArtist = this.normalizeArtistName(userArtist);
      const normalizedEventArtist = this.normalizeArtistName(eventArtist);
      
      if (normalizedUserArtist === normalizedEventArtist) {
        return 1.0;
      }
      
      // Use simple string matching instead of regex
      const [userArtistData, eventArtistData] = await Promise.all([
        db.collection('artistGenres').findOne({ 
          artistName: normalizedUserArtist
        }),
        db.collection('artistGenres').findOne({ 
          artistName: normalizedEventArtist
        })
      ]);
      
      if (userArtistData && eventArtistData && userArtistData.genres && eventArtistData.genres) {
        const userGenres = new Set(userArtistData.genres.map(g => g.toLowerCase()));
        const eventGenres = new Set(eventArtistData.genres.map(g => g.toLowerCase()));
        
        const intersection = new Set([...userGenres].filter(g => eventGenres.has(g)));
        const union = new Set([...userGenres, ...eventGenres]);
        
        const similarity = intersection.size / union.size;
        return Math.max(similarity, 0.1);
      }
      
      // Fallback to hardcoded data
      const fallbackData = this.fallbackRelationships[normalizedUserArtist];
      if (fallbackData && fallbackData.similar) {
        const match = fallbackData.similar.find(similar => 
          this.normalizeArtistName(similar.name) === normalizedEventArtist
        );
        if (match) {
          return match.similarity || 0.5;
        }
      }
      
      return 0.1;
      
    } catch (error) {
      console.error('Error in getArtistSimilarity:', error.message);
      return 0.1;
    }
  }
}

module.exports = { AlternativeArtistRelationships };

