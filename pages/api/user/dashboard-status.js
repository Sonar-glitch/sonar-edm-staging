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
    
    console.log('🔍 Dashboard API called - Session:', !!session, session?.user?.email);
    
    if (!session?.user?.email) {
      console.log('❌ Dashboard API: No session or email');
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { db } = await connectToDatabase();
    const userEmail = session.user.email;
    
    console.log('🔍 Dashboard API: Checking for user:', userEmail);
    
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
    
    console.log('🔍 Dashboard API Data:');
    console.log('   Collection Status:', collectionStatus?.status);
    console.log('   Taste Profile exists:', !!tasteProfile);
    console.log('   Top Artists:', tasteProfile?.topArtists?.length || 0);
    console.log('   Events Count:', eventsCount);
    
    // Determine overall dashboard state
    const dashboardStatus = determineDashboardStatus(
      collectionStatus, 
      tasteProfile, 
      eventsCount,
      session
    );
    
    console.log('🔍 Dashboard API Response:');
    console.log('   User Type:', dashboardStatus.userType);
    console.log('   Show Taste Loader:', dashboardStatus.showTasteLoader);
    console.log('   Message:', dashboardStatus.message);
    
    // 🎯 ADD: Data sources for frontend section indicators
    const completionData = calculateCompletionPercentage(tasteProfile);
    const dataSources = {
      spotify: {
        isRealData: completionData.sections.spotify.hasData,
        tracksAnalyzed: completionData.sections.spotify.tracksAnalyzed,
        confidence: completionData.sections.spotify.confidence,
        label: completionData.sections.spotify.label,
        source: 'spotify_api',
        lastFetch: tasteProfile?.lastUpdated,
        error: completionData.sections.spotify.hasData ? null : 'INSUFFICIENT_DATA'
      },
      soundstat: {
        isRealData: completionData.sections.soundCharacteristics.hasData,
        tracksAnalyzed: completionData.sections.soundCharacteristics.tracksAnalyzed,
        confidence: completionData.sections.soundCharacteristics.confidence,
        label: completionData.sections.soundCharacteristics.label,
        source: 'spotify_audio_features',
        lastFetch: tasteProfile?.lastUpdated,
        error: completionData.sections.soundCharacteristics.hasData ? null : 'NO_AUDIO_ANALYSIS'
      },
      seasonal: {
        isRealData: completionData.sections.seasonal.hasData,
        tracksAnalyzed: completionData.sections.seasonal.tracksAnalyzed,
        confidence: completionData.sections.seasonal.confidence,
        label: completionData.sections.seasonal.label,
        source: 'listening_history',
        lastFetch: tasteProfile?.lastUpdated,
        error: completionData.sections.seasonal.hasData ? null : 'NO_SEASONAL_DATA'
      },
      events: {
        isRealData: eventsCount > 0,
        eventsFound: eventsCount,
        confidence: eventsCount > 10 ? 0.9 : eventsCount * 0.09,
        label: eventsCount > 0 ? 'Real Data' : 'Demo Data',
        location: 'Montreal', // TODO: Get from user location
        lastFetch: new Date().toISOString(),
        error: eventsCount > 0 ? null : 'NO_LOCATION_SET'
      }
    };
    
    return res.status(200).json({
      success: true,
      status: dashboardStatus,
      dataSources: dataSources,
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
  
  // 🎯 IMPROVED FIRST LOGIN DETECTION: Check if profile is empty/failed
  const isFirstLogin = !tasteProfile || 
    (!tasteProfile.topArtists?.length && 
     !tasteProfile.topTracks?.length && 
     !tasteProfile.enhancedGenreProfile) ||
    collectionStatus?.status === 'failed';
  
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
  
  // 🎯 FIXED: Use actual data structure from database
  const topArtistsCount = tasteProfile.topArtists?.length || 0;
  const topTracksCount = tasteProfile.topTracks?.length || 0;
  const hasGenreProfile = tasteProfile.enhancedGenreProfile && Object.keys(tasteProfile.enhancedGenreProfile.primary || {}).length > 0;
  const hasAudioFeatures = tasteProfile.audioFeatures && Object.keys(tasteProfile.audioFeatures).length > 0;
  
  const sections = {
    spotify: {
      hasData: topArtistsCount > 0,
      tracksAnalyzed: topArtistsCount,
      confidence: topArtistsCount >= 10 ? 0.9 : topArtistsCount * 0.09,
      label: topArtistsCount >= 10 ? 'Real Data' : 
             topArtistsCount >= 5 ? `Partial Data (${topArtistsCount} artists)` : 
             topArtistsCount > 0 ? `Limited Data (${topArtistsCount} artists)` : 'Fallback Data'
    },
    soundCharacteristics: {
      hasData: hasAudioFeatures,
      tracksAnalyzed: topTracksCount, // Use tracks count as proxy for sound analysis
      confidence: hasAudioFeatures ? 0.8 : 0,
      label: hasAudioFeatures && topTracksCount >= 10 ? 'Real Data' :
             hasAudioFeatures && topTracksCount > 0 ? `Partial Data (${topTracksCount} tracks)` : 'Fallback Data'
    },
    genres: {
      hasData: hasGenreProfile,
      tracksAnalyzed: topArtistsCount, // Use artists count for genre analysis
      confidence: hasGenreProfile ? 0.9 : 0,
      label: hasGenreProfile ? 'Real Data' : 'Fallback Data'
    },
    seasonal: {
      hasData: hasAudioFeatures, // Use audio features as proxy for seasonal analysis
      tracksAnalyzed: topTracksCount,
      confidence: hasAudioFeatures && topTracksCount >= 20 ? 0.7 : hasAudioFeatures ? 0.5 : 0,
      label: hasAudioFeatures && topTracksCount >= 20 ? 'Real Data' :
             hasAudioFeatures && topTracksCount >= 10 ? `Partial Data (${topTracksCount} tracks)` :
             hasAudioFeatures ? `Limited Data (${topTracksCount} tracks)` : 'Fallback Data'
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
