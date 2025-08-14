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
  // If we have a complete taste profile, determine realistic progress
  if (tasteProfile) {
    const hasSpotifyData = tasteProfile.topArtists && tasteProfile.topTracks;
    const hasAudioFeatures = tasteProfile.audioFeatures || soundProfile;
    const hasGenreProfile = tasteProfile.enhancedGenreProfile;
    
    let progress = {
      overall: 'in_progress',
      spotify: hasSpotifyData ? 'complete' : 'in_progress',
      essentia: 'pending',
      seasonal: 'pending',
      currentStep: 'Processing your music data...',
      details: '',
      percentage: 0,
      tracksAnalyzed: tasteProfile.topTracks?.length || 0,
      artistsAnalyzed: tasteProfile.topArtists?.length || 0
    };

    if (hasSpotifyData) {
      progress.percentage = 40;
      progress.currentStep = 'Spotify data collected successfully';
      progress.details = `Analyzed ${progress.tracksAnalyzed} tracks from ${progress.artistsAnalyzed} artists`;
      
      if (hasAudioFeatures) {
        progress.essentia = 'complete';
        progress.percentage = 80;
        progress.currentStep = 'Audio characteristics analyzed';
        progress.details = 'Your sound DNA profile is ready';
        
        if (hasGenreProfile) {
          progress.seasonal = 'complete';
          progress.overall = 'complete';
          progress.percentage = 100;
          progress.currentStep = 'Your music profile is complete!';
          progress.details = 'Ready to find your perfect events';
        } else {
          progress.seasonal = 'in_progress';
          progress.percentage = 90;
          progress.currentStep = 'Mapping genres to events...';
          progress.details = 'Finding EDM events that match your taste';
        }
      } else {
        progress.essentia = 'in_progress';
        progress.percentage = 60;
        progress.currentStep = 'Analyzing audio characteristics...';
        progress.details = 'This may take 30-60 seconds for detailed analysis';
      }
    }

    return progress;
  }

  // Check collection status for more granular info
  if (collectionStatus) {
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
