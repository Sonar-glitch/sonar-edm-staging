// pages/api/user/profile-summary.js
// 👤 USER PROFILE SUMMARY API
// Returns brief user profile summary for profile button

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

    // Get user profile from database
    const userProfile = await db.collection('userProfiles').findOne({
      email: session.user.email
    });

    // Get recent events count (if any)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const eventCount = await db.collection('events_cache').countDocuments({
      timestamp: { $gte: oneWeekAgo }
    });

    // Build summary response
    const summary = {
      hasProfile: !!userProfile,
      lastUpdated: userProfile?.updatedAt || userProfile?.createdAt,
      eventCount: eventCount || 0,
      topGenres: [],
      confidence: 0
    };

    if (userProfile) {
      // Extract top genres from taste profile
      if (userProfile.tasteProfile?.genres) {
        summary.topGenres = userProfile.tasteProfile.genres
          .sort((a, b) => (b.weight || 0) - (a.weight || 0))
          .slice(0, 5)
          .map(g => g.name);
      }

      // Get overall confidence
      summary.confidence = userProfile.tasteProfile?.confidence || 0;
    }

    return res.status(200).json(summary);

  } catch (error) {
    console.error('Profile summary error:', error);
    return res.status(500).json({ error: 'Failed to load profile summary' });
  }
}
