// Test Essentia service with a sample track

async function testEssentiaService() {
  const fetch = (await import('node-fetch')).default;
  console.log('🎵 Testing Essentia Service...');
  
  try {
    // Test health endpoint first
    console.log('Checking health endpoint...');
    const healthResponse = await fetch('https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com/health');
    console.log(`Health check: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('Health data:', healthData);
    }
    
    // Test with a sample preview URL (using a known Spotify preview)
    console.log('\nTesting audio analysis...');
    const testUrl = 'https://p.scdn.co/mp3-preview/9a8ff1d6e95e04b5cf2b3bc74c0cc52c6ce67a5e?cid=20d98eaf33fa464291b4c13a1e70a2ad';
    
    const response = await fetch('https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audioUrl: testUrl,
        trackMetadata: {
          name: 'Test Track',
          artist: 'Test Artist',
          id: 'test123'
        }
      }),
      timeout: 30000
    });
    
    console.log(`Analysis response: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Essentia service working!');
      console.log('Response structure:');
      console.log('  success:', result.success);
      console.log('  message:', result.message);
      
      if (result.features) {
        console.log('  Available features:', Object.keys(result.features).length);
        console.log('  Sample features:');
        Object.entries(result.features).slice(0, 8).forEach(([key, value]) => {
          console.log(`    ${key}: ${typeof value === 'number' ? value.toFixed(3) : value}`);
        });
      }
      
      if (result.error) {
        console.log('  Error:', result.error);
      }
    } else {
      console.log(`❌ Essentia service error: ${response.status} ${response.statusText}`);
      try {
        const errorText = await response.text();
        console.log('Error details:', errorText);
      } catch (e) {
        console.log('Could not read error response');
      }
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
  }
}

testEssentiaService();
