// REAL DELTA CALCULATION WITH ESSENTIA ML ANALYSIS
// Compares last 7 days tracks vs 6-month baseline using Essentia pipeline

import { getSession } from 'next-auth/react';
const { connectToDatabase } = require('../../../lib/mongodb');

// Essentia service configuration for delta analysis
const ESSENTIA_SERVICE_URL = process.env.ESSENTIA_SERVICE_URL || 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';

// Calculate delta between two sound profiles (normalize 0-1)
function normalize01(v) {
  if (v == null || isNaN(v)) return 0;
  // If values look like percentages (>1), scale down
  if (v > 1) return Math.max(0, Math.min(1, v / 100));
  return Math.max(0, Math.min(1, v));
}

function calculateSoundDelta(current, previous) {
  const deltas = {};
  
  const features = ['danceability', 'energy', 'valence', 'acousticness'];
  
  for (const feature of features) {
    const currentVal = normalize01(current[feature] || 0);
    const previousVal = normalize01(previous[feature] || 0);
    const change = Math.round((currentVal - previousVal) * 100); // percentage points
    
    deltas[feature === 'valence' ? 'positivity' : (feature === 'acousticness' ? 'acoustic' : feature)] = {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : (change < 0 ? 'down' : 'stable')
    };
  }
  
  return deltas;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false,
      error: 'METHOD_NOT_ALLOWED',
      message: 'Only GET method is allowed' 
    });
  }

  const startTime = Date.now();

  try {
    // Authentication check with fallback
    const session = await getSession({ req });
    if (!session?.user?.email) {
      const fallbackData = getFallbackDeltas();
      
      return res.status(200).json({ 
        success: true,
        deltas: fallbackData,
        dataSource: {
          isReal: false,
          cached: false,
          calculatedAt: new Date().toISOString(),
          confidence: 0.4,
          processingTime: Date.now() - startTime,
          error: 'NO_SESSION',
          fallbackReason: 'Authentication required but session not found'
        }
      });
    }

    let client, db;
    try {
      ({ client, db } = await connectToDatabase());
    } catch (err) {
      console.error('❌ MongoDB connection error:', err);
      return res.status(200).json({
        success: true,
        deltas: getFallbackDeltas(),
        dataSource: {
          isReal: false,
          cached: false,
          calculatedAt: new Date().toISOString(),
          confidence: 0.4,
          processingTime: Date.now() - startTime,
          error: 'DB_CONNECTION_ERROR',
          fallbackReason: 'Could not connect to database'
        }
      });
    }
    
    const userId = session.user.email;

    // Check cache first (24 hour TTL for mobile performance)
    let cachedDeltas;
    try {
      cachedDeltas = await db.collection('weekly_deltas_cache').findOne({
        userId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });
    } catch (err) {
      console.error('❌ Cache query error:', err);
      return res.status(200).json({
        success: true,
        deltas: getFallbackDeltas(),
        dataSource: {
          isReal: false,
          cached: false,
          calculatedAt: new Date().toISOString(),
          confidence: 0.4,
          processingTime: Date.now() - startTime,
          error: 'CACHE_QUERY_ERROR',
          fallbackReason: 'Failed to query cache'
        }
      });
    }

    if (cachedDeltas) {
      console.log(`✅ Cache hit for user ${userId}`);
      return res.status(200).json({
        success: true,
        deltas: cachedDeltas.deltas,
        dataSource: {
          isReal: true,
          cached: true,
          calculatedAt: cachedDeltas.createdAt,
          confidence: cachedDeltas.confidence || 0.85,
          processingTime: Date.now() - startTime,
          error: null
        }
      });
    }

  // ESSENTIA-BASED DELTA CALCULATION
  console.log(`📊 Calculating Essentia-based deltas for user: ${userId}`);

    // Get current user profile (6 months baseline) from Essentia
    const currentProfile = await db.collection('user_sound_profiles').findOne({ userId });
    
    if (!currentProfile || !currentProfile.soundPreferences) {
      console.log(`⚠️ No Essentia profile found for user ${userId}`);
      return res.status(200).json({
        success: true,
        deltas: getFallbackDeltas(),
        dataSource: {
          isReal: false,
          cached: false,
          error: 'NO_ESSENTIA_PROFILE',
          fallbackReason: 'User Essentia profile not yet generated',
          processingTime: Date.now() - startTime
        }
      });
    }

  // Try to get Spotify access token to fetch recent tracks + recent liked tracks
  const spotifySession = session.accessToken ? session : null;
    
    if (spotifySession && spotifySession.accessToken) {
      try {
        console.log(`🎵 Fetching recent tracks & liked tracks for delta analysis...`);
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);

        // 1. Recently played (limited window by Spotify)
        let recentTracks = [];
        try {
          const recentResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
            headers: { 'Authorization': `Bearer ${spotifySession.accessToken}` }
          });
          if (recentResponse.ok) {
            const recentData = await recentResponse.json();
            recentTracks = recentData.items?.filter(item => new Date(item.played_at).getTime() > sevenDaysAgo).map(i => i.track) || [];
            console.log(`   🎧 Recently played (7d) tracks: ${recentTracks.length}`);
          }
        } catch (rpErr) {
          console.warn('   ⚠️ Recently played fetch error:', rpErr.message);
        }

        // 2. Recently liked tracks (Saved tracks with added_at within 7 days)
        let likedRecentTracks = [];
        try {
          let offset = 0;
          const pageLimit = 50;
            // Fetch up to 10 pages (500 tracks) or until we pass time window
              while (offset < 500) {
            const likedResp = await fetch(`https://api.spotify.com/v1/me/tracks?limit=${pageLimit}&offset=${offset}`, {
              headers: { 'Authorization': `Bearer ${spotifySession.accessToken}` }
            });
            if (!likedResp.ok) break;
            const likedData = await likedResp.json();
            if (!likedData.items?.length) break;
            const pageRecent = likedData.items.filter(it => new Date(it.added_at).getTime() > sevenDaysAgo);
            likedRecentTracks.push(...pageRecent.map(it => it.track));
            // If last item in page already older than 7 days, stop
            const lastAdded = likedData.items[likedData.items.length - 1].added_at;
            if (new Date(lastAdded).getTime() <= sevenDaysAgo) break;
            offset += pageLimit;
          }
          console.log(`   ❤️ Recently liked (7d) tracks: ${likedRecentTracks.length}`);
        } catch (likedErr) {
          console.warn('   ⚠️ Liked tracks fetch error:', likedErr.message);
        }

        // Merge and de-duplicate tracks by id
        const trackMap = new Map();
        [...likedRecentTracks, ...recentTracks].forEach(t => { if (t && t.id) trackMap.set(t.id, t); });
        const mergedRecent = Array.from(trackMap.values());
        console.log(`   🔀 Merged unique recent tracks for analysis: ${mergedRecent.length}`);

        if (mergedRecent.length > 0) {
          // Gather artist IDs for genre extraction
          const artistIds = Array.from(new Set(mergedRecent.flatMap(t => t.artists?.map(a => a.id).filter(Boolean) || [])));
          let artistGenres = {};
          try {
            for (let i = 0; i < artistIds.length; i += 50) {
              const batch = artistIds.slice(i, i + 50);
              const artistsResp = await fetch(`https://api.spotify.com/v1/artists?ids=${batch.join(',')}`, {
                headers: { 'Authorization': `Bearer ${spotifySession.accessToken}` }
              });
              if (artistsResp.ok) {
                const artistsData = await artistsResp.json();
                artistsData.artists?.forEach(a => {
                  if (Array.isArray(a.genres)) artistGenres[a.id] = a.genres;
                });
              }
            }
          } catch (agErr) {
            console.warn('   ⚠️ Artist genre fetch error:', agErr.message);
          }

          // Build current 7d genre counts
          const currentGenreCounts = {};
          mergedRecent.forEach(t => {
            t.artists?.forEach(a => {
              (artistGenres[a.id] || []).forEach(g => {
                if (!g) return; currentGenreCounts[g] = (currentGenreCounts[g] || 0) + 1;
              });
            });
          });

          // Baseline (6-month) genre counts from stored profile
            let baselineGenreCounts = {};
          if (Array.isArray(currentProfile.topGenres) && currentProfile.topGenres.length) {
            currentProfile.topGenres.forEach(g => { if (g.genre) baselineGenreCounts[g.genre] = (baselineGenreCounts[g.genre] || 0) + (g.count || 1); });
          } else if (Array.isArray(currentProfile.genrePreferences) && currentProfile.genrePreferences.length) {
            currentProfile.genrePreferences.forEach(g => { if (g.name) baselineGenreCounts[g.name] = (baselineGenreCounts[g.name] || 0) + Math.round((g.weight || 0) * 100); });
          }

          // Normalize to shares
          const sumCurrent = Object.values(currentGenreCounts).reduce((a,b)=>a+b,0) || 1;
          const sumBaseline = Object.values(baselineGenreCounts).reduce((a,b)=>a+b,0) || 1;
          const unionGenres = Array.from(new Set([...Object.keys(currentGenreCounts), ...Object.keys(baselineGenreCounts)]));
          const genreDeltas = {};
          unionGenres.forEach(g => {
            const currentShare = (currentGenreCounts[g] || 0) / sumCurrent * 100;
            const baselineShare = (baselineGenreCounts[g] || 0) / sumBaseline * 100;
            const deltaPts = currentShare - baselineShare;
            if (Math.abs(deltaPts) < 0.5) return; // filter insignificant
            genreDeltas[g] = {
              change: Math.round(deltaPts),
              direction: deltaPts > 0 ? 'up' : 'down',
              current: Math.round(currentShare),
              historical: Math.round(baselineShare)
            };
          });

          // Keep top 5 by absolute change
          const top5 = Object.entries(genreDeltas)
            .sort((a,b)=>Math.abs(b[1].change) - Math.abs(a[1].change))
            .slice(0,5)
            .reduce((acc,[k,v])=>{acc[k]=v;return acc;},{});

          // Analyze sound characteristics with Essentia (limit to recent 25 tracks for speed)
          const fetch = (await import('node-fetch')).default;
          const deltaAnalysisResponse = await fetch(`${ESSENTIA_SERVICE_URL}/api/user-profile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: `${userId}_delta_7days`,
              recentTracks: mergedRecent.slice(0,25),
              maxTracks: 25
            }),
            timeout: 90000
          });

          let soundDeltas = {};
          let analyzedTrackCount = 0;
          if (deltaAnalysisResponse.ok) {
            const deltaProfile = await deltaAnalysisResponse.json();
            if (deltaProfile.success && deltaProfile.soundPreferences) {
              analyzedTrackCount = deltaProfile.trackCount || mergedRecent.length;
              soundDeltas = calculateSoundDelta(deltaProfile.soundPreferences, currentProfile.soundPreferences || {});
            }
          }

          const calculatedDeltas = {
            genres: top5,
            soundCharacteristics: soundDeltas,
            dataQuality: {
              confidence: Object.keys(top5).length ? 0.9 : 0.6,
              daysOfData: 7,
              tracksAnalyzed: analyzedTrackCount,
              essentiaAnalysis: !!analyzedTrackCount,
              source: 'recent_likes+recently_played'
            }
          };

          await db.collection('weekly_deltas_cache').replaceOne(
            { userId },
            {
              userId,
              deltas: calculatedDeltas,
              confidence: calculatedDeltas.dataQuality.confidence,
              tracksAnalyzed: analyzedTrackCount,
              source: 'essentia_ml_delta_analysis',
              createdAt: new Date()
            },
            { upsert: true }
          );

          // Persist into user_sound_profiles for fast dashboard path
          try {
            await db.collection('user_sound_profiles').updateOne(
              { userId },
              {
                $set: {
                  weeklyDeltas: calculatedDeltas,
                  lastWeeklyDeltaAt: new Date(),
                  recentSavedTracksSnapshot: likedRecentTracks.slice(0,500).map(t => ({ id: t.id, name: t.name, artists: t.artists?.map(a=>a.name), addedAt: null })),
                  recentPlayedTracksCount: recentTracks.length,
                  recentMergedTracksAnalyzed: mergedRecent.length
                }
              },
              { upsert: true }
            );
          } catch (persistErr) {
            console.warn('⚠️ Failed to persist weekly deltas to user_sound_profiles:', persistErr.message);
          }

          return res.status(200).json({
            success: true,
            deltas: calculatedDeltas,
            dataSource: {
              isReal: true,
              cached: false,
              calculatedAt: new Date(),
              confidence: calculatedDeltas.dataQuality.confidence,
              tracksAnalyzed: analyzedTrackCount,
              source: 'essentia_ml_delta_analysis',
              baselinePeriod: 'last_6_months',
              deltaPeriod: 'last_7_days',
              processingTime: Date.now() - startTime,
              error: null
            }
          });
        } else {
          console.log('⚠️ No merged recent tracks (liked or played) within 7 days; using fallback deltas');
          // Persist fallback with error flag
          try {
            await db.collection('user_sound_profiles').updateOne(
              { userId },
              { $set: { weeklyDeltas: getFallbackDeltas(), lastWeeklyDeltaAt: new Date(), weeklyDeltasError: 'NO_RECENT_TRACKS' } },
              { upsert: true }
            );
          } catch {}
        }
      } catch (essentiaError) {
        console.error('❌ Delta pipeline failed:', essentiaError.message);
        try {
          await db.collection('user_sound_profiles').updateOne(
            { userId },
            { $set: { weeklyDeltas: getFallbackDeltas(), lastWeeklyDeltaAt: new Date(), weeklyDeltasError: essentiaError.message } },
            { upsert: true }
          );
        } catch {}
      }
    }

  } catch (error) {
    console.error('❌ Weekly deltas calculation error:', error);
    
    return res.status(200).json({
      success: false,
      deltas: getFallbackDeltas(),
      dataSource: {
        isReal: false,
        cached: false,
        error: 'CALCULATION_ERROR',
        errorMessage: error.message,
        fallbackReason: 'Error calculating deltas, using demo data',
        processingTime: Date.now() - startTime
      }
    });
  }
}

function calculateDeltas(current, historical) {
  const deltas = {
    genres: {},
    soundCharacteristics: {},
    summary: {
      totalGenreShift: 0,
      totalSoundShift: 0,
      direction: 'stable',
      confidence: 0
    },
    dataQuality: {
      hasHistoricalData: !!historical,
      daysOfData: 7,
      confidence: 0.85
    }
  };

  // Calculate genre deltas
  if (current.genres && historical.genres) {
    const genreChanges = [];
    
    Object.keys(current.genres).forEach(genre => {
      const currentValue = current.genres[genre] || 0;
      const historicalValue = historical.genres[genre] || 0;
      const delta = currentValue - historicalValue;
      
      if (Math.abs(delta) > 0.5) { // Only significant changes
        genreChanges.push({
          genre,
          delta,
          currentValue,
          historicalValue
        });
      }
    });

    // Sort by absolute change and take top 10 for mobile
    genreChanges
      .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
      .slice(0, 10)
      .forEach(({ genre, delta, currentValue, historicalValue }) => {
        deltas.genres[genre] = {
          change: Math.round(delta),
          direction: delta > 0 ? 'up' : 'down',
          current: Math.round(currentValue),
          historical: Math.round(historicalValue)
        };
      });
  }

  // Calculate sound characteristic deltas
  const soundKeys = ['energy', 'danceability', 'positivity', 'acoustic'];
  soundKeys.forEach(key => {
    const currentValue = current.soundCharacteristics?.[key] || 
                        current.audioFeatures?.[key] || 0;
    const historicalValue = historical.soundCharacteristics?.[key] || 
                           historical.audioFeatures?.[key] || 0;
    const delta = currentValue - historicalValue;
    
    if (Math.abs(delta) > 0.5) { // Only significant changes
      deltas.soundCharacteristics[key] = {
        change: Math.round(delta),
        direction: delta > 0 ? 'up' : 'down',
        current: Math.round(currentValue),
        historical: Math.round(historicalValue)
      };
    }
  });

  // Calculate summary statistics
  const genreDeltas = Object.values(deltas.genres).map(g => Math.abs(g.change));
  const soundDeltas = Object.values(deltas.soundCharacteristics).map(s => Math.abs(s.change));
  
  deltas.summary.totalGenreShift = genreDeltas.reduce((a, b) => a + b, 0);
  deltas.summary.totalSoundShift = soundDeltas.reduce((a, b) => a + b, 0);
  
  // Determine overall direction
  if (deltas.summary.totalGenreShift > 15) {
    deltas.summary.direction = 'exploring';
  } else if (deltas.summary.totalGenreShift > 8) {
    deltas.summary.direction = 'evolving';
  } else if (deltas.summary.totalGenreShift > 3) {
    deltas.summary.direction = 'shifting';
  } else {
    deltas.summary.direction = 'stable';
  }

  // Calculate confidence based on data quality
  const hasGoodData = Object.keys(deltas.genres).length > 0 || 
                      Object.keys(deltas.soundCharacteristics).length > 0;
  deltas.dataQuality.confidence = hasGoodData ? 0.85 : 0.4;
  deltas.summary.confidence = deltas.dataQuality.confidence;

  return deltas;
}

function createBaselineFromCurrent(current) {
  // Create a baseline by slightly reducing current values
  // This provides reasonable starting deltas when no history exists
  const baseline = {
    genres: {},
    soundCharacteristics: {},
    audioFeatures: {}
  };

  if (current.genres) {
    Object.keys(current.genres).forEach(genre => {
      // Reduce by 5-10% to show slight growth
      baseline.genres[genre] = current.genres[genre] * 0.92;
    });
  }

  if (current.soundCharacteristics) {
    Object.keys(current.soundCharacteristics).forEach(key => {
      // Add small random variation for realism
      const variation = (Math.random() - 0.5) * 5;
      baseline.soundCharacteristics[key] = 
        Math.max(0, Math.min(100, current.soundCharacteristics[key] + variation));
    });
  }

  if (current.audioFeatures) {
    Object.keys(current.audioFeatures).forEach(key => {
      const variation = (Math.random() - 0.5) * 5;
      baseline.audioFeatures[key] = 
        Math.max(0, Math.min(1, current.audioFeatures[key] + variation));
    });
  }

  return baseline;
}

function getFallbackDeltas() {
  return {
    genres: {
      'melodic techno': { change: 5, direction: 'up', current: 95, historical: 90 },
      'melodic house': { change: 2, direction: 'up', current: 95, historical: 93 },
      'progressive house': { change: 10, direction: 'up', current: 60, historical: 50 },
      'techno': { change: 1, direction: 'up', current: 30, historical: 29 },
      'organic house': { change: -3, direction: 'down', current: 15, historical: 18 }
    },
    soundCharacteristics: {
      energy: { change: 3, direction: 'up', current: 82, historical: 79 },
      danceability: { change: 2, direction: 'up', current: 84, historical: 82 },
      positivity: { change: -1, direction: 'down', current: 52, historical: 53 },
      acoustic: { change: 11, direction: 'up', current: 50, historical: 39 }
    },
    summary: {
      totalGenreShift: 21,
      totalSoundShift: 17,
      direction: 'evolving',
      confidence: 0
    },
    dataQuality: {
      hasHistoricalData: false,
      daysOfData: 0,
      confidence: 0
    }
  };
}

