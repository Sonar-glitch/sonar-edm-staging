const { MongoClient } = require('mongodb');

async function checkAudioProfiles() {
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  console.log('=== CHECKING AUDIO PROFILE MATRIX ===');
  
  // Get a sample artist to check for audio profile data
  const sampleArtist = await artistGenresCollection.findOne({});
  
  if (sampleArtist) {
    console.log('\nSample artist structure:');
    console.log(JSON.stringify(sampleArtist, null, 2));
    
    // Check for track-related fields
    const fieldsToCheck = ['tracks', 'topTracks', 'recentTracks', 'audioProfile', 'soundMatrix', 'trackAnalysis', 'spotifyTracks'];
    
    console.log('\n🎵 AUDIO PROFILE FIELDS CHECK:');
    fieldsToCheck.forEach(field => {
      if (sampleArtist[field]) {
        const value = sampleArtist[field];
        console.log(`  ✅ ${field}: ${typeof value} - ${Array.isArray(value) ? `Array[${value.length}]` : 'Object'}`);
        
        // If it's an array, show first item structure
        if (Array.isArray(value) && value.length > 0) {
          console.log(`      First item keys: ${Object.keys(value[0]).join(', ')}`);
        }
      } else {
        console.log(`  ❌ ${field}: not found`);
      }
    });
    
    // Check across all artists for any audio profile data
    const artistsWithTracks = await artistGenresCollection.countDocuments({
      $or: [
        { tracks: { $exists: true } },
        { topTracks: { $exists: true } },
        { recentTracks: { $exists: true } },
        { audioProfile: { $exists: true } },
        { soundMatrix: { $exists: true } },
        { spotifyTracks: { $exists: true } }
      ]
    });
    
    const totalArtists = await artistGenresCollection.countDocuments();
    
    console.log(`\n📊 AUDIO PROFILE DEPLOYMENT STATUS:`);
    console.log(`  Artists with audio profiles: ${artistsWithTracks}/${totalArtists}`);
    console.log(`  Deployment percentage: ${((artistsWithTracks/totalArtists)*100).toFixed(1)}%`);
    
    if (artistsWithTracks === 0) {
      console.log('\n❌ AUDIO PROFILE MATRIX NOT DEPLOYED');
      console.log('   No artists have track analysis data');
      console.log('   Missing: Top 10 tracks + Recent tracks audio analysis');
    } else {
      console.log('\n✅ AUDIO PROFILE MATRIX PARTIALLY DEPLOYED');
      
      // Get a sample artist with audio data
      const artistWithAudio = await artistGenresCollection.findOne({
        $or: [
          { tracks: { $exists: true } },
          { topTracks: { $exists: true } },
          { audioProfile: { $exists: true } }
        ]
      });
      
      if (artistWithAudio) {
        console.log('\n🎤 SAMPLE ARTIST WITH AUDIO DATA:');
        console.log(`Artist: ${artistWithAudio.originalName}`);
        console.log('Audio fields present:');
        fieldsToCheck.forEach(field => {
          if (artistWithAudio[field]) {
            console.log(`  - ${field}: ${typeof artistWithAudio[field]}`);
          }
        });
      }
    }
    
  } else {
    console.log('No artists found in collection');
  }
  
  await client.close();
}

checkAudioProfiles().catch(console.error);
