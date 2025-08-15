#!/usr/bin/env node
/**
 * ESSENTIA-BASED AUDIO PROFILE MATRIX BUILDER - WITH STAGED ANALYSIS
 * Uses the deployed Esse        console.log(`   ✅ Staged Essentia analysis complete:`);
        console.log(`      📊 Tracks in matrix: ${audioProfile.trackMatrix?.length || 0}`);
        console.log(`      🔄 Analysis rounds: ${audioProfile.metadata?.analysisRounds || 1}`);
        console.log(`      🎯 Success rate: ${audioProfile.metadata?.successRate || 'N/A'}`);
        console.log(`      🎧 Top tracks: ${audioProfile.metadata?.topTracks || 0}`);
        console.log(`      🆕 Recent releases: ${audioProfile.metadata?.recentReleases || 0}`);
        console.log(`      🎼 Genre mapping: ${audioProfile.genreMapping || 'N/A'}`);
        console.log(`      📈 Evolution: ${audioProfile.recentEvolution?.evolution || 'N/A'}`);vice to build comprehensive audio profiles
 * This replaces deprecated Spotify audio features with advanced ML analysis
 * 
 * STAGED ANALYSIS IMPLEMENTATION:
 * - Round 1: 5 top tracks + 5 recent releases = 10 tracks
 * - Round 2: 5 more top + 5 more recent = 10 additional tracks (if Round 1 successful)
 * - Total Max: 20 tracks per artist (10 top + 10 recent)
 * - Individual track matrices stored (not aggregated)
 * - User profiles: 20 tracks from recent listening history
 */

const { MongoClient } = require('mongodb');

// Essentia service configuration
const ESSENTIA_SERVICE_URL = process.env.ESSENTIA_SERVICE_URL || 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
// Alternative: 'http://localhost:3001' for local development

// Global stop flag for graceful shutdown
let shouldStop = false;
let currentClient = null;

// Handle CTRL+C and other termination signals
process.on('SIGINT', async () => {
  console.log('\n🛑 STOP SIGNAL RECEIVED - Gracefully shutting down...');
  shouldStop = true;
  
  // Close database connection if active
  if (currentClient) {
    try {
      await currentClient.close();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.log('⚠️  Database close error:', error.message);
    }
  }
  
  console.log('👋 Essentia matrix builder stopped by user');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 TERMINATION SIGNAL - Stopping...');
  shouldStop = true;
  if (currentClient) {
    await currentClient.close();
  }
  process.exit(0);
});

