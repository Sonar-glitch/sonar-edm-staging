import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import {
  getTopArtists,
  getTopTracks,
  getRecentlyPlayed,
  getRecommendations,
  getArtist,
  getAudioFeaturesForTracks
} from "@/lib/spotify";

/**
 * Enhanced API for personalized recommendations
 * - Weights recent listening habits higher than historical data
 * - Incorporates user quiz preferences
 * - Returns similar artists and tracks with match scores
 */
export default async function handler(req, res) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const token = session.accessToken;
    
    if (!token) {
      return res.status(401).json({ error: "No valid token" });
    }

    // Fetch user's listening data with different time ranges
    // - short_term: approximately last 4 weeks (higher weight)
    // - medium_term: approximately last 6 months (medium weight)
    // - long_term: several years of data (lower weight)
    const [
      shortTermArtists,
      mediumTermArtists,
      shortTermTracks,
      mediumTermTracks,
      recentlyPlayed
    ] = await Promise.all([
      getTopArtists(token, 'short_term', 20),
      getTopArtists(token, 'medium_term', 20),
      getTopTracks(token, 'short_term', 20),
      getTopTracks(token, 'medium_term', 20),
      getRecentlyPlayed(token, 50)
    ]);

    // Extract user preferences from quiz data (if available)
    // These preferences will be used to further refine recommendations
    const { db } = await connectToDatabase();
    const userPreferences = await db
      .collection("userPreferences")
      .findOne({ userId: session.user.id });
    
    // Get artist seeds with weighting
    const artistSeeds = calculateWeightedArtistSeeds(
      shortTermArtists?.items || [],
      mediumTermArtists?.items || [],
      recentlyPlayed?.items || []
    );
    
    // Get track seeds with weighting
    const trackSeeds = calculateWeightedTrackSeeds(
      shortTermTracks?.items || [],
      mediumTermTracks?.items || [],
      recentlyPlayed?.items || []
    );
    
    // Generate artist recommendations
    let recommendedArtists = [];
    if (artistSeeds.length > 0) {
      const artistRecommendations = await getRecommendations(
        token,
        { seed_artists: artistSeeds.slice(0, 5).map(a => a.id).join(',') },
        {}, // No target parameters for artists
        30
      );
      
      // Map to format and assign match scores
      if (artistRecommendations?.tracks) {
        const artistIds = [...new Set(
          artistRecommendations.tracks.flatMap(track => 
            track.artists.map(artist => artist.id)
          )
        )];
        
        // Fetch full artist details in batches (Spotify API limits to 50 per request)
        const artistBatches = [];
        for (let i = 0; i < artistIds.length; i += 50) {
          artistBatches.push(artistIds.slice(i, i + 50));
        }
        
        const artistDetails = await Promise.all(
          artistBatches.map(batch => getArtists(token, batch))
        );
        
        // Flatten and assign scores
        const artistsMap = artistDetails.flatMap(batch => batch.artists).reduce((map, artist) => {
          map[artist.id] = artist;
          return map;
        }, {});
        
        // Calculate match scores based on genre overlap and popularity
        recommendedArtists = calculateArtistMatchScores(
          artistsMap,
          artistSeeds,
          shortTermArtists?.items || [],
          userPreferences
        );
      }
    }
    
    // Generate track recommendations
    let recommendedTracks = [];
    if (trackSeeds.length > 0) {
      // Get audio features for top and recent tracks to establish preference profile
      const topTrackIds = [
        ...shortTermTracks?.items.map(t => t.id) || [],
        ...recentlyPlayed?.items.map(item => item.track.id) || []
      ].slice(0, 50);
      
      let audioFeatures = [];
      if (topTrackIds.length > 0) {
        const featuresResponse = await getAudioFeaturesForTracks(token, topTrackIds);
        audioFeatures = featuresResponse?.audio_features || [];
      }
      
      // Calculate average audio features for targeting recommendations
      const targetFeatures = calculateAverageFeatures(audioFeatures);
      
      // Request recommendations with these targets
      const trackRecommendations = await getRecommendations(
        token,
        { seed_tracks: trackSeeds.slice(0, 5).map(t => t.id).join(',') },
        {
          target_energy: targetFeatures.energy,
          target_danceability: targetFeatures.danceability,
          target_valence: targetFeatures.valence,
          target_tempo: targetFeatures.tempo
        },
        50
      );
      
      if (trackRecommendations?.tracks) {
        // Get audio features for recommended tracks to help with scoring
        const recTrackIds = trackRecommendations.tracks.map(t => t.id);
        let recFeatures = [];
        
        if (recTrackIds.length > 0) {
          const featuresResponse = await getAudioFeaturesForTracks(token, recTrackIds);
          recFeatures = featuresResponse?.audio_features || [];
        }
        
        // Map the features to each track
        const trackFeatures = recFeatures.reduce((map, feature) => {
          if (feature && feature.id) {
            map[feature.id] = feature;
          }
          return map;
        }, {});
        
        // Calculate match scores
        recommendedTracks = calculateTrackMatchScores(
          trackRecommendations.tracks,
          trackFeatures,
          targetFeatures,
          trackSeeds,
          userPreferences
        );
      }
    }
    
    // Return the recommendations
    return res.status(200).json({
      recommendations: {
        artists: recommendedArtists.slice(0, 10),
        tracks: recommendedTracks.slice(0, 10)
      }
    });
  } catch (error) {
    console.error("API Error:", error);
    return res.status(500).json({ 
      error: "Failed to generate recommendations",
      message: error.message
    });
  }
}

