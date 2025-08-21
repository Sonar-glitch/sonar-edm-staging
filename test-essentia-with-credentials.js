#!/usr/bin/env node
/**
 * TEST ESSENTIA SERVICE WITH SPOTIFY CREDENTIALS
 * Tests the updated Essentia service with Spotify credentials support
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const ESSENTIA_SERVICE_URL = process.env.ESSENTIA_SERVICE_URL || 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';

async function testEssentiaWithCredentials() {
  console.log('🧪 TESTING ESSENTIA SERVICE WITH CREDENTIALS');
  console.log('============================================');
  
  const fetch = (await import('node-fetch')).default;
  
  // Test a few specific artists with different credential scenarios
  const testArtists = [
    { name: 'Deadmau5', type: 'EDM', spotifyId: '2CIMQHirSU0MQqyYHq0eOx' },
    { name: 'Fisher', type: 'EDM', spotifyId: '6nS5roXSAGhTGr34W6n7Et' },
    { name: 'Porter Robinson', type: 'EDM', spotifyId: '3dz0NnIZhtKKeXZxLOxCam' },
    { name: 'REZZ', type: 'EDM', spotifyId: '6kBDZFXuYHeHdX0dAeOG5O' }
  ];
  
  // Mock Spotify credentials (in real app, these would come from frontend auth)
  const mockSpotifyCredentials = {
    accessToken: process.env.SPOTIFY_ACCESS_TOKEN || null, // You'd get this from frontend
    clientId: process.env.SPOTIFY_CLIENT_ID || null,
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET || null
  };
  
  // Check what's actually available
  const hasClientCredentials = process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET;
  console.log(`🔑 Local Spotify access token: ${mockSpotifyCredentials.accessToken ? 'YES' : 'NO'}`);
  console.log(`🔑 Local Spotify client credentials: ${hasClientCredentials ? 'YES' : 'NO'}`);
  console.log(`🏗️ Heroku service credentials: Should be available on deployed service`);
  console.log(`📊 Testing ${testArtists.length} artists:`);
  console.log(`💡 Note: Heroku service uses its own client credentials for Spotify API`);
  
  for (let i = 0; i < testArtists.length; i++) {
    const artist = testArtists[i];
    console.log(`\n[${i+1}/${testArtists.length}] Testing: ${artist.name} (${artist.type})`);
    
    try {
      const requestBody = {
        artistName: artist.name,
        spotifyId: artist.spotifyId,
        maxTracks: 10, // Smaller test
        includeRecentReleases: true
      };
      
      // Add Spotify credentials if available
      if (mockSpotifyCredentials.accessToken) {
        requestBody.spotifyCredentials = mockSpotifyCredentials;
        console.log('   🔑 Using mock Spotify credentials');
      } else {
        console.log('   🍎 Using Apple-only mode');
      }
      
      const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          console.log(`   ✅ SUCCESS:`);
          console.log(`      📊 Tracks analyzed: ${result.trackMatrix.length}`);
          console.log(`      🎧 Top tracks: ${result.metadata.topTracks}`);
          console.log(`      🆕 Recent releases: ${result.metadata.recentReleases}`);
          console.log(`      🎼 Genre mapping: ${result.genreMapping}`);
          console.log(`      📈 Success rate: ${result.metadata.successRate}`);
        } else {
          console.log(`   ❌ FAILED: ${result.error}`);
        }
      } else {
        console.log(`   ❌ HTTP ERROR: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
    }
    
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n🎯 Test completed!');
  console.log('\n📝 INSIGHTS:');
  console.log('1. Artists with Spotify credentials should get more tracks');
  console.log('2. Apple-only mode should still work but with fewer tracks');
  console.log('3. Genre mapping should be more accurate now');
  console.log('4. EDM artists should be detected correctly');
}

// Run the test
testEssentiaWithCredentials().catch(console.error);
