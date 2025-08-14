// CACHE REFRESH API
// Allows users to manually refresh their cached profile data
// Triggers fresh Spotify data collection and updates cache

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    const userId = session.user.id || session.user.email;

    console.log(`🔄 Manual cache refresh requested for ${userId}`);

    // Delete existing cached profile to force fresh generation
    await db.collection('user_sound_profiles').deleteOne({ userId });
    
    // Also clear any progress tracking
    await db.collection('tasteCollectionProgress').deleteOne({ 
      email: session.user.email 
    });

    console.log(`✅ Cache cleared for ${userId}, fresh profile will be generated on next request`);

    return res.status(200).json({
      success: true,
      message: 'Cache refreshed successfully',
      action: 'reload_dashboard',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error refreshing cache:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}
