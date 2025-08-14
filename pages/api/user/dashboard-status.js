// pages/api/user/dashboard-status.js
// 🎵 DASHBOARD STATUS API ENDPOINT
// Returns real-time status for dashboard loading states
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
    
    console.log('🔍 [User Dashboard API] Session:', session ? session.user.email : 'No session');
    
    const client = await connectToDatabase();
    const db = client.db('sonar');

    // 🎯 FIX: Check if THIS SPECIFIC USER has a profile, not total users globally
    let userHasProfile = false;
    let isFirstLogin = true;

    if (session && session.user) {
      const userProfile = await db.collection('userProfiles').findOne({ 
        email: session.user.email 
      });
      userHasProfile = !!userProfile;
      isFirstLogin = !userHasProfile; // First login if this user has no profile
      console.log('[User Dashboard API] User has profile:', userHasProfile);
    } else {
      console.log('[User Dashboard API] No session - user not logged in');
      // For non-authenticated users, don't show first-login onboarding
      isFirstLogin = false;
    }

    // Get basic stats
    const [eventsCount, artistsCount, totalUsers] = await Promise.all([
      db.collection('events_unified').countDocuments(),
      db.collection('artistGenres').countDocuments(),
      db.collection('userProfiles').countDocuments()
    ]);

    console.log('[User Dashboard API] Events count:', eventsCount);
    console.log('[User Dashboard API] Artists count:', artistsCount);
    console.log('[User Dashboard API] Total users:', totalUsers);

    const status = {
      showTasteLoader: isFirstLogin && !!session, // Only show for logged-in users with no profile
      showEventsLoader: false,
      isFirstLogin: isFirstLogin && !!session,    // Only true for logged-in users with no profile  
      userHasProfile: userHasProfile,
      isAuthenticated: !!session,
      userType: !session ? 'guest' : (userHasProfile ? 'returning' : 'first_login'),
      tasteCollection: !session ? 'guest' : (userHasProfile ? 'complete' : 'needed'),
      eventsStatus: 'loaded'
    };

    console.log('[User Dashboard API] Sending status:', JSON.stringify(status, null, 2));

    return res.status(200).json({
      success: true,
      status: status,
      stats: {
        totalUsers,
        eventsCount,
        artistsCount
      },
      debug: {
        mongoUri: process.env.MONGODB_URI ? 'configured' : 'missing',
        nodeEnv: process.env.NODE_ENV || 'not-set',
        userEmail: session?.user?.email || 'not-logged-in'
      }
    });

  } catch (error) {
    console.error('🔍 Dashboard API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      status: {
        showTasteLoader: false,
        showEventsLoader: false,
        isFirstLogin: false,
        userHasProfile: false,
        isAuthenticated: false,
        userType: 'error',
        tasteCollection: 'error',
        eventsStatus: 'error'
      }
    });
  }
}
