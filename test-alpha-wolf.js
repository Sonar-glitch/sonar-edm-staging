// Test Alpha Wolf analysis specifically
async function testAlphaWolf() {
  const fetch = (await import('node-fetch')).default;
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';

  try {
    console.log('🐺 TESTING ALPHA WOLF ANALYSIS');
    console.log('===============================');
    
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artistName: 'Alpha Wolf',
        spotifyId: '2tjnvrUmP46XNjFh9V0NGc',
        existingGenres: ['metalcore', 'deathcore', 'djent'],
        maxTracks: 10,
        includeRecentReleases: true
      })
    });
    
    console.log('HTTP Status:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('\n✅ Analysis Result:');
      console.log('   Success:', result.success);
      console.log('   Error:', result.error || 'None');
      console.log('   Track matrix length:', result.trackMatrix?.length || 0);
      console.log('   Genre mapping:', result.genreMapping?.inferredGenres || 'N/A');
      console.log('   Metadata:', result.metadata);
      
      if (result.trackMatrix && result.trackMatrix.length > 0) {
        console.log('\n🎵 Sample track:');
        console.log('   Track:', result.trackMatrix[0].trackName);
        console.log('   Features keys:', Object.keys(result.trackMatrix[0].features || {}));
      }
    } else {
      const errorText = await response.text();
      console.log('\n❌ HTTP Error Response:');
      console.log(errorText.substring(0, 500));
    }
  } catch (error) {
    console.log('\n❌ Network Error:', error.message);
  }
}

testAlphaWolf();
