// lib/firstLoginTasteCollector.js
// 🎵 FIRST LOGIN TASTE COLLECTION SYSTEM
// Triggered automatically on user login for immediate music profile building

import { connectToDatabase } from './mongodb';
import {
  getTopArtistsAllRanges,
  getTopTracksAllRanges,
  getAudioFeaturesForTracks,
  getUserPlaylists,
  getRecentlyPlayed
} from './spotify';
import {
  getEnhancedGenreProfile,
  getEnhancedMoodProfile,
  getSoundCharacteristics
} from './moodUtils';

/**
 * MAIN FUNCTION: Triggered on user login to collect comprehensive taste data
 */
export async function triggerFirstLoginTasteCollection(user, account, options = {}) {
  console.log('🚀 FIRST LOGIN TASTE COLLECTION STARTED for:', user.email);
  console.log('   Priority:', options.priority || 'high');
  console.log('   Reason:', options.reason || 'login_detected');
  
  try {
    const startTime = Date.now();
    
    // PHASE 1: Mark user as "in progress" immediately
    await markUserTasteCollectionInProgress(user.email, {
      startedAt: new Date(),
      reason: options.reason,
      priority: options.priority
    });
    
    // PHASE 2: Collect comprehensive Spotify data (parallel for speed)
    console.log('   📊 Collecting Spotify data...');
    const spotifyData = await collectComprehensiveSpotifyData(account.access_token);
    
    const spotifyTime = Date.now() - startTime;
    console.log(`   ✅ Spotify data collected in ${spotifyTime}ms`);
    
    // PHASE 3: Process and enhance the data
    console.log('   🧠 Processing genre and mood profiles...');
    const enhancedData = await processSpotifyDataForTaste(spotifyData);
    
    // PHASE 4: Save initial complete profile to DB
    await saveCompleteTasteProfile(user.email, {
      ...spotifyData,
      ...enhancedData,
      status: 'spotify_complete',
      essentiaStatus: 'queued',
      collectedAt: new Date(),
      collectionDuration: Date.now() - startTime
    });
    
    // PHASE 5: Queue high-priority Essentia analysis for sound characteristics
    console.log('   🎵 Queueing Essentia analysis...');
    await queueUserEssentiaAnalysis(user.email, spotifyData.topTracks, {
      priority: options.priority === 'highest' ? 'user_immediate' : 'user_high',
      reason: options.reason || 'first_login'
    });
    
    const totalTime = Date.now() - startTime;
    console.log(`✅ First login taste collection completed in ${totalTime}ms`);
    
    return {
      success: true,
      duration: totalTime,
      tracksAnalyzed: spotifyData.topTracks?.length || 0,
      artistsAnalyzed: spotifyData.topArtists?.length || 0,
      essentiaQueued: true
    };
    
  } catch (error) {
    console.error('❌ First login taste collection failed:', error);
    await markUserTasteCollectionFailed(user.email, error.message);
    
    return {
      success: false,
      error: error.message,
      fallbackDataProvided: await provideFallbackTasteData(user.email)
    };
  }
}

/**
 * Collect ALL required Spotify data in parallel for maximum speed
 */
async function collectComprehensiveSpotifyData(accessToken) {
  const promises = [
    getTopArtistsAllRanges(accessToken, 50).catch(e => ({ error: e.message })),
    getTopTracksAllRanges(accessToken, 50).catch(e => ({ error: e.message })),
    getUserPlaylists(accessToken).catch(e => ({ error: e.message })),
    getRecentlyPlayed(accessToken).catch(e => ({ error: e.message }))
  ];
  
  const [topArtists, topTracks, playlists, recentlyPlayed] = await Promise.all(promises);
  
  // Get audio features for top tracks
  let audioFeatures = null;
  if (topTracks?.medium_term?.items) {
    const trackIds = topTracks.medium_term.items.map(track => track.id).slice(0, 50);
    audioFeatures = await getAudioFeaturesForTracks(accessToken, trackIds).catch(e => null);
  }
  
  return {
    topArtists,
    topTracks,
    audioFeatures,
    playlists,
    recentlyPlayed,
    collectedAt: new Date()
  };
}

/**
 * Process Spotify data into enhanced genre/mood profiles
 */
async function processSpotifyDataForTaste(spotifyData) {
  try {
    // Extract medium-term data as primary source
    const primaryArtists = spotifyData.topArtists?.medium_term?.items || [];
    const primaryTracks = spotifyData.topTracks?.medium_term?.items || [];
    
    // Generate enhanced profiles
    const enhancedGenreProfile = getEnhancedGenreProfile(primaryArtists);
    const enhancedMoodProfile = getEnhancedMoodProfile(spotifyData.audioFeatures);
    const soundCharacteristics = getSoundCharacteristics(spotifyData.audioFeatures);
    
    return {
      enhancedGenreProfile,
      enhancedMoodProfile,
      soundCharacteristics,
      primaryArtists: primaryArtists.slice(0, 20),
      primaryTracks: primaryTracks.slice(0, 20)
    };
    
  } catch (error) {
    console.error('Error processing Spotify data:', error);
    return {
      enhancedGenreProfile: { primary: {}, secondary: {} },
      enhancedMoodProfile: { primary: {}, emotional: {} },
      soundCharacteristics: {},
      primaryArtists: [],
      primaryTracks: []
    };
  }
}

