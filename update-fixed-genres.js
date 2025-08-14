// Update a few artists with the fixed genre mapping
const { MongoClient } = require('mongodb');

async function updateArtistsWithFixedGenres() {
  const fetch = (await import('node-fetch')).default;
  const ESSENTIA_SERVICE_URL = 'https://tiko-essentia-audio-service-2eff1b2af167.herokuapp.com';
  
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  console.log('🔄 UPDATING ARTISTS WITH FIXED GENRE MAPPING');
  console.log('============================================');
  
  // Get a few artists that have existing profiles but might have empty genre mapping
  const artistsToUpdate = ['Fisher', 'Deadmau5', 'Ferry Corsten'];
  
  for (const artistName of artistsToUpdate) {
    try {
      console.log(`\n🎵 Updating ${artistName}...`);
      
      const artist = await artistGenresCollection.findOne({ originalName: artistName });
      if (!artist) {
        console.log(`   ❌ Artist ${artistName} not found`);
        continue;
      }
      
      console.log(`   📋 Existing genres: ${(artist.genres || []).join(', ')}`);
      
      // Call Essentia service with fixed genre mapping
      const response = await fetch(`${ESSENTIA_SERVICE_URL}/api/analyze-artist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: artist.originalName,
          spotifyId: artist.spotifyId,
          existingGenres: artist.genres || [],
          maxTracks: 5, // Small test
          includeRecentReleases: true
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Update the genre mapping in database
          await artistGenresCollection.updateOne(
            { _id: artist._id },
            { 
              $set: { 
                essentiaGenreMapping: result.genreMapping,
                'essentiaAudioProfile.genreMapping': result.genreMapping,
                lastGenreUpdate: new Date()
              }
            }
          );
          
          console.log(`   ✅ Updated genre mapping:`);
          console.log(`      🎼 Inferred genres: ${result.genreMapping?.inferredGenres?.join(', ') || 'None'}`);
          console.log(`      📍 Source: ${result.genreMapping?.source}`);
          console.log(`      🎯 Confidence: ${result.genreMapping?.confidence}`);
        } else {
          console.log(`   ❌ Analysis failed: ${result.error}`);
        }
      } else {
        console.log(`   ❌ HTTP Error: ${response.status}`);
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.log(`   ❌ Error updating ${artistName}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Genre mapping update complete!');
  await client.close();
}

updateArtistsWithFixedGenres();
