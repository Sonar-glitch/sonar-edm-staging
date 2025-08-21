import { getServerSession } from 'next-auth/next';
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "@/lib/mongodb";

// PHASE 2: Enhanced taste profile API that connects to our three-dimensional implementation
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        dataSource: 'error',
        errorCode: 'NO_SESSION'
      });
    }

    const userId = session.user.id || session.user.email;
    console.log(`🧠 Fetching enhanced taste profile for user: ${userId}`);

    // PHASE 2: Try to get enhanced profile with three-dimensional data
    try {
      const enhancedProfile = await fetchEnhancedUserTasteProfile(session.accessToken);
      
      if (enhancedProfile && enhancedProfile.phase2Enabled) {
        console.log('✅ Enhanced Phase 2 profile available');
        
        // Format for frontend consumption
        const formattedProfile = {
          userId: userId,
          genrePreferences: enhancedProfile.genrePreferences || [],
          soundCharacteristics: {
            danceability: { 
              value: enhancedProfile.soundCharacteristics?.danceability || 0.7, 
              source: enhancedProfile.soundCharacteristics?.source || 'phase2' 
            },
            energy: { 
              value: enhancedProfile.soundCharacteristics?.energy || 0.65, 
              source: enhancedProfile.soundCharacteristics?.source || 'phase2' 
            },
            valence: { 
              value: enhancedProfile.soundCharacteristics?.valence || 0.4, 
              source: enhancedProfile.soundCharacteristics?.source || 'phase2' 
            },
            acousticness: { 
              value: enhancedProfile.soundCharacteristics?.acousticness || 0.15, 
              source: enhancedProfile.soundCharacteristics?.source || 'phase2' 
            },
            trackCount: enhancedProfile.soundCharacteristics?.trackCount || 0,
            confidence: enhancedProfile.soundCharacteristics?.confidenceScore || 0
          },
          
          // PHASE 2: Three-dimensional data
          artistAffinities: enhancedProfile.artistAffinities || {},
          temporalPattern: enhancedProfile.temporalPattern || getDefaultTemporalProfile(),
          
          // Enhanced metadata
          phase2Enabled: true,
          enhancedAt: enhancedProfile.enhancedAt,
          dataSource: 'live',
          lastUpdated: new Date(),
          
          // Legacy compatibility
          tasteEvolution: generateTasteEvolution(enhancedProfile.temporalPattern),
          recentActivity: generateRecentActivity(enhancedProfile.topTracks),
          playlists: enhancedProfile.playlists || []
        };

        return res.status(200).json(formattedProfile);
      }
    } catch (enhancedError) {
      console.error('❌ Enhanced profile fetch failed:', enhancedError.message);
    }

    // FALLBACK 1: Try basic Spotify integration
    try {
      console.log('🔄 Falling back to basic Spotify integration');
      
      const basicProfile = await fetchBasicSpotifyProfile(session.accessToken);
      
      if (basicProfile) {
        const fallbackProfile = {
          userId: userId,
          genrePreferences: basicProfile.genrePreferences || [],
          soundCharacteristics: {
            danceability: { value: basicProfile.audioFeatures?.danceability || 0.7, source: 'spotify_basic' },
            energy: { value: basicProfile.audioFeatures?.energy || 0.65, source: 'spotify_basic' },
            valence: { value: basicProfile.audioFeatures?.valence || 0.4, source: 'spotify_basic' },
            acousticness: { value: basicProfile.audioFeatures?.acousticness || 0.15, source: 'spotify_basic' },
            trackCount: basicProfile.trackCount || 0,
            confidence: 0.5
          },
          artistAffinities: {},
          temporalPattern: getDefaultTemporalProfile(),
          phase2Enabled: false,
          dataSource: 'fallback',
          errorCode: 'ENHANCED_PROFILE_UNAVAILABLE',
          lastUpdated: new Date(),
          tasteEvolution: [],
          recentActivity: { added: [], removed: [], liked: [] },
          playlists: []
        };

        return res.status(200).json(fallbackProfile);
      }
    } catch (basicError) {
      console.error('❌ Basic Spotify profile fetch failed:', basicError.message);
    }

    // FALLBACK 2: Try database stored profile
    try {
      console.log('🔄 Falling back to database stored profile');
      
      const { db } = await connectToDatabase();
      const storedProfile = await db.collection('user_taste_profiles').findOne({ userId });

      if (storedProfile) {
        console.log(`✅ Found stored taste profile for user: ${userId}`);
        
        const databaseProfile = {
          ...storedProfile,
          dataSource: 'database',
          errorCode: 'LIVE_APIS_UNAVAILABLE',
          lastUpdated: new Date(storedProfile.lastUpdated)
        };

        return res.status(200).json(databaseProfile);
      }
    } catch (dbError) {
      console.error('❌ Database profile fetch failed:', dbError.message);
    }

    // FINAL FALLBACK: Default profile with error indication
    console.log('🚨 All profile sources failed, returning default profile');
    
    const defaultProfile = getFallbackTasteProfile(userId);
    defaultProfile.dataSource = 'error';
    defaultProfile.errorCode = 'ALL_SOURCES_FAILED';
    
    return res.status(200).json(defaultProfile);

  } catch (error) {
    console.error('🚨 Critical error in enhanced taste profile API:', error);
    
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      dataSource: 'error',
      errorCode: 'CRITICAL_FAILURE',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * PHASE 2: Fetch enhanced user taste profile with three-dimensional data
 */
async function fetchEnhancedUserTasteProfile(accessToken) {
  if (!accessToken) {
    throw new Error('No access token available');
  }

  try {
    // This would call our Phase 2 enhanced profile function
    // For now, we'll simulate the call structure
    console.log('🔍 Attempting to fetch enhanced user taste profile...');
    
    // In a real implementation, this would call the fetchEnhancedUserTasteProfile 
    // function from our Phase 2 API implementation
    const response = await fetch('/api/spotify/enhanced-profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const enhancedProfile = await response.json();
      return enhancedProfile;
    } else {
      throw new Error(`Enhanced profile API returned ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Enhanced profile fetch error:', error);
    throw error;
  }
}

/**
 * FALLBACK: Fetch basic Spotify profile
 */
async function fetchBasicSpotifyProfile(accessToken) {
  if (!accessToken) {
    throw new Error('No access token available');
  }

  try {
    console.log('🔍 Fetching basic Spotify profile...');
    
    // Fetch user's top tracks and artists
    const [tracksResponse, artistsResponse] = await Promise.all([
      fetch('https://api.spotify.com/v1/me/top/tracks?limit=20&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      }),
      fetch('https://api.spotify.com/v1/me/top/artists?limit=20&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      })
    ]);

    if (!tracksResponse.ok || !artistsResponse.ok) {
      throw new Error('Spotify API calls failed');
    }

    const [tracksData, artistsData] = await Promise.all([
      tracksResponse.json(),
      artistsResponse.json()
    ]);

    // Extract genres from artists
    const genreMap = {};
    artistsData.items.forEach(artist => {
      artist.genres.forEach(genre => {
        genreMap[genre] = (genreMap[genre] || 0) + 1;
      });
    });

    const genrePreferences = Object.entries(genreMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({
        name,
        weight: count / artistsData.items.length,
        confidence: 0.7,
        source: 'spotify'
      }));

    // Estimate audio features from genres
    const audioFeatures = estimateAudioFeaturesFromGenres(genrePreferences);

    return {
      genrePreferences,
      audioFeatures,
      trackCount: tracksData.items.length,
      topArtists: artistsData.items.slice(0, 10).map(a => a.name),
      topTracks: tracksData.items.slice(0, 10)
    };

  } catch (error) {
    console.error('❌ Basic Spotify profile error:', error);
    throw error;
  }
}

function estimateAudioFeaturesFromGenres(genrePreferences) {
  const genreCharacteristics = {
    'melodic techno': { energy: 0.8, danceability: 0.9, valence: 0.3, acousticness: 0.05 },
    'progressive house': { energy: 0.7, danceability: 0.8, valence: 0.6, acousticness: 0.1 },
    'deep house': { energy: 0.6, danceability: 0.8, valence: 0.4, acousticness: 0.15 },
    'techno': { energy: 0.9, danceability: 0.9, valence: 0.2, acousticness: 0.05 },
    'house': { energy: 0.7, danceability: 0.9, valence: 0.7, acousticness: 0.1 },
    'electronic': { energy: 0.7, danceability: 0.7, valence: 0.5, acousticness: 0.1 }
  };

  let weightedFeatures = { energy: 0, danceability: 0, valence: 0, acousticness: 0 };
  let totalWeight = 0;

  genrePreferences.forEach(genre => {
    const genreName = genre.name.toLowerCase();
    const weight = genre.weight || 0.5;
    
    for (const [knownGenre, characteristics] of Object.entries(genreCharacteristics)) {
      if (genreName.includes(knownGenre)) {
        Object.keys(characteristics).forEach(feature => {
          weightedFeatures[feature] += characteristics[feature] * weight;
        });
        totalWeight += weight;
        break;
      }
    }
  });

  if (totalWeight > 0) {
    Object.keys(weightedFeatures).forEach(feature => {
      weightedFeatures[feature] /= totalWeight;
    });
  } else {
    weightedFeatures = { energy: 0.6, danceability: 0.7, valence: 0.5, acousticness: 0.3 };
  }

  return weightedFeatures;
}

function getDefaultTemporalProfile() {
  return {
    emergingInterests: [],
    stableInterests: ['electronic'],
    discoveryRate: 0.1,
    tasteStability: 0.5,
    recentGenreShift: 'stable'
  };
}

function generateTasteEvolution(temporalPattern) {
  if (!temporalPattern) return [];
  
  const now = new Date();
  const evolution = [];
  
  for (let i = 2; i >= 0; i--) {
    const date = new Date(now.getTime() - i * 30 * 24 * 60 * 60 * 1000);
    const genres = {};
    
    if (temporalPattern.stableInterests) {
      temporalPattern.stableInterests.forEach((genre, index) => {
        genres[genre] = 0.8 - (index * 0.1);
      });
    }
    
    evolution.push({
      date: date.toISOString().split('T')[0],
      genres
    });
  }
  
  return evolution;
}

function generateRecentActivity(topTracks) {
  if (!topTracks || topTracks.length === 0) {
    return { added: [], removed: [], liked: [] };
  }
  
  return {
    added: topTracks.slice(0, 3).map(track => ({
      trackId: track.id,
      name: track.name,
      artists: track.artists.map(a => a.name),
      date: new Date()
    })),
    removed: [],
    liked: topTracks.slice(3, 6).map(track => ({
      trackId: track.id,
      name: track.name,
      artists: track.artists.map(a => a.name),
      date: new Date()
    }))
  };
}

function getFallbackTasteProfile(userId) {
  return {
    userId,
    genrePreferences: [
      { name: 'electronic', weight: 0.6, confidence: 0.3, source: 'default' },
      { name: 'house', weight: 0.5, confidence: 0.3, source: 'default' },
      { name: 'techno', weight: 0.4, confidence: 0.3, source: 'default' },
    ],
    soundCharacteristics: {
      danceability: { value: 0.7, source: 'default' },
      energy: { value: 0.6, source: 'default' },
      valence: { value: 0.5, source: 'default' },
      acousticness: { value: 0.3, source: 'default' },
      trackCount: 0,
      confidence: 0
    },
    artistAffinities: {},
    temporalPattern: getDefaultTemporalProfile(),
    phase2Enabled: false,
    tasteEvolution: [],
    recentActivity: { added: [], removed: [], liked: [] },
    playlists: [],
    lastUpdated: new Date(),
  };
}

