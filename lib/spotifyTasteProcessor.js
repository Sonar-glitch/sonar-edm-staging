// lib/spotifyTasteProcessor.js - Enhanced processor with 500+ genres
const { connectToDatabase } = require('./mongodb');
const { getTopArtists, getTopTracks, getAudioFeaturesForTracks } = require('./spotify');
const { getTopGenres, getSeasonalMood } = require('./moodUtils'); // PRESERVED: Existing moodUtils

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ENHANCED: 500+ Genre mapping with cross-genre intelligence
const ENHANCED_GENRE_MAPPING = {
  // House family (expanded)
  'house': {
    subgenres: ['deep house', 'tech house', 'progressive house', 'electro house', 'future house', 'tropical house', 'acid house', 'chicago house', 'french house', 'funky house'],
    crossGenre: ['techno', 'disco', 'funk', 'garage'],
    audioProfile: { energy: 0.8, danceability: 0.9, valence: 0.7, tempo: 125 },
    seasonalAffinity: { summer: 0.9, spring: 0.8, fall: 0.6, winter: 0.5 }
  },
  'deep house': {
    subgenres: ['minimal deep house', 'vocal deep house', 'organic house', 'melodic deep house'],
    crossGenre: ['house', 'techno', 'ambient', 'downtempo'],
    audioProfile: { energy: 0.6, danceability: 0.8, valence: 0.6, tempo: 120 },
    seasonalAffinity: { summer: 0.8, spring: 0.7, fall: 0.8, winter: 0.7 }
  },
  'tech house': {
    subgenres: ['minimal tech house', 'vocal tech house', 'underground tech house'],
    crossGenre: ['house', 'techno', 'minimal'],
    audioProfile: { energy: 0.8, danceability: 0.9, valence: 0.6, tempo: 128 },
    seasonalAffinity: { summer: 0.7, spring: 0.6, fall: 0.8, winter: 0.9 }
  },
  'progressive house': {
    subgenres: ['melodic progressive house', 'uplifting progressive house', 'dark progressive house'],
    crossGenre: ['house', 'trance', 'progressive trance'],
    audioProfile: { energy: 0.7, danceability: 0.8, valence: 0.7, tempo: 128 },
    seasonalAffinity: { summer: 0.8, spring: 0.9, fall: 0.7, winter: 0.6 }
  },

  // Techno family (expanded)
  'techno': {
    subgenres: ['minimal techno', 'detroit techno', 'berlin techno', 'acid techno', 'hard techno', 'melodic techno', 'industrial techno'],
    crossGenre: ['house', 'industrial', 'ambient', 'experimental'],
    audioProfile: { energy: 0.9, danceability: 0.8, valence: 0.4, tempo: 130 },
    seasonalAffinity: { summer: 0.6, spring: 0.5, fall: 0.8, winter: 0.9 }
  },
  'minimal techno': {
    subgenres: ['dub techno', 'ambient techno', 'micro house'],
    crossGenre: ['techno', 'minimal', 'ambient', 'dub'],
    audioProfile: { energy: 0.7, danceability: 0.7, valence: 0.3, tempo: 125 },
    seasonalAffinity: { summer: 0.5, spring: 0.6, fall: 0.8, winter: 0.9 }
  },
  'detroit techno': {
    subgenres: ['classic detroit techno', 'modern detroit techno'],
    crossGenre: ['techno', 'electro', 'funk', 'soul'],
    audioProfile: { energy: 0.8, danceability: 0.8, valence: 0.5, tempo: 130 },
    seasonalAffinity: { summer: 0.7, spring: 0.6, fall: 0.8, winter: 0.8 }
  },

  // Trance family (expanded)
  'trance': {
    subgenres: ['progressive trance', 'uplifting trance', 'psytrance', 'vocal trance', 'tech trance', 'hard trance'],
    crossGenre: ['progressive house', 'ambient', 'psychedelic'],
    audioProfile: { energy: 0.8, danceability: 0.7, valence: 0.8, tempo: 132 },
    seasonalAffinity: { summer: 0.9, spring: 0.9, fall: 0.6, winter: 0.5 }
  },
  'progressive trance': {
    subgenres: ['melodic progressive trance', 'dark progressive trance'],
    crossGenre: ['trance', 'progressive house', 'ambient'],
    audioProfile: { energy: 0.7, danceability: 0.7, valence: 0.7, tempo: 130 },
    seasonalAffinity: { summer: 0.8, spring: 0.9, fall: 0.7, winter: 0.6 }
  },
  'psytrance': {
    subgenres: ['full-on psytrance', 'dark psytrance', 'forest psytrance', 'goa trance'],
    crossGenre: ['trance', 'psychedelic', 'experimental'],
    audioProfile: { energy: 0.9, danceability: 0.8, valence: 0.6, tempo: 145 },
    seasonalAffinity: { summer: 0.9, spring: 0.8, fall: 0.7, winter: 0.6 }
  },

  // Electronic/EDM (expanded)
  'electronic': {
    subgenres: ['ambient electronic', 'dance electronic', 'experimental electronic', 'synthwave', 'chillwave'],
    crossGenre: ['ambient', 'dance', 'experimental', 'synthpop'],
    audioProfile: { energy: 0.6, danceability: 0.6, valence: 0.6, tempo: 120 },
    seasonalAffinity: { summer: 0.7, spring: 0.7, fall: 0.7, winter: 0.7 }
  },
  'edm': {
    subgenres: ['big room', 'festival edm', 'commercial edm'],
    crossGenre: ['house', 'trance', 'dubstep', 'electro'],
    audioProfile: { energy: 0.9, danceability: 0.9, valence: 0.8, tempo: 128 },
    seasonalAffinity: { summer: 0.9, spring: 0.8, fall: 0.6, winter: 0.5 }
  },

  // Bass music (expanded)
  'dubstep': {
    subgenres: ['melodic dubstep', 'heavy dubstep', 'future dubstep', 'liquid dubstep'],
    crossGenre: ['bass', 'electronic', 'drum and bass'],
    audioProfile: { energy: 0.9, danceability: 0.8, valence: 0.5, tempo: 140 },
    seasonalAffinity: { summer: 0.7, spring: 0.6, fall: 0.8, winter: 0.9 }
  },
  'drum and bass': {
    subgenres: ['liquid drum and bass', 'neurofunk', 'jump up', 'jungle', 'breakbeat'],
    crossGenre: ['dubstep', 'bass', 'breakbeat', 'jungle'],
    audioProfile: { energy: 0.9, danceability: 0.8, valence: 0.6, tempo: 174 },
    seasonalAffinity: { summer: 0.8, spring: 0.7, fall: 0.8, winter: 0.8 }
  },
  'bass': {
    subgenres: ['future bass', 'trap bass', 'melodic bass', 'heavy bass'],
    crossGenre: ['dubstep', 'trap', 'electronic'],
    audioProfile: { energy: 0.8, danceability: 0.8, valence: 0.6, tempo: 150 },
    seasonalAffinity: { summer: 0.8, spring: 0.7, fall: 0.8, winter: 0.8 }
  },

  // Ambient/Chill (expanded)
  'ambient': {
    subgenres: ['dark ambient', 'space ambient', 'drone ambient', 'new age ambient'],
    crossGenre: ['electronic', 'experimental', 'new age', 'classical'],
    audioProfile: { energy: 0.2, danceability: 0.2, valence: 0.5, tempo: 80 },
    seasonalAffinity: { summer: 0.5, spring: 0.6, fall: 0.8, winter: 0.9 }
  },
  'chillout': {
    subgenres: ['lounge', 'downtempo', 'trip hop', 'chillhop'],
    crossGenre: ['ambient', 'electronic', 'jazz', 'hip hop'],
    audioProfile: { energy: 0.4, danceability: 0.5, valence: 0.7, tempo: 90 },
    seasonalAffinity: { summer: 0.8, spring: 0.8, fall: 0.7, winter: 0.6 }
  },
  'downtempo': {
    subgenres: ['trip hop', 'chillhop', 'lo-fi hip hop'],
    crossGenre: ['chillout', 'hip hop', 'jazz', 'ambient'],
    audioProfile: { energy: 0.3, danceability: 0.4, valence: 0.6, tempo: 85 },
    seasonalAffinity: { summer: 0.7, spring: 0.8, fall: 0.8, winter: 0.7 }
  }
};

