// pages/api/user/dashboard-status.js
// 🎵 DASHBOARD STATUS API ENDPOINT
// Returns real-time status for dashboard loading states

import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { connectToDatabase } from "@/lib/mongodb";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session?.user?.email) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    const userEmail = session.user.email;
    
    // Check taste collection status
    const [collectionStatus, tasteProfile, eventsCount] = await Promise.all([
      db.collection('user_taste_collection_status').findOne({ userEmail }),
      db.collection('user_taste_profiles').findOne({ userEmail }),
      db.collection('events_unified').countDocuments({ 
        // Basic filter for events in the next 30 days
        date: { 
          $gte: new Date(), 
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) 
        }
      })
    ]);
    
    // Determine overall dashboard state
    const dashboardStatus = determineDashboardStatus(
      collectionStatus, 
      tasteProfile, 
      eventsCount,
      session
    );
    
    return res.status(200).json({
      success: true,
      status: dashboardStatus,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting dashboard status:', error);
    return res.status(500).json({ 
      error: 'Failed to get dashboard status',
      message: error.message 
    });
  }
}

function determineDashboardStatus(collectionStatus, tasteProfile, eventsCount, session) {
  const isFirstLogin = !tasteProfile;
  const hasRecentProfile = tasteProfile && isDataFresh(tasteProfile.lastUpdated);
  
  // First login detection
  if (isFirstLogin || !hasRecentProfile) {
    return {
      userType: 'first_login',
      tasteCollection: collectionStatus?.status || 'needed',
      eventsStatus: 'pending',
      showTasteLoader: true,
      showEventsLoader: false,
      message: 'Understanding your music taste',
      recommendations: [
        'Connecting to your Spotify account...',
        'Analyzing your top artists and tracks...',
        'Building your genre profile...'
      ]
    };
  }
  
  // Returning user with fresh data
  if (hasRecentProfile) {
    return {
      userType: 'returning_user',
      tasteCollection: 'complete',
      eventsStatus: eventsCount > 0 ? 'available' : 'loading',
      showTasteLoader: false,
      showEventsLoader: eventsCount === 0,
      profileLastUpdated: tasteProfile.lastUpdated,
      eventsFound: eventsCount,
      message: eventsCount > 0 
        ? `Found ${eventsCount} events matching your taste`
        : 'Fetching your events',
      recommendations: [
        'Your music profile is ready',
        `Last updated: ${getTimeAgo(tasteProfile.lastUpdated)}`,
        eventsCount > 0 
          ? `${eventsCount} events match your vibe`
          : 'Finding events that match your taste...'
      ]
    };
  }
  
  // Edge case: unclear state
  return {
    userType: 'unknown',
    tasteCollection: 'checking',
    eventsStatus: 'checking',
    showTasteLoader: true,
    showEventsLoader: false,
    message: 'Loading your dashboard',
    recommendations: [
      'Checking your account status...',
      'Preparing your personalized experience...'
    ]
  };
}

function isDataFresh(lastUpdated, maxAgeHours = 24) {
  if (!lastUpdated) return false;
  
  const now = new Date();
  const updated = new Date(lastUpdated);
  const hoursSince = (now - updated) / (1000 * 60 * 60);
  
  return hoursSince < maxAgeHours;
}

function getTimeAgo(date) {
  if (!date) return 'Unknown';
  
  const now = new Date();
  const updated = new Date(date);
  const minutesAgo = Math.floor((now - updated) / (1000 * 60));
  
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  
  const hoursAgo = Math.floor(minutesAgo / 60);
  if (hoursAgo < 24) return `${hoursAgo}h ago`;
  
  const daysAgo = Math.floor(hoursAgo / 24);
  return `${daysAgo}d ago`;
}
