// Music API Service - Lightweight version for deployment
// Provides Spotify/Apple Music integration for event enhancement

class MusicApiService {
  constructor() {
    this.spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
    this.spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.spotifyToken = null;
    this.tokenExpiry = null;
  }

  async getUserMusicPreferences(userId = 'default') {
    // Return default user preferences
    return {
      preferredGenres: ['house', 'techno', 'electronic', 'dance'],
      audioFeatures: {
        energy: 0.8,
        danceability: 0.85,
        valence: 0.6,
        tempo: 128
      },
      userId
    };
  }

  async analyzeEventWithMusicApis(event, userPreferences = {}) {
    try {
      console.log(`🎵 Analyzing event: ${event.name}`);
      
      // Extract artists from event
      const artists = this.extractArtistsFromEvent(event);
      
      // Base enhancement (no API calls if no credentials)
      let enhancedScore = event.personalizedScore || 50;
      let scoreBoosts = [];
      let confidence = 'medium';
      
      // If we have Spotify credentials, try to enhance
      if (this.spotifyClientId && this.spotifyClientSecret) {
        try {
          const spotifyData = await this.analyzeWithSpotify(artists);
          if (spotifyData.found) {
            enhancedScore += 8; // Boost for successful API match
            scoreBoosts.push({ source: 'spotify', boost: 8, reason: 'Artist found in Spotify' });
            confidence = 'high';
          }
        } catch (spotifyError) {
          console.log('Spotify API error, using fallback:', spotifyError.message);
        }
      }

      // Apply genre boost
      if (event.genres && event.genres.some(g => 
        ['house', 'techno', 'electronic', 'dance', 'edm'].includes(g.toLowerCase())
      )) {
        enhancedScore += 5;
        scoreBoosts.push({ source: 'genre', boost: 5, reason: 'EDM genre match' });
      }

      // Cap at 100
      enhancedScore = Math.min(100, enhancedScore);

      return {
        enhancedScore,
        originalScore: event.personalizedScore || 50,
        confidence,
        artistsAnalyzed: artists.length,
        scoreBoosts,
        totalBoost: scoreBoosts.reduce((sum, boost) => sum + boost.boost, 0),
        combinedInsights: {
          dominantGenres: event.genres || ['electronic'],
          audioProfile: userPreferences.audioFeatures || { energy: 0.8, danceability: 0.85 },
          popularityTier: 'medium'
        },
        recommendations: [],
        processingTime: Date.now()
      };

    } catch (error) {
      console.error('Music API analysis error:', error);
      
      // Return safe fallback
      return {
        enhancedScore: event.personalizedScore || 50,
        originalScore: event.personalizedScore || 50,
        confidence: 'low',
        artistsAnalyzed: 0,
        scoreBoosts: [],
        totalBoost: 0,
        combinedInsights: {
          dominantGenres: ['unknown'],
          audioProfile: { energy: 0.5, danceability: 0.5 },
          popularityTier: 'unknown'
        },
        recommendations: [],
        processingTime: Date.now(),
        error: error.message
      };
    }
  }

  extractArtistsFromEvent(event) {
    const artists = [];
    
    // From event.artists array
    if (event.artists && Array.isArray(event.artists)) {
      event.artists.forEach(artist => {
        if (typeof artist === 'string') artists.push(artist);
        else if (artist && artist.name) artists.push(artist.name);
      });
    }

    // From event name (simple extraction)
    if (event.name) {
      const name = event.name.toLowerCase();
      // Common patterns: "Artist @ Venue", "Event w/ Artist", "Artist presents"
      const patterns = [
        /w\/\s*([^,]+)/i,
        /with\s+([^,@]+)/i,
        /presents\s+([^,@]+)/i,
        /feat\.?\s+([^,@]+)/i
      ];
      
      for (const pattern of patterns) {
        const match = name.match(pattern);
        if (match && match[1]) {
          artists.push(match[1].trim());
        }
      }
    }

    return [...new Set(artists)]; // Remove duplicates
  }

  async analyzeWithSpotify(artists) {
    try {
      // Get Spotify token
      if (!this.spotifyToken || Date.now() > this.tokenExpiry) {
        await this.refreshSpotifyToken();
      }

      if (!this.spotifyToken) {
        return { found: false, reason: 'No token' };
      }

      // Search for first artist
      if (artists.length === 0) {
        return { found: false, reason: 'No artists' };
      }

      const searchUrl = `https://api.spotify.com/v1/search?q=${encodeURIComponent(artists[0])}&type=artist&limit=1`;
      
      const response = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${this.spotifyToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return { 
          found: data.artists && data.artists.items.length > 0,
          artist: data.artists?.items[0] || null
        };
      }

      return { found: false, reason: 'API error' };

    } catch (error) {
      console.error('Spotify analysis error:', error);
      return { found: false, reason: error.message };
    }
  }

  async refreshSpotifyToken() {
    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${this.spotifyClientId}:${this.spotifyClientSecret}`).toString('base64')}`
        },
        body: 'grant_type=client_credentials'
      });

      if (response.ok) {
        const data = await response.json();
        this.spotifyToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000);
        console.log('✅ Spotify token refreshed');
      }
    } catch (error) {
      console.error('Spotify token refresh error:', error);
    }
  }
}

module.exports = new MusicApiService();
