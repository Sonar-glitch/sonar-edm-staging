// System verification script
const { MongoClient } = require('mongodb');

async function verifySystem() {
  try {
    console.log('🔍 VERIFYING ACTUAL SYSTEM STATE...\n');
    
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb+srv://sonar:NqcOhA0K4YMI0uOm@cluster0.3zn5s.mongodb.net');
    await client.connect();
    const db = client.db('tiko_development');
    
    // 1. Check collections
    console.log('=== DATABASE COLLECTIONS ===');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('Available collections:', collectionNames);
    
    const requiredCollections = ['events_unified', 'user_profiles', 'spotify_data'];
    requiredCollections.forEach(col => {
      const exists = collectionNames.includes(col);
      console.log(exists ? '✅' : '❌', col, exists ? 'EXISTS' : 'MISSING');
    });
    
    // 2. Check events_unified structure
    console.log('\n=== EVENTS_UNIFIED STRUCTURE ===');
    const eventCount = await db.collection('events_unified').countDocuments({});
    console.log('Total events in database:', eventCount);
    
    if (eventCount > 0) {
      const sampleEvent = await db.collection('events_unified').findOne({});
      console.log('Sample event fields:', Object.keys(sampleEvent));
      
      // Check for advanced fields
      const fieldsToCheck = [
        'personalizedScore', 'musicType', 'audioFeatures', 'artistData', 
        'spotifyData', 'genreAnalysis', 'tasteScore', 'enhancementData'
      ];
      
      fieldsToCheck.forEach(field => {
        const hasField = field in sampleEvent;
        console.log(hasField ? '✅' : '❌', `Has ${field}:`, hasField);
      });
      
      console.log('\nSample event structure:');
      console.log(JSON.stringify(sampleEvent, null, 2).substring(0, 800) + '...');
    } else {
      console.log('❌ No events found in events_unified');
    }
    
    // 3. Check enhanced data counts
    console.log('\n=== ENHANCED DATA STATUS ===');
    
    const queries = [
      { name: 'audioFeatures', query: { audioFeatures: { $exists: true } } },
      { name: 'artistData', query: { artistData: { $exists: true } } },
      { name: 'personalizedScore', query: { personalizedScore: { $exists: true, $ne: null } } },
      { name: 'spotifyData', query: { spotifyData: { $exists: true } } },
      { name: 'musicType', query: { musicType: { $exists: true } } }
    ];
    
    for (const q of queries) {
      try {
        const count = await db.collection('events_unified').countDocuments(q.query);
        console.log(`Events with ${q.name}: ${count}/${eventCount} (${((count/eventCount)*100).toFixed(1)}%)`);
      } catch (err) {
        console.log(`❌ Error checking ${q.name}:`, err.message);
      }
    }
    
    // 4. Check user profiles
    console.log('\n=== USER PROFILE DATA ===');
    try {
      const userCount = await db.collection('user_profiles').countDocuments({});
      console.log('User profiles in database:', userCount);
      
      if (userCount > 0) {
        const sampleUser = await db.collection('user_profiles').findOne({});
        console.log('User profile fields:', Object.keys(sampleUser));
      }
    } catch (err) {
      console.log('❌ User profiles collection missing or error:', err.message);
    }
    
    await client.close();
    
  } catch (err) {
    console.error('❌ Database verification failed:', err.message);
  }
}

verifySystem();
