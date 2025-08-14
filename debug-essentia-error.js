#!/usr/bin/env node

async function debugEssentiaError() {
  console.log('🔍 DEBUGGING ESSENTIA SERVICE 500 ERROR');
  console.log('========================================');
  
  try {
    const fetch = (await import('node-fetch')).default;
    
    // Test the exact same call that's failing in the matrix builder
    console.log('📞 Testing artist analysis endpoint...');
    
    const response = await fetch('https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com/api/analyze-artist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artistName: 'Deadmau5',
        spotifyId: '2CIMQHirSU0MQqyYHq0eOx',
        maxTracks: 20,
        includeRecentReleases: true
      })
    });
    
    console.log('📊 Response Details:');
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    console.log('   Content-Type:', response.headers.get('content-type'));
    
    const responseText = await response.text();
    console.log('   Body:', responseText);
    
    if (responseText.includes('Spotify') || responseText.includes('access token')) {
      console.log('\n❌ ROOT CAUSE: Missing Spotify API credentials');
      console.log('\n🔧 SOLUTION OPTIONS:');
      console.log('   Option 1: Set Heroku config vars');
      console.log('     heroku config:set SPOTIFY_CLIENT_ID=your_id --app tiko-essentia-audio-service');
      console.log('     heroku config:set SPOTIFY_CLIENT_SECRET=your_secret --app tiko-essentia-audio-service');
      console.log('');
      console.log('   Option 2: Test with mock data (development mode)');
      console.log('     - Modify service to use mock Spotify responses');
      console.log('     - Test staged analysis logic without API calls');
      console.log('');
      console.log('   Option 3: Use local Spotify credentials');
      console.log('     - Set up local .env file with credentials');
      console.log('     - Test against local service instead');
    } else {
      console.log('\n🤔 Different error - analyzing...');
      try {
        const errorObj = JSON.parse(responseText);
        console.log('   Parsed error:', errorObj);
      } catch (e) {
        console.log('   Raw error text:', responseText);
      }
    }
    
    console.log('\n🎯 IMMEDIATE ACTION NEEDED:');
    console.log('   Set Spotify credentials to proceed with matrix building');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugEssentiaError();
