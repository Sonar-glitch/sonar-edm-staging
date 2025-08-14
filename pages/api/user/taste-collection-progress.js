// pages/api/user/taste-collection-progress.js
// 🎵 REAL-TIME TASTE COLLECTION PROGRESS API
// Returns current status of user's music taste collection process

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
    
    // Get current collection status
    const [collectionStatus, tasteProfile, soundProfile] = await Promise.all([
      db.collection('user_taste_collection_status').findOne({ userEmail }),
      db.collection('user_taste_profiles').findOne({ userEmail }),
      db.collection('user_sound_profiles').findOne({ userEmail })
    ]);
    
    // Determine realistic progress
    const progress = determineCollectionProgress(collectionStatus, tasteProfile, soundProfile);
    
    return res.status(200).json({
      success: true,
      status: progress,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting taste collection progress:', error);
    return res.status(500).json({ 
      error: 'Failed to get progress',
      message: error.message 
    });
  }
}

function determineCollectionProgress(collectionStatus, tasteProfile, soundProfile) {
  const now = new Date();
  
  // 🎯 ACTIVE SESSION CHECK: Look for recent collection status
  if (collectionStatus) {
    const lastUpdated = new Date(collectionStatus.lastUpdated || collectionStatus.createdAt);
    const minutesSinceUpdate = (now - lastUpdated) / (1000 * 60);
    
    // If collection status is very recent (< 5 minutes) and active, use it
    if (minutesSinceUpdate < 5 && collectionStatus.status === 'in_progress') {
      return {
        overall: 'in_progress',
        spotify: collectionStatus.spotify?.status || 'in_progress',
        essentia: collectionStatus.essentia?.status || 'pending',
        seasonal: collectionStatus.seasonal?.status || 'pending',
        currentStep: collectionStatus.currentStep || 'Starting music analysis...',
        details: collectionStatus.details || 'Processing your music data',
        percentage: collectionStatus.percentage || 10,
        tracksAnalyzed: collectionStatus.tracksAnalyzed || 0,
        artistsAnalyzed: collectionStatus.artistsAnalyzed || 0,
        isRealTime: true
      };
    }
  }
  
  // 🎯 COMPLETION TRACKING: Calculate actual progress from available data
  if (tasteProfile || soundProfile) {
    const completion = calculateDetailedCompletion(tasteProfile, soundProfile);
    
    // Check if this is a recent session (< 30 minutes) with incomplete data
    const profileLastUpdated = tasteProfile ? new Date(tasteProfile.lastUpdated) : null;
    const soundLastUpdated = soundProfile ? new Date(soundProfile.lastEssentiaAnalysis || soundProfile.lastUpdated) : null;
    const mostRecentUpdate = profileLastUpdated && soundLastUpdated 
      ? new Date(Math.max(profileLastUpdated, soundLastUpdated))
      : profileLastUpdated || soundLastUpdated;
    
    const minutesSinceLastUpdate = mostRecentUpdate ? (now - mostRecentUpdate) / (1000 * 60) : 60;
    const isRecentSession = minutesSinceLastUpdate < 30;
    
    // 🎯 ACTIVE ANALYSIS: Recent session with missing components
    if (isRecentSession && completion.percentage < 100) {
      let currentStep, details, percentage;
      
      if (!completion.sections.spotify.complete) {
        currentStep = 'Collecting Spotify data...';
        details = 'Fetching your top artists and tracks';
        percentage = 20;
      } else if (!completion.sections.essentia.complete) {
        currentStep = 'Analyzing audio characteristics...';
        details = 'This may take 30-60 seconds for detailed analysis';
        percentage = 60;
      } else if (!completion.sections.seasonal.complete) {
        currentStep = 'Building seasonal profile...';
        details = 'Analyzing listening patterns over time';
        percentage = 85;
      } else {
        currentStep = 'Finalizing your profile...';
        details = 'Completing music taste analysis';
        percentage = 95;
      }
      
      return {
        overall: 'in_progress',
        spotify: completion.sections.spotify.complete ? 'complete' : 'in_progress',
        essentia: completion.sections.essentia.complete ? 'complete' : 'in_progress',
        seasonal: completion.sections.seasonal.complete ? 'complete' : 'pending',
        currentStep,
        details,
        percentage,
        tracksAnalyzed: completion.totalTracksAnalyzed,
        artistsAnalyzed: completion.totalArtistsAnalyzed,
        isRealTime: false,
        completion: completion
      };
    }
    
    // 🎯 COMPLETED ANALYSIS: Show final results with confidence
    if (completion.percentage >= 100) {
      return {
        overall: 'complete',
        spotify: 'complete',
        essentia: 'complete',
        seasonal: 'complete',
        currentStep: 'Your music profile is complete!',
        details: `Analysis complete with ${Math.round(completion.confidence * 100)}% confidence`,
        percentage: 100,
        tracksAnalyzed: completion.totalTracksAnalyzed,
        artistsAnalyzed: completion.totalArtistsAnalyzed,
        completion: completion
      };
    }
    
    // 🎯 PARTIAL DATA: Timeout reached, populate what's available
    if (completion.percentage > 0) {
      return {
        overall: 'partial_complete',
        spotify: completion.sections.spotify.complete ? 'complete' : 'timeout',
        essentia: completion.sections.essentia.complete ? 'complete' : 'timeout',
        seasonal: completion.sections.seasonal.complete ? 'complete' : 'timeout',
        currentStep: `Analysis timed out - ${Math.round(completion.percentage)}% complete`,
        details: `Using available data with ${Math.round(completion.confidence * 100)}% confidence`,
        percentage: completion.percentage,
        tracksAnalyzed: completion.totalTracksAnalyzed,
        artistsAnalyzed: completion.totalArtistsAnalyzed,
        completion: completion
      };
    }
  }
  
  // 🎯 NOT STARTED: Fresh state
  return {
    overall: 'not_started',
    spotify: 'pending',
    essentia: 'pending',
    seasonal: 'pending',
    currentStep: 'Ready to analyze your music taste',
    details: 'Click to start building your personalized profile',
    percentage: 0,
    tracksAnalyzed: 0,
    artistsAnalyzed: 0
  };
}

