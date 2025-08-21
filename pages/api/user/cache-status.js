import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    
    // Get cache statistics
    const totalProfiles = await db.collection('user_sound_profiles').countDocuments();
    const activeProfiles = await db.collection('user_sound_profiles').countDocuments({
      expiresAt: { $gt: new Date() }
    });
    const expiredProfiles = totalProfiles - activeProfiles;
    
    // Get cache hit rate (approximate from recent profiles)
    const recentProfiles = await db.collection('user_sound_profiles')
      .find({ createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    
    // Get profile age distribution
    const profileAges = recentProfiles.map(profile => {
      const ageHours = (new Date() - profile.createdAt) / (1000 * 60 * 60);
      return {
        userId: profile.userId,
        ageHours: Math.round(ageHours * 10) / 10,
        confidence: profile.confidence,
        tracksAnalyzed: profile.tracksAnalyzed,
        source: profile.source
      };
    });
    
    // Get current user's profile status
    const userId = session.user.id || session.user.email;
    const userProfile = await db.collection('user_sound_profiles').findOne({
      userId,
      expiresAt: { $gt: new Date() }
    });
    
    const userProfileStatus = userProfile ? {
      exists: true,
      ageMinutes: Math.floor((new Date() - userProfile.createdAt) / (1000 * 60)),
      confidence: userProfile.confidence,
      tracksAnalyzed: userProfile.tracksAnalyzed,
      source: userProfile.source,
      expiresIn: Math.floor((userProfile.expiresAt - new Date()) / (1000 * 60 * 60))
    } : {
      exists: false
    };
    
    // Calculate estimated cache hit rate
    const cacheHitRate = activeProfiles > 0 ? Math.round((activeProfiles / (activeProfiles + 1)) * 100) : 0;
    
    const stats = {
      cache: {
        totalProfiles,
        activeProfiles,
        expiredProfiles,
        hitRate: `${cacheHitRate}%`,
        efficiency: activeProfiles > 0 ? 'Good' : 'Low'
      },
      currentUser: userProfileStatus,
      recentActivity: {
        profilesGenerated24h: recentProfiles.length,
        averageConfidence: recentProfiles.length > 0 
          ? Math.round(recentProfiles.reduce((sum, p) => sum + p.confidence, 0) / recentProfiles.length * 100) / 100
          : 0,
        averageTracksAnalyzed: recentProfiles.length > 0
          ? Math.round(recentProfiles.reduce((sum, p) => sum + p.tracksAnalyzed, 0) / recentProfiles.length)
          : 0
      },
      profileAges,
      system: {
        cacheEnabled: true,
        ttlHours: 24,
        maxProfiles: 'Unlimited',
        autoCleanup: 'MongoDB TTL'
      },
      recommendations: generateRecommendations(totalProfiles, activeProfiles, recentProfiles)
    };
    
    return res.json(stats);
    
  } catch (error) {
    console.error('❌ Error in cache status API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch cache status',
      message: error.message 
    });
  }
}

function generateRecommendations(total, active, recent) {
  const recommendations = [];
  
  if (active === 0) {
    recommendations.push({
      type: 'warning',
      message: 'No active cached profiles. System will generate profiles on-demand.',
      action: 'Consider pre-warming cache for frequent users'
    });
  }
  
  if (recent.length > 0) {
    const lowConfidence = recent.filter(p => p.confidence < 0.5).length;
    if (lowConfidence > recent.length * 0.3) {
      recommendations.push({
        type: 'info',
        message: `${lowConfidence} profiles have low confidence (<0.5)`,
        action: 'Consider implementing Essentia audio analysis for better accuracy'
      });
    }
  }
  
  if (total > 1000) {
    recommendations.push({
      type: 'info',
      message: 'High cache usage detected',
      action: 'Monitor memory usage and consider cache size limits'
    });
  }
  
  const avgTracks = recent.length > 0 
    ? recent.reduce((sum, p) => sum + p.tracksAnalyzed, 0) / recent.length 
    : 0;
    
  if (avgTracks < 10) {
    recommendations.push({
      type: 'warning',
      message: 'Low track analysis count may affect recommendation quality',
      action: 'Encourage users to listen to more music or extend analysis period'
    });
  }
  
  return recommendations;
}
