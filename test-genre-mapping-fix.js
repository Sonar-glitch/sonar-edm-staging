// Test the fixed genre mapping with Fisher
async function testGenreMappingFix() {
  const fetch = (await import('node-fetch')).default;
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';

  try {
    console.log('🔧 TESTING GENRE MAPPING FIX');
    console.log('=============================');
    
    const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        artistName: 'Fisher',
        spotifyId: null,
        existingGenres: ['tech house', 'house', 'electronic'], // Pass existing genres
        maxTracks: 5,
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
      console.log('   Genre mapping object:', result.genreMapping);
      console.log('   ⭐ Inferred genres:', result.genreMapping?.inferredGenres);
      console.log('   Source:', result.genreMapping?.source);
      console.log('   Confidence:', result.genreMapping?.confidence);
      
      if (result.genreMapping?.inferredGenres?.length > 0) {
        console.log('\n🎉 SUCCESS: Genre mapping is now working!');
        console.log('   Genres found:', result.genreMapping.inferredGenres.join(', '));
      } else {
        console.log('\n❌ Still not working - inferred genres is empty');
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

testGenreMappingFix();