/**
 * Queue user tracks for immediate Essentia analysis
 */
export async function queueUserEssentiaAnalysis(userEmail, topTracks, options = {}) {
  try {
    // Get user's top tracks for analysis (limit for speed)
    const tracksToAnalyze = topTracks?.medium_term?.items?.slice(0, 15) || [];
    
    if (tracksToAnalyze.length === 0) {
      console.log('⚠️ No tracks available for Essentia analysis');
      return { success: false, reason: 'no_tracks' };
    }
    
    console.log(`🎵 Queueing ${tracksToAnalyze.length} tracks for Essentia analysis`);
    
    // Send to Essentia service with high priority
    const response = await fetch('https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com/api/analyze-user-tracks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userEmail,
        tracks: tracksToAnalyze.map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0]?.name,
          preview_url: track.preview_url
        })),
        priority: options.priority || 'user_high',
        maxTracks: 15,
        reason: options.reason || 'first_login',
        callbackUrl: process.env.NEXTAUTH_URL + '/api/user/essentia-callback'
      }),
      timeout: 30000
    });
    
    if (!response.ok) {
      throw new Error(`Essentia service responded with ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ User Essentia analysis queued: ${result.queuePosition || 'immediate'}`);
      
      // Update user profile with queue status
      await updateUserEssentiaStatus(userEmail, {
        status: 'queued',
        queuePosition: result.queuePosition,
        tracksQueued: tracksToAnalyze.length,
        queuedAt: new Date()
      });
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ Failed to queue user Essentia analysis:', error);
    
    // Fallback: Mark as failed but continue with Spotify-only data
    await updateUserEssentiaStatus(userEmail, {
      status: 'failed',
      error: error.message,
      failedAt: new Date()
    });
    
    return { success: false, error: error.message };
  }
}

/**
 * Database operations for user taste collection status
 */
async function markUserTasteCollectionInProgress(userEmail, metadata) {
  const { db } = await connectToDatabase();
  
  await db.collection('user_taste_collection_status').updateOne(
    { userEmail },
    {
      $set: {
        status: 'in_progress',
        ...metadata,
        updatedAt: new Date()
      }
    },
    { upsert: true }
  );
}

async function saveCompleteTasteProfile(userEmail, profileData) {
  const { db } = await connectToDatabase();
  
  // Save to main user taste profiles collection
  await db.collection('user_taste_profiles').updateOne(
    { userEmail },
    {
      $set: {
        ...profileData,
        lastUpdated: new Date(),
        source: 'first_login_collector',
        version: '2.0'
      }
    },
    { upsert: true }
  );
  
  // Update collection status
  await db.collection('user_taste_collection_status').updateOne(
    { userEmail },
    {
      $set: {
        status: 'spotify_complete',
        essentiaStatus: profileData.essentiaStatus,
        completedAt: new Date(),
        duration: profileData.collectionDuration
      }
    }
  );
}

async function updateUserEssentiaStatus(userEmail, statusData) {
  const { db } = await connectToDatabase();
  
  await db.collection('user_taste_collection_status').updateOne(
    { userEmail },
    {
      $set: {
        essentiaStatus: statusData.status,
        essentiaDetails: statusData,
        essentiaUpdatedAt: new Date()
      }
    }
  );
}

async function markUserTasteCollectionFailed(userEmail, errorMessage) {
  const { db } = await connectToDatabase();
  
  await db.collection('user_taste_collection_status').updateOne(
    { userEmail },
    {
      $set: {
        status: 'failed',
        error: errorMessage,
        failedAt: new Date()
      }
    },
    { upsert: true }
  );
}

async function provideFallbackTasteData(userEmail) {
  // Provide basic fallback data so user doesn't see empty screen
  const fallbackData = {
    genreProfile: { 'Electronic': 50, 'House': 40, 'Techno': 30 },
    mood: { energetic: 50, melodic: 50 },
    source: 'fallback',
    note: 'Connect your Spotify account for personalized data'
  };
  
  const { db } = await connectToDatabase();
  await db.collection('user_taste_profiles').updateOne(
    { userEmail },
    { $set: { ...fallbackData, lastUpdated: new Date() } },
    { upsert: true }
  );
  
  return true;
}

/**
 * Utility functions for checking user state
 */
export async function isUserFirstLogin(userEmail) {
  const { db } = await connectToDatabase();
  
  const existingProfile = await db.collection('user_taste_profiles').findOne({ userEmail });
  return !existingProfile;
}

export async function checkTasteRefreshNeeded(userEmail) {
  const { db } = await connectToDatabase();
  
  const profile = await db.collection('user_taste_profiles').findOne({ userEmail });
  
  if (!profile) return true; // First time user
  
  const lastUpdate = new Date(profile.lastUpdated);
  const now = new Date();
  const hoursSinceUpdate = (now - lastUpdate) / (1000 * 60 * 60);
  
  // Refresh if data is older than 24 hours
  return hoursSinceUpdate >= 24;
}

export default {
  triggerFirstLoginTasteCollection,
  queueUserEssentiaAnalysis,
  isUserFirstLogin,
  checkTasteRefreshNeeded
};
