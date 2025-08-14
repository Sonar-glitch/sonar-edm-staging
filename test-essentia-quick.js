// Quick test of Essentia service
async function testEssentiaService() {
  const fetch = (await import('node-fetch')).default;
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
  
  try {
    console.log('🔍 Testing Essentia service...');
    const healthUrl = ESSENTIA_SERVICE_URL + '/health';
    const response = await fetch(healthUrl);
    if (response.ok) {
      console.log('✅ Essentia service is online');
      
      console.log('\n🎵 Testing artist analysis...');
      const testUrl = ESSENTIA_SERVICE_URL + '/api/analyze-artist';
      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: 'Fisher',
          spotifyId: '2NFrAuh8RQdQoS7iYFbckw',
          existingGenres: ['tech house', 'house', 'electronic'],
          maxTracks: 10,
          includeRecentReleases: true
        })
      });
      
      if (testResponse.ok) {
        const result = await testResponse.json();
        console.log('✅ Test analysis successful');
        console.log('   Success:', result.success);
        console.log('   Track matrix length:', result.trackMatrix?.length || 0);
        console.log('   Genre mapping:', result.genreMapping?.inferredGenres?.join(', ') || 'N/A');
        console.log('   Metadata:', result.metadata);
      } else {
        console.log('❌ Test analysis failed:', testResponse.status, testResponse.statusText);
        const errorText = await testResponse.text();
        console.log('   Error:', errorText.substring(0, 200));
      }
    } else {
      console.log('❌ Essentia service is not responding');
    }
  } catch (error) {
    console.log('❌ Error testing service:', error.message);
  }
}

testEssentiaService();
