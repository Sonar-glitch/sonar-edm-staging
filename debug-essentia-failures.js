#!/usr/bin/env node
/**
 * DEBUG ESSENTIA FAILURES
 * Test why artists are failing Essentia analysis
 */

const fetch = require('node-fetch');

async function debugEssentiaFailures() {
  console.log('🔍 DEBUGGING ESSENTIA ANALYSIS FAILURES');
  console.log('========================================');
  
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
  
  // Test with a famous artist that should definitely work
  const testArtists = [
    { name: 'BLACKPINK', spotifyId: '41MozSoPIsD1dJM0CLPjZF' },
    { name: 'The Offspring', spotifyId: '3jK9MiCrA42lLAdMGUZpwa' },
    { name: 'Rod Stewart', spotifyId: '2y8Jo9CKlia6hsU8BgzDDo' }
  ];
  
  for (const artist of testArtists) {
    console.log(`\n🎵 Testing: ${artist.name}`);
    console.log(`   Spotify ID: ${artist.spotifyId}`);
    
    try {
      const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          artistName: artist.name,
          spotifyId: artist.spotifyId,
          maxTracks: 5, // Small test
          includeRecentReleases: false
        }),
        timeout: 60000
      });
      
      if (!response.ok) {
        console.log(`   ❌ HTTP Error: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log(`   Error details: ${errorText}`);
        continue;
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`   ✅ Success!`);
        console.log(`      Tracks analyzed: ${result.trackMatrix?.length || 0}`);
        console.log(`      Genres: ${result.genreMapping?.inferredGenres?.join(', ') || 'N/A'}`);
      } else {
        console.log(`   ❌ Analysis failed: ${result.error}`);
        
        // Check if it's a Spotify credentials issue
        if (result.error && result.error.includes('credential')) {
          console.log(`   🔑 This looks like a Spotify credentials issue`);
        }
        
        // Check if it's a track fetching issue
        if (result.error && result.error.includes('tracks')) {
          console.log(`   🎵 This looks like a track fetching issue`);
        }
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test health and credentials endpoint
  console.log(`\n🔍 TESTING ESSENTIA SERVICE HEALTH:`);
  
  try {
    const healthResponse = await fetch(`${ESSENTIA_SERVICE_URL}/health`);
    console.log(`   Health check: ${healthResponse.ok ? '✅ OK' : '❌ Failed'}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Service status: ${healthData.status || 'Unknown'}`);
    }
  } catch (error) {
    console.log(`   Health check failed: ${error.message}`);
  }
  
  // Test credentials endpoint
  try {
    const credentialsResponse = await fetch(`${ESSENTIA_SERVICE_URL}/api/test-credentials`);
    console.log(`   Credentials test: ${credentialsResponse.ok ? '✅ OK' : '❌ Failed'}`);
    
    if (credentialsResponse.ok) {
      const credData = await credentialsResponse.json();
      console.log(`   Spotify access: ${credData.spotifyWorking ? '✅ Working' : '❌ Not working'}`);
    }
  } catch (error) {
    console.log(`   Credentials test failed: ${error.message}`);
  }
}

// Run the debug
debugEssentiaFailures().catch(console.error);
