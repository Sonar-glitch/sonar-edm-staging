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
  // Check if there's an active collection session first
  if (collectionStatus) {
    // Check if the collection status is recent (within last 10 minutes)
    const lastUpdated = new Date(collectionStatus.lastUpdated || collectionStatus.createdAt);
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    
    if (lastUpdated > tenMinutesAgo && collectionStatus.status === 'in_progress') {
      // Active session - return the stored progress
      return {
        overall: collectionStatus.status || 'in_progress',
        spotify: collectionStatus.spotify?.status || 'in_progress',
        essentia: collectionStatus.essentia?.status || 'pending',
        seasonal: collectionStatus.seasonal?.status || 'pending',
        currentStep: collectionStatus.currentStep || 'Collecting your music data...',
        details: collectionStatus.details || '',
        percentage: collectionStatus.percentage || 20
      };
    }
  }

  // If we have a complete taste profile, check if it's actually complete or just stale
  if (tasteProfile) {
    const hasSpotifyData = tasteProfile.topArtists && tasteProfile.topTracks;
    const hasAudioFeatures = tasteProfile.audioFeatures || (soundProfile && soundProfile.soundCharacteristics);
    const hasGenreProfile = tasteProfile.enhancedGenreProfile;
    
    // Check if this profile is recent (within last hour) to determine if it's an active session
    const profileLastUpdated = new Date(tasteProfile.lastUpdated);
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const isRecentProfile = profileLastUpdated > oneHourAgo;
    
    // If profile is old and incomplete, treat as not started (stale data)
    if (!isRecentProfile && !hasAudioFeatures) {
      return {
        overall: 'not_started',
        spotify: 'pending',
        essentia: 'pending',
        seasonal: 'pending',
        currentStep: 'Ready to analyze your music taste',
        details: 'Previous session expired. Click to start fresh analysis.',
        percentage: 0
      };
    }
    
    let progress = {
      overall: 'complete',
      spotify: hasSpotifyData ? 'complete' : 'pending',
      essentia: hasAudioFeatures ? 'complete' : 'pending',
      seasonal: hasGenreProfile ? 'complete' : 'pending',
      currentStep: 'Your music profile is complete!',
      details: 'Ready to find your perfect events',
      percentage: 100,
      tracksAnalyzed: tasteProfile.topTracks?.length || 0,
      artistsAnalyzed: tasteProfile.topArtists?.length || 0
    };

    // Only show in_progress if we have recent data and missing components
    if (isRecentProfile && hasSpotifyData && !hasAudioFeatures) {
      progress.overall = 'in_progress';
      progress.essentia = 'in_progress';
      progress.percentage = 60;
      progress.currentStep = 'Analyzing audio characteristics...';
      progress.details = 'This may take 30-60 seconds for detailed analysis';
    } else if (isRecentProfile && hasSpotifyData && hasAudioFeatures && !hasGenreProfile) {
      progress.overall = 'in_progress';
      progress.seasonal = 'in_progress';
      progress.percentage = 90;
      progress.currentStep = 'Mapping genres to events...';
      progress.details = 'Finding EDM events that match your taste';
    }

    return progress;
  }

  // Default state - not started
  return {
    overall: 'not_started',
    spotify: 'pending',
    essentia: 'pending',
    seasonal: 'pending',
    currentStep: 'Ready to analyze your music taste',
    details: 'Click to start building your personalized profile',
    percentage: 0
  };
}
