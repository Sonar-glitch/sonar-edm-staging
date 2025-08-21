#!/usr/bin/env node
/**
 * FOCUSED ESSENTIA MATRIX BUILDER - EDM ARTISTS ONLY
 * Test run with limited artists to verify the pipeline
 */

const { MongoClient } = require('mongodb');

const ESSENTIA_SERVICE_URL = process.env.ESSENTIA_SERVICE_URL || 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';

async function buildFocusedEssentiaMatrix() {
  console.log('🎵 FOCUSED ESSENTIA MATRIX BUILDER - EDM ARTISTS');
  console.log('===============================================');
  
  const fetch = (await import('node-fetch')).default;
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  // Get EDM artists without Essentia profiles (limit to first 5 for testing)
  const edmGenres = ['electronic', 'edm', 'dance', 'house', 'techno', 'trance', 'dubstep', 'electro'];
  const edmKeywords = ['dj', 'electronic', 'dance', 'house', 'techno', 'trance', 'dubstep', 'edm'];
  
  const allArtists = await artistGenresCollection.find({
    essentiaAudioProfile: { $exists: false }
  }).toArray();
  
  const edmArtists = allArtists.filter(artist => {
    const artistName = (artist.name || artist.originalName || '').toLowerCase();
    const genres = (artist.genres || []).map(g => g.toLowerCase());
    
    const hasEdmGenres = genres.some(genre => 
      edmGenres.some(edmGenre => genre.includes(edmGenre))
    );
    
    const hasEdmKeywords = edmKeywords.some(keyword => artistName.includes(keyword));
    
    return hasEdmGenres || hasEdmKeywords;
  }).slice(0, 5); // Only process first 5 EDM artists for testing
  
  console.log(`📊 Total artists without Essentia: ${allArtists.length}`);
  console.log(`🎧 EDM artists to process (test): ${edmArtists.length}`);
  console.log('');
  
  let processed = 0;
  let successful = 0;
  let failed = 0;
  
  for (const artist of edmArtists) {
    try {
      console.log(`[${processed + 1}/${edmArtists.length}] Processing: ${artist.originalName}`);
      console.log(`   Spotify ID: ${artist.spotifyId}`);
      console.log(`   Existing genres: ${(artist.genres || []).join(', ')}`);
      
      // Call Essentia service
      const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          artistName: artist.originalName,
          spotifyId: artist.spotifyId,
          existingGenres: artist.genres || [], // Pass existing genres
          maxTracks: 10, // Start with 10 tracks
          includeRecentReleases: true
        }),
        timeout: 120000 // 2 minute timeout
      });
      
      if (!response.ok) {
        failed++;
        console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const analysisResult = await response.json();
      
      if (analysisResult.success) {
        // Update artist in database
        await artistGenresCollection.updateOne(
          { _id: artist._id },
          { 
            $set: { 
              essentiaTrackMatrix: analysisResult.trackMatrix,
              essentiaGenreMapping: analysisResult.genreMapping,
              essentiaRecentEvolution: analysisResult.recentEvolution,
              essentiaAudioProfile: {
                trackMatrix: analysisResult.trackMatrix,
                genreMapping: analysisResult.genreMapping,
                recentEvolution: analysisResult.recentEvolution,
                averageFeatures: analysisResult.averageFeatures,
                spectralFeatures: analysisResult.spectralFeatures,
                metadata: analysisResult.metadata
              },
              essentiaProfileBuilt: true,
              essentiaProfileDate: new Date(),
              essentiaVersion: '2.0-staged'
            }
          }
        );
        
        successful++;
        console.log(`   ✅ SUCCESS:`);
        console.log(`      📊 Tracks: ${analysisResult.trackMatrix?.length || 0}`);
        console.log(`      🎼 Genre mapping: ${analysisResult.genreMapping?.inferredGenres?.join(', ') || 'N/A'}`);
        console.log(`      📈 Evolution: ${analysisResult.recentEvolution?.evolution || 'N/A'}`);
        console.log(`      ⏱️ Analysis time: ${analysisResult.metadata?.analysisTime || 'N/A'}ms`);
      } else {
        failed++;
        console.log(`   ❌ Analysis failed: ${analysisResult.error}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      failed++;
    }
    
    processed++;
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log(`\n✅ FOCUSED TEST COMPLETE:`);
  console.log(`   Processed: ${processed}`);
  console.log(`   Successful: ${successful}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Success rate: ${((successful/processed)*100).toFixed(1)}%`);
  
  await client.close();
}

// Run the focused builder
if (require.main === module) {
  buildFocusedEssentiaMatrix().catch(console.error);
}

module.exports = { buildFocusedEssentiaMatrix };
