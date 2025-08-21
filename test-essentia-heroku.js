#!/usr/bin/env node
/**
 * ESSENTIA SERVICE TEST WITH SAMPLE TRACK
 * Tests the Heroku Essentia service with a known track URL
 */

async function testEssentiaWithSampleTrack() {
  console.log('🎵 TESTING ESSENTIA SERVICE WITH SAMPLE TRACK');
  console.log('==============================================');
  
  const fetch = (await import('node-fetch')).default;
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
  
  // Use a known Spotify preview URL for testing
  const sampleTrackUrl = 'https://p.scdn.co/mp3-preview/9af4c7c4d8b64ca53b2c1c5e9a52c6d4d0b2a1c8';
  
  try {
    console.log(`\n🔍 Testing with sample track URL: ${sampleTrackUrl.substring(0, 50)}...`);
    
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audioUrl: sampleTrackUrl,
        trackId: 'test-track-001',
        trackMetadata: {
          name: 'Test Track',
          artist: 'Test Artist',
          id: 'test-track-001'
        }
      }),
      timeout: 30000
    });
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status}`);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return;
    }
    
    const result = await response.json();
    console.log('\n✅ ESSENTIA ANALYSIS RESULT:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success && result.features) {
      console.log('\n🎧 EXTRACTED FEATURES:');
      console.log(`   Energy: ${result.features.energy?.toFixed(3) || 'N/A'}`);
      console.log(`   Danceability: ${result.features.danceability?.toFixed(3) || 'N/A'}`);
      console.log(`   Valence: ${result.features.valence?.toFixed(3) || 'N/A'}`);
      console.log(`   Tempo: ${result.features.tempo?.toFixed(1) || 'N/A'} BPM`);
      console.log(`   Spectral Centroid: ${result.features.spectralCentroid?.toFixed(1) || 'N/A'} Hz`);
      console.log(`   Source: ${result.source}`);
      console.log(`   Confidence: ${result.confidence}`);
      console.log(`   Processing Time: ${result.processingTime}ms`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Also test the health endpoint
async function testHealthEndpoint() {
  console.log('\n🏥 TESTING HEALTH ENDPOINT');
  console.log('==========================');
  
  const fetch = (await import('node-fetch')).default;
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
  
  try {
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/health`);
    const health = await response.json();
    
    console.log('✅ HEALTH STATUS:');
    console.log(JSON.stringify(health, null, 2));
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
  }
}

// Run the tests
async function runTests() {
  await testHealthEndpoint();
  await testEssentiaWithSampleTrack();
}

runTests().catch(console.error);
