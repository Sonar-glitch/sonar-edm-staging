#!/usr/bin/env node
/**
 * TEST PARTIAL SUCCESS WITH GENRES
 * Verify that artists can get genres even without track analysis
 */

async function testPartialSuccess() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('🔧 TESTING PARTIAL SUCCESS WITH GENRES');
  console.log('=======================================');
  
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
  
  // Test with BLACKPINK (should have genres from existing data)
  console.log('1️⃣ Testing BLACKPINK with existing genres...');
  
  try {
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artistName: 'BLACKPINK',
        spotifyId: '41MozSoPIsD1dJM0CLPjZF',
        existingGenres: ['k-pop', 'pop', 'korean pop'], // Provide existing genres
        maxTracks: 3,
        includeRecentReleases: false
      })
    });
    
    console.log(`   HTTP Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   Success: ${result.success}`);
      console.log(`   Error: ${result.error || 'None'}`);
      console.log(`   Tracks analyzed: ${result.trackMatrix?.length || 0}`);
      console.log(`   Genre mapping: ${result.genreMapping?.inferredGenres?.join(', ') || 'None'}`);
      console.log(`   Genre source: ${result.genreMapping?.source || 'N/A'}`);
      console.log(`   Has genre mapping: ${result.metadata?.hasGenreMapping || false}`);
      console.log(`   Has audio analysis: ${result.metadata?.hasAudioAnalysis || false}`);
    } else {
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   Request Error: ${error.message}`);
  }
  
  // Test with Rod Stewart (should also work with genres)
  console.log('\n2️⃣ Testing Rod Stewart with existing genres...');
  
  try {
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artistName: 'Rod Stewart',
        spotifyId: '2y8Jo9CKlia6hsU8BgzDDo',
        existingGenres: ['rock', 'classic rock', 'soft rock'], // Provide existing genres
        maxTracks: 3,
        includeRecentReleases: false
      })
    });
    
    console.log(`   HTTP Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   Success: ${result.success}`);
      console.log(`   Error: ${result.error || 'None'}`);
      console.log(`   Tracks analyzed: ${result.trackMatrix?.length || 0}`);
      console.log(`   Genre mapping: ${result.genreMapping?.inferredGenres?.join(', ') || 'None'}`);
      console.log(`   Genre source: ${result.genreMapping?.source || 'N/A'}`);
      console.log(`   Has genre mapping: ${result.metadata?.hasGenreMapping || false}`);
      console.log(`   Has audio analysis: ${result.metadata?.hasAudioAnalysis || false}`);
    } else {
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   Request Error: ${error.message}`);
  }
  
  console.log('\n✅ EXPECTED RESULTS:');
  console.log('   Success: true');
  console.log('   Tracks analyzed: 0 (no preview URLs)');
  console.log('   Genre mapping: Present (from existing Spotify genres)');
  console.log('   Genre source: spotify');
  console.log('   Has genre mapping: true');
  console.log('   Has audio analysis: false');
}

// Run the test
testPartialSuccess().catch(console.error);
