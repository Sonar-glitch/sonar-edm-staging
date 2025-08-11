const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || 'mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/?retryWrites=true&w=majority&appName=SonarEDM';

async function checkMongoDB() {
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db();
    
    console.log('=== USER_TASTE_PROFILES ===');
    const userCount = await db.collection('user_taste_profiles').countDocuments();
    console.log('Count:', userCount);
    
    if (userCount > 0) {
      const sample = await db.collection('user_taste_profiles').findOne();
      console.log('Keys:', Object.keys(sample));
      console.log('Has soundCharacteristics:', !!sample.soundCharacteristics);
      console.log('CreatedAt:', sample.createdAt);
      console.log('Sample structure:', JSON.stringify(sample, null, 2));
    }
    
    console.log('\n=== EVENTS_UNIFIED SOUND ===');
    const eventSoundCount = await db.collection('events_unified').countDocuments({ 
      soundCharacteristics: { $exists: true } 
    });
    console.log('Events with sound:', eventSoundCount);
    
    if (eventSoundCount > 0) {
      const eventSample = await db.collection('events_unified').findOne({ 
        soundCharacteristics: { $exists: true } 
      });
      console.log('Event sound sample:', JSON.stringify(eventSample.soundCharacteristics, null, 2));
    }
    
    console.log('\n=== COLLECTIONS LIST ===');
    const collections = await db.listCollections().toArray();
    console.log('Available:', collections.map(c => c.name).sort());
    
    await client.close();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkMongoDB();
