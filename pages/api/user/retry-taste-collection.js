// pages/api/user/retry-taste-collection.js
// 🔄 RETRY TASTE COLLECTION API
// Allows users with fallback profiles to retry real data collection

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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Must be logged in to retry taste collection' 
      });
    }

    const client = await connectToDatabase();
    const db = client.db('sonar');

    // Check if user has a profile
    const userProfile = await db.collection('userProfiles').findOne({
      email: session.user.email
    });

    if (!userProfile) {
      return res.status(404).json({
        error: 'No profile found',
        message: 'User needs to complete initial onboarding first'
      });
    }

    // Check if user can retry (has fallback/low confidence profile)
    const currentConfidence = userProfile.tasteProfile?.confidence?.score || 0;
    const profileType = userProfile.profileType || 'unknown';
    
    if (currentConfidence >= 80 && profileType !== 'fallback') {
      return res.status(400).json({
        error: 'Retry not needed',
        message: 'Profile already has high confidence',
        currentConfidence: currentConfidence
      });
    }

    console.log(`🔄 Starting retry taste collection for: ${session.user.email}`);
    console.log(`Current confidence: ${currentConfidence}%, type: ${profileType}`);

    // Mark profile as being retried
    await db.collection('userProfiles').updateOne(
      { email: session.user.email },
      { 
        $set: { 
          retryInProgress: true,
          retryStartedAt: new Date(),
          lastRetryAttempt: new Date()
        }
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Retry process initiated',
      redirectTo: '/onboarding',
      currentConfidence: currentConfidence,
      profileType: profileType
    });

  } catch (error) {
    console.error('❌ [Retry Taste Collection] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
