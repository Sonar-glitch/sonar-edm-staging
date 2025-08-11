const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || 'mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/?retryWrites=true&w=majority&appName=SonarEDM';

async function checkDeltaTracking() {
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db();
    
    console.log('=== WEEKLY_DELTAS_CACHE ===');
    const deltasCount = await db.collection('weekly_deltas_cache').countDocuments();
    console.log('Weekly deltas cache count:', deltasCount);
    
    if (deltasCount > 0) {
      const deltaSample = await db.collection('weekly_deltas_cache').findOne();
      console.log('\nSample delta structure:');
      console.log('Keys:', Object.keys(deltaSample));
      console.log('Delta sample:', JSON.stringify(deltaSample, null, 2));
    }
    
    console.log('\n=== WEEKLY_TASTE_SNAPSHOTS ===');
    const snapshotsCount = await db.collection('weekly_taste_snapshots').countDocuments();
    console.log('Weekly snapshots count:', snapshotsCount);
    
    if (snapshotsCount > 0) {
      const snapshotSample = await db.collection('weekly_taste_snapshots').findOne();
      console.log('\nSample snapshot structure:');
      console.log('Keys:', Object.keys(snapshotSample));
      console.log('Has soundCharacteristics:', !!snapshotSample.soundCharacteristics);
      console.log('Has genres:', !!snapshotSample.genres);
      console.log('Snapshot date:', snapshotSample.snapshotDate);
    }
    
    console.log('\n=== USER_TASTE_PROFILES DEEPER CHECK ===');
    const profile = await db.collection('user_taste_profiles').findOne();
    if (profile) {
      console.log('Profile has audioFeatures:', !!profile.audioFeatures);
      console.log('Profile has soundCharacteristics:', !!profile.soundCharacteristics);
      console.log('AudioFeatures value:', profile.audioFeatures);
      console.log('Profile version:', profile.version);
      console.log('Profile source:', profile.source);
      console.log('Last updated:', profile.lastUpdated);
    }
    
    await client.close();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkDeltaTracking();