async function buildEssentiaAudioProfileMatrix() {
  console.log('🎵 BUILDING ESSENTIA-BASED AUDIO PROFILE MATRIX');
  console.log('===============================================');
  console.log('⚠️  Press CTRL+C to stop gracefully at any time');
  
  const fetch = (await import('node-fetch')).default;
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  currentClient = client; // Store for cleanup
  
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  // Verify Essentia service is available
  try {
    const healthCheck = await fetch(`${ESSENTIA_SERVICE_URL}/health`);
    if (!healthCheck.ok) {
      throw new Error(`Essentia service health check failed: ${healthCheck.status}`);
    }
    console.log('✅ Essentia service is online and ready');
  } catch (error) {
    console.error('❌ Essentia service unavailable:', error.message);
    process.exit(1);
  }
  
  // Get all artists without Essentia audio profiles
  const allArtists = await artistGenresCollection.find({
    essentiaAudioProfile: { $exists: false }
  }).toArray();
  
  // PRIORITIZE EDM ARTISTS
  const edmGenres = ['electronic', 'edm', 'dance', 'house', 'techno', 'trance', 'dubstep', 'electro', 'progressive house', 'deep house', 'bass'];
  const edmKeywords = ['dj', 'electronic', 'dance', 'house', 'techno', 'trance', 'dubstep', 'edm', 'rave'];
  
  const edmArtists = allArtists.filter(artist => {
    const artistName = (artist.name || '').toLowerCase();
    const genres = (artist.genres || []).map(g => g.toLowerCase());
    
    // Check if artist has EDM genres
    const hasEdmGenres = genres.some(genre => 
      edmGenres.some(edmGenre => genre.includes(edmGenre))
    );
    
    // Check if artist name contains EDM keywords
    const hasEdmKeywords = edmKeywords.some(keyword => artistName.includes(keyword));
    
    return hasEdmGenres || hasEdmKeywords;
  });
  
  const nonEdmArtists = allArtists.filter(artist => !edmArtists.includes(artist));
  
  // Process EDM artists first, then others
  const artistsToProcess = [...edmArtists, ...nonEdmArtists];
  
  console.log(`\n📊 Artists to process: ${artistsToProcess.length}`);
  console.log(`🎧 EDM artists (prioritized): ${edmArtists.length}`);
  console.log(`🎵 Other artists: ${nonEdmArtists.length}`);
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  for (const artist of artistsToProcess) {
    // Check stop flag before processing each artist
    if (shouldStop) {
      console.log('\n🛑 STOPPING: User requested shutdown');
      break;
    }
    
    try {
      console.log(`\n[${processed + 1}/${artistsToProcess.length}] Processing: ${artist.originalName}`);
      
      // Build Essentia-based audio profile
      const audioProfile = await buildEssentiaArtistProfile(artist);
      
      // Check stop flag after each API call
      if (shouldStop) {
        console.log('🛑 STOPPING: User requested shutdown during analysis');
        break;
      }
      
      if (audioProfile.success) {
        // Update artist in database with NEW STAGED ANALYSIS FORMAT
        await artistGenresCollection.updateOne(
          { _id: artist._id },
          { 
            $set: { 
              // NEW FORMAT: Store track matrix (not aggregated profile)
              essentiaTrackMatrix: audioProfile.trackMatrix,
              essentiaGenreMapping: audioProfile.genreMapping,
              essentiaRecentEvolution: audioProfile.recentEvolution,
              
              // Backward compatibility fields
              essentiaAudioProfile: {
                trackMatrix: audioProfile.trackMatrix,
                genreMapping: audioProfile.genreMapping,
                recentEvolution: audioProfile.recentEvolution,
                averageFeatures: audioProfile.averageFeatures,
                spectralFeatures: audioProfile.spectralFeatures,
                metadata: audioProfile.metadata
              },
              
              // Status fields
              essentiaProfileBuilt: true,
              essentiaProfileDate: new Date(),
              essentiaVersion: '2.0-staged',
              stagingAnalysis: true,
              
              // Backward compatibility for matching functions
              averageFeatures: audioProfile.averageFeatures,
              spectralFeatures: audioProfile.spectralFeatures
            }
          }
        );
        
        successful++;
        console.log(`   ✅ Staged Essentia analysis complete:`);
        console.log(`      📊 Tracks in matrix: ${audioProfile.trackMatrix?.length || 0}`);
        console.log(`      🔄 Analysis rounds: ${audioProfile.metadata?.analysisRounds || 1}`);
        console.log(`      🎯 Success rate: ${audioProfile.metadata?.successRate || 'N/A'}`);
        console.log(`      🎧 Top tracks: ${audioProfile.metadata?.topTracks || 0}`);
        console.log(`      � Recent releases: ${audioProfile.metadata?.recentReleases || 0}`);
        console.log(`      🎼 Genres: ${audioProfile.genreMapping?.inferredGenres?.join(', ') || 'N/A'}`);
        console.log(`      📈 Evolution: ${audioProfile.recentEvolution?.evolution || 'N/A'}`);
      } else {
        failed++;
        console.log(`   ❌ Failed: ${audioProfile.error}`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing ${artist.originalName}:`, error.message);
      failed++;
    }
    
    processed++;
    
    // Progress update every 5 artists (Essentia is slower than Spotify)
    if (processed % 5 === 0) {
      console.log(`\n📈 PROGRESS: ${processed}/${artistsToProcess.length}`);
      console.log(`   Successful: ${successful}`);
      console.log(`   Failed: ${failed}`);
      console.log(`   Success rate: ${((successful/processed)*100).toFixed(1)}%`);
      console.log(`   ⚠️  Press CTRL+C to stop gracefully`);
    }
    
    // Rate limiting - Essentia analysis is resource intensive
    // Check stop flag during delay too
    for (let i = 0; i < 20 && !shouldStop; i++) {
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms chunks = 2 second total
    }
    
    if (shouldStop) {
      console.log('🛑 STOPPING: User requested shutdown during delay');
      break;
    }
  }
  
  // Final status (whether completed or stopped)
  const statusMessage = shouldStop ? 'STOPPED BY USER' : 'COMPLETE';
  console.log(`\n${shouldStop ? '🛑' : '✅'} ESSENTIA AUDIO PROFILE MATRIX ${statusMessage}:`);
  console.log(`   Artists processed: ${processed}`);
  console.log(`   Successful profiles: ${successful}`);
  console.log(`   Failed profiles: ${failed}`);
  console.log(`   Success rate: ${processed > 0 ? ((successful/processed)*100).toFixed(1) : 0}%`);
  
  // Verify the results
  const artistsWithEssentiaProfiles = await artistGenresCollection.countDocuments({
    essentiaAudioProfile: { $exists: true }
  });
  
  const totalArtists = await artistGenresCollection.countDocuments();
  
  console.log(`\n📊 FINAL STATUS:`);
  console.log(`   Artists with Essentia profiles: ${artistsWithEssentiaProfiles}/${totalArtists}`);
  console.log(`   Coverage: ${((artistsWithEssentiaProfiles/totalArtists)*100).toFixed(1)}%`);
  
  if (shouldStop) {
    console.log(`\n⚠️  PROCESS STOPPED BY USER`);
    console.log(`   Remaining artists: ${artistsToProcess.length - processed}`);
    console.log(`   You can restart to continue processing`);
  }
  
  currentClient = null; // Clear reference
  await client.close();
}

/**
 * Build comprehensive Essentia-based audio profile for a single artist
 * WITH STAGED TRACK ANALYSIS (5+5, then 5+5 more if successful)
 */
async function buildEssentiaArtistProfile(artist) {
  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log(`   🎤 Using Essentia staged analysis for: ${artist.originalName}`);
    
    // Call Essentia service artist endpoint with staged analysis
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artistName: artist.originalName,
        spotifyId: artist.spotifyId,
        existingGenres: artist.genres, // Pass existing Spotify genres
        maxTracks: 20, // Staged: Round 1 (10 tracks), Round 2 (10 more tracks)
        includeRecentReleases: true
      }),
      timeout: 180000 // 3 minute timeout for staged analysis
    });
    
    if (!response.ok) {
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
    
    const analysisResult = await response.json();
    
    if (analysisResult.success) {
      return {
        success: true,
        trackMatrix: analysisResult.trackMatrix, // Individual track profiles
        genreMapping: analysisResult.genreMapping,
        recentEvolution: analysisResult.recentEvolution,
        averageFeatures: analysisResult.averageFeatures, // Backward compatibility
        spectralFeatures: analysisResult.spectralFeatures, // Backward compatibility
        metadata: analysisResult.metadata
      };
    } else {
      return { success: false, error: analysisResult.error || 'Staged artist analysis failed' };
    }
    
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Run the builder
if (require.main === module) {
  buildEssentiaAudioProfileMatrix().catch(console.error);
}

module.exports = { buildEssentiaAudioProfileMatrix };
