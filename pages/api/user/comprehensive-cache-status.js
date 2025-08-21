// pages/api/user/comprehensive-cache-status.js
// 📊 COMPREHENSIVE CACHE STATUS API
// Shows status of all cached data sources for debugging and optimization

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.email;

    // Check all cache collections
    const cacheStatus = {
      userId,
      timestamp: new Date().toISOString(),
      caches: {}
    };

    // 1. User Profile Cache (userProfiles collection)
    const userProfile = await db.collection('userProfiles').findOne({
      email: userId
    });
    cacheStatus.caches.userProfile = {
      exists: !!userProfile,
      lastUpdated: userProfile?.updatedAt,
      age: userProfile ? Math.floor((new Date() - new Date(userProfile.updatedAt)) / 1000 / 60) : null,
      hasSpotifyData: !!userProfile?.spotifyData,
      hasTasteProfile: !!userProfile?.tasteProfile,
      hasAudioProfile: !!userProfile?.tasteProfile?.audioProfile
    };

    // 2. Sound Profile Cache (user_sound_profiles collection)
    const soundProfile = await db.collection('user_sound_profiles').findOne({
      userId
    });
    cacheStatus.caches.soundProfile = {
      exists: !!soundProfile,
      lastUpdated: soundProfile?.createdAt,
      age: soundProfile ? Math.floor((new Date() - new Date(soundProfile.createdAt)) / 1000 / 60) : null,
      hasEssentiaData: !!soundProfile?.soundCharacteristics
    };

    // 3. Events Cache (events_cache collection)
    const eventsCache = await db.collection('events_cache').findOne({
      userId
    });
    cacheStatus.caches.eventsCache = {
      exists: !!eventsCache,
      lastUpdated: eventsCache?.timestamp,
      age: eventsCache ? Math.floor((new Date() - new Date(eventsCache.timestamp)) / 1000 / 60) : null,
      eventCount: eventsCache?.events?.length || 0,
      enhanced: !!eventsCache?.enhancementStats
    };

    // 4. Weekly Deltas Cache (weekly_deltas_cache collection)
    const weeklyDeltas = await db.collection('weekly_deltas_cache').findOne({
      userId
    });
    cacheStatus.caches.weeklyDeltas = {
      exists: !!weeklyDeltas,
      lastUpdated: weeklyDeltas?.createdAt,
      age: weeklyDeltas ? Math.floor((new Date() - new Date(weeklyDeltas.createdAt)) / 1000 / 60) : null,
      hasDeltas: !!weeklyDeltas?.deltas
    };

    // 5. Calculate overall cache health
    const totalCaches = Object.keys(cacheStatus.caches).length;
    const activeCaches = Object.values(cacheStatus.caches).filter(cache => cache.exists).length;
    const healthScore = (activeCaches / totalCaches) * 100;

    cacheStatus.summary = {
      totalCaches,
      activeCaches,
      healthScore: Math.round(healthScore),
      status: healthScore >= 75 ? 'healthy' : healthScore >= 50 ? 'warning' : 'critical',
      recommendations: []
    };

    // Generate recommendations
    if (!cacheStatus.caches.userProfile.exists) {
      cacheStatus.summary.recommendations.push('Run taste collection to create user profile');
    }
    
    if (cacheStatus.caches.userProfile.exists && cacheStatus.caches.userProfile.age > 1440) { // 24 hours
      cacheStatus.summary.recommendations.push('User profile is stale (>24h), consider refresh');
    }

    if (!cacheStatus.caches.eventsCache.exists) {
      cacheStatus.summary.recommendations.push('No events cache found, run events collection');
    }

    if (cacheStatus.caches.eventsCache.exists && cacheStatus.caches.eventsCache.age > 1440) { // 24 hours
      cacheStatus.summary.recommendations.push('Events cache is stale (>24h), consider refresh');
    }

    return res.status(200).json(cacheStatus);

  } catch (error) {
    console.error('Cache status error:', error);
    return res.status(500).json({ error: 'Failed to get cache status' });
  }
}