// 🎯 NEW: Calculate detailed completion with confidence scoring
function calculateDetailedCompletion(tasteProfile, soundProfile) {
  const sections = {
    spotify: {
      complete: tasteProfile?.topArtists && tasteProfile.topArtists.length >= 5,
      tracksAnalyzed: tasteProfile?.topTracks?.length || 0,
      artistsAnalyzed: tasteProfile?.topArtists?.length || 0,
      confidence: tasteProfile?.topArtists?.length >= 10 ? 0.9 : 
                 (tasteProfile?.topArtists?.length || 0) * 0.09,
      label: tasteProfile?.topArtists?.length >= 10 ? 'Real Data' :
             tasteProfile?.topArtists?.length > 0 ? `Partial (${tasteProfile.topArtists.length} tracks)` : 'Fallback'
    },
    essentia: {
      complete: (tasteProfile?.audioFeatures || soundProfile?.soundCharacteristics) && 
                (tasteProfile?.essentiaProfile?.tracksAnalyzed || soundProfile?.trackMatrices?.length || 0) >= 5,
      tracksAnalyzed: tasteProfile?.essentiaProfile?.tracksAnalyzed || soundProfile?.trackMatrices?.length || 0,
      confidence: (() => {
        const tracks = tasteProfile?.essentiaProfile?.tracksAnalyzed || soundProfile?.trackMatrices?.length || 0;
        return tracks >= 10 ? 0.9 : tracks * 0.09;
      })(),
      label: (() => {
        const tracks = tasteProfile?.essentiaProfile?.tracksAnalyzed || soundProfile?.trackMatrices?.length || 0;
        return tracks >= 10 ? 'Real Data' : tracks > 0 ? `Partial (${tracks} tracks)` : 'Fallback';
      })()
    },
    seasonal: {
      complete: tasteProfile?.seasonalProfile && Object.keys(tasteProfile.seasonalProfile).length >= 2,
      tracksAnalyzed: tasteProfile?.seasonalProfile?.tracksAnalyzed || 0,
      confidence: tasteProfile?.seasonalProfile ? 0.8 : 0,
      label: tasteProfile?.seasonalProfile ? 'Real Data' : 'Fallback'
    }
  };
  
  const completedSections = Object.values(sections).filter(s => s.complete).length;
  const totalSections = Object.keys(sections).length;
  const percentage = (completedSections / totalSections) * 100;
  
  // Calculate overall confidence (weighted average)
  const weights = { spotify: 0.3, essentia: 0.5, seasonal: 0.2 };
  const confidence = Object.entries(sections).reduce((sum, [key, section]) => {
    return sum + (section.confidence * weights[key]);
  }, 0);
  
  const totalTracksAnalyzed = sections.spotify.tracksAnalyzed + sections.essentia.tracksAnalyzed;
  const totalArtistsAnalyzed = sections.spotify.artistsAnalyzed;
  
  return {
    percentage,
    confidence,
    sections,
    totalTracksAnalyzed,
    totalArtistsAnalyzed,
    completedSections,
    totalSections
  };
}
