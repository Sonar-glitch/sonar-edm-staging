#!/usr/bin/env node
/**
 * TEST PREVIEW URL AVAILABILITY
 * Check if tracks have preview URLs available
 */

async function testPreviewUrls() {
  const fetch = (await import('node-fetch')).default;
  
  console.log('🔍 TESTING PREVIEW URL AVAILABILITY');
  console.log('===================================');
  
  // Test the Spotify token availability first
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
  
  console.log('1️⃣ Testing with detailed logging...');
  
  try {
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artistName: 'BLACKPINK',
        spotifyId: '41MozSoPIsD1dJM0CLPjZF',
        maxTracks: 3, // Small test
        includeRecentReleases: false
      })
    });
    
    console.log(`   HTTP Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   Success: ${result.success}`);
      console.log(`   Error: ${result.error || 'None'}`);
      console.log(`   Tracks attempted: ${result.tracksAttempted || 'N/A'}`);
      console.log(`   Tracks analyzed: ${result.trackMatrix?.length || 0}`);
      
      if (result.trackMatrix && result.trackMatrix.length > 0) {
        console.log('   Sample track:');
        const sample = result.trackMatrix[0];
        console.log(`     Name: ${sample.name}`);
        console.log(`     Artist: ${sample.artist}`);
        console.log(`     Preview URL: ${sample.previewUrl ? 'YES' : 'NO'}`);
      }
    } else {
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   Request Error: ${error.message}`);
  }
  
  // Test with an artist that definitely should have preview URLs
  console.log('\n2️⃣ Testing Fisher (EDM artist with likely preview URLs)...');
  
  try {
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        artistName: 'Fisher',
        spotifyId: '2HPaUgqeutzr3jx5a9WyDV', // Fisher's Spotify ID
        maxTracks: 3,
        includeRecentReleases: false
      })
    });
    
    console.log(`   HTTP Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log(`   Success: ${result.success}`);
      console.log(`   Error: ${result.error || 'None'}`);
      console.log(`   Tracks attempted: ${result.tracksAttempted || 'N/A'}`);
      console.log(`   Tracks analyzed: ${result.trackMatrix?.length || 0}`);
    } else {
      const errorText = await response.text();
      console.log(`   Error: ${errorText}`);
    }
    
  } catch (error) {
    console.log(`   Request Error: ${error.message}`);
  }
  
  console.log('\n💡 DIAGNOSIS:');
  console.log('   If tracks attempted > 0 but tracks analyzed = 0,');
  console.log('   then the issue is that NO tracks have preview URLs available.');
  console.log('   This could be due to:');
  console.log('   1. Spotify API not returning preview_url fields');
  console.log('   2. Apple Music search function failing');
  console.log('   3. Missing Spotify credentials in the service');
}

// Run the test
testPreviewUrls().catch(console.error);
