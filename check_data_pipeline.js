// Check data pipeline and mapping collections
const { MongoClient } = require('mongodb');

async function checkMappings() {
  try {
    const client = new MongoClient('mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/test?retryWrites=true&w=majority&appName=SonarEDM');
    await client.connect();
    const db = client.db('test');
    
    console.log('🎤 Artist-Genre mapping collection:');
    const artistGenres = await db.collection('artistGenres').findOne({});
    if (artistGenres) {
      console.log('Sample artistGenres doc keys:', Object.keys(artistGenres));
      console.log('Sample artistGenres doc:', JSON.stringify(artistGenres, null, 2));
    } else {
      console.log('❌ No artistGenres collection found');
    }
    
    console.log('\n🎵 Audio features collection:');
    const audioFeatures = await db.collection('audio_features').findOne({});
    if (audioFeatures) {
      console.log('Sample audio_features doc keys:', Object.keys(audioFeatures));
      console.log('Sample audio_features doc:', JSON.stringify(audioFeatures, null, 2));
    } else {
      console.log('❌ No audio_features collection found');
    }
    
    console.log('\n📊 Events_unified count and processing status:');
    const unifiedCount = await db.collection('events_unified').countDocuments();
    const withSoundChar = await db.collection('events_unified').countDocuments({ soundCharacteristics: { $exists: true } });
    const withPersonalizedScore = await db.collection('events_unified').countDocuments({ personalizedScore: { $exists: true } });
    
    console.log('Total events_unified:', unifiedCount);
    console.log('With soundCharacteristics:', withSoundChar);
    console.log('With personalizedScore:', withPersonalizedScore);
    
    // Sample a few events to see their current state
    console.log('\n🔍 Sample events to see enhancement status:');
    const sampleEvents = await db.collection('events_unified').find({}).limit(3).toArray();
    sampleEvents.forEach((event, i) => {
      console.log(`\nEvent ${i+1}: "${event.name}"`);
      console.log(`  Artists: ${event.artists ? event.artists.map(a => typeof a === 'object' ? a.name : a).join(', ') : 'None'}`);
      console.log(`  Genres: ${event.genres ? event.genres.join(', ') : 'None'}`);
      console.log(`  Has soundCharacteristics: ${!!event.soundCharacteristics}`);
      console.log(`  Has artistMetadata: ${!!event.artistMetadata}`);
      console.log(`  Has enhancedGenres: ${!!event.enhancedGenres}`);
      console.log(`  personalizedScore: ${event.personalizedScore || 'None'}`);
    });
    
    await client.close();
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkMappings();
