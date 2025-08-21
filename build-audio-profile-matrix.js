#!/usr/bin/env node
/**
 * AUDIO PROFILE MATRIX BUILDER
 * Builds comprehensive audio profiles for all artists with:
 * - Top 20 tracks from Spotify
 * - Audio features for each track (energy, danceability, valence, etc.)
 * - Artist genre data from Spotify
 * - Sound profile matrix for user matching
 */

const { MongoClient } = require('mongodb');
const SpotifyApi = require('spotify-web-api-node');

// Spotify API setup (you'll need to add your credentials)
const spotifyApi = new SpotifyApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET
});

async function buildAudioProfileMatrix() {
  console.log('🎵 BUILDING AUDIO PROFILE MATRIX');
  console.log('=================================');
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  // Get Spotify access token
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    console.log('✅ Spotify API authenticated');
  } catch (error) {
    console.error('❌ Spotify authentication failed:', error.message);
    process.exit(1);
  }
  
  // Get all artists without audio profiles
  const artistsToProcess = await artistGenresCollection.find({
    audioProfile: { $exists: false }
  }).toArray();
  
  console.log(`\n📊 Artists to process: ${artistsToProcess.length}`);
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  for (const artist of artistsToProcess) {
    try {
      console.log(`\n[${processed + 1}/${artistsToProcess.length}] Processing: ${artist.originalName}`);
      
      // Build complete audio profile
      const audioProfile = await buildArtistAudioProfile(artist, spotifyApi);
      
      if (audioProfile.success) {
        // Update artist in database
        await artistGenresCollection.updateOne(
          { _id: artist._id },
          { 
            $set: { 
              audioProfile: audioProfile.profile,
              spotifyData: audioProfile.spotifyData,
              audioProfileBuilt: true,
              audioProfileDate: new Date()
            }
          }
        );
        
        successful++;
        console.log(`   ✅ Audio profile built: ${audioProfile.profile.tracks.length} tracks`);
        console.log(`   🎧 Avg Energy: ${audioProfile.profile.averageFeatures.energy.toFixed(2)}`);
        console.log(`   💃 Avg Danceability: ${audioProfile.profile.averageFeatures.danceability.toFixed(2)}`);
      } else {
        failed++;
        console.log(`   ❌ Failed: ${audioProfile.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${artist.originalName}:`, error.message);
      failed++;
    }
    
    processed++;
    
    // Progress update every 10 artists
    if (processed % 10 === 0) {
      console.log(`\n📈 PROGRESS: ${processed}/${artistsToProcess.length}`);
      console.log(`   Successful: ${successful}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Success rate: ${((successful/processed)*100).toFixed(1)}%`);
    }
    
    // Rate limiting - 100 requests per minute for Spotify
    await new Promise(resolve => setTimeout(resolve, 600)); // 600ms delay
  }
  
  console.log(`\n✅ AUDIO PROFILE MATRIX COMPLETE:`);
  console.log(`   Artists processed: ${processed}`);
  console.log(`   Successful profiles: ${successful}`);
  console.log(`   Failed profiles: ${failed}`);
  console.log(`   Success rate: ${((successful/processed)*100).toFixed(1)}%`);
  
  // Verify the results
  const artistsWithProfiles = await artistGenresCollection.countDocuments({
    audioProfile: { $exists: true }
  });
  
  const totalArtists = await artistGenresCollection.countDocuments();
  
  console.log(`\n📊 FINAL STATUS:`);
  console.log(`   Artists with audio profiles: ${artistsWithProfiles}/${totalArtists}`);
  console.log(`   Coverage: ${((artistsWithProfiles/totalArtists)*100).toFixed(1)}%`);
  
  await client.close();
}

/**
 * Build comprehensive audio profile for a single artist
 */
