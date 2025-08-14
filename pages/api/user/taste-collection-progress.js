// pages/api/user/taste-collection-progress.js
// 🎵 TASTE COLLECTION PROGRESS API
// Returns the current status of taste collection for a user

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
    
    if (!session) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        status: {
          overall: 'not_authenticated',
          spotify: 'not_connected',
          genres: 'not_started',
          audio: 'not_started',
          profile: 'not_started'
        }
      });
    }

    console.log('🔍 [Taste Progress API] Checking progress for:', session.user.email);
    
    const client = await connectToDatabase();
    const db = client.db('sonar');

    // Check if user has a profile
    const userProfile = await db.collection('userProfiles').findOne({ 
      email: session.user.email 
    });

    if (userProfile) {
      // User has completed taste collection
      return res.status(200).json({
        success: true,
        status: {
          overall: 'complete',
          spotify: 'connected',
          genres: 'complete',
          audio: 'complete',
          profile: 'complete',
          completedAt: userProfile.createdAt || new Date().toISOString()
        },
        profile: {
          hasGenres: !!userProfile.topGenres,
          hasAudioFeatures: !!userProfile.audioFeatures,
          hasSpotifyData: !!userProfile.spotifyUserId,
          tracksAnalyzed: userProfile.tracksAnalyzed || 0
        }
      });
    }

    // Check if taste collection is in progress
    const progressRecord = await db.collection('tasteCollectionProgress').findOne({
      email: session.user.email
    });

    if (progressRecord) {
      // Collection is in progress
      return res.status(200).json({
        success: true,
        status: {
          overall: 'loading',
          spotify: progressRecord.spotify || 'in_progress',
          genres: progressRecord.genres || 'pending',
          audio: progressRecord.audio || 'pending',
          profile: progressRecord.profile || 'pending',
          startedAt: progressRecord.startedAt,
          lastUpdated: progressRecord.lastUpdated
        },
        progress: {
          percentage: progressRecord.percentage || 0,
          currentStep: progressRecord.currentStep || 'spotify_connection',
          estimatedTimeRemaining: progressRecord.estimatedTimeRemaining || 15000
        }
      });
    }

    // No profile and no progress record - needs to start
    return res.status(200).json({
      success: true,
      status: {
        overall: 'not_started',
        spotify: 'connected', // User is authenticated via Spotify
        genres: 'not_started',
        audio: 'not_started',
        profile: 'not_started'
      },
      message: 'User needs to start taste collection process'
    });

  } catch (error) {
    console.error('🔍 [Taste Progress API] Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      status: {
        overall: 'error',
        spotify: 'error',
        genres: 'error',
        audio: 'error',
        profile: 'error'
      }
    });
  }
}
