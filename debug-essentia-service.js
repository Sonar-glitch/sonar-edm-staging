#!/usr/bin/env node
/**
 * DEBUG ESSENTIA SERVICE FAILURES
 * Test specific failed artists to understand the root cause
 */

async function debugEssentiaServiceFailures() {
  const fetch = (await import('node-fetch')).default;
  console.log('🔧 DEBUGGING ESSENTIA SERVICE FAILURES');
  console.log('======================================');
  
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
  
  // Test service health first
  console.log('1️⃣ TESTING SERVICE HEALTH:');
  try {
    const healthResponse = await fetch(`${ESSENTIA_SERVICE_URL}/health`);
    console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   Service: ${JSON.stringify(healthData)}`);
    }
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
    return;
  }
  
  // Test credentials
  console.log('\n2️⃣ TESTING SPOTIFY CREDENTIALS:');
  try {
    const credResponse = await fetch(`${ESSENTIA_SERVICE_URL}/api/test-credentials`);
    console.log(`   Status: ${credResponse.status}`);
    
    if (credResponse.ok) {
      const credData = await credResponse.json();
      console.log(`   Spotify Working: ${credData.spotifyWorking}`);
      console.log(`   Details: ${JSON.stringify(credData)}`);
    } else {
      const errorText = await credResponse.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Credentials test failed: ${error.message}`);
  }
  
  // Test with famous artists that should definitely work
  const testArtists = [
    { name: 'BLACKPINK', spotifyId: '41MozSoPIsD1dJM0CLPjZF' },
    { name: 'The Offspring', spotifyId: '3jK9MiCrA42lLAdMGUZpwa' },
    { name: 'Rod Stewart', spotifyId: '2y8Jo9CKlia6hsU8BgzDDo' }
  ];
  
  console.log('\n3️⃣ TESTING FAILED ARTISTS:');
  
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
      
      console.log(`   HTTP Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.log(`   HTTP Error Body: ${errorText}`);
        continue;
      }
      
      const result = await response.json();
      
      console.log(`   Success: ${result.success}`);
      if (result.success) {
        console.log(`   Tracks analyzed: ${result.trackMatrix?.length || 0}`);
        console.log(`   Genres: ${result.genreMapping?.inferredGenres?.join(', ') || 'N/A'}`);
      } else {
        console.log(`   Error: ${result.error}`);
        console.log(`   Details: ${JSON.stringify(result)}`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Test a simple artist lookup without analysis
  console.log('\n4️⃣ TESTING BASIC SPOTIFY LOOKUP:');
  try {
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/test-spotify-lookup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artistName: 'BLACKPINK',
        spotifyId: '41MozSoPIsD1dJM0CLPjZF'
      })
    });
    
    console.log(`   Status: ${response.status}`);
    if (response.ok) {
      const result = await response.json();
      console.log(`   Result: ${JSON.stringify(result)}`);
    } else {
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
  } catch (error) {
    console.log(`   ❌ Spotify lookup test failed: ${error.message}`);
  }
}

// Run the debug
debugEssentiaServiceFailures().catch(console.error);