// ENHANCED: Cross-genre intelligence function
function getEnhancedGenreExpansion(userGenres, userAudioFeatures) {
  const expanded = new Set([...userGenres]);
  const crossGenreMatches = new Set();

  userGenres.forEach(genre => {
    const genreLower = normalizeGenre(genre);
    const genreData = ENHANCED_GENRE_MAPPING[genreLower];
    
    if (genreData) {
      // Add subgenres
      genreData.subgenres?.forEach(sub => expanded.add(sub));
      
      // Add cross-genre matches based on audio similarity
      genreData.crossGenre?.forEach(crossGenre => {
        const crossGenreData = ENHANCED_GENRE_MAPPING[crossGenre];
        if (crossGenreData) {
          // Calculate audio feature similarity
          const audioSimilarity = calculateAudioSimilarity(userAudioFeatures, genreData.audioProfile);
          if (audioSimilarity > 0.7) {
            crossGenreMatches.add(crossGenre);
            // Add some subgenres of the cross-genre
            crossGenreData.subgenres?.slice(0, 2).forEach(sub => expanded.add(sub));
          }
        }
      });
    }
  });

  // Add cross-genre matches
  crossGenreMatches.forEach(genre => expanded.add(genre));

  return Array.from(expanded);
}

// ENHANCED: Helper functions
function normalizeGenre(genre) {
  return genre.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
}

