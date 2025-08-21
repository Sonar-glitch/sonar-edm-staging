import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "@/lib/mongodb";

// Essentia service configuration
const ESSENTIA_SERVICE_URL = process.env.ESSENTIA_SERVICE_URL || 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';

// Fallback taste profile for new users or when data is unavailable
const getFallbackTasteProfile = (userId) => ({
  userId,
  genrePreferences: [
    { name: 'melodic techno', weight: 0.8, confidence: 0.9, source: 'spotify' },
    { name: 'progressive house', weight: 0.7, confidence: 0.8, source: 'spotify' },
    { name: 'deep house', weight: 0.6, confidence: 0.75, source: 'spotify' },
  ],
  soundCharacteristics: {
    danceability: { value: 0.75, source: 'spotify' },
    energy: { value: 0.65, source: 'spotify' },
    valence: { value: 0.4, source: 'spotify' },
    instrumentalness: { value: 0.85, source: 'spotify' },
  },
  // CRITICAL: Add data source metadata to properly label as demo data
  dataSources: {
    genreProfile: {
      isRealData: false,
      tracksAnalyzed: 0,
      confidence: 0,
      source: 'hardcoded_demo',
      timePeriod: 'demo_data',
      description: 'fallback genres for demo purposes',
      error: 'NO_SPOTIFY_DATA',
      lastFetch: null
    },
    soundCharacteristics: {
      isRealData: false,
      tracksAnalyzed: 0,
      confidence: 0,
      source: 'hardcoded_demo',
      timePeriod: 'demo_data',
      description: 'fallback sound characteristics for demo purposes',
      error: 'NO_SPOTIFY_DATA',
      lastFetch: null
    },
    seasonalProfile: {
      isRealData: false,
      tracksAnalyzed: 0,
      confidence: 0,
      source: 'hardcoded_demo',
      timePeriod: 'demo_data',
      description: 'fallback seasonal data for demo purposes',
      error: 'NO_SPOTIFY_DATA',
      lastFetch: null
    }
  },
  tasteEvolution: [
    { date: '2025-04-01', genres: { 'melodic techno': 0.7, 'tech house': 0.6 } },
    { date: '2025-05-01', genres: { 'melodic techno': 0.75, 'progressive house': 0.65 } },
    { date: '2025-06-01', genres: { 'melodic techno': 0.8, 'progressive house': 0.7 } },
  ],
  recentActivity: {
    added: [
      { trackId: 'sample1', name: 'Gravity', artists: ['Boris Brejcha'], date: new Date('2025-07-10T10:00:00Z') },
    ],
    removed: [],
    liked: [
      { trackId: 'sample2', name: 'The Future', artists: ['CamelPhat'], date: new Date('2025-07-09T15:30:00Z') },
    ],
  },
  playlists: [
    { id: 'pl1', name: 'Late Night Drives', characteristics: 'Deep, melodic, instrumental', trackCount: 50, lastUpdated: new Date('2025-07-08T20:00:00Z') },
    { id: 'pl2', name: 'Workout Energy', characteristics: 'High-energy, fast-paced, electronic', trackCount: 120, lastUpdated: new Date('2025-07-05T11:00:00Z') },
  ],
  lastUpdated: new Date(),
});

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

  const { db } = await connectToDatabase();
  // Unified user identifier (fallback to email). Some earlier profiles stored only email; others only id.
  const primaryUserId = session.user.id || session.user.email;
  const normalizedEmail = (session.user.email || '').toLowerCase();
  const userId = primaryUserId; // keep existing variable name for downstream logic

    console.log(`🧠 Fetching Essentia-based taste profile for user: ${userId}`);

    // PHASE 1: Try to get existing Essentia user profile from database
    const existingProfile = await db.collection('user_sound_profiles').findOne({
      $or: [
        { userId },
        { userId: session.user.id || null },
        { userId: normalizedEmail },
        { email: normalizedEmail }
      ]
    });
    
    const isProfileFresh = existingProfile && 
      existingProfile.profileBuiltAt && 
      (Date.now() - new Date(existingProfile.profileBuiltAt).getTime()) < (6 * 60 * 60 * 1000); // 6 hours

    if (existingProfile && isProfileFresh) {
      console.log(`✅ Using cached Essentia profile for user: ${userId}`);
      
      // Format for frontend consumption
      const formattedProfile = {
        userId,
        genrePreferences: existingProfile.genrePreferences || [],
        soundCharacteristics: {
          danceability: { 
            value: Math.round((existingProfile.soundPreferences?.danceability || 0.7) * 100), 
            source: 'essentia_ml' 
          },
          energy: { 
            value: Math.round((existingProfile.soundPreferences?.energy || 0.65) * 100), 
            source: 'essentia_ml' 
          },
          valence: { 
            value: Math.round((existingProfile.soundPreferences?.valence || 0.4) * 100), 
            source: 'essentia_ml' 
          },
          acousticness: { 
            value: Math.round((existingProfile.soundPreferences?.acousticness || 0.15) * 100), 
            source: 'essentia_ml' 
          },
          trackCount: existingProfile.trackCount || 0,
          confidence: 0.9
        },
        dataSources: {
          genreProfile: {
            isRealData: true,
            tracksAnalyzed: existingProfile.trackCount || 0,
            confidence: 0.9,
            source: 'essentia_ml_pipeline',
            timePeriod: 'last_6_months_top_tracks',
            description: 'ML-based audio analysis using Essentia from top tracks',
            lastFetch: existingProfile.profileBuiltAt,
            error: null
          },
          soundCharacteristics: {
            isRealData: true,
            tracksAnalyzed: existingProfile.trackCount || 0,
            confidence: 0.9,
            source: 'essentia_ml_pipeline',
            timePeriod: 'last_6_months_top_tracks',
            description: 'Essentia ML analysis of user top tracks from 6 months',
            lastFetch: existingProfile.profileBuiltAt,
            error: null
          },
          seasonalProfile: {
            isRealData: false,
            tracksAnalyzed: 0,
            confidence: 0.5,
            source: 'estimated',
            timePeriod: 'demo_data',
            description: 'seasonal preferences estimated from sound characteristics',
            lastFetch: existingProfile.profileBuiltAt,
            error: null
          }
        },
        tasteEvolution: [],
        recentActivity: { added: [], removed: [], liked: [] },
        playlists: [],
        lastUpdated: existingProfile.profileBuiltAt || new Date(),
      };

      return res.status(200).json(formattedProfile);
    }

    // PHASE 2: Build new Essentia profile if needed
    if (session.accessToken) {
      try {
        console.log(`🎵 Building new Essentia user profile for: ${userId}`);
        
        // Get user's top tracks (last 6 months for sound characteristics)
        const topTracksResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=medium_term', {
          headers: {
            'Authorization': `Bearer ${session.accessToken}`
          }
        });

        if (topTracksResponse.ok) {
          const topTracksData = await topTracksResponse.json();
          
          if (topTracksData.items && topTracksData.items.length > 0) {
            console.log(`📊 Found ${topTracksData.items.length} top tracks for Essentia analysis`);
            
            // Call Essentia service to build user profile matrix
            const fetch = (await import('node-fetch')).default;
            const essentiaResponse = await fetch(`${ESSENTIA_SERVICE_URL}/api/user-profile`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                userId: userId,
                recentTracks: topTracksData.items,
                maxTracks: 20 // Analyze top 20 tracks for sound characteristics
              }),
              timeout: 120000 // 2 minute timeout
            });

            if (essentiaResponse.ok) {
              const essentiaProfile = await essentiaResponse.json();
              
              if (essentiaProfile.success) {
                console.log(`✅ Essentia user profile built: ${essentiaProfile.trackCount} tracks analyzed`);
                
                // Derive topGenres & genrePreferences from Spotify top tracks (basic frequency count)
                let topGenresArray = [];
                let genrePreferences = [];
                try {
                  if (topTracksData.items?.length) {
                    const genreCounts = {};
                    topTracksData.items.forEach(t => {
                      t.artists?.forEach(a => {
                        if (Array.isArray(a.genres)) {
                          a.genres.forEach(g => {
                            if (!g) return;
                            genreCounts[g] = (genreCounts[g] || 0) + 1;
                          });
                        }
                      });
                    });
                    topGenresArray = Object.entries(genreCounts)
                      .sort((a,b)=>b[1]-a[1])
                      .slice(0,25)
                      .map(([genre,count]) => ({ genre, count }));
                    const max = topGenresArray[0]?.count || 1;
                    genrePreferences = topGenresArray.slice(0,10).map(g => ({
                      name: g.genre,
                      weight: +(g.count / max).toFixed(3),
                      confidence: 0.85,
                      source: 'spotify_top_tracks_inferred'
                    }));
                  }
                } catch (genreDeriveErr) {
                  console.warn('⚠️ Failed to derive top genres from tracks:', genreDeriveErr.message);
                }

                // Derive seasonal stub & sound characteristic summary for persistence (can be enriched later)
                const seasonalStub = {
                  profile: {
                    spring: ['Progressive House','Melodic Techno'],
                    summer: ['Tech House','Festival Progressive'],
                    fall: ['Organic House','Downtempo'],
                    winter: ['Deep House','Ambient Techno']
                  },
                  metadata: {
                    tracksAnalyzed: essentiaProfile.trackCount || 0,
                    confidence: 0.5,
                    isRealData: false,
                    source: 'estimated_from_audio_features',
                    seasonsWithData: [],
                    lastFetch: new Date()
                  }
                };

                // Basic weekly deltas snapshot (placeholder until real diff computation)
                const deltas = {
                  topGenres: genrePreferences.slice(0,5).map(g => ({ name: g.name, delta: 0, direction: 'flat' })),
                  soundCharacteristics: ['danceability','energy','valence','acousticness']
                    .map(k => ({ key: k, delta: 0, direction: 'flat' }))
                };

                // Store in database
                await db.collection('user_sound_profiles').replaceOne(
                  { $or: [ { userId }, { userId: normalizedEmail } ] },
                  {
                    ...essentiaProfile,
                    userId,
                    email: normalizedEmail,
                    profileBuiltAt: new Date(),
                    sourceType: 'essentia_ml_6_month_top_tracks',
                    tracksAnalyzed: essentiaProfile.trackCount || 0,
                    trackCount: essentiaProfile.trackCount || 0,
                    topGenres: topGenresArray,
                    genrePreferences: genrePreferences,
                    seasonalProfile: seasonalStub,
                    soundCharacteristicsSummary: {
                      danceability: essentiaProfile.soundPreferences?.danceability || 0,
                      energy: essentiaProfile.soundPreferences?.energy || 0,
                      valence: essentiaProfile.soundPreferences?.valence || 0,
                      acousticness: essentiaProfile.soundPreferences?.acousticness || 0,
                      tracksAnalyzed: essentiaProfile.trackCount || 0,
                      lastFetch: new Date()
                    },
                    weeklyDeltas: deltas
                  },
                  { upsert: true }
                );

                // Format for frontend
                const formattedProfile = {
                  userId,
                  genrePreferences: genrePreferences,
                  soundCharacteristics: {
                    danceability: { 
                      value: Math.round((essentiaProfile.soundPreferences?.danceability || 0.7) * 100), 
                      source: 'essentia_ml' 
                    },
                    energy: { 
                      value: Math.round((essentiaProfile.soundPreferences?.energy || 0.65) * 100), 
                      source: 'essentia_ml' 
                    },
                    valence: { 
                      value: Math.round((essentiaProfile.soundPreferences?.valence || 0.4) * 100), 
                      source: 'essentia_ml' 
                    },
                    acousticness: { 
                      value: Math.round((essentiaProfile.soundPreferences?.acousticness || 0.15) * 100), 
                      source: 'essentia_ml' 
                    },
                    trackCount: essentiaProfile.trackCount || 0,
                    confidence: 0.9
                  },
                  dataSources: {
                    genreProfile: {
                      isRealData: true,
                      tracksAnalyzed: essentiaProfile.trackCount || 0,
                      confidence: 0.9,
                      source: 'essentia_ml_pipeline + spotify_top_tracks_inferred_genres',
                      timePeriod: 'last_6_months_top_tracks',
                      description: 'Essentia ML audio features + inferred top track artist genres',
                      lastFetch: new Date().toISOString(),
                      error: null
                    },
                    soundCharacteristics: {
                      isRealData: true,
                      tracksAnalyzed: essentiaProfile.trackCount || 0,
                      confidence: 0.9,
                      source: 'essentia_ml_pipeline',
                      timePeriod: 'last_6_months_top_tracks',
                      description: 'Essentia ML analysis of user top tracks from 6 months',
                      lastFetch: new Date().toISOString(),
                      error: null
                    },
                    seasonalProfile: {
                      isRealData: false,
                      tracksAnalyzed: 0,
                      confidence: 0.5,
                      source: 'estimated',
                      timePeriod: 'demo_data',
                      description: 'seasonal preferences estimated from sound characteristics',
                      lastFetch: new Date().toISOString(),
                      error: null
                    }
                  },
                  tasteEvolution: [],
                  recentActivity: { added: [], removed: [], liked: [] },
                  playlists: [],
                  lastUpdated: new Date(),
                };

                return res.status(200).json(formattedProfile);
              } else {
                console.warn(`⚠️ Essentia analysis failed: ${essentiaProfile.error}`);
              }
            } else {
              console.warn(`⚠️ Essentia service call failed: ${essentiaResponse.status}`);
            }
          } else {
            console.warn(`⚠️ No top tracks found for user: ${userId}`);
          }
        } else {
          console.warn(`⚠️ Spotify top tracks fetch failed: ${topTracksResponse.status}`);
        }

      } catch (essentiaError) {
        console.error('❌ Essentia profile building failed:', essentiaError.message);
      }
    }

    // FALLBACK: Return demo data if Essentia analysis fails
    console.log(`🔄 Using fallback profile for user: ${userId}`);
  const fallbackProfile = { ...getFallbackTasteProfile(userId), email: normalizedEmail };
    return res.status(200).json(fallbackProfile);

  } catch (error) {
    console.error('Error in /api/user/taste-profile:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
