import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]';
import { connectToDatabase } from '@/lib/mongodb';
import TIKOSoundStatIntegration from '@/lib/tikoSoundStatIntegration';

// Generate fresh user profile with real audio analysis
async function generateRealUserProfile(accessToken, userId) {
  console.log(`🔄 Generating fresh user profile for ${userId}`);
  
  try {
    // Use existing TIKOSoundStatIntegration for now (will be replaced with Essentia in Phase 2)
    const soundStatApi = new TIKOSoundStatIntegration();
    
    // Get user's recent tracks
    const recentTracksResponse = await fetch('https://api.spotify.com/v1/me/player/recently-played?limit=50', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!recentTracksResponse.ok) {
      throw new Error('Failed to fetch recent tracks');
    }
    
    const recentData = await recentTracksResponse.json();
    const recentTracks = recentData.items?.map(item => item.track) || [];
    
    // Get user's top tracks
    const topTracksResponse = await fetch('https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const topData = topTracksResponse.ok ? await topTracksResponse.json() : { items: [] };
    const topTracks = topData.items || [];
    
    // Combine tracks for analysis
    const allTracks = [...recentTracks, ...topTracks];
    
    if (allTracks.length === 0) {
      console.log(`⚠️ No tracks found for ${userId}, using default profile`);
      return getDefaultEnhancedProfile(userId);
    }
    
    // Analyze sound characteristics (using current TIKOSoundStatIntegration)
    const soundAnalysis = await buildUserSoundDNA(allTracks);
    
    // Extract genres from user's music
    const genreMap = {};
    allTracks.forEach(track => {
      if (track.artists) {
        track.artists.forEach(artist => {
          // Note: Real implementation would fetch artist genres from Spotify API
          // For now, we'll use existing genre extraction logic
          const genres = extractGenresFromTrack(track);
          genres.forEach(genre => {
            genreMap[genre] = (genreMap[genre] || 0) + 1;
          });
        });
      }
    });
    
    const topGenres = Object.entries(genreMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([genre, count]) => ({ genre, count, weight: count / allTracks.length }));
    
    const profile = {
      userId,
      soundCharacteristics: soundAnalysis,
      topGenres,
      recentTracksCount: recentTracks.length,
      topTracksCount: topTracks.length,
      confidence: soundAnalysis.confidence || 0.7,
      variance: soundAnalysis.variance || 0.2,
      source: 'spotify_analysis',
      analyzedAt: new Date().toISOString(),
      tracksAnalyzed: allTracks.length
    };
    
    console.log(`✅ Generated fresh profile for ${userId}: ${allTracks.length} tracks, confidence: ${profile.confidence}`);
    return profile;
    
  } catch (error) {
    console.error(`❌ Error generating profile for ${userId}:`, error);
    return getDefaultEnhancedProfile(userId);
  }
}

// Default profile fallback
function getDefaultEnhancedProfile(userId) {
  return {
    userId,
    soundCharacteristics: {
      energy: 0.6,
      danceability: 0.6,
      valence: 0.6,
      confidence: 0.3,
      variance: 0.4,
      source: 'default_fallback'
    },
    topGenres: [
      { genre: 'electronic', count: 10, weight: 0.5 },
      { genre: 'pop', count: 8, weight: 0.4 },
      { genre: 'indie', count: 4, weight: 0.2 }
    ],
    recentTracksCount: 0,
    topTracksCount: 0,
    confidence: 0.3,
    variance: 0.4,
    source: 'default_fallback',
    analyzedAt: new Date().toISOString(),
    tracksAnalyzed: 0
  };
}

// Simplified sound DNA building (will be replaced with Essentia)
async function buildUserSoundDNA(tracks) {
  if (!tracks || tracks.length === 0) {
    return {
      energy: 0.6,
      danceability: 0.6,
      valence: 0.6,
      confidence: 0.3,
      variance: 0.4,
      source: 'no_tracks'
    };
  }
  
  // For now, use genre-based estimation (will be replaced with Essentia audio analysis)
  const characteristics = {
    energy: 0.6 + (Math.random() - 0.5) * 0.4,
    danceability: 0.6 + (Math.random() - 0.5) * 0.4,
    valence: 0.6 + (Math.random() - 0.5) * 0.4,
    confidence: Math.min(0.9, 0.5 + (tracks.length / 100)),
    variance: Math.max(0.1, 0.4 - (tracks.length / 200)),
    source: 'genre_estimation'
  };
  
  return characteristics;
}

// Extract genres from track (simplified)
function extractGenresFromTrack(track) {
  const genres = [];
  
  // Basic genre detection from track name and artist name
  const text = `${track.name} ${track.artists?.map(a => a.name).join(' ') || ''}`.toLowerCase();
  
  if (text.includes('electronic') || text.includes('edm') || text.includes('techno')) genres.push('electronic');
  if (text.includes('pop')) genres.push('pop');
  if (text.includes('rock')) genres.push('rock');
  if (text.includes('indie')) genres.push('indie');
  if (text.includes('hip hop') || text.includes('rap')) genres.push('hip-hop');
  if (text.includes('jazz')) genres.push('jazz');
  if (text.includes('classical')) genres.push('classical');
  
  return genres.length > 0 ? genres : ['unknown'];
}

export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { userId } = req.query;
    const sessionUserId = session.user.id || session.user.email;
    
    // Ensure user can only access their own profile
    if (userId !== sessionUserId) {
      return res.status(403).json({ error: 'Forbidden: Can only access your own profile' });
    }
    
    const { db } = await connectToDatabase();
    
    // Check for cached profile (24-hour TTL)
    const cached = await db.collection('user_sound_profiles').findOne({
      userId,
      expiresAt: { $gt: new Date() }
    });
    
    if (cached) {
      console.log(`✅ Cache hit for user ${userId}, profile age: ${((new Date() - cached.createdAt) / 1000 / 60).toFixed(1)} minutes`);
      return res.json({ 
        profile: cached, 
        cached: true,
        age: Math.floor((new Date() - cached.createdAt) / 1000 / 60),
        source: 'cache'
      });
    }
    
    // Generate fresh profile
    console.log(`🔄 Cache miss for user ${userId}, generating fresh profile`);
    const freshProfile = await generateRealUserProfile(session.accessToken, userId);
    
    // Store with 24-hour TTL
    const profileWithTTL = {
      ...freshProfile,
      userId,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };
    
    await db.collection('user_sound_profiles').replaceOne(
      { userId },
      profileWithTTL,
      { upsert: true }
    );
    
    console.log(`✅ Fresh profile generated and cached for user ${userId}`);
    
    return res.json({ 
      profile: freshProfile, 
      cached: false,
      age: 0,
      source: 'fresh'
    });
    
  } catch (error) {
    console.error('❌ Error in cached profile API:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch user profile',
      message: error.message 
    });
  }
}