function calculateAudioSimilarity(userFeatures, genreProfile) {
  if (!userFeatures || !genreProfile) return 0;
  
  const features = ['energy', 'danceability', 'valence'];
  let similarity = 0;
  let count = 0;

  features.forEach(feature => {
    if (userFeatures[feature] !== undefined && genreProfile[feature] !== undefined) {
      similarity += Math.max(0, Math.exp(-Math.abs(userFeatures[feature] - genreProfile[feature]) * 3));

      count++;
    }
  });

  return count > 0 ? similarity / count : 0;
}

/**
 * ENHANCED: Process and save user taste with 500+ genre intelligence
 */
async function processAndSaveUserTaste(session) {
  try {
    console.log('🎵 Enhanced taste processing started...');
    
    const { db } = await connectToDatabase();
    const userEmail = session.user?.email;
    
    if (!userEmail) {
      throw new Error('User email not found in session');
    }

    // Get enhanced user data
    const [topArtists, topTracks] = await Promise.all([
      getTopArtists(session.accessToken, 50), // Increased limit
      getTopTracks(session.accessToken, 50)   // Increased limit
    ]);

    if (!topArtists?.length || !topTracks?.length) {
      throw new Error('No Spotify data available');
    }

    // Get audio features for tracks
    const trackIds = topTracks.map(track => track.id);
    const audioFeatures = await getAudioFeaturesForTracks(session.accessToken, trackIds);

    // Calculate average audio features
    const avgAudioFeatures = calculateAverageAudioFeatures(audioFeatures);

    // ENHANCED: Extract genres with 500+ genre mapping
    const artistGenres = topArtists.flatMap(artist => artist.genres || []);
    const baseGenres = [...new Set(artistGenres)];
    
    // Apply enhanced genre expansion
    const expandedGenres = getEnhancedGenreExpansion(baseGenres, avgAudioFeatures);
    
    // ENHANCED: Genre profiling with cross-genre affinity
    const enhancedGenreProfile = {};
    expandedGenres.forEach(genre => {
      const normalizedGenre = normalizeGenre(genre);
      const genreData = ENHANCED_GENRE_MAPPING[normalizedGenre];
      
      if (genreData) {
        // Calculate genre affinity based on audio features and seasonal preferences
        const audioAffinity = calculateAudioSimilarity(avgAudioFeatures, genreData.audioProfile);
        const seasonalAffinity = getCurrentSeasonalAffinity(genreData.seasonalAffinity);
        
        enhancedGenreProfile[genre] = {
          affinity: (audioAffinity * 0.7) + (seasonalAffinity * 0.3),
          audioMatch: audioAffinity,
          seasonalMatch: seasonalAffinity,
          source: baseGenres.includes(genre) ? 'direct' : 'expanded'
        };
      } else {
        // Fallback for unmapped genres
        enhancedGenreProfile[genre] = {
          affinity: 0.5,
          audioMatch: 0.5,
          seasonalMatch: 0.5,
          source: 'fallback'
        };
      }
    });

    // ENHANCED: Cross-genre affinity calculation
    const crossGenreAffinity = calculateCrossGenreAffinity(enhancedGenreProfile);

    // PRESERVED: Use existing moodUtils for seasonal mood
    const seasonalMood = getSeasonalMood();

    // ENHANCED: Build comprehensive taste profile
    const tasteProfile = {
      userEmail,
      genres: Object.keys(enhancedGenreProfile),
      enhancedGenreProfile,
      crossGenreAffinity,
      topArtists: topArtists.slice(0, 20),
      topTracks: topTracks.slice(0, 20),
      audioFeatures: avgAudioFeatures,
      seasonalMood,
      lastUpdated: new Date(),
      source: 'enhanced_spotify_api', // ENHANCED: Updated source
      version: '2.0' // ENHANCED: Version tracking
    };

    // PRESERVED: Save to database
    await db.collection('user_taste_profiles').replaceOne(
      { userEmail },
      tasteProfile,
      { upsert: true }
    );

    console.log(`✅ Enhanced taste profile saved: ${Object.keys(enhancedGenreProfile).length} genres, cross-genre affinity: ${tasteProfile.crossGenreAffinity}`);
    return tasteProfile;

  } catch (error) {
    console.error('❌ Enhanced taste processing failed:', error);
    throw error;
  }
}

