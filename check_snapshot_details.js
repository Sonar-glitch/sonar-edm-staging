const { MongoClient } = require('mongodb');
const uri = process.env.MONGODB_URI || 'mongodb+srv://furqanzemail:XJfBasTxNcle2CEs@sonaredm.g4cdx.mongodb.net/?retryWrites=true&w=majority&appName=SonarEDM';

async function checkSnapshotDetails() {
  try {
    const client = await MongoClient.connect(uri);
    const db = client.db();
    
    console.log('=== WEEKLY_TASTE_SNAPSHOTS DETAILED ===');
    const snapshots = await db.collection('weekly_taste_snapshots').find().toArray();
    
    snapshots.forEach((snapshot, index) => {
      console.log(`\n--- Snapshot ${index + 1} ---`);
      console.log('UserId:', snapshot.userId);
      console.log('Date:', snapshot.snapshotDate);
      console.log('Created:', snapshot.createdAt);
      
      if (snapshot.soundCharacteristics) {
        console.log('Sound characteristics:', JSON.stringify(snapshot.soundCharacteristics, null, 2));
      }
      
      if (snapshot.genres) {
        console.log('Genres (top 5):', Object.entries(snapshot.genres)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5));
      }
      
      if (snapshot.topArtists) {
        console.log('Top artists count:', snapshot.topArtists.length);
        console.log('Sample artists:', snapshot.topArtists.slice(0, 3).map(a => a.name));
      }
    });
    
    console.log('\n=== CHECKING FOR REAL SOUND CHARACTERISTICS ===');
    // Check if any profile has real sound characteristics
    const profileWithSound = await db.collection('user_taste_profiles').findOne({
      soundCharacteristics: { $exists: true, $ne: null }
    });
    
    if (profileWithSound) {
      console.log('Found profile with sound characteristics:');
      console.log(JSON.stringify(profileWithSound.soundCharacteristics, null, 2));
    } else {
      console.log('❌ No profiles have real sound characteristics');
    }
    
    await client.close();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSnapshotDetails();
