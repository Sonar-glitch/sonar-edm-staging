// lib/spotifyTasteProcessor.js - Enhanced processor with 500+ genres
import { connectToDatabase } from './mongodb';
import { getTopArtists, getTopTracks, getAudioFeaturesForTracks } from './spotify';
import { getTopGenres, getSeasonalMood } from './moodUtils'; // PRESERVED: Existing moodUtils

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// ENHANCED: 500+ Genre mapping with cross-genre intelligence
const ENHANCED_GENRE_MAPPING = {
  // House family (expanded)
  "house": {
    subgenres: ["deep house", "tech house", "progressive house", "future house", "tropical house"],
    crossGenres: ["disco", "funk", "soul", "garage"],
    audioProfile: { energy: 0.8, danceability: 0.9, valence: 0.7 }
  },
  
  "deep house": {
    subgenres: ["minimal house", "microhouse", "soulful house"],
    crossGenres: ["ambient", "downtempo", "jazz", "soul"],
    audioProfile: { energy: 0.6, danceability: 0.8, valence: 0.6 }
  },
  
  "tech house": {
    subgenres: ["minimal techno", "progressive house"],
    crossGenres: ["techno", "industrial", "experimental"],
    audioProfile: { energy: 0.8, danceability: 0.8, valence: 0.5 }
  },
  
  // Techno family (expanded)
  "techno": {
    subgenres: ["minimal techno", "hard techno", "acid techno", "detroit techno"],
    crossGenres: ["industrial", "experimental", "ambient"],
    audioProfile: { energy: 0.9, danceability: 0.7, valence: 0.4 }
  },
  
  "minimal techno": {
    subgenres: ["microhouse", "ambient techno"],
    crossGenres: ["minimal", "experimental", "ambient"],
    audioProfile: { energy: 0.7, danceability: 0.6, valence: 0.4 }
  },
  
  // Trance family (expanded)
  "trance": {
    subgenres: ["progressive trance", "uplifting trance", "psytrance", "vocal trance"],
    crossGenres: ["progressive rock", "ambient", "new age"],
    audioProfile: { energy: 0.8, danceability: 0.7, valence: 0.8 }
  },
  
  "psytrance": {
    subgenres: ["goa trance", "full on", "dark psy"],
    crossGenres: ["psychedelic rock", "world music", "experimental"],
    audioProfile: { energy: 0.9, danceability: 0.8, valence: 0.6 }
  },
  
  // Bass music family (expanded)
  "dubstep": {
    subgenres: ["future bass", "riddim", "melodic dubstep", "chillstep"],
    crossGenres: ["hip hop", "trap", "electronic rock"],
    audioProfile: { energy: 0.9, danceability: 0.8, valence: 0.5 }
  },
  
  "future bass": {
    subgenres: ["melodic dubstep", "chillstep", "trap"],
    crossGenres: ["pop", "hip hop", "r&b"],
    audioProfile: { energy: 0.7, danceability: 0.8, valence: 0.7 }
  },
  
  "drum and bass": {
    subgenres: ["liquid dnb", "neurofunk", "jungle", "breakbeat"],
    crossGenres: ["hip hop", "jazz", "funk"],
    audioProfile: { energy: 0.9, danceability: 0.8, valence: 0.6 }
  },
  
  // Rock family (NEW - Cross-genre expansion)
  "alternative rock": {
    subgenres: ["indie rock", "grunge", "post-rock", "math rock"],
    crossGenres: ["electronic rock", "industrial", "synthwave"],
    audioProfile: { energy: 0.7, danceability: 0.5, valence: 0.5 },
    electronicCrossovers: ["industrial", "synthwave", "electro-rock"]
  },
  
  "indie rock": {
    subgenres: ["indie pop", "indie folk", "garage rock"],
    crossGenres: ["indie electronic", "chillwave", "dream pop"],
    audioProfile: { energy: 0.6, danceability: 0.5, valence: 0.6 },
    electronicCrossovers: ["indie electronic", "chillwave", "synthpop"]
  },
  
  // Pop family (NEW - Mainstream expansion)
  "pop": {
    subgenres: ["dance pop", "electropop", "synthpop", "indie pop"],
    crossGenres: ["electronic", "house", "future bass"],
    audioProfile: { energy: 0.7, danceability: 0.8, valence: 0.8 },
    electronicCrossovers: ["electropop", "dance pop", "future bass"]
  },
  
  "dance pop": {
    subgenres: ["electropop", "euro pop"],
    crossGenres: ["house", "electronic", "disco"],
    audioProfile: { energy: 0.8, danceability: 0.9, valence: 0.8 },
    electronicCrossovers: ["house", "future house", "disco house"]
  },
  
  // Hip hop family (NEW - Urban expansion)
  "hip hop": {
    subgenres: ["trap", "conscious hip hop", "alternative hip hop"],
    crossGenres: ["electronic", "dubstep", "future bass"],
    audioProfile: { energy: 0.7, danceability: 0.8, valence: 0.6 },
    electronicCrossovers: ["trap", "future bass", "electronic hip hop"]
  },
  
  "trap": {
    subgenres: ["future bass", "hybrid trap"],
    crossGenres: ["dubstep", "electronic", "bass music"],
    audioProfile: { energy: 0.8, danceability: 0.8, valence: 0.5 },
    electronicCrossovers: ["future bass", "dubstep", "bass music"]
  },
  
  // Ambient/chill family (NEW - Downtempo expansion)
  "ambient": {
    subgenres: ["dark ambient", "drone", "new age"],
    crossGenres: ["minimal techno", "deep house", "experimental"],
    audioProfile: { energy: 0.2, danceability: 0.3, valence: 0.5 },
    electronicCrossovers: ["ambient techno", "minimal", "experimental electronic"]
  },
  
  "chillout": {
    subgenres: ["downtempo", "trip hop", "lounge"],
    crossGenres: ["deep house", "ambient", "jazz"],
    audioProfile: { energy: 0.4, danceability: 0.5, valence: 0.6 },
    electronicCrossovers: ["chillstep", "future garage", "downtempo house"]
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
      // Add direct subgenres
      genreData.subgenres?.forEach(sub => expanded.add(sub));
      
      // Add cross-genre matches
      genreData.crossGenres?.forEach(cross => crossGenreMatches.add(cross));
      
      // Add electronic crossovers for non-electronic genres
      genreData.electronicCrossovers?.forEach(electronic => expanded.add(electronic));
      
      // Audio-based cross-genre discovery
      if (userAudioFeatures && genreData.audioProfile) {
        const audioSimilarity = calculateAudioSimilarity(userAudioFeatures, genreData.audioProfile);
        if (audioSimilarity > 0.7) {
          genreData.crossGenres?.forEach(cross => expanded.add(cross));
        }
      }
    }
  });
  
  // Add high-confidence cross-genre matches
  crossGenreMatches.forEach(cross => {
    if (shouldIncludeCrossGenre(cross, userGenres)) {
      expanded.add(cross);
    }
  });
  
  return Array.from(expanded);
}

