// pages/api/user/collection-status.js
// 🎵 REAL-TIME COLLECTION STATUS API
// Tracks actual progress of taste collection process

import { MongoClient } from 'mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  await client.connect();
  cachedClient = client;
  return client;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        status: 'not_authenticated'
      });
    }

    const client = await connectToDatabase();
    const db = client.db('sonar');

    // Check if user has a completed profile
    const userProfile = await db.collection('userProfiles').findOne({
      email: session.user.email
    });

    if (userProfile && userProfile.onboardingCompleted) {
      // User has completed onboarding
      const confidence = userProfile.tasteProfile?.confidence || { score: 0, level: 'unknown' };
      
      return res.status(200).json({
        status: 'completed',
        profileExists: true,
        confidence: confidence,
        summary: {
          genres: userProfile.tasteProfile?.genres?.length || 0,
          topArtists: userProfile.spotifyData?.topArtistsCount || 0,
          topTracks: userProfile.spotifyData?.topTracksCount || 0,
          hasAudioProfile: userProfile.tasteProfile?.audioProfile ? true : false,
          lastUpdated: userProfile.tasteProfile?.lastUpdated || userProfile.updatedAt
        },
        completedAt: userProfile.onboardingCompletedAt
      });
    }

    // Check if we have access to Spotify
    if (!session.accessToken) {
      return res.status(200).json({
        status: 'needs_spotify_connection',
        profileExists: false,
        message: 'Spotify connection required for taste collection'
      });
    }

    // User needs onboarding
    return res.status(200).json({
      status: 'needs_collection',
      profileExists: false,
      hasSpotifyAccess: true,
      message: 'Ready to start taste collection'
    });

  } catch (error) {
    console.error('❌ [Collection Status] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      status: 'error',
      message: error.message
    });
  }
}
