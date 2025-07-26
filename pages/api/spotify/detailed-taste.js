// UPDATED: /pages/api/spotify/detailed-taste.js
// Integrates SoundStat API for real sound characteristics analysis
// PRESERVES: All existing functionality, error handling, and fallback logic

import { getSession } from 'next-auth/react';
import { getTopArtists, getTopTracks, getRecentlyPlayed } from '../../../lib/spotify';
import { connectToDatabase } from '../../../lib/mongodb';
import { getFallbackDetailedTasteData } from '../../../lib/fallbackData';
import TIKOSoundStatIntegration from '../../../lib/tikoSoundStatIntegration'; // ✅ NEW: SoundStat integration

export default async function handler(req, res) {
  const session = await getSession({ req });
  
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  
  try {
    // PRESERVED: Existing Spotify API calls with proper error handling
    const [topArtistsResponse, topTracksResponse, recentlyPlayedResponse] = await Promise.allSettled([
      getTopArtists(session.accessToken),
      getTopTracks(session.accessToken),
      getRecentlyPlayed(session.accessToken)
    ]);
    
    // PRESERVED: Track API call success for data source labeling
    const apiCallsSuccessful = {
      topArtists: topArtistsResponse.status === 'fulfilled' && topArtistsResponse.value?.items?.length > 0,
      topTracks: topTracksResponse.status === 'fulfilled' && topTracksResponse.value?.items?.length > 0,
      recentlyPlayed: recentlyPlayedResponse.status === 'fulfilled' && recentlyPlayedResponse.value?.items?.length > 0
    };
    
    const hasRealData = apiCallsSuccessful.topArtists || apiCallsSuccessful.topTracks;
    
    // PRESERVED: Process top artists (unchanged)
    let artistProfile = [];
    if (apiCallsSuccessful.topArtists) {
      artistProfile = topArtistsResponse.value.items.slice(0, 5).map(artist => ({
        name: artist.name,
        plays: Math.floor(Math.random() * 50) + 20,
        genre: artist.genres?.[0] || 'Electronic'
      }));
    }
    
    // PRESERVED: Process top tracks (unchanged)
    let topTracks = [];
    if (apiCallsSuccessful.topTracks) {
      topTracks = topTracksResponse.value.items.slice(0, 5).map(track => ({
        name: track.name,
        artist: track.artists[0]?.name || 'Unknown Artist',
        plays: Math.floor(Math.random() * 100) + 30
      }));
    }
    
    // PRESERVED: Get user's genre profile from database (unchanged)
    const { db } = await connectToDatabase();
    const userProfile = await db.collection('users').findOne({ email: session.user.email });
    
    // PRESERVED: Extract genre profile or generate from real data (unchanged)
    let genreProfile = {};
    if (userProfile && userProfile.genreProfile) {
      genreProfile = userProfile.genreProfile;
    } else if (apiCallsSuccessful.topArtists) {
      const genres = topArtistsResponse.value.items.flatMap(artist => artist.genres || []);
      const genreCounts = genres.reduce((acc, genre) => {
        acc[genre] = (acc[genre] || 0) + 1;
        return acc;
      }, {});
      
      const maxCount = Math.max(...Object.values(genreCounts));
      if (maxCount > 0) {
        Object.keys(genreCounts).forEach(genre => {
          genreProfile[genre] = Math.round((genreCounts[genre] / maxCount) * 100);
        });
      }
    }
    
    // ✅ NEW: SoundStat integration for real sound characteristics
    let soundCharacteristicsResult;
    try {
      if (apiCallsSuccessful.topTracks && topTracksResponse.value.items.length > 0) {
        const soundStatIntegration = new TIKOSoundStatIntegration();
        soundCharacteristicsResult = await soundStatIntegration.analyzeUserTracks(topTracksResponse.value.items);
      } else {
        // No tracks available, use fallback
        soundCharacteristicsResult = {
          soundCharacteristics: {
            energy: 75,
            danceability: 82,
            positivity: 65,
            acoustic: 15
          },
          source: 'demo_data',
          isRealData: false,
          confidence: 0.0,
          fallbackReason: 'NO_SPOTIFY_TRACKS'
        };
      }
    } catch (soundStatError) {
      console.error('SoundStat integration error:', soundStatError);
      // Fallback to demo data on SoundStat error
      soundCharacteristicsResult = {
        soundCharacteristics: {
          energy: 75,
          danceability: 82,
          positivity: 65,
          acoustic: 15
        },
        source: 'demo_data',
        isRealData: false,
        confidence: 0.0,
        fallbackReason: 'SOUNDSTAT_ERROR',
        error: soundStatError.message
      };
    }
    
    // PRESERVED: Generate seasonal profile (unchanged)
    const seasonalProfile = {
      spring: ['Progressive House', 'Melodic Techno'],
      summer: ['Tech House', 'Festival Progressive'],
      fall: ['Organic House', 'Downtempo'],
      winter: ['Deep House', 'Ambient Techno']
    };
    
    // PRESERVED: Generate listening trends (unchanged)
    const listeningTrends = [
      { month: 'Jan', house: 65, techno: 50, trance: 30 },
      { month: 'Feb', house: 70, techno: 60, trance: 35 },
      { month: 'Mar', house: 75, techno: 65, trance: 40 },
      { month: 'Apr', house: 72, techno: 70, trance: 45 },
      { month: 'May', house: 70, techno: 68, trance: 50 },
      { month: 'Jun', house: 65, techno: 72, trance: 48 }
    ];
    
    // ✅ ENHANCED: Response with SoundStat integration
    const responseData = {
      genreProfile: Object.keys(genreProfile).length > 0 ? genreProfile : getFallbackDetailedTasteData().genreProfile,
      artistProfile: artistProfile.length > 0 ? artistProfile : getFallbackDetailedTasteData().artistProfile,
      topTracks: topTracks.length > 0 ? topTracks : getFallbackDetailedTasteData().topTracks,
      soundCharacteristics: soundCharacteristicsResult.soundCharacteristics, // ✅ NEW: Real SoundStat data
      seasonalProfile,
      listeningTrends,
      
      // ✅ ENHANCED: Data source metadata with SoundStat info
      source: soundCharacteristicsResult.isRealData ? 'soundstat_api' : soundCharacteristicsResult.source,
      isRealData: soundCharacteristicsResult.isRealData,
      dataQuality: {
        topArtists: apiCallsSuccessful.topArtists,
        topTracks: apiCallsSuccessful.topTracks,
        recentlyPlayed: apiCallsSuccessful.recentlyPlayed,
        artistCount: topArtistsResponse.value?.items?.length || 0,
        trackCount: topTracksResponse.value?.items?.length || 0,
        soundStatAnalysis: {
          source: soundCharacteristicsResult.source,
          confidence: soundCharacteristicsResult.confidence,
          tracksAnalyzed: soundCharacteristicsResult.tracksAnalyzed || 0,
          totalTracks: soundCharacteristicsResult.totalTracks || 0,
          fallbackReason: soundCharacteristicsResult.fallbackReason
        }
      },
      lastFetch: new Date().toISOString(),
      
      // PRESERVED: API call status for debugging (unchanged)
      apiStatus: {
        topArtists: {
          status: topArtistsResponse.status,
          error: topArtistsResponse.status === 'rejected' ? topArtistsResponse.reason?.message : null
        },
        topTracks: {
          status: topTracksResponse.status,
          error: topTracksResponse.status === 'rejected' ? topTracksResponse.reason?.message : null
        },
        recentlyPlayed: {
          status: recentlyPlayedResponse.status,
          error: recentlyPlayedResponse.status === 'rejected' ? recentlyPlayedResponse.reason?.message : null
        },
        soundStat: {
          source: soundCharacteristicsResult.source,
          isRealData: soundCharacteristicsResult.isRealData,
          error: soundCharacteristicsResult.error || null
        }
      }
    };
    
    // Return the complete detailed taste profile with SoundStat integration
    res.status(200).json(responseData);
    
  } catch (error) {
    console.error('Error fetching detailed taste:', error);
    
    // PRESERVED: Detailed error logging for debugging (unchanged)
    console.error('Detailed error info:', {
      message: error.message,
      stack: error.stack,
      session: !!session,
      accessToken: !!session?.accessToken,
      tokenLength: session?.accessToken?.length || 0
    });
    
    // PRESERVED: Return fallback data with error info instead of 500 error (unchanged)
    const fallbackData = getFallbackDetailedTasteData();
    res.status(200).json({
      ...fallbackData,
      source: 'fallback_due_to_error',
      isRealData: false,
      error: error.message,
      errorCode: 'DETAILED_TASTE_ERROR',
      errorTimestamp: new Date().toISOString(),
      lastFetch: new Date().toISOString()
    });
  }
}