/**
 * Calculate weighted artist seeds based on recent and historical listening
 */
function calculateWeightedArtistSeeds(shortTermArtists, mediumTermArtists, recentlyPlayed) {
  // Extract artists from recently played
  const recentArtists = recentlyPlayed.map(item => item.track.artists[0]).filter(a => a);
  
  // Create a map to track artists and their scores
  const artistMap = {};
  
  // Weight system:
  // - Recent plays (last few days): highest weight (1.5)
  // - Short term (last 4 weeks): high weight (1.2)
  // - Medium term (last 6 months): base weight (1.0)
  
  // Add recently played artists (highest weight)
  recentArtists.forEach(artist => {
    if (!artistMap[artist.id]) {
      artistMap[artist.id] = {
        id: artist.id,
        name: artist.name,
        score: 0
      };
    }
    artistMap[artist.id].score += 1.5;
  });
  
  // Add short term top artists (high weight)
  shortTermArtists.forEach((artist, index) => {
    if (!artistMap[artist.id]) {
      artistMap[artist.id] = {
        id: artist.id,
        name: artist.name,
        score: 0
      };
    }
    // Higher position = higher score (reversed index)
    artistMap[artist.id].score += (shortTermArtists.length - index) * 1.2;
  });
  
  // Add medium term top artists (base weight)
  mediumTermArtists.forEach((artist, index) => {
    if (!artistMap[artist.id]) {
      artistMap[artist.id] = {
        id: artist.id,
        name: artist.name,
        score: 0
      };
    }
    // Higher position = higher score (reversed index)
    artistMap[artist.id].score += (mediumTermArtists.length - index);
  });
  
  // Convert to array, sort by score, and return
  return Object.values(artistMap)
    .sort((a, b) => b.score - a.score);
}

/**
 * Calculate weighted track seeds based on recent and historical listening
 */
function calculateWeightedTrackSeeds(shortTermTracks, mediumTermTracks, recentlyPlayed) {
  // Extract tracks from recently played
  const recentTracks = recentlyPlayed.map(item => item.track);
  
  // Create a map to track tracks and their scores
  const trackMap = {};
  
  // Weight system (same as artists):
  // - Recent plays: highest weight (1.5)
  // - Short term: high weight (1.2)
  // - Medium term: base weight (1.0)
  
  // Add recently played tracks (highest weight)
  recentTracks.forEach((track, index) => {
    if (!trackMap[track.id]) {
      trackMap[track.id] = {
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name).join(', '),
        score: 0
      };
    }
    // More recent plays get higher score (reversed index)
    trackMap[track.id].score += (recentTracks.length - index) * 1.5;
  });
  
  // Add short term top tracks (high weight)
  shortTermTracks.forEach((track, index) => {
    if (!trackMap[track.id]) {
      trackMap[track.id] = {
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name).join(', '),
        score: 0
      };
    }
    // Higher position = higher score (reversed index)
    trackMap[track.id].score += (shortTermTracks.length - index) * 1.2;
  });
  
  // Add medium term top tracks (base weight)
  mediumTermTracks.forEach((track, index) => {
    if (!trackMap[track.id]) {
      trackMap[track.id] = {
        id: track.id,
        name: track.name,
        artists: track.artists.map(a => a.name).join(', '),
        score: 0
      };
    }
    // Higher position = higher score (reversed index)
    trackMap[track.id].score += (mediumTermTracks.length - index);
  });
  
  // Convert to array, sort by score, and return
  return Object.values(trackMap)
    .sort((a, b) => b.score - a.score);
}

/**
 * Calculate average audio features for targeting recommendations
 */
function calculateAverageFeatures(features) {
  if (!features || features.length === 0) {
    return {
      energy: 0.5,
      danceability: 0.5,
      valence: 0.5,
      tempo: 120
    };
  }
  
  // Filter out any null features
  const validFeatures = features.filter(f => f);
  
  if (validFeatures.length === 0) {
    return {
      energy: 0.5,
      danceability: 0.5,
      valence: 0.5,
      tempo: 120
    };
  }
  
  // Calculate averages
  const sum = validFeatures.reduce((acc, feature) => {
    return {
      energy: acc.energy + (feature.energy || 0),
      danceability: acc.danceability + (feature.danceability || 0),
      valence: acc.valence + (feature.valence || 0),
      tempo: acc.tempo + (feature.tempo || 0)
    };
  }, { energy: 0, danceability: 0, valence: 0, tempo: 0 });
  
  return {
    energy: sum.energy / validFeatures.length,
    danceability: sum.danceability / validFeatures.length,
    valence: sum.valence / validFeatures.length,
    tempo: sum.tempo / validFeatures.length
  };
}

