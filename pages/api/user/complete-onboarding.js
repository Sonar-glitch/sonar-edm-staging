// pages/api/user/complete-onboarding.js
// 🎵 COMPLETE ONBOARDING API
// Creates user profile after first-time onboarding completion

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
        message: 'Must be logged in to complete onboarding' 
      });
    }

    const client = await connectToDatabase();
    const db = client.db('sonar');

    // Check if user already has a profile
    const existingProfile = await db.collection('userProfiles').findOne({
      email: session.user.email
    });

    if (existingProfile) {
      return res.status(200).json({
        success: true,
        message: 'User profile already exists',
        profileId: existingProfile._id
      });
    }

    // Get request body for fallback data
    const { fallback, error, confidence } = req.body || {};

    // Create new user profile
    const userProfile = {
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      spotifyId: session.user.id || null,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Profile type
      profileType: fallback ? 'fallback' : 'minimal',
      
      tasteProfile: fallback ? {
        genres: [],
        audioProfile: null,
        confidence: confidence || { score: 10, level: 'low', factors: ['minimal profile'] },
        lastUpdated: new Date(),
        source: 'fallback',
        error: error || 'Unknown error during collection'
      } : {
        genres: [],
        audioProfile: null,
        confidence: { score: 0, level: 'none', factors: ['no data collected'] },
        lastUpdated: new Date(),
        source: 'minimal'
      },
      
      preferences: {
        genres: [],
        artists: [],
        venues: [],
        eventTypes: [],
        priceRanges: []
      }
    };

    const result = await db.collection('userProfiles').insertOne(userProfile);

    console.log('✅ [Complete Onboarding] Created profile:', {
      email: session.user.email,
      profileId: result.insertedId,
      type: userProfile.profileType
    });

    return res.status(200).json({
      success: true,
      message: `${fallback ? 'Fallback' : 'Minimal'} profile created successfully`,
      profileId: result.insertedId,
      profileType: userProfile.profileType,
      confidence: userProfile.tasteProfile.confidence
    });

  } catch (error) {
    console.error('❌ [Complete Onboarding] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
