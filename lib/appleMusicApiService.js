// Apple Music API Service for Enhanced Artist Data
// Provides alternative rich artist information and music data

class AppleMusicApiService {
  constructor() {
    this.apiKey = process.env.APPLE_MUSIC_API_KEY; // JWT token
    this.baseUrl = 'https://api.music.apple.com/v1';
    this.storefront = 'us'; // Default to US storefront
  }

  async searchArtist(artistName) {
    try {
      if (!this.apiKey) {
        console.log('⚠️ Apple Music API key not configured, skipping Apple Music search');
        return null;
      }

      const encodedName = encodeURIComponent(artistName);
      const response = await fetch(
        `${this.baseUrl}/catalog/${this.storefront}/search?term=${encodedName}&types=artists&limit=1`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const data = await response.json();
      
      if (data.results && data.results.artists && data.results.artists.data.length > 0) {
        const artist = data.results.artists.data[0];
        return {
          id: artist.id,
          name: artist.attributes.name,
          genres: artist.attributes.genreNames || [],
          url: artist.attributes.url,
          artwork: artist.attributes.artwork
        };
      }

      return null;
    } catch (error) {
      console.error(`❌ Apple Music artist search error for "${artistName}":`, error.message);
      return null;
    }
  }

  async getArtistTopSongs(artistId) {
    try {
      if (!this.apiKey) return [];

      const response = await fetch(
        `${this.baseUrl}/catalog/${this.storefront}/artists/${artistId}/songs?limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const data = await response.json();
      
      if (data.data) {
        return data.data.map(song => ({
          id: song.id,
          name: song.attributes.name,
          albumName: song.attributes.albumName,
          releaseDate: song.attributes.releaseDate,
          genres: song.attributes.genreNames || [],
          durationInMillis: song.attributes.durationInMillis,
          url: song.attributes.url,
          artwork: song.attributes.artwork
        }));
      }

      return [];
    } catch (error) {
      console.error(`❌ Apple Music top songs error for artist ${artistId}:`, error.message);
      return [];
    }
  }

  async searchGenre(genreName) {
    try {
      if (!this.apiKey) return null;

      const encodedName = encodeURIComponent(genreName);
      const response = await fetch(
        `${this.baseUrl}/catalog/${this.storefront}/search?term=${encodedName}&types=songs&limit=25`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      const data = await response.json();
      
      if (data.results && data.results.songs && data.results.songs.data.length > 0) {
        // Analyze genre characteristics from top songs
        const songs = data.results.songs.data;
        const genreAnalysis = {
          name: genreName,
          sampleSongs: songs.slice(0, 5).map(song => ({
            name: song.attributes.name,
            artist: song.attributes.artistName,
            genres: song.attributes.genreNames
          })),
          commonGenreTags: this.extractCommonGenres(songs),
          songCount: songs.length
        };

        return genreAnalysis;
      }

      return null;
    } catch (error) {
      console.error(`❌ Apple Music genre search error for "${genreName}":`, error.message);
      return null;
    }
  }

  extractCommonGenres(songs) {
    const genreCounts = {};
    
    songs.forEach(song => {
      if (song.attributes.genreNames) {
        song.attributes.genreNames.forEach(genre => {
          genreCounts[genre] = (genreCounts[genre] || 0) + 1;
        });
      }
    });

    return Object.entries(genreCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([genre, count]) => ({ genre, count }));
  }

  // Enhanced analysis combining both Spotify and Apple Music
  async enhanceArtistData(artistName, spotifyData = null) {
    console.log(`🍎 Enhancing artist data for "${artistName}" with Apple Music...`);
    
    const appleMusicArtist = await this.searchArtist(artistName);
    
    if (!appleMusicArtist && !spotifyData) {
      return null;
    }

    const enhanced = {
      name: artistName,
      spotify: spotifyData || null,
      appleMusic: appleMusicArtist || null,
      combinedGenres: [],
      crossPlatformPopularity: 0,
      dataQuality: 'basic'
    };

    // Combine genre data from both platforms
    const allGenres = new Set();
    
    if (spotifyData && spotifyData.genres) {
      spotifyData.genres.forEach(genre => allGenres.add(genre.toLowerCase()));
    }
    
    if (appleMusicArtist && appleMusicArtist.genres) {
      appleMusicArtist.genres.forEach(genre => allGenres.add(genre.toLowerCase()));
    }

    enhanced.combinedGenres = Array.from(allGenres);

    // Calculate cross-platform popularity
    let popularityFactors = 0;
    let totalPopularity = 0;

    if (spotifyData && typeof spotifyData.popularity === 'number') {
      totalPopularity += spotifyData.popularity;
      popularityFactors++;
    }

    if (appleMusicArtist) {
      // Apple Music doesn't provide direct popularity scores,
      // but we can infer from presence and genre diversity
      const inferredPopularity = Math.min(80, enhanced.combinedGenres.length * 15 + 30);
      totalPopularity += inferredPopularity;
      popularityFactors++;
    }

    if (popularityFactors > 0) {
      enhanced.crossPlatformPopularity = totalPopularity / popularityFactors;
      enhanced.dataQuality = popularityFactors === 2 ? 'rich' : 'partial';
    }

    console.log(`🍎 Apple Music enhancement complete for "${artistName}": ${enhanced.dataQuality} data quality`);
    return enhanced;
  }

  // Genre trend analysis using Apple Music catalog
  async analyzeGenreTrends(genres) {
    console.log(`🍎 Analyzing genre trends for: ${genres.join(', ')}`);
    
    const trendAnalysis = {
      genres: {},
      trending: [],
      stable: [],
      emerging: []
    };

    for (const genre of genres.slice(0, 5)) { // Limit to avoid rate limits
      const genreData = await this.searchGenre(genre);
      
      if (genreData) {
        trendAnalysis.genres[genre] = genreData;
        
        // Simple trend classification based on song diversity and common tags
        const diversity = genreData.commonGenreTags.length;
        const popularity = genreData.songCount;
        
        if (diversity > 3 && popularity > 15) {
          trendAnalysis.trending.push(genre);
        } else if (diversity >= 2 && popularity >= 10) {
          trendAnalysis.stable.push(genre);
        } else {
          trendAnalysis.emerging.push(genre);
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    return trendAnalysis;
  }
}

module.exports = AppleMusicApiService;
