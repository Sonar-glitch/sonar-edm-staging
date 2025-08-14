// pages/api/user/trigger-taste-collection.js
// 🎵 MANUAL TASTE COLLECTION TRIGGER API
// Allows manual triggering of taste collection (e.g., from music-taste page)

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { triggerFirstLoginTasteCollection } from "@/lib/firstLoginTasteCollector";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!session.accessToken) {
      return res.status(400).json({ 
        error: 'No Spotify access token available',
        message: 'Please reconnect your Spotify account'
      });
    }

    console.log(`🎵 Manual taste collection triggered for: ${session.user.email}`);
    
    // Trigger taste collection with manual priority
    const result = await triggerFirstLoginTasteCollection(
      session.user,
      { access_token: session.accessToken },
      {
        priority: 'high',
        reason: 'manual_trigger'
      }
    );
    
    if (result.success) {
      return res.status(200).json({
        success: true,
        message: 'Taste collection started successfully',
        duration: result.duration,
        tracksAnalyzed: result.tracksAnalyzed,
        artistsAnalyzed: result.artistsAnalyzed,
        essentiaQueued: result.essentiaQueued
      });
    } else {
      return res.status(500).json({
        success: false,
        error: result.error,
        fallbackProvided: result.fallbackDataProvided
      });
    }
    
  } catch (error) {
    console.error('Error triggering taste collection:', error);
    return res.status(500).json({ 
      error: 'Failed to trigger taste collection',
      message: error.message 
    });
  }
}