/**
 * Calculate artist match scores based on genre overlap and user preferences
 */
function calculateArtistMatchScores(artistsMap, seeds, topArtists, userPreferences) {
  const artists = Object.values(artistsMap);
  
  // Extract user preferred genres from quiz data
  const preferredGenres = userPreferences?.vibeType || [];
  
  // Collect unique genres from top artists for comparison
  const userGenres = new Set();
  topArtists.forEach(artist => {
    if (artist.genres) {
      artist.genres.forEach(genre => userGenres.add(genre.toLowerCase()));
    }
  });
  
  return artists.map(artist => {
    let matchScore = 60; // Base score
    
    // Factor 1: Genre overlap (40 points max)
    if (artist.genres) {
      const genreOverlap = artist.genres.filter(
        genre => userGenres.has(genre.toLowerCase())
      ).length;
      
      const genreScore = Math.min(40, genreOverlap * 10);
      matchScore += genreScore;
    }
    
    // Factor 2: Quiz preference match (15 points max)
    if (preferredGenres.length > 0 && artist.genres) {
      const preferenceMatch = artist.genres.some(genre => 
        preferredGenres.some(pref => 
          genre.toLowerCase().includes(pref.toLowerCase())
        )
      );
      
      if (preferenceMatch) {
        matchScore += 15;
      }
    }
    
    // Factor 3: seed artist similarity (10 points max)
    const seedMatch = seeds.some(seed => seed.id === artist.id);
    if (seedMatch) {
      matchScore += 10;
    }
    
    // Normalize to 100 maximum
    matchScore = Math.min(100, Math.round(matchScore));
    
    return {
      id: artist.id,
      name: artist.name,
      popularity: artist.popularity,
      genres: artist.genres,
      images: artist.images,
      matchScore
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Calculate track match scores based on audio features and user preferences
 */
function calculateTrackMatchScores(tracks, trackFeatures, targetFeatures, seeds, userPreferences) {
  // Extract user preferred vibes from quiz data
  const preferredVibes = userPreferences?.vibeType || [];
  
  return tracks.map(track => {
    const features = trackFeatures[track.id] || {};
    let matchScore = 60; // Base score
    
    // Factor 1: Audio feature similarity (30 points max)
    if (Object.keys(features).length > 0) {
      // Energy match (0-10 points)
      const energyDiff = Math.abs(features.energy - targetFeatures.energy);
      const energyScore = Math.round((1 - energyDiff) * 10);
      
      // Danceability match (0-10 points)
      const danceabilityDiff = Math.abs(features.danceability - targetFeatures.danceability);
      const danceabilityScore = Math.round((1 - danceabilityDiff) * 10);
      
      // Valence/mood match (0-10 points)
      const valenceDiff = Math.abs(features.valence - targetFeatures.valence);
      const valenceScore = Math.round((1 - valenceDiff) * 10);
      
      matchScore += energyScore + danceabilityScore + valenceScore;
    }
    
    // Factor 2: Preferred vibe match based on features (15 points max)
    if (features && preferredVibes.length > 0) {
      // Translate preferred vibes to audio feature expectations
      if (
        (preferredVibes.includes('highEnergy') && features.energy > 0.7) ||
        (preferredVibes.includes('deep') && features.energy < 0.5 && features.valence < 0.5) ||
        (preferredVibes.includes('chill') && features.energy < 0.6 && features.valence > 0.4) ||
        (preferredVibes.includes('eclectic') && features.acousticness > 0.3 && features.instrumentalness > 0.3)
      ) {
        matchScore += 15;
      }
    }
    
    // Factor 3: Seed track or seed artist match (10 points max)
    const seedTrackMatch = seeds.some(seed => seed.id === track.id);
    if (seedTrackMatch) {
      matchScore += 10;
    }
    
    // Normalize to 100 maximum
    matchScore = Math.min(100, Math.round(matchScore));
    
    return {
      id: track.id,
      name: track.name,
      artist: track.artists[0]?.name,
      album: track.album?.name,
      popularity: track.popularity,
      matchScore
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Helper function to get multiple artists by ID (Spotify API wrapper)
 */
async function getArtists(token, ids) {
  const idsString = ids.join(',');
  const res = await fetch(`https://api.spotify.com/v1/artists?ids=${idsString}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  
  if (!res.ok) {
    throw new Error('Failed to fetch artists');
  }
  
  return await res.json();
}

/**
 * MongoDB connection
 */
import { MongoClient } from 'mongodb';

let client;
let clientPromise;
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const uri = process.env.MONGODB_URI;
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  };

  if (!uri) {
    throw new Error('Please add MongoDB URI to .env file');
  }

  client = new MongoClient(uri, options);
  await client.connect();
  
  const db = client.db();
  
  cachedClient = client;
  cachedDb = db;
  
  return { client, db };
}