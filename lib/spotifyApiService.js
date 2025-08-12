// Spotify API Service for Enhanced Artist Data
// Provides rich artist information, audio features, and recommendations

class SpotifyApiService {
  constructor() {
    this.clientId = process.env.SPOTIFY_CLIENT_ID;
    this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    this.accessToken = null;
    this.tokenExpiry = null;
    this.baseUrl = 'https://api.spotify.com/v1';
  }

  async getAccessToken() {
    // Check if current token is still valid
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64')
        },
        body: 'grant_type=client_credentials'
      });

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // Refresh 1 min early
        console.log('🎵 Spotify token obtained, expires in', data.expires_in, 'seconds');
        return this.accessToken;
      }

      throw new Error('Failed to get Spotify access token');
    } catch (error) {
      console.error('❌ Spotify auth error:', error.message);
      throw error;
    }
  }

  async searchArtist(artistName) {
    try {
      const token = await this.getAccessToken();
      const encodedName = encodeURIComponent(artistName);
      
      const response = await fetch(
        `${this.baseUrl}/search?q=${encodedName}&type=artist&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      
      if (data.artists && data.artists.items.length > 0) {
        const artist = data.artists.items[0];
        return {
          id: artist.id,
          name: artist.name,
          genres: artist.genres,
          popularity: artist.popularity,
          followers: artist.followers?.total,
          images: artist.images,
          spotifyUrl: artist.external_urls?.spotify
        };
      }

      return null;
    } catch (error) {
      console.error(`❌ Spotify artist search error for "${artistName}":`, error.message);
      return null;
    }
  }

  async getArtistTopTracks(artistId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `${this.baseUrl}/artists/${artistId}/top-tracks?market=US`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      
      if (data.tracks) {
        return data.tracks.map(track => ({
          id: track.id,
          name: track.name,
          popularity: track.popularity,
          previewUrl: track.preview_url,
          durationMs: track.duration_ms,
          explicit: track.explicit,
          album: {
            name: track.album.name,
            releaseDate: track.album.release_date,
            images: track.album.images
          }
        }));
      }

      return [];
    } catch (error) {
      console.error(`❌ Spotify top tracks error for artist ${artistId}:`, error.message);
      return [];
    }
  }

  async getAudioFeatures(trackIds) {
    try {
      const token = await this.getAccessToken();
      const ids = Array.isArray(trackIds) ? trackIds.join(',') : trackIds;
      
      const response = await fetch(
        `${this.baseUrl}/audio-features?ids=${ids}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      
      if (data.audio_features) {
        return data.audio_features.filter(f => f !== null).map(features => ({
          id: features.id,
          danceability: features.danceability,
          energy: features.energy,
          valence: features.valence,
          tempo: features.tempo,
          acousticness: features.acousticness,
          instrumentalness: features.instrumentalness,
          liveness: features.liveness,
          speechiness: features.speechiness,
          key: features.key,
          mode: features.mode,
          timeSignature: features.time_signature
        }));
      }

      return [];
    } catch (error) {
      console.error('❌ Spotify audio features error:', error.message);
      return [];
    }
  }

  async getRelatedArtists(artistId) {
    try {
      const token = await this.getAccessToken();
      
      const response = await fetch(
        `${this.baseUrl}/artists/${artistId}/related-artists`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      
      if (data.artists) {
        return data.artists.slice(0, 10).map(artist => ({
          id: artist.id,
          name: artist.name,
          genres: artist.genres,
          popularity: artist.popularity
        }));
      }

      return [];
    } catch (error) {
      console.error(`❌ Spotify related artists error for ${artistId}:`, error.message);
      return [];
    }
  }

  // Enhanced artist analysis for event matching
  async analyzeEventArtists(eventArtists) {
    console.log(`🎵 Analyzing ${eventArtists.length} event artists with Spotify...`);
    
    const analysis = {
      artists: [],
      averagePopularity: 0,
      dominantGenres: {},
      audioProfile: {
        danceability: 0,
        energy: 0,
        valence: 0,
        tempo: 0
      },
      relatedArtists: [],
      matchScore: 0
    };

    for (const artistName of eventArtists) {
      if (!artistName || typeof artistName !== 'string') continue;
      
      const spotifyArtist = await this.searchArtist(artistName.trim());
      if (spotifyArtist) {
        analysis.artists.push(spotifyArtist);
        
        // Accumulate genre data
        spotifyArtist.genres.forEach(genre => {
          analysis.dominantGenres[genre] = (analysis.dominantGenres[genre] || 0) + 1;
        });

        // Get top tracks for audio analysis
        const topTracks = await this.getArtistTopTracks(spotifyArtist.id);
        if (topTracks.length > 0) {
          const trackIds = topTracks.slice(0, 3).map(t => t.id);
          const audioFeatures = await this.getAudioFeatures(trackIds);
          
          // Average the audio features
          if (audioFeatures.length > 0) {
            const avgFeatures = audioFeatures.reduce((acc, curr) => ({
              danceability: acc.danceability + curr.danceability,
              energy: acc.energy + curr.energy,
              valence: acc.valence + curr.valence,
              tempo: acc.tempo + curr.tempo
            }), { danceability: 0, energy: 0, valence: 0, tempo: 0 });

            const count = audioFeatures.length;
            analysis.audioProfile.danceability += avgFeatures.danceability / count;
            analysis.audioProfile.energy += avgFeatures.energy / count;
            analysis.audioProfile.valence += avgFeatures.valence / count;
            analysis.audioProfile.tempo += avgFeatures.tempo / count;
          }
        }

        // Get related artists for similarity analysis
        const relatedArtists = await this.getRelatedArtists(spotifyArtist.id);
        analysis.relatedArtists.push(...relatedArtists);
      }

      // Add small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Calculate averages
    if (analysis.artists.length > 0) {
      analysis.averagePopularity = analysis.artists.reduce((sum, a) => sum + a.popularity, 0) / analysis.artists.length;
      
      const artistCount = analysis.artists.length;
      analysis.audioProfile.danceability /= artistCount;
      analysis.audioProfile.energy /= artistCount;
      analysis.audioProfile.valence /= artistCount;
      analysis.audioProfile.tempo /= artistCount;
    }

    console.log(`🎵 Spotify analysis complete: ${analysis.artists.length} artists found`);
    return analysis;
  }

  // Calculate compatibility with user preferences
  calculateArtistCompatibility(eventAnalysis, userPreferences = {}) {
    let compatibilityScore = 0;
    const factors = [];

    // Genre compatibility (40% weight)
    if (userPreferences.favoriteGenres && Object.keys(eventAnalysis.dominantGenres).length > 0) {
      const genreMatches = userPreferences.favoriteGenres.filter(genre => 
        eventAnalysis.dominantGenres[genre.toLowerCase()]
      ).length;
      const genreScore = (genreMatches / userPreferences.favoriteGenres.length) * 40;
      compatibilityScore += genreScore;
      factors.push({ factor: 'Genre Match', score: genreScore, weight: '40%' });
    }

    // Audio profile compatibility (30% weight)
    if (userPreferences.audioProfile) {
      const audioSimilarity = this.calculateAudioSimilarity(
        eventAnalysis.audioProfile, 
        userPreferences.audioProfile
      );
      const audioScore = audioSimilarity * 30;
      compatibilityScore += audioScore;
      factors.push({ factor: 'Audio Profile', score: audioScore, weight: '30%' });
    }

    // Artist popularity alignment (20% weight)
    if (userPreferences.popularityPreference) {
      const popularityScore = this.calculatePopularityAlignment(
        eventAnalysis.averagePopularity,
        userPreferences.popularityPreference
      ) * 20;
      compatibilityScore += popularityScore;
      factors.push({ factor: 'Popularity Alignment', score: popularityScore, weight: '20%' });
    }

    // Discovery potential (10% weight)
    const discoveryScore = Math.min(eventAnalysis.relatedArtists.length * 2, 10);
    compatibilityScore += discoveryScore;
    factors.push({ factor: 'Discovery Potential', score: discoveryScore, weight: '10%' });

    return {
      totalScore: Math.round(compatibilityScore),
      breakdown: factors,
      eventAnalysis
    };
  }

  calculateAudioSimilarity(eventProfile, userProfile) {
    const features = ['danceability', 'energy', 'valence'];
    let similarity = 0;

    features.forEach(feature => {
      const diff = Math.abs(eventProfile[feature] - userProfile[feature]);
      similarity += (1 - diff); // Closer values = higher similarity
    });

    return similarity / features.length;
  }

  calculatePopularityAlignment(eventPopularity, userPreference) {
    // userPreference: 'mainstream' (60-100), 'balanced' (30-70), 'underground' (0-40)
    const ranges = {
      mainstream: [60, 100],
      balanced: [30, 70], 
      underground: [0, 40]
    };

    const [min, max] = ranges[userPreference] || ranges.balanced;
    
    if (eventPopularity >= min && eventPopularity <= max) {
      return 1; // Perfect alignment
    } else {
      const distance = eventPopularity < min ? min - eventPopularity : eventPopularity - max;
      return Math.max(0, 1 - (distance / 50)); // Gradual falloff
    }
  }
}

module.exports = SpotifyApiService;