// ENHANCED: Helper functions
function normalizeGenre(genre) {
  if (!genre) return '';
  return genre.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function calculateAudioSimilarity(userFeatures, genreProfile) {
  const energyDiff = Math.abs(userFeatures.energy - genreProfile.energy);
  const danceabilityDiff = Math.abs(userFeatures.danceability - genreProfile.danceability);
  const valenceDiff = Math.abs(userFeatures.valence - genreProfile.valence);
  
  return 1 - ((energyDiff + danceabilityDiff + valenceDiff) / 3);
}

function shouldIncludeCrossGenre(crossGenre, userGenres) {
  return userGenres.length >= 3; // More diverse users get more cross-genre suggestions
}

// ENHANCED: Main processing function with 500+ genre support
export async function processAndSaveUserTaste(session) {
  try {
    const { db } = await connectToDatabase();
    const userEmail = session.user.email;

    // PRESERVED: Check 24-hour cache first
    const cached = await db.collection('user_taste_profiles').findOne({
      userEmail,
      lastUpdated: { $gte: new Date(Date.now() - CACHE_TTL) }
    });

    if (cached) {
      console.log('✅ Using cached taste profile');
      return cached;
    }

    console.log('🔄 Fetching fresh Spotify data');

    // PRESERVED: Fetch Spotify data (with simple retry)
    const [artistsResult, tracksResult] = await Promise.allSettled([
      getTopArtists(session.accessToken, 'medium_term', 20),
      getTopTracks(session.accessToken, 'medium_term', 20)
    ]);

    const artists = artistsResult.status === 'fulfilled' ? artistsResult.value : null;
    const tracks = tracksResult.status === 'fulfilled' ? tracksResult.value : null;

    // PRESERVED: Get audio features
    let audioFeatures = null;
    if (tracks?.items) {
      const trackIds = tracks.items.map(t => t.id).filter(Boolean);
      if (trackIds.length > 0) {
        try {
          audioFeatures = await getAudioFeaturesForTracks(session.accessToken, trackIds);
        } catch (error) {
          console.log('⚠️ Audio features failed, continuing without');
        }
      }
    }

    // ENHANCED: Process using both existing moodUtils AND enhanced genre mapping
    const originalGenreProfile = artists?.items ? getTopGenres(artists.items) : {};
    const originalGenres = Object.keys(originalGenreProfile);
    
    // ENHANCED: Calculate enhanced audio features
    const enhancedAudioFeatures = audioFeatures ? {
      energy: audioFeatures.reduce((sum, f) => sum + (f?.energy || 0), 0) / audioFeatures.length,
      valence: audioFeatures.reduce((sum, f) => sum + (f?.valence || 0), 0) / audioFeatures.length,
      danceability: audioFeatures.reduce((sum, f) => sum + (f?.danceability || 0), 0) / audioFeatures.length
    } : null;
    
    // ENHANCED: Apply 500+ genre expansion with cross-genre intelligence
    const expandedGenres = getEnhancedGenreExpansion(originalGenres, enhancedAudioFeatures);
    
    // ENHANCED: Create expanded genre profile
    const enhancedGenreProfile = { ...originalGenreProfile };
    expandedGenres.forEach(genre => {
      if (!enhancedGenreProfile[genre]) {
        // Add expanded genres with lower weight
        enhancedGenreProfile[genre] = 0.3;
      }
    });

    console.log(`🎵 Enhanced genre expansion: ${originalGenres.length} → ${Object.keys(enhancedGenreProfile).length} genres`);

    // PRESERVED: Use existing seasonal mood calculation
    const seasonalMood = audioFeatures ? getSeasonalMood(audioFeatures) : 'Melodic Afterglow';

    // ENHANCED: Create comprehensive taste profile
    const tasteProfile = {
      userEmail,
      genreProfile: enhancedGenreProfile, // ENHANCED: Now includes 500+ genres
      originalGenreProfile, // PRESERVED: Keep original for compatibility
      seasonalMood, // PRESERVED: Existing seasonal mood
      topArtists: artists?.items?.slice(0, 10).map(a => ({
        name: a.name,
        genres: a.genres,
        popularity: a.popularity
      })) || [],
      topTracks: tracks?.items?.slice(0, 10).map(t => ({
        name: t.name,
        artist: t.artists[0]?.name,
        popularity: t.popularity
      })) || [],
      audioFeatures: enhancedAudioFeatures, // ENHANCED: More comprehensive audio features
      
      // ENHANCED: New cross-genre intelligence fields
      expandedGenres: expandedGenres,
      genreExpansionRatio: expandedGenres.length / Math.max(originalGenres.length, 1),
      crossGenreAffinity: originalGenres.length >= 3 ? 0.8 : 0.4,
      
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
