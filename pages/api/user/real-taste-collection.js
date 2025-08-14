// pages/api/user/real-taste-collection.js
// 🎵 REAL TASTE COLLECTION API
// Performs actual data collection from Spotify and creates user profile

import { MongoClient } from 'mongodb';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const mongoUri = process.env.MONGODB_URI;
  const client = new MongoClient(mongoUri);
  await client.connect();
  cachedClient = client;
  return client;
}

// Real Spotify API calls
async function fetchSpotifyData(accessToken) {
  const baseUrl = 'https://api.spotify.com/v1';
  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  try {
    // Fetch user's top artists, tracks, and recent play history
    const [topArtistsResponse, topTracksResponse, recentTracksResponse] = await Promise.all([
      fetch(`${baseUrl}/me/top/artists?limit=50&time_range=medium_term`, { headers }),
      fetch(`${baseUrl}/me/top/tracks?limit=50&time_range=medium_term`, { headers }),
      fetch(`${baseUrl}/me/player/recently-played?limit=50`, { headers })
    ]);

    const topArtists = topArtistsResponse.ok ? await topArtistsResponse.json() : null;
    const topTracks = topTracksResponse.ok ? await topTracksResponse.json() : null;
    const recentTracks = recentTracksResponse.ok ? await recentTracksResponse.json() : null;

    // Get audio features for top tracks
    let audioFeatures = null;
    if (topTracks?.items?.length > 0) {
      const trackIds = topTracks.items.map(track => track.id).join(',');
      const featuresResponse = await fetch(`${baseUrl}/audio-features?ids=${trackIds}`, { headers });
      audioFeatures = featuresResponse.ok ? await featuresResponse.json() : null;
    }

    return {
      topArtists,
      topTracks,
      recentTracks,
      audioFeatures,
      confidence: calculateConfidence({ topArtists, topTracks, recentTracks, audioFeatures })
    };
  } catch (error) {
    console.error('Spotify API Error:', error);
    return null;
  }
}

function calculateConfidence(data) {
  let confidence = 0;
  let factors = [];

  if (data.topArtists?.items?.length > 0) {
    confidence += Math.min(data.topArtists.items.length * 2, 40); // Max 40 points
    factors.push(`${data.topArtists.items.length} top artists`);
  }

  if (data.topTracks?.items?.length > 0) {
    confidence += Math.min(data.topTracks.items.length * 1.5, 30); // Max 30 points
    factors.push(`${data.topTracks.items.length} top tracks`);
  }

  if (data.recentTracks?.items?.length > 0) {
    confidence += Math.min(data.recentTracks.items.length * 0.5, 20); // Max 20 points
    factors.push(`${data.recentTracks.items.length} recent plays`);
  }

  if (data.audioFeatures?.audio_features?.length > 0) {
    confidence += 10; // 10 points for audio features
    factors.push('audio features available');
  }

  return {
    score: Math.min(confidence, 100),
    level: confidence >= 80 ? 'high' : confidence >= 50 ? 'medium' : 'low',
    factors
  };
}

function extractGenres(spotifyData) {
  const genreMap = new Map();
  
  // Extract from top artists
  if (spotifyData.topArtists?.items) {
    spotifyData.topArtists.items.forEach(artist => {
      artist.genres.forEach(genre => {
        genreMap.set(genre, (genreMap.get(genre) || 0) + artist.popularity / 100);
      });
    });
  }

  // Extract from top tracks (through artists)
  if (spotifyData.topTracks?.items) {
    spotifyData.topTracks.items.forEach(track => {
      track.artists.forEach(artist => {
        if (artist.genres) {
          artist.genres.forEach(genre => {
            genreMap.set(genre, (genreMap.get(genre) || 0) + 0.5);
          });
        }
      });
    });
  }

  // Convert to sorted array
  return Array.from(genreMap.entries())
    .map(([genre, weight]) => ({ genre, weight }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20); // Top 20 genres
}

function calculateAudioProfile(audioFeatures) {
  if (!audioFeatures?.audio_features?.length) {
    return null;
  }

  const features = audioFeatures.audio_features.filter(f => f !== null);
  if (features.length === 0) return null;

  const profile = {
    energy: features.reduce((sum, f) => sum + f.energy, 0) / features.length,
    danceability: features.reduce((sum, f) => sum + f.danceability, 0) / features.length,
    valence: features.reduce((sum, f) => sum + f.valence, 0) / features.length,
    acousticness: features.reduce((sum, f) => sum + f.acousticness, 0) / features.length,
    instrumentalness: features.reduce((sum, f) => sum + f.instrumentalness, 0) / features.length,
    tempo: features.reduce((sum, f) => sum + f.tempo, 0) / features.length,
    count: features.length
  };

  return profile;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    
    if (!session || !session.user) {
      return res.status(401).json({ 
        error: 'Unauthorized', 
        message: 'Must be logged in for taste collection' 
      });
    }

    console.log(`🎵 Starting real taste collection for: ${session.user.email}`);

    // Step 1: Fetch Spotify data
    if (!session.accessToken) {
      return res.status(400).json({
        error: 'No Spotify access token',
        message: 'Please reconnect to Spotify'
      });
    }

    const spotifyData = await fetchSpotifyData(session.accessToken);
    
    if (!spotifyData) {
      return res.status(400).json({
        error: 'Failed to fetch Spotify data',
        message: 'Unable to access your Spotify data'
      });
    }

    // Step 2: Process the data
    const genres = extractGenres(spotifyData);
    const audioProfile = calculateAudioProfile(spotifyData.audioFeatures);
    
    // Step 3: Create user profile in database
    const client = await connectToDatabase();
    const db = client.db('sonar');

    const userProfile = {
      email: session.user.email,
      name: session.user.name,
      image: session.user.image,
      spotifyId: session.user.id || null,
      onboardingCompleted: true,
      onboardingCompletedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Real taste data
      tasteProfile: {
        genres: genres,
        audioProfile: audioProfile,
        confidence: spotifyData.confidence,
        lastUpdated: new Date(),
        source: 'spotify_api'
      },
      
      // Raw Spotify data for reference
      spotifyData: {
        topArtistsCount: spotifyData.topArtists?.items?.length || 0,
        topTracksCount: spotifyData.topTracks?.items?.length || 0,
        recentTracksCount: spotifyData.recentTracks?.items?.length || 0,
        hasAudioFeatures: !!audioProfile,
        lastFetch: new Date()
      },
      
      preferences: {
        venues: [],
        eventTypes: [],
        priceRanges: []
      }
    };

    // Check if profile already exists
    const existingProfile = await db.collection('userProfiles').findOne({
      email: session.user.email
    });

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await db.collection('userProfiles').updateOne(
        { email: session.user.email },
        { $set: userProfile }
      );
      console.log(`✅ Updated existing profile for: ${session.user.email}`);
    } else {
      // Create new profile
      result = await db.collection('userProfiles').insertOne(userProfile);
      console.log(`✅ Created new profile for: ${session.user.email}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Taste collection completed successfully',
      profileId: existingProfile ? existingProfile._id : result.insertedId,
      confidence: spotifyData.confidence,
      summary: {
        genres: genres.length,
        topArtists: spotifyData.topArtists?.items?.length || 0,
        topTracks: spotifyData.topTracks?.items?.length || 0,
        recentTracks: spotifyData.recentTracks?.items?.length || 0,
        hasAudioProfile: !!audioProfile
      }
    });

  } catch (error) {
    console.error('❌ [Real Taste Collection] Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      fallback: true
    });
  }
}
