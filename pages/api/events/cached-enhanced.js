// pages/api/events/cached-enhanced.js
// 🎯 CACHED EVENTS API - FAST LOADING
// Returns cached events with 24-hour TTL instead of 15-minute live calls
// Only refreshes when explicitly requested or cache is stale

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.email;

    // 🚀 PERFORMANCE: Check for cached events (24-hour TTL)
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const cachedResult = await db.collection('events_cache').findOne({ 
      userId,
      timestamp: { $gte: twentyFourHoursAgo }
    });

    if (cachedResult) {
      const cachedEvents = cachedResult.events || [];
      console.log(`🚀 Cache hit - returning ${cachedEvents.length} cached events (age: ${Math.floor((new Date() - cachedResult.timestamp) / 1000 / 60)} min)`);
      
      return res.status(200).json({
        events: cachedEvents,
        source: "cached_events",
        cached: true,
        cacheAge: Math.floor((new Date() - cachedResult.timestamp) / 1000 / 60),
        enhancementStats: cachedResult.enhancementStats || {
          totalEvents: cachedEvents.length,
          enhancedEvents: cachedEvents.filter(e => e.enhanced).length,
          musicApiIntegration: true,
          essentiaIntegration: true
        },
        timestamp: cachedResult.timestamp,
        totalEvents: cachedEvents.length,
        enhanced: true
      });
    }

    // 🔄 Cache miss - return demo data and trigger background refresh
    console.log(`⚡ Cache miss - returning demo data, triggering background refresh`);
    
    // Trigger background refresh (don't wait for it)
    triggerBackgroundRefresh(userId, db).catch(error => {
      console.error('Background refresh failed:', error);
    });

    // Return demo data immediately for fast loading
    const demoEvents = [
      {
        id: 'demo_1',
        name: 'Electronic Music Showcase',
        artists: ['Demo Artist 1', 'Demo Artist 2'],
        venue: 'Demo Venue',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        genre: 'House',
        enhanced: false,
        demo: true,
        vibeMatch: 85
      },
      {
        id: 'demo_2', 
        name: 'Techno Night',
        artists: ['Demo Techno Artist'],
        venue: 'Demo Club',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        genre: 'Techno',
        enhanced: false,
        demo: true,
        vibeMatch: 78
      }
    ];

    return res.status(200).json({
      events: demoEvents,
      source: "demo_data_with_background_refresh",
      cached: false,
      refreshTriggered: true,
      enhancementStats: {
        totalEvents: demoEvents.length,
        enhancedEvents: 0,
        musicApiIntegration: false,
        essentiaIntegration: false
      },
      timestamp: new Date().toISOString(),
      totalEvents: demoEvents.length,
      enhanced: false
    });

  } catch (error) {
    console.error('❌ Cached events API error:', error);
    return res.status(500).json({ 
      error: 'Failed to load events',
      source: 'error'
    });
  }
}

// Background refresh function (non-blocking)
async function triggerBackgroundRefresh(userId, db) {
  console.log(`🔄 Starting background events refresh for ${userId}...`);
  
  try {
    // This would call the actual enhanced events API
    const response = await fetch(`${process.env.NEXTAUTH_URL}/api/events/enhanced?limit=20&background=true`);
    if (response.ok) {
      const freshData = await response.json();
      
      // Cache the fresh data
      await db.collection('events_cache').updateOne(
        { userId },
        {
          $set: {
            userId,
            events: freshData.events || [],
            enhancementStats: freshData.enhancementStats,
            timestamp: new Date(),
            source: 'background_refresh'
          }
        },
        { upsert: true }
      );
      
      console.log(`✅ Background refresh completed for ${userId}`);
    }
  } catch (error) {
    console.error(`❌ Background refresh failed for ${userId}:`, error);
  }
}
