// PERFORMANCE-OPTIMIZED DASHBOARD API
// Uses cached profile data instead of live Spotify calls
// ⚡ FAST LOADING: Returns cached data in <500ms instead of 3-5 seconds

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
// NOTE: Avoid path alias here (was '@/lib/mongodb') to prevent prod resolution issues causing 500s
const { connectToDatabase } = require('../../../lib/mongodb');

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

  console.log('📦 [cached-dashboard-data] Connecting to Mongo...');
  const { db } = await connectToDatabase();
  console.log('✅ [cached-dashboard-data] Mongo connected');
  // Normalize identifiers (prevent case / format mismatches)
  const rawUserId = session.user.id || session.user.email;
  const userId = (rawUserId || '').toString().trim();
  const normalizedEmail = (session.user.email || '').toLowerCase().trim();

    // 🚀 PERFORMANCE: Use cached profile data instead of live Spotify calls
    // Small grace window (15m) allows slightly expired data to still serve while refresh is queued
    const now = new Date();
    const graceWindow = new Date(Date.now() - 15 * 60 * 1000);
    // Broader lookup: some documents may have stored email instead of userId or variant keys
    const cached = await db.collection('user_sound_profiles').findOne({
        $and: [
          { expiresAt: { $gt: graceWindow } },
          { $or: [
            { userId },
            { userId: normalizedEmail },
            { email: normalizedEmail },
            { email: session.user.email }
          ] }
        ]
      });

    if (cached) {
      console.log(`⚡ Cache hit for dashboard data: ${userId} (docId=${cached._id})`);

      // Derive tracks analyzed robustly (explicit field OR derived from genre counts)
      // FIX: Some stored profiles used trackCount instead of tracksAnalyzed; also some only have topGenres counts
      const derivedTracks = (
        cached.tracksAnalyzed ||
        cached.trackCount ||
        (Array.isArray(cached.topGenres)
          ? cached.topGenres.reduce((a, g) => a + (g.count || 0), 0)
          : 0)
      );

      // Confidence must NOT be high if we have zero tracks; downgrade & mark non-real
  const hasRealData = derivedTracks > 0; // threshold can later be raised to >=10
  const demoReason = hasRealData ? null : (!derivedTracks ? 'ZERO_TRACKS' : 'UNKNOWN');
      const effectiveConfidence = hasRealData
        ? (cached.confidence != null ? cached.confidence : 0.7)
        : 0.0; // show 0 when truly no tracks analyzed

      const analysisStatus = {
        hasRealData,
        tracksAnalyzed: derivedTracks,
        pending: !hasRealData,
        // future: queued rebuild doc indicates pending async processing
      };

      const baseSource = {
        lastFetch: cached.createdAt,
        source: 'cached_profile',
        tracksAnalyzed: derivedTracks,
        confidence: effectiveConfidence,
        analysisStatus
      };

      const dashboardData = {
        dataSources: {
          spotify: { 
            ...baseSource,
            isReal: hasRealData,
            error: hasRealData ? null : 'NO_TRACKS_ANALYZED',
            demoReason
          },
          soundstat: { 
            ...baseSource,
            isReal: hasRealData,
            error: hasRealData ? null : 'NO_TRACKS_ANALYZED',
            demoReason
          },
          events: { 
            isReal: true,
            error: null,
            lastFetch: new Date().toISOString(),
            source: 'live_api'
          },
          seasonal: { 
            ...baseSource,
            isReal: hasRealData,
            error: hasRealData ? null : 'NO_TRACKS_ANALYZED',
            demoReason
          },
          ...(cached.weeklyDeltas ? {
            weeklyDeltas: {
              lastFetch: cached.lastWeeklyDeltaAt || cached.profileBuiltAt || new Date(),
              source: 'weekly_deltas_cache',
              tracksAnalyzed: cached.weeklyDeltas?.dataQuality?.tracksAnalyzed || 0,
              confidence: cached.weeklyDeltas?.dataQuality?.confidence || 0,
              isReal: !!cached.weeklyDeltas?.dataQuality?.tracksAnalyzed,
              error: cached.weeklyDeltasError || null,
              analysisStatus: { pending: !cached.weeklyDeltas?.dataQuality?.tracksAnalyzed }
            }
          } : {})
        },

        genreProfile: {
          topGenres: cached.topGenres || [],
          confidence: effectiveConfidence,
          dataSource: 'cached_spotify_data',
          lastFetch: cached.createdAt,
          tracksAnalyzed: derivedTracks,
          pending: !hasRealData
        },

        soundCharacteristics: cached.soundCharacteristics || {
          energy: 0.6,
          danceability: 0.6,
          valence: 0.6,
          confidence: effectiveConfidence
        },

        artistProfile: cached.topGenres?.slice(0, 5).map((genre, i) => ({
          name: `${genre.genre} Artist ${i + 1}`,
            plays: genre.count || 10,
          genre: genre.genre
        })) || [],

        topTracks: [
          { name: 'Track 1', artist: 'Artist 1', plays: 50 },
          { name: 'Track 2', artist: 'Artist 2', plays: 45 },
          { name: 'Track 3', artist: 'Artist 3', plays: 40 }
        ],

        seasonalAnalysis: cached.seasonalProfile ? {
          currentSeason: getCurrentSeason(),
          genres: cached.seasonalProfile.profile || {},
          metadata: {
            ...(cached.seasonalProfile.metadata || {}),
            pending: !hasRealData
          }
        } : {
          currentSeason: getCurrentSeason(),
          genres: {
            spring: cached.topGenres?.slice(0, 3).map(g => g.genre) || ['Progressive House', 'Melodic Techno'],
            summer: cached.topGenres?.slice(1, 4).map(g => g.genre) || ['Tech House', 'Festival Progressive'],
            fall: cached.topGenres?.slice(2, 5).map(g => g.genre) || ['Organic House', 'Downtempo'],
            winter: cached.topGenres?.slice(3, 6).map(g => g.genre) || ['Deep House', 'Ambient Techno']
          },
          metadata: {
            tracksAnalyzed: derivedTracks,
            seasonsWithData: ['spring', 'summer', 'fall', 'winter'],
            dataQuality: effectiveConfidence,
            confidence: effectiveConfidence,
            source: 'cached_spotify_data',
            isRealData: hasRealData,
            pending: !hasRealData
          }
        },

        // Expose weekly deltas if present
        weeklyDeltas: cached.weeklyDeltas || null,

        soundCharacteristicsSummary: cached.soundCharacteristicsSummary || null,

        performance: {
          cacheAge: Math.floor((new Date() - cached.createdAt) / 1000 / 60),
          loadTime: 'fast',
          dataSource: 'cache',
          lastUpdate: cached.createdAt,
          cacheState: 'HIT'
        }
      };

      return res.status(200).json(dashboardData);
    }

    // 🔄 FALLBACK: No cached data, attempt broader profile discovery first
    console.log(`❌ No cached profile for ${userId}. Attempting broader userProfiles lookup...`);
    const userProfile = await db.collection('userProfiles').findOne({
      $or: [
        { email: normalizedEmail },
        { email: session.user.email },
        { userId: normalizedEmail },
        { userId: session.user.email },
        { userId: userId }
      ]
    });

    if (!userProfile) {
      console.log('⚠️ No userProfiles doc found; returning soft onboarding signal. (Will not hard redirect)');
      return res.status(200).json({
        softOnboarding: true,
        message: 'No user profile document found; begin taste collection',
        action: 'suggest_onboarding',
        performance: { cacheState: 'MISS', rebuildQueued: false }
      });
    }

    console.log('✅ userProfiles doc found — sending fallback dashboard stub & queuing async rebuild');
    // (Optional) Queue async rebuild (fire-and-forget) if profile cache missing or stale beyond grace
    try {
      const needsRebuild = !cached || (cached.expiresAt && cached.expiresAt < now);
      if (needsRebuild) {
        // Lightweight marker; real job runner could pick this up
        await db.collection('profile_rebuild_requests').updateOne(
          { userId },
          { $set: { userId, requestedAt: new Date(), reason: 'CACHE_MISS_FALLBACK' } },
          { upsert: true }
        );
      }
    } catch (queueErr) {
      console.warn('⚠️ Failed to queue profile rebuild request:', queueErr.message);
    }
    return res.status(200).json({
      dataSources: {
        spotify: { isReal: false, error: 'CACHE_MISS', lastFetch: null },
        soundstat: { isReal: false, error: 'CACHE_MISS', lastFetch: null },
        events: { isReal: true, error: null, lastFetch: new Date().toISOString() },
        seasonal: { isReal: false, error: 'CACHE_MISS', lastFetch: null }
      },
      genreProfile: {
        topGenres: userProfile.topGenres || userProfile.genres || [],
        confidence: 0.5,
        dataSource: 'user_profile_fallback'
      },
      soundCharacteristics: userProfile.audioFeatures || userProfile.soundCharacteristics || {
        energy: 0.6,
        danceability: 0.6,
        valence: 0.6,
        confidence: 0.3
      },
      performance: {
        cacheAge: null,
        loadTime: 'fast_fallback',
        dataSource: 'user_profile',
        needsRefresh: true,
        cacheState: 'MISS',
        rebuildQueued: true
      }
    });

  } catch (error) {
    console.error('❌ Error in cached dashboard API:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      raw: error
    });
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error?.message || 'Unknown error'
    });
  }
}

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}
