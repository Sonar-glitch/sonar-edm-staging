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
  const now = new Date();
  const isFirstLogin = !tasteProfile;
  
  // 🎯 FIRST LOGIN LOGIC: Always trigger new analysis
  if (isFirstLogin) {
    return {
      userType: 'first_login',
      tasteCollection: 'needed',
      eventsStatus: 'pending',
      showTasteLoader: true,
      showEventsLoader: false,
      message: 'First login - building your music profile',
      trigger: 'immediate',
      recommendations: [
        'Connecting to your Spotify account...',
        'Analyzing your top artists and tracks...',
        'Building your personalized genre profile...'
      ]
    };
  }
  
  // 🎯 RETURNING USER LOGIC: 24-hour analysis limit
  const lastAnalysis = tasteProfile.lastUpdated ? new Date(tasteProfile.lastUpdated) : null;
  const hoursSinceLastAnalysis = lastAnalysis ? (now - lastAnalysis) / (1000 * 60 * 60) : 24;
  const canTriggerNewAnalysis = hoursSinceLastAnalysis >= 24;
  
  // Check completion percentage and data quality
  const completionData = calculateCompletionPercentage(tasteProfile);
  const { completionPercent, confidence, sections } = completionData;
  
  // 🎯 RETURNING USER - NEEDS NEW ANALYSIS (24 hours passed)
  if (canTriggerNewAnalysis) {
    return {
      userType: 'returning_user_refresh',
      tasteCollection: 'needed',
      eventsStatus: 'pending',
      showTasteLoader: true,
      showEventsLoader: false,
      message: 'Refreshing your music profile (24+ hours since last update)',
      trigger: 'scheduled',
      lastAnalysis: lastAnalysis?.toISOString(),
      hoursSinceLastAnalysis: Math.round(hoursSinceLastAnalysis),
      previousCompletion: completionPercent,
      recommendations: [
        'Updating your music taste profile...',
        'Analyzing new listening patterns...',
        'Finding fresh events that match your vibe...'
      ]
    };
  }
  
  // 🎯 RETURNING USER - RECENT DATA (< 24 hours)
  return {
    userType: 'returning_user_current',
    tasteCollection: 'complete',
    eventsStatus: eventsCount > 0 ? 'available' : 'loading',
    showTasteLoader: false,
    showEventsLoader: eventsCount === 0,
    message: `Profile ready (${Math.round(completionPercent)}% complete)`,
    trigger: 'none',
    profileLastUpdated: lastAnalysis?.toISOString(),
    eventsFound: eventsCount,
    hoursSinceLastAnalysis: Math.round(hoursSinceLastAnalysis),
    completion: {
      percent: completionPercent,
      confidence: confidence,
      sections: sections
    },
    recommendations: [
      `Your music profile is ${Math.round(completionPercent)}% complete`,
      `Confidence: ${Math.round(confidence * 100)}% (${sections.real}/${sections.total} sections with real data)`,
      `Next refresh in ${24 - Math.round(hoursSinceLastAnalysis)} hours`,
      eventsCount > 0 
        ? `${eventsCount} events match your vibe`
        : 'Finding events that match your taste...'
    ]
  };
}

// 🎯 NEW: Calculate completion percentage and confidence
function calculateCompletionPercentage(tasteProfile) {
  if (!tasteProfile) {
    return { completionPercent: 0, confidence: 0, sections: { real: 0, total: 4, labels: {} } };
  }
  
  const sections = {
    spotify: {
      hasData: tasteProfile.topArtists && tasteProfile.topArtists.length > 0,
      tracksAnalyzed: tasteProfile.topTracks?.length || 0,
      confidence: tasteProfile.topArtists?.length >= 10 ? 0.9 : (tasteProfile.topArtists?.length || 0) * 0.09,
      label: tasteProfile.topArtists?.length >= 10 ? 'Real Data' : 
             tasteProfile.topArtists?.length > 0 ? `Partial Data (${tasteProfile.topArtists.length} tracks)` : 'Fallback Data'
    },
    soundCharacteristics: {
      hasData: tasteProfile.audioFeatures || tasteProfile.essentiaProfile,
      tracksAnalyzed: tasteProfile.essentiaProfile?.tracksAnalyzed || 0,
      confidence: tasteProfile.essentiaProfile?.tracksAnalyzed >= 10 ? 0.9 : 
                 (tasteProfile.essentiaProfile?.tracksAnalyzed || 0) * 0.09,
      label: tasteProfile.essentiaProfile?.tracksAnalyzed >= 10 ? 'Real Data' :
             tasteProfile.essentiaProfile?.tracksAnalyzed > 0 ? `Partial Data (${tasteProfile.essentiaProfile.tracksAnalyzed} tracks)` : 'Fallback Data'
    },
    genres: {
      hasData: tasteProfile.enhancedGenreProfile,
      tracksAnalyzed: tasteProfile.enhancedGenreProfile?.tracksAnalyzed || 0,
      confidence: tasteProfile.enhancedGenreProfile ? 0.9 : 0,
      label: tasteProfile.enhancedGenreProfile ? 'Real Data' : 'Fallback Data'
    },
    seasonal: {
      hasData: tasteProfile.seasonalProfile,
      tracksAnalyzed: tasteProfile.seasonalProfile?.tracksAnalyzed || 0,
      confidence: tasteProfile.seasonalProfile?.tracksAnalyzed >= 10 ? 0.9 : 
                 (tasteProfile.seasonalProfile?.tracksAnalyzed || 0) * 0.09,
      label: tasteProfile.seasonalProfile?.tracksAnalyzed >= 10 ? 'Real Data' :
             tasteProfile.seasonalProfile?.tracksAnalyzed > 0 ? `Partial Data (${tasteProfile.seasonalProfile.tracksAnalyzed} tracks)` : 'Fallback Data'
    }
  };
  
  const sectionArray = Object.values(sections);
  const completedSections = sectionArray.filter(s => s.hasData).length;
  const completionPercent = (completedSections / sectionArray.length) * 100;
  
  // Calculate overall confidence (average of non-zero confidences)
  const validConfidences = sectionArray.filter(s => s.confidence > 0);
  const confidence = validConfidences.length > 0 
    ? validConfidences.reduce((sum, s) => sum + s.confidence, 0) / validConfidences.length 
    : 0;
  
  return {
    completionPercent,
    confidence,
    sections: {
      real: validConfidences.length,
      total: sectionArray.length,
      labels: {
        spotify: sections.spotify.label,
        soundCharacteristics: sections.soundCharacteristics.label,
        genres: sections.genres.label,
        seasonal: sections.seasonal.label
      },
      details: sections
    }
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
