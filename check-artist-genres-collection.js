const { MongoClient } = require('mongodb');

async function checkArtistGenresCollection() {
  const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
  await client.connect();
  const db = client.db('test');
  const artistGenresCollection = db.collection('artistGenres');
  
  console.log('=== ARTIST GENRES COLLECTION ANALYSIS ===');
  
  const totalArtists = await artistGenresCollection.countDocuments();
  console.log(`Total artist records: ${totalArtists.toLocaleString()}`);
  
  if (totalArtists > 0) {
    // Get sample records
    const samples = await artistGenresCollection.find({}).limit(10).toArray();
    
    console.log('\n📊 SAMPLE ARTIST RECORDS:');
    samples.forEach((artist, i) => {
      console.log(`\n[${i+1}] Artist Record:`);
      console.log('  _id:', artist._id);
      console.log('  Structure:');
      Object.keys(artist).forEach(key => {
        const value = artist[key];
        const valueDesc = Array.isArray(value) 
          ? `Array[${value.length}]` 
          : (typeof value === 'object' && value !== null)
            ? 'Object'
            : String(value).substring(0, 50);
        console.log(`    ${key}: ${typeof value} - ${valueDesc}`);
      });
      
      // Check if artist name is clean
      if (artist.name) {
        console.log(`  ✅ Artist name: "${artist.name}" (${typeof artist.name})`);
      }
      if (artist.artistName) {
        console.log(`  ✅ Artist name: "${artist.artistName}" (${typeof artist.artistName})`);
      }
    });
    
    // Check for clean vs corrupted artist names
    const sampleDoc = samples[0];
    if (sampleDoc) {
      console.log('\n🔍 FIRST RECORD DETAIL:');
      console.log(JSON.stringify(sampleDoc, null, 2));
    }
    
    // Check for artist name field variations
    console.log('\n📈 FIELD ANALYSIS:');
    const fieldStats = {};
    samples.forEach(doc => {
      Object.keys(doc).forEach(key => {
        fieldStats[key] = (fieldStats[key] || 0) + 1;
      });
    });
    
    Object.entries(fieldStats).forEach(([field, count]) => {
      console.log(`  ${field}: appears in ${count}/${samples.length} records`);
    });
    
    // Look for EDM artists specifically
    console.log('\n🎵 SEARCHING FOR EDM ARTISTS:');
    const edmArtists = await artistGenresCollection.find({
      $or: [
        { name: { $regex: /tiesto|armin|deadmau5|calvin harris|martin garrix|skrillex|diplo|david guetta/i } },
        { artistName: { $regex: /tiesto|armin|deadmau5|calvin harris|martin garrix|skrillex|diplo|david guetta/i } },
        { genres: { $in: ['house', 'techno', 'trance', 'edm', 'electronic'] } }
      ]
    }).limit(5).toArray();
    
    console.log(`Found ${edmArtists.length} EDM artist records:`);
    edmArtists.forEach(artist => {
      console.log(`  - ${artist.name || artist.artistName}: ${artist.genres ? artist.genres.join(', ') : 'no genres'}`);
    });
    
  } else {
    console.log('⚠️ Artist genres collection is empty');
  }
  
  await client.close();
}

checkArtistGenresCollection().catch(console.error);
