// pages/api/user/delete-account.js
// 🗑️ DELETE ACCOUNT API
// Deletes user profile and forces fresh onboarding experience

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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Must be logged in to delete account' 
      });
    }

    const client = await connectToDatabase();
    const db = client.db('sonar');

    console.log(`🗑️ Deleting account for: ${session.user.email}`);

    // Find and delete user profile
    const deleteResult = await db.collection('userProfiles').deleteOne({
      email: session.user.email
    });

    if (deleteResult.deletedCount > 0) {
      console.log(`✅ Deleted user profile for: ${session.user.email}`);
      
      // Also delete any related user data (preferences, etc.)
      await Promise.all([
        db.collection('userPreferences').deleteMany({ email: session.user.email }),
        db.collection('userInteractions').deleteMany({ email: session.user.email }),
        // Add other collections as needed
      ]);

      return res.status(200).json({
        success: true,
        message: 'Account deleted successfully',
        profileDeleted: true,
        relatedDataDeleted: true
      });
    } else {
      // No profile found - user already doesn't have a profile
      return res.status(200).json({
        success: true,
        message: 'No profile found to delete',
        profileDeleted: false,
        alreadyNewUser: true
      });
    }

  } catch (error) {
    console.error('❌ [Delete Account] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