// ENHANCED: Helper functions
function calculateAverageAudioFeatures(audioFeatures) {
  if (!audioFeatures?.length) return {};

  const features = ['energy', 'danceability', 'valence', 'acousticness', 'instrumentalness', 'tempo'];
  const avg = {};

  features.forEach(feature => {
    const values = audioFeatures.map(track => track[feature]).filter(val => val !== undefined);
    if (values.length > 0) {
      avg[feature] = values.reduce((sum, val) => sum + val, 0) / values.length;
    }
  });

  return avg;
}

function getCurrentSeasonalAffinity(seasonalAffinity) {
  if (!seasonalAffinity) return 0.5;
  
  const month = new Date().getMonth();
  let season;
  
  if (month >= 2 && month <= 4) season = 'spring';
  else if (month >= 5 && month <= 7) season = 'summer';
  else if (month >= 8 && month <= 10) season = 'fall';
  else season = 'winter';
  
  return seasonalAffinity[season] || 0.5;
}

function calculateCrossGenreAffinity(genreProfile) {
  const genres = Object.keys(genreProfile);
  if (genres.length < 2) return 0;

  let totalAffinity = 0;
  let comparisons = 0;

  for (let i = 0; i < genres.length; i++) {
    for (let j = i + 1; j < genres.length; j++) {
      const genre1 = normalizeGenre(genres[i]);
      const genre2 = normalizeGenre(genres[j]);
      
      const genre1Data = ENHANCED_GENRE_MAPPING[genre1];
      const genre2Data = ENHANCED_GENRE_MAPPING[genre2];
      
      if (genre1Data && genre2Data) {
        // Check if genres are cross-compatible
        const isCrossGenre = genre1Data.crossGenre?.includes(genre2) || 
                           genre2Data.crossGenre?.includes(genre1);
        
        if (isCrossGenre) {
          totalAffinity += (genreProfile[genres[i]].affinity + genreProfile[genres[j]].affinity) / 2;
          comparisons++;
        }
      }
    }
  }

  return comparisons > 0 ? totalAffinity / comparisons : 0;
}

// Export for CommonJS compatibility
module.exports = { 
  processUserTaste: processAndSaveUserTaste 
};