async function buildArtistAudioProfile(artist, spotifyApi) {
  try {
    // Step 1: Search for artist on Spotify
    let spotifyArtist = null;
    
    if (artist.spotifyId) {
      // Use existing Spotify ID
      const artistData = await spotifyApi.getArtist(artist.spotifyId);
      spotifyArtist = artistData.body;
    } else {
      // Search by name
      const searchResults = await spotifyApi.searchArtists(artist.originalName, { limit: 1 });
      if (searchResults.body.artists.items.length > 0) {
        spotifyArtist = searchResults.body.artists.items[0];
        
        // Update artist with Spotify ID
        await artistGenresCollection.updateOne(
          { _id: artist._id },
          { $set: { spotifyId: spotifyArtist.id } }
        );
      }
    }
    
    if (!spotifyArtist) {
      return { success: false, error: 'Artist not found on Spotify' };
    }
    
    // Step 2: Get top tracks (up to 20)
    const topTracksData = await spotifyApi.getArtistTopTracks(spotifyArtist.id, 'US');
    const topTracks = topTracksData.body.tracks.slice(0, 20); // Max 20 tracks
    
    if (topTracks.length === 0) {
      return { success: false, error: 'No tracks found' };
    }
    
    // Step 3: Get audio features for all tracks
    const trackIds = topTracks.map(track => track.id);
    const audioFeaturesData = await spotifyApi.getAudioFeaturesForTracks(trackIds);
    const audioFeatures = audioFeaturesData.body.audio_features;
    
    // Step 4: Build comprehensive track profiles
    const trackProfiles = [];
    const validFeatures = [];
    
    for (let i = 0; i < topTracks.length; i++) {
      const track = topTracks[i];
      const features = audioFeatures[i];
      
      if (features) { // Some tracks might not have audio features
        const trackProfile = {
          id: track.id,
          name: track.name,
          popularity: track.popularity,
          previewUrl: track.preview_url,
          explicit: track.explicit,
          durationMs: track.duration_ms,
          soundProfile: {
            energy: features.energy,
            danceability: features.danceability,
            valence: features.valence,
            acousticness: features.acousticness,
            instrumentalness: features.instrumentalness,
            speechiness: features.speechiness,
            loudness: features.loudness,
            tempo: features.tempo,
            key: features.key,
            mode: features.mode,
            timeSignature: features.time_signature
          }
        };
        
        trackProfiles.push(trackProfile);
        validFeatures.push(features);
      }
    }
    
    if (validFeatures.length === 0) {
      return { success: false, error: 'No audio features available' };
    }
    
    // Step 5: Calculate average audio features for artist
    const averageFeatures = calculateAverageFeatures(validFeatures);
    
    // Step 6: Build complete audio profile
    const audioProfile = {
      tracks: trackProfiles,
      trackCount: trackProfiles.length,
      averageFeatures: averageFeatures,
      artistPopularity: spotifyArtist.popularity,
      followers: spotifyArtist.followers.total,
      spotifyGenres: spotifyArtist.genres,
      profileBuiltAt: new Date(),
      version: '1.0'
    };
    
    const spotifyData = {
      id: spotifyArtist.id,
      name: spotifyArtist.name,
      popularity: spotifyArtist.popularity,
      followers: spotifyArtist.followers.total,
      genres: spotifyArtist.genres,
      images: spotifyArtist.images
    };
    
    return { 
      success: true, 
      profile: audioProfile, 
      spotifyData: spotifyData 
    };
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Calculate average audio features across all tracks
 */
function calculateAverageFeatures(features) {
  const featureKeys = [
    'energy', 'danceability', 'valence', 'acousticness', 
    'instrumentalness', 'speechiness', 'loudness', 'tempo'
  ];
  
  const averages = {};
  
  for (const key of featureKeys) {
    const values = features.map(f => f[key]).filter(v => v !== null && v !== undefined);
    if (values.length > 0) {
      averages[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
    } else {
      averages[key] = 0;
    }
  }
  
  // Calculate mode and key distributions
  const keys = features.map(f => f.key).filter(k => k !== null);
  const modes = features.map(f => f.mode).filter(m => m !== null);
  
  averages.dominantKey = getMostFrequent(keys);
  averages.dominantMode = getMostFrequent(modes);
  
  return averages;
}

/**
 * Get most frequent value in array
 */
function getMostFrequent(arr) {
  if (arr.length === 0) return null;
  
  const frequency = {};
  let maxCount = 0;
  let mostFrequent = null;
  
  for (const item of arr) {
    frequency[item] = (frequency[item] || 0) + 1;
    if (frequency[item] > maxCount) {
      maxCount = frequency[item];
      mostFrequent = item;
    }
  }
  
  return mostFrequent;
}

// Run the builder
if (require.main === module) {
  buildAudioProfileMatrix().catch(console.error);
}

module.exports = { buildAudioProfileMatrix };
